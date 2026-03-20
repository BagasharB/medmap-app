import { router, useLocalSearchParams } from "expo-router";
import { Linking, StyleSheet, Text, TouchableOpacity, View } from "react-native";

export default function Emergency() {
  const params = useLocalSearchParams();

  return (
    <View style={styles.container}>
      <View style={styles.inner}>

        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Text style={styles.backText}>←</Text>
        </TouchableOpacity>

        <View style={styles.body}>
          <Text style={styles.icon}>🚨</Text>
          <Text style={styles.title}>В экстренных случаях</Text>
          <Text style={styles.sub}>
            Немедленно вызовите скорую помощь. Не теряйте время на поиск больницы.
          </Text>

          <TouchableOpacity
            style={styles.callBtn}
            onPress={() => Linking.openURL("tel:103")}
          >
            <Text style={styles.callBtnText}>📞 Позвонить 103</Text>
          </TouchableOpacity>

          {params.problemType === "mental" && (
            <TouchableOpacity
              style={styles.crisisBtn}
              onPress={() => Linking.openURL("tel:88000808090")}
            >
              <Text style={styles.crisisBtnText}>📞 Психологическая помощь: 8-800-080-8090</Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity
            style={styles.continueBtn}
            onPress={() => router.push({ pathname: "/find/description", params })}
          >
            <Text style={styles.continueBtnText}>Продолжить поиск больницы</Text>
          </TouchableOpacity>
        </View>

      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff2f2", alignItems: "center" },
  inner: { flex: 1, width: "100%", maxWidth: 390, backgroundColor: "#fff2f2", paddingHorizontal: 24, paddingTop: 56, paddingBottom: 32 },
  backBtn: { width: 40, height: 40, alignItems: "center", justifyContent: "center", marginBottom: 24 },
  backText: { fontSize: 24, color: "#c0392b" },
  body: { flex: 1, alignItems: "center", justifyContent: "center" },
  icon: { fontSize: 64, marginBottom: 20 },
  title: { fontSize: 24, fontWeight: "800", color: "#c0392b", marginBottom: 12, textAlign: "center" },
  sub: { fontSize: 15, color: "#666", lineHeight: 22, textAlign: "center", marginBottom: 32 },
  callBtn: { width: "100%", height: 64, backgroundColor: "#c0392b", borderRadius: 18, alignItems: "center", justifyContent: "center", marginBottom: 12 },
  callBtnText: { color: "#fff", fontSize: 20, fontWeight: "800" },
  crisisBtn: { width: "100%", padding: 16, backgroundColor: "#fff", borderWidth: 1.5, borderColor: "#c0392b", borderRadius: 14, alignItems: "center", marginBottom: 12 },
  crisisBtnText: { color: "#c0392b", fontSize: 14, fontWeight: "600", textAlign: "center" },
  continueBtn: { padding: 12 },
  continueBtnText: { color: "#c0392b", fontSize: 14, textDecorationLine: "underline" },
});