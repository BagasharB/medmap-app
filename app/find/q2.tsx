import { router, useLocalSearchParams } from "expo-router";
import { useState } from "react";
import { KeyboardAvoidingView, Platform, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";

export default function Q2() {
  const params = useLocalSearchParams();
  const [description, setDescription] = useState("");
  const [selectedPart, setSelectedPart] = useState("");

  const quickOptions = ["Голова", "Грудь", "Живот", "Спина", "Рука", "Нога"];

  function handleNext() {
    router.push({
      pathname: "/find/q3",
      params: {
        ...params,
        bodyPart: selectedPart,
        description,
      }
    });
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <View style={styles.inner}>

        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Text style={styles.backText}>←</Text>
        </TouchableOpacity>

        <View style={styles.progressBar}>
          <View style={[styles.progressFill, { width: "66%" }]} />
        </View>

        <Text style={styles.step}>Вопрос 2 из 3</Text>
        <Text style={styles.question}>Опишите проблему</Text>
        <Text style={styles.sub}>Чем подробнее — тем точнее подберём помощь</Text>

        {/* Quick body part chips */}
        <Text style={styles.chipsLabel}>Где на теле? (необязательно)</Text>
        <View style={styles.grid}>
          {quickOptions.map(opt => (
            <TouchableOpacity
              key={opt}
              style={[styles.chip, selectedPart === opt && styles.chipSelected]}
              onPress={() => setSelectedPart(selectedPart === opt ? "" : opt)}
            >
              <Text style={[styles.chipLabel, selectedPart === opt && styles.chipLabelSelected]}>
                {opt}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Main description input */}
        <Text style={styles.chipsLabel}>Что случилось?</Text>
        <TextInput
          style={styles.input}
          placeholder="Например: упал с велосипеда, ударился головой, кружится голова..."
          placeholderTextColor="#bbb"
          value={description}
          onChangeText={setDescription}
          multiline
          numberOfLines={4}
          textAlignVertical="top"
        />

        <TouchableOpacity
          style={styles.skipBtn}
          onPress={() => router.push({
            pathname: "/find/q3",
            params: { ...params, bodyPart: selectedPart, description: "" }
          })}
        >
          <Text style={styles.skipText}>Пропустить →</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.nextBtn, description.length === 0 && styles.nextBtnDisabled]}
          onPress={handleNext}
        >
          <Text style={styles.nextBtnText}>Далее →</Text>
        </TouchableOpacity>

      </View>
    </KeyboardAvoidingView>
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
  sub: { fontSize: 14, color: "#888", marginBottom: 20 },
  chipsLabel: { fontSize: 13, fontWeight: "600", color: "#555", marginBottom: 10 },
  grid: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 20 },
  chip: { paddingVertical: 8, paddingHorizontal: 14, backgroundColor: "#fff", borderWidth: 1.5, borderColor: "#e0e8f0", borderRadius: 20 },
  chipSelected: { borderColor: "#1a5276", backgroundColor: "#e8f0f7" },
  chipLabel: { fontSize: 13, fontWeight: "600", color: "#0d2137" },
  chipLabelSelected: { color: "#1a5276" },
  input: { borderWidth: 1.5, borderColor: "#e0e8f0", borderRadius: 14, padding: 14, fontSize: 15, color: "#111", minHeight: 120, marginBottom: 12 },
  skipBtn: { alignItems: "center", padding: 10, marginBottom: 8 },
  skipText: { fontSize: 14, color: "#999", textDecorationLine: "underline" },
  nextBtn: { backgroundColor: "#1a5276", height: 54, borderRadius: 16, alignItems: "center", justifyContent: "center" },
  nextBtnDisabled: { backgroundColor: "#a0b4c4" },
  nextBtnText: { color: "#fff", fontSize: 17, fontWeight: "700" },
});