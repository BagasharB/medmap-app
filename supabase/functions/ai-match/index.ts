import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const ANTHROPIC_API_KEY = Deno.env.get("ANTHROPIC_API_KEY");

const RESOURCE_KEYS = [
  "mri", "ct_scan", "ultrasound", "dialysis", "xray", "ecg",
  "endoscope", "ventilator", "mammography", "pet_scan", "defibrillator",
  "incubator", "psychiatrist", "psychologist", "pediatrician",
  "physiotherapist", "cardiologist", "neurologist", "traumatologist",
  "ophthalmologist", "dermatologist", "gynecologist", "urologist",
  "oncologist", "dentist", "endocrinologist", "surgeon",
  "emergency_dept", "pediatrics_dept", "maternity_dept",
  "mental_health_dept", "oncology_dept", "icu"
];

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
      },
    });
  }

  try {
    const body = await req.json();
    const forWho = body.forWho || "myself";
    const problemType = body.problemType || "unknown";
    const bodyPart = body.bodyPart || "not specified";
    const urgency = body.urgency || "today";
    const description = body.description || "none";

    const prompt = "You are a medical triage assistant for Kazakhstan. " +
      "A user needs help finding the right hospital resource. " +
      "Who: " + forWho + ". " +
      "Problem type: " + problemType + ". " +
      "Body part: " + bodyPart + ". " +
      "Urgency: " + urgency + ". " +
      "Description: " + description + ". " +
      "Valid resource keys: " + RESOURCE_KEYS.join(", ") + ". " +
      "Return ONLY this exact JSON format with no other text or markdown: {\"resource_key\": \"ct_scan\", \"reasoning\": \"one sentence explanation in Russian language\"}";

    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": ANTHROPIC_API_KEY || "",
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-haiku-4-5-20251001",
        max_tokens: 200,
        messages: [{ role: "user", content: prompt }],
      }),
    });

    const data = await response.json();
    const text = data.content?.[0]?.text || "";
    const clean = text.replace(/```json|```/g, "").trim();
    const parsed = JSON.parse(clean);

    return new Response(JSON.stringify(parsed), {
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
      },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: String(error) }), {
      status: 500,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
      },
    });
  }
});