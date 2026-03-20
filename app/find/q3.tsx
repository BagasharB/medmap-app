import { router, useLocalSearchParams } from "expo-router";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

export default function Q3() {
  const params = useLocalSearchParams();

  function handleSelect(urgency: string) {
    if (urgency === "emergency") {
      router.push({ pathname: "/find/emergency", params });
    } else {
      router.push({ pathname: "/find/loading", params: { ...params, urgency } });
    }
  }

  return (
    <View style={styles.container}>
      <View style={styles.inner}>

        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Text style={styles.backText}>←</Text>
        </TouchableOpacity>

        <View style={styles.progressBar}>
          <View style={[styles.progressFill, { width: "100%" }]} />
        </View>

        <Text style={styles.step}>Вопрос 3 из 3</Text>
        <Text style={styles.question}>Насколько срочно?</Text>
        <Text style={styles.sub}>Это поможет нам приоритизировать поиск</Text>

        <TouchableOpacity style={styles.urgencyChip} onPress={() => handleSelect("emergency")}>
          <View style={[styles.dot, { backgroundColor: "#e74c3c" }]} />
          <View style={styles.urgencyInfo}>
            <Text style={styles.urgencyTitle}>Экстренно</Text>
            <Text style={styles.urgencySub}>Нужна немедленная помощь</Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity style={styles.urgencyChip} onPress={() => handleSelect("today")}>
          <View style={[styles.dot, { backgroundColor: "#f39c12" }]} />
          <View style={styles.urgencyInfo}>
            <Text style={styles.urgencyTitle}>Сегодня</Text>
            <Text style={styles.urgencySub}>Нужна помощь сегодня</Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity style={styles.urgencyChip} onPress={() => handleSelect("noturgent")}>
          <View style={[styles.dot, { backgroundColor: "#27ae60" }]} />
          <View style={styles.urgencyInfo}>
            <Text style={styles.urgencyTitle}>Не срочно</Text>
            <Text style={styles.urgencySub}>Могу подождать несколько дней</Text>
          </View>
        </TouchableOpacity>

      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f5f5f5", alignItems: "center" },
  inner: { flex: 1, width: "100%", maxWidth: 390, backgroundColor: "#fff", paddingHorizontal: 24, paddingTop: 56, paddingBottom: 32 },
  backBtn: { width: 40, height: 40, alignItems: "center", justifyContent: "center", marginBottom: 16 },
  backText: { fontSize: 24, color: "#0d2137" },
  progressBar: { height: 4, backgroundColor: "#e0e8f0", borderRadius: 2, marginBottom: 24 },
  progressFill: { height: 4, backgroundColor: "#1a5276", borderRadius: 2 },
  step: { fontSize: 12, color: "#1a5276", fontWeight: "600", letterSpacing: 1, textTransform: "uppercase", marginBottom: 8 },
  question: { fontSize: 24, fontWeight: "800", color: "#0d2137", marginBottom: 8 },
  sub: { fontSize: 14, color: "#888", marginBottom: 32 },
  urgencyChip: { flexDirection: "row", alignItems: "center", padding: 18, backgroundColor: "#fff", borderWidth: 1.5, borderColor: "#e0e8f0", borderRadius: 14, gap: 16, marginBottom: 12 },
  dot: { width: 14, height: 14, borderRadius: 7 },
  urgencyInfo: { flex: 1 },
  urgencyTitle: { fontSize: 16, fontWeight: "700", color: "#0d2137", marginBottom: 2 },
  urgencySub: { fontSize: 13, color: "#888" },
});