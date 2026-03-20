import { router, useLocalSearchParams } from "expo-router";
import { useState } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

export default function Q1() {
  const params = useLocalSearchParams();
  const [selected, setSelected] = useState("");

  const options = [
    { key: "trauma", label: "Травма", icon: "🤕" },
    { key: "pain", label: "Боль", icon: "😣" },
    { key: "mental", label: "Психическое", icon: "🧠" },
    { key: "chronic", label: "Хроническое", icon: "🔄" },
    { key: "other", label: "Другое", icon: "❓" },
  ];

  function handleSelect(key: string) {
    setSelected(key);
    setTimeout(() => {
      if (key === "mental") {
        router.push({ 
          pathname: "/find/q3", 
          params: { ...params, problemType: key } 
        });
      } else {
        router.push({ 
          pathname: "/find/q2", 
          params: { ...params, problemType: key } 
        });
      }
    }, 200);
  }

  return (
    <View style={styles.container}>
      <View style={styles.inner}>

        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Text style={styles.backText}>←</Text>
        </TouchableOpacity>

        <View style={styles.progressBar}>
          <View style={[styles.progressFill, { width: "50%" }]} />
        </View>

        <Text style={styles.step}>Вопрос 1 из 3</Text>
        <Text style={styles.question}>Какой тип проблемы?</Text>
        <Text style={styles.sub}>Выберите наиболее подходящий вариант</Text>

        <View style={styles.grid}>
          {options.map(opt => (
            <TouchableOpacity
              key={opt.key}
              style={[styles.chip, selected === opt.key && styles.chipSelected]}
              onPress={() => handleSelect(opt.key)}
            >
              <Text style={styles.chipIcon}>{opt.icon}</Text>
              <Text style={[styles.chipLabel, selected === opt.key && styles.chipLabelSelected]}>
                {opt.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

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
    marginBottom: 16,
  },
  backText: {
    fontSize: 24,
    color: "#0d2137",
  },
  progressBar: {
    height: 4,
    backgroundColor: "#e0e8f0",
    borderRadius: 2,
    marginBottom: 24,
  },
  progressFill: {
    height: 4,
    backgroundColor: "#1a5276",
    borderRadius: 2,
  },
  step: {
    fontSize: 12,
    color: "#1a5276",
    fontWeight: "600",
    letterSpacing: 1,
    textTransform: "uppercase",
    marginBottom: 8,
  },
  question: {
    fontSize: 24,
    fontWeight: "800",
    color: "#0d2137",
    marginBottom: 8,
  },
  sub: {
    fontSize: 14,
    color: "#888",
    marginBottom: 32,
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  chip: {
    width: "47%",
    padding: 16,
    backgroundColor: "#fff",
    borderWidth: 1.5,
    borderColor: "#e0e8f0",
    borderRadius: 14,
    alignItems: "center",
    gap: 8,
  },
  chipSelected: {
    borderColor: "#1a5276",
    backgroundColor: "#e8f0f7",
  },
  chipIcon: {
    fontSize: 28,
  },
  chipLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#0d2137",
    textAlign: "center",
  },
  chipLabelSelected: {
    color: "#1a5276",
  },
});