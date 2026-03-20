import { router } from "expo-router";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

export default function Intro() {
  return (
    <View style={styles.container}>
      <View style={styles.inner}>
        
        {/* Back button */}
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Text style={styles.backText}>←</Text>
        </TouchableOpacity>

        {/* Content */}
        <View style={styles.body}>
          <View style={styles.iconBox}>
            <Text style={styles.icon}>🔍</Text>
          </View>

          <Text style={styles.title}>Найдём вам лучшую помощь поблизости</Text>
          <Text style={styles.sub}>
            Ответьте на несколько коротких вопросов — наш ИИ подберёт ближайшую больницу с нужным оборудованием или специалистом
          </Text>

          {/* Steps */}
          <View style={styles.stepsRow}>
            <View style={styles.step}>
              <Text style={styles.stepNum}>1</Text>
              <Text style={styles.stepLabel}>Тип проблемы</Text>
            </View>
            <View style={styles.step}>
              <Text style={styles.stepNum}>2</Text>
              <Text style={styles.stepLabel}>Часть тела</Text>
            </View>
            <View style={styles.step}>
              <Text style={styles.stepNum}>3</Text>
              <Text style={styles.stepLabel}>Срочность</Text>
            </View>
          </View>
        </View>

        {/* Start button */}
        <TouchableOpacity 
          style={styles.startBtn} 
          onPress={() => router.push("/find/q0")}
        >
          <Text style={styles.startBtnText}>Начать →</Text>
        </TouchableOpacity>

      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
    alignItems: "center",
  },
  inner: {
    flex: 1,
    width: "100%",
    maxWidth: 390,
    backgroundColor: "#fff",
    paddingHorizontal: 24,
    paddingTop: 56,
    paddingBottom: 32,
  },
  backBtn: {
    width: 40, height: 40,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 24,
  },
  backText: {
    fontSize: 24,
    color: "#0d2137",
  },
  body: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  iconBox: {
    width: 80, height: 80,
    backgroundColor: "#e8f0f7",
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 24,
  },
  icon: {
    fontSize: 36,
  },
  title: {
    fontSize: 26,
    fontWeight: "800",
    color: "#0d2137",
    textAlign: "center",
    lineHeight: 34,
    marginBottom: 12,
  },
  sub: {
    fontSize: 15,
    color: "#666",
    textAlign: "center",
    lineHeight: 22,
    marginBottom: 40,
  },
  stepsRow: {
    flexDirection: "row",
    gap: 12,
  },
  step: {
    flex: 1,
    backgroundColor: "#f5f9fd",
    borderRadius: 12,
    padding: 12,
    alignItems: "center",
    borderWidth: 0.5,
    borderColor: "#e0e8f0",
  },
  stepNum: {
    fontSize: 22,
    fontWeight: "800",
    color: "#1a5276",
    marginBottom: 4,
  },
  stepLabel: {
    fontSize: 11,
    color: "#555",
    textAlign: "center",
  },
  startBtn: {
    backgroundColor: "#1a5276",
    height: 56,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  startBtnText: {
    color: "#fff",
    fontSize: 17,
    fontWeight: "700",
  },
});