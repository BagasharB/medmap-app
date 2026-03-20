import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import { Linking, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { supabase } from "../../lib/supabase";

export default function Result() {
  const params = useLocalSearchParams();
  const [state, setState] = useState<"loading" | "match" | "noAvailable" | "noResource">("loading");
  const [matchedHospital, setMatchedHospital] = useState<any>(null);
  const [matchedResource, setMatchedResource] = useState<any>(null);
  const [resourceName, setResourceName] = useState("");
  const [allHospitals, setAllHospitals] = useState<any[]>([]);

  useEffect(() => {
    loadResult();
  }, []);

  async function loadResult() {
    const resourceKey = params.resourceKey as string;

    // Get resource display name
    if (resourceKey) {
      const { data: res } = await supabase
        .from("resources")
        .select("name_russian")
        .eq("key", resourceKey)
        .single();
      if (res) setResourceName(res.name_russian);
    }

    // State 1: Look for working_available match
    const { data: available } = await supabase
      .from("hospital_resources")
      .select(`
        id, machine_type, status, last_updated,
        hospitals(id, name, phone, city, address, accepts_children)
      `)
      .eq("machine_type", resourceKey)
      .eq("status", "working_available");

    const forChild = params.forWho === "child";
    let matched = (available || []) as any[];
    if (forChild) {
      matched = matched.filter((r: any) => r.hospitals?.accepts_children === true);
    }

    if (matched.length > 0) {
      setMatchedHospital(matched[0].hospitals);
      setMatchedResource(matched[0]);
      setState("match");
      return;
    }

    // State 2: Look for any hospital with this resource (any status)
    const { data: anyStatus } = await supabase
      .from("hospital_resources")
      .select(`
        id, machine_type, status, last_updated,
        hospitals(id, name, phone, city, address, accepts_children)
      `)
      .eq("machine_type", resourceKey);

    let anyMatched = (anyStatus || []) as any[];
    if (forChild) {
      anyMatched = anyMatched.filter((r: any) => r.hospitals?.accepts_children === true);
    }

    if (anyMatched.length > 0) {
      setAllHospitals(anyMatched);
      setState("noAvailable");
      return;
    }

    // State 3: Nobody has this resource
    setState("noResource");
  }

  function formatTime(timestamp: string) {
    if (!timestamp) return "Нет данных";
    const diff = Math.floor((Date.now() - new Date(timestamp).getTime()) / 60000);
    if (diff < 1) return "Только что";
    if (diff < 60) return `${diff} мин назад`;
    return `${Math.floor(diff / 60)} ч назад`;
  }

  function getStatusLabel(status: string) {
    if (status === "working_available") return "✅ Доступно";
    if (status === "working_booked") return "🟡 Занято";
    return "❌ Не работает";
  }

  function getStatusColor(status: string) {
    if (status === "working_available") return "#27ae60";
    if (status === "working_booked") return "#f39c12";
    return "#e74c3c";
  }

  if (state === "loading") {
    return (
      <View style={{ flex: 1, backgroundColor: "#0d2137", alignItems: "center", justifyContent: "center" }}>
        <View style={{ width: 64, height: 64, backgroundColor: "rgba(255,255,255,0.1)", borderRadius: 18, alignItems: "center", justifyContent: "center", marginBottom: 32 }}>
          <Text style={{ color: "#fff", fontSize: 24, fontWeight: "700", fontStyle: "italic" }}>mm</Text>
        </View>
        <Text style={{ fontSize: 18, fontWeight: "700", color: "#fff", marginBottom: 8 }}>Анализируем результат...</Text>
        <Text style={{ fontSize: 14, color: "rgba(255,255,255,0.5)" }}>Проверяем доступность</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
        <View style={styles.inner}>

          {/* Back button */}
          <TouchableOpacity style={styles.backBtn} onPress={() => router.push("/")}>
            <Text style={styles.backText}>←</Text>
          </TouchableOpacity>

          {/* AI reasoning */}
          <View style={styles.aiBox}>
            <Text style={styles.aiLabel}>🤖 Анализ ИИ</Text>
            <Text style={styles.aiReasoning}>
              {params.reasoning as string || "На основе ваших ответов мы определили наиболее подходящий тип помощи."}
            </Text>
            {resourceName ? (
              <View style={styles.resourceTag}>
                <Text style={styles.resourceTagText}>{resourceName}</Text>
              </View>
            ) : null}
          </View>

          {/* STATE 1: Direct match found */}
          {state === "match" && matchedHospital ? (
            <View>
              <View style={styles.matchBox}>
                <View style={styles.matchHeader}>
                  <View style={styles.availableDot} />
                  <Text style={styles.availableText}>Доступно прямо сейчас</Text>
                </View>
                <Text style={styles.hospitalName}>{matchedHospital.name}</Text>
                <Text style={styles.hospitalMeta}>📍 {matchedHospital.city}</Text>
                {matchedResource ? (
                  <Text style={styles.hospitalMeta}>🕐 Обновлено {formatTime(matchedResource.last_updated)}</Text>
                ) : null}
              </View>

              <TouchableOpacity
                style={styles.callBtn}
                onPress={() => Linking.openURL(`tel:${matchedHospital.phone}`)}
              >
                <Text style={styles.callBtnText}>📞 Позвонить в больницу</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.detailsBtn}
                onPress={() => router.push({ pathname: "/", params: { hospitalId: matchedHospital.id } })}
              >
                <Text style={styles.detailsBtnText}>Подробнее о больнице →</Text>
              </TouchableOpacity>
            </View>
          ) : null}

          {/* STATE 2: No available match but hospitals have the resource */}
          {state === "noAvailable" ? (
            <View>
              <View style={styles.warningBox}>
                <Text style={styles.warningTitle}>⚠️ Сейчас недоступно</Text>
                <Text style={styles.warningText}>
                  {resourceName} в данный момент недоступен ни в одной больнице. Ниже список больниц с этим оборудованием — позвоните напрямую, чтобы уточнить статус.
                </Text>
              </View>

              {allHospitals.map((item: any) => (
                <View key={item.id} style={styles.hospitalRow}>
                  <View style={styles.hospitalRowInfo}>
                    <Text style={styles.hospitalRowName}>{item.hospitals?.name}</Text>
                    <Text style={styles.hospitalRowCity}>📍 {item.hospitals?.city}</Text>
                    <Text style={[styles.hospitalRowStatus, { color: getStatusColor(item.status) }]}>
                      {getStatusLabel(item.status)}
                    </Text>
                  </View>
                  <View style={styles.hospitalRowBtns}>
                    <TouchableOpacity
                      style={styles.callSmallBtn}
                      onPress={() => Linking.openURL(`tel:${item.hospitals?.phone}`)}
                    >
                      <Text style={styles.callSmallBtnText}>Звонить</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.detailsSmallBtn}
                      onPress={() => router.push({ pathname: "/", params: { hospitalId: item.hospitals?.id } })}
                    >
                      <Text style={styles.detailsSmallBtnText}>Детали</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ))}
            </View>
          ) : null}

          {/* STATE 3: Nobody has this resource */}
          {state === "noResource" ? (
            <View style={styles.noResourceBox}>
              <Text style={styles.noResourceTitle}>😔 Оборудование не найдено</Text>
              <Text style={styles.noResourceText}>
                {resourceName || "Данное оборудование"} не отслеживается ни в одной больнице вашего района.
              </Text>
              <TouchableOpacity
                style={styles.emergencyBtn}
                onPress={() => Linking.openURL("tel:103")}
              >
                <Text style={styles.emergencyBtnText}>📞 Позвонить 103</Text>
              </TouchableOpacity>
            </View>
          ) : null}

          {/* Disclaimer */}
          <Text style={styles.disclaimer}>
            MedMap помогает найти оборудование. Данные обновляются координаторами больниц.{" "}
            <Text style={styles.disclaimerRed}>В экстренных случаях звоните 103.</Text>
          </Text>

        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff", alignItems: "center" },
  scroll: { width: "100%" },
  scrollContent: { alignItems: "center", flexGrow: 1 },
  inner: { width: "100%", maxWidth: 390, backgroundColor: "#fff", padding: 24, paddingTop: 48, minHeight: "100%" },
  loadingText: { fontSize: 16, color: "#888", textAlign: "center", padding: 32 },
  backBtn: { width: 40, height: 40, alignItems: "center", justifyContent: "center", marginBottom: 16 },
  backText: { fontSize: 24, color: "#0d2137" },
  aiBox: { backgroundColor: "#f0f6fb", borderRadius: 14, padding: 16, marginBottom: 16 },
  aiLabel: { fontSize: 13, fontWeight: "700", color: "#1a5276", marginBottom: 8 },
  aiReasoning: { fontSize: 15, color: "#333", lineHeight: 22, marginBottom: 10 },
  resourceTag: { backgroundColor: "#1a5276", alignSelf: "flex-start", paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  resourceTagText: { color: "#fff", fontSize: 12, fontWeight: "700" },
  matchBox: { backgroundColor: "#f0fff4", borderWidth: 1.5, borderColor: "#27ae60", borderRadius: 14, padding: 16, marginBottom: 16 },
  matchHeader: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 8 },
  availableDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: "#27ae60" },
  availableText: { fontSize: 13, fontWeight: "700", color: "#27ae60" },
  hospitalName: { fontSize: 20, fontWeight: "800", color: "#0d2137", marginBottom: 6 },
  hospitalMeta: { fontSize: 13, color: "#666", marginBottom: 2 },
  callBtn: { backgroundColor: "#1a5276", height: 54, borderRadius: 16, alignItems: "center", justifyContent: "center", marginBottom: 10 },
  callBtnText: { color: "#fff", fontSize: 17, fontWeight: "700" },
  detailsBtn: { borderWidth: 1.5, borderColor: "#1a5276", height: 48, borderRadius: 16, alignItems: "center", justifyContent: "center", marginBottom: 16 },
  detailsBtnText: { color: "#1a5276", fontSize: 15, fontWeight: "600" },
  warningBox: { backgroundColor: "#fff8e1", borderWidth: 1, borderColor: "#f39c12", borderRadius: 14, padding: 16, marginBottom: 16 },
  warningTitle: { fontSize: 15, fontWeight: "700", color: "#e67e22", marginBottom: 6 },
  warningText: { fontSize: 14, color: "#555", lineHeight: 20 },
  hospitalRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", padding: 14, borderWidth: 1, borderColor: "#e0e8f0", borderRadius: 12, marginBottom: 10 },
  hospitalRowInfo: { flex: 1 },
  hospitalRowName: { fontSize: 14, fontWeight: "700", color: "#0d2137", marginBottom: 2 },
  hospitalRowCity: { fontSize: 12, color: "#888", marginBottom: 4 },
  hospitalRowStatus: { fontSize: 12, fontWeight: "600" },
  hospitalRowBtns: { flexDirection: "column", gap: 6, marginLeft: 10 },
  callSmallBtn: { backgroundColor: "#1a5276", paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8 },
  callSmallBtnText: { color: "#fff", fontSize: 12, fontWeight: "600" },
  detailsSmallBtn: { borderWidth: 1, borderColor: "#1a5276", paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8 },
  detailsSmallBtnText: { color: "#1a5276", fontSize: 12, fontWeight: "600" },
  noResourceBox: { backgroundColor: "#fff2f2", borderRadius: 14, padding: 20, marginBottom: 16, alignItems: "center" },
  noResourceTitle: { fontSize: 18, fontWeight: "800", color: "#c0392b", marginBottom: 8 },
  noResourceText: { fontSize: 14, color: "#666", textAlign: "center", lineHeight: 20, marginBottom: 16 },
  emergencyBtn: { backgroundColor: "#c0392b", height: 54, borderRadius: 16, alignItems: "center", justifyContent: "center", width: "100%" },
  emergencyBtnText: { color: "#fff", fontSize: 17, fontWeight: "700" },
  disclaimer: { fontSize: 11, color: "#bbb", textAlign: "center", lineHeight: 16, marginTop: 16 },
  disclaimerRed: { color: "#e74c3c" },
});