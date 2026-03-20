require('dotenv').config();
const { Telegraf, Markup } = require('telegraf');
const { createClient } = require('@supabase/supabase-js');
const cron = require('node-cron');

// ── Connections ──────────────────────────────────────────
const bot = new Telegraf(process.env.BOT_TOKEN);
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY
);

// ── Status options ────────────────────────────────────────
const STATUS_OPTIONS = {
  working_available: '✅ Доступно',
  working_booked:    '🟡 Занято',
  not_working:       '❌ Не работает'
};

// ── Helper: get coordinator's hospital ───────────────────
async function getCoordinatorHospital(telegramId) {
  const { data, error } = await supabase
    .from('profiles')
    .select('hospital_id, hospitals(id, name, bot_start_hour, bot_end_hour, timezone)')
    .eq('telegram_id', telegramId)
    .eq('role', 'staff')
    .single();

  if (error || !data) return null;
  return data;
}

// ── Helper: get hospital resources ───────────────────────
async function getHospitalResources(hospitalId) {
  const { data, error } = await supabase
    .from('hospital_resources')
    .select('id, machine_type, status, quantity, notes, resources(name_russian, category)')
    .eq('hospital_id', hospitalId);

  if (error || !data) return [];
  return data;
}

// ── Helper: update resource status ───────────────────────
async function updateResourceStatus(resourceId, hospitalId, status, telegramId) {
  const { data: profile } = await supabase
    .from('profiles')
    .select('id')
    .eq('telegram_id', telegramId)
    .single();

  // Get resource category for history
  const { data: resource } = await supabase
    .from('hospital_resources')
    .select('machine_type, resources(category)')
    .eq('id', resourceId)
    .single();

  // Update current status
  await supabase
    .from('hospital_resources')
    .update({
      status,
      updated_by: profile?.id
    })
    .eq('id', resourceId);

  // Log to history
  await supabase
    .from('machine_status_history')
    .insert({
      resource_id: resourceId,
      hospital_id: hospitalId,
      status,
      changed_by: profile?.id,
      resource_category: resource?.resources?.category
    });
}

// ── Helper: check if within working hours ────────────────
function isWithinWorkingHours(startHour = 8, endHour = 20) {
  const now = new Date();
  const astanaTime = new Date(
    now.toLocaleString('en-US', { timeZone: 'Asia/Almaty' })
  );
  const hour = astanaTime.getHours();
  return hour >= startHour && hour < endHour;
}

// ── Send update request to a coordinator ─────────────────
async function sendUpdateRequest(ctx, hospitalId, telegramId) {
  const resources = await getHospitalResources(hospitalId);

  if (!resources.length) {
    await ctx.reply('У вашей больницы нет зарегистрированных ресурсов. Свяжитесь с администратором MedMap.');
    return;
  }

  await ctx.reply(
    '🏥 Пожалуйста, обновите статус каждого ресурса:\n\n' +
    'Нажмите на ресурс чтобы изменить его статус.',
    Markup.inlineKeyboard(
      resources.map(r => [
        Markup.button.callback(
          `${STATUS_OPTIONS[r.status]} — ${r.resources?.name_russian || r.machine_type}`,
          `update_${r.id}`
        )
      ])
    )
  );
}

// ── /start command ────────────────────────────────────────
bot.start(async (ctx) => {
  const telegramId = ctx.from.id.toString();
  const coordinator = await getCoordinatorHospital(telegramId);

  if (!coordinator) {
    await ctx.reply(
      '👋 Добро пожаловать в MedMap!\n\n' +
      'Ваш Telegram не привязан к больнице.\n' +
      'Свяжитесь с администратором MedMap для регистрации.'
    );
    return;
  }

  const hospital = coordinator.hospitals;
  const resources = await getHospitalResources(coordinator.hospital_id);

  await ctx.reply(
    `✅ Добро пожаловать!\n\n` +
    `Вы координатор: *${hospital.name}*\n\n` +
    `Зарегистрированные ресурсы (${resources.length}):\n` +
    resources.map(r =>
      `${STATUS_OPTIONS[r.status]} ${r.resources?.name_russian || r.machine_type}`
    ).join('\n') +
    `\n\nНапишите /update чтобы обновить статусы в любое время.`,
    { parse_mode: 'Markdown' }
  );
});

// ── /update command (on-demand) ───────────────────────────
bot.command('update', async (ctx) => {
  const telegramId = ctx.from.id.toString();
  const coordinator = await getCoordinatorHospital(telegramId);

  if (!coordinator) {
    await ctx.reply('❌ Вы не зарегистрированы как координатор.');
    return;
  }

  await sendUpdateRequest(ctx, coordinator.hospital_id, telegramId);
});

// ── Handle resource update button taps ───────────────────
bot.action(/^update_(.+)$/, async (ctx) => {
  const resourceId = ctx.match[1];
  const telegramId = ctx.from.id.toString();
  const coordinator = await getCoordinatorHospital(telegramId);

  if (!coordinator) {
    await ctx.answerCbQuery('❌ Не авторизован');
    return;
  }

  await ctx.answerCbQuery();
  await ctx.reply(
    'Выберите новый статус:',
    Markup.inlineKeyboard([
      [Markup.button.callback('✅ Доступно',     `set_${resourceId}_working_available`)],
      [Markup.button.callback('🟡 Занято',        `set_${resourceId}_working_booked`)],
      [Markup.button.callback('❌ Не работает',   `set_${resourceId}_not_working`)],
    ])
  );
});

// ── Handle status selection ───────────────────────────────
bot.action(/^set_(.+)_(working_available|working_booked|not_working)$/, async (ctx) => {
  const resourceId = ctx.match[1];
  const newStatus  = ctx.match[2];
  const telegramId = ctx.from.id.toString();
  const coordinator = await getCoordinatorHospital(telegramId);

  if (!coordinator) {
    await ctx.answerCbQuery('❌ Не авторизован');
    return;
  }

  await updateResourceStatus(
    resourceId,
    coordinator.hospital_id,
    newStatus,
    telegramId
  );

  await ctx.answerCbQuery('✅ Статус обновлён');
  await ctx.reply(
    `✅ Обновлено: *${STATUS_OPTIONS[newStatus]}*\n\n` +
    'Нажмите /update чтобы обновить другой ресурс.',
    { parse_mode: 'Markdown' }
  );
});

// ── /status command — see current statuses ────────────────
bot.command('status', async (ctx) => {
  const telegramId = ctx.from.id.toString();
  const coordinator = await getCoordinatorHospital(telegramId);

  if (!coordinator) {
    await ctx.reply('❌ Вы не зарегистрированы как координатор.');
    return;
  }

  const resources = await getHospitalResources(coordinator.hospital_id);
  const hospital = coordinator.hospitals;

  await ctx.reply(
    `🏥 *${hospital.name}*\n\n` +
    resources.map(r =>
      `${STATUS_OPTIONS[r.status]} ${r.resources?.name_russian || r.machine_type}` +
      (r.notes ? `\n   📝 ${r.notes}` : '')
    ).join('\n'),
    { parse_mode: 'Markdown' }
  );
});

// ── Scheduled reminders: 9AM, 1PM, 6PM Astana time ───────
async function sendScheduledReminders() {
  const { data: coordinators } = await supabase
    .from('profiles')
    .select('telegram_id, hospital_id, hospitals(name, bot_start_hour, bot_end_hour)')
    .eq('role', 'staff')
    .not('telegram_id', 'is', null);

  if (!coordinators) return;

  for (const coord of coordinators) {
    const hospital = coord.hospitals;
    if (!hospital) continue;

    if (!isWithinWorkingHours(hospital.bot_start_hour, hospital.bot_end_hour)) {
      continue;
    }

    try {
      await bot.telegram.sendMessage(
        coord.telegram_id,
        `🔔 *Напоминание MedMap*\n\n` +
        `Пожалуйста, обновите статус оборудования в *${hospital.name}*.\n\n` +
        `Напишите /update чтобы начать.`,
        { parse_mode: 'Markdown' }
      );
    } catch (e) {
      console.log(`Failed to message coordinator ${coord.telegram_id}:`, e.message);
    }
  }
}

// 9:00 AM Astana time
cron.schedule('0 9 * * *', sendScheduledReminders, {
  timezone: 'Asia/Almaty'
});

// 1:00 PM Astana time
cron.schedule('0 13 * * *', sendScheduledReminders, {
  timezone: 'Asia/Almaty'
});

// 6:00 PM Astana time
cron.schedule('0 18 * * *', sendScheduledReminders, {
  timezone: 'Asia/Almaty'
});

// ── Any other message → show menu ────────────────────────
bot.on('message', async (ctx) => {
  await ctx.reply(
    '📋 Доступные команды:\n\n' +
    '/start — Информация о вашей больнице\n' +
    '/update — Обновить статус ресурсов\n' +
    '/status — Посмотреть текущие статусы'
  );
});

// ── Launch ────────────────────────────────────────────────
bot.launch();
console.log('✅ MedMap bot is running...');

process.once('SIGINT',  () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));