import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useRef, useState } from "react";
import { Animated, Dimensions, Linking, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { supabase } from "../lib/supabase";

const isWeb = typeof document !== "undefined";
const SCREEN_HEIGHT = Dimensions.get("window").height;
const BOTTOM_LIST_HEIGHT = 200;
const SHEET_COLLAPSED = 320;
const SHEET_EXPANDED = 540;
const MAP_HEIGHT = SCREEN_HEIGHT - 60 - BOTTOM_LIST_HEIGHT;

export default function Index() {
  const params = useLocalSearchParams();
  const [hospitals, setHospitals] = useState<any[]>([]);
  const [selectedHospital, setSelectedHospital] = useState<any>(null);
  const [resources, setResources] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [sheetExpanded, setSheetExpanded] = useState(false);
  const mapContainer = useRef<any>(null);
  const map = useRef<any>(null);
  const sheetAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => { fetchHospitals(); }, []);

  useEffect(() => {
    if (isWeb && hospitals.length > 0) {
      let attempts = 0;
      const check = setInterval(() => {
        attempts++;
        if ((window as any).mapboxgl && mapContainer.current) {
          clearInterval(check);
          initMap();
        }
        if (attempts > 100) clearInterval(check);
      }, 200);
      return () => clearInterval(check);
    }
  }, [hospitals]);

  useEffect(() => {
    if (params.focusHospitalId && hospitals.length > 0) {
      const h = hospitals.find((h: any) => h.id === params.focusHospitalId);
      if (h) {
        const waitForMap = setInterval(() => {
          if (map.current) {
            clearInterval(waitForMap);
            openHospital(h);
          }
        }, 200);
        setTimeout(() => clearInterval(waitForMap), 5000);
      }
    }
  }, [params.focusHospitalId, hospitals]);

  async function fetchHospitals() {
    const { data } = await supabase
      .from("hospitals")
      .select("id, name, city, phone, address, latitude, longitude, two_gis_url, working_hours")
      .eq("is_active", true);
    if (data) setHospitals(data);
    setLoading(false);
  }

  async function openHospital(hospital: any) {
    setSelectedHospital(hospital);
    setSheetExpanded(false);
    sheetAnim.setValue(0);

    const { data } = await supabase
      .from("hospital_resources")
      .select("id, machine_type, status, quantity, notes, last_updated, resources(name_russian, category)")
      .eq("hospital_id", hospital.id);
    if (data) setResources(data);

    Animated.spring(sheetAnim, {
      toValue: 1,
      useNativeDriver: false,
      tension: 50,
      friction: 8
    }).start(() => {
      if (map.current) map.current.resize();
    });

    setTimeout(() => {
      if (map.current) {
        map.current.resize();
        map.current.flyTo({
          center: [hospital.longitude, hospital.latitude],
          zoom: 15,
          duration: 1500,
        });
      }
    }, 300);
  }

  function closeSheet() {
    Animated.spring(sheetAnim, { toValue: 0, useNativeDriver: false }).start(() => {
      setSelectedHospital(null);
      setSheetExpanded(false);
      setTimeout(() => { if (map.current) map.current.resize(); }, 100);
    });
  }

  function initMap() {
    console.log("initMap called", mapContainer.current);
    if (map.current || !mapContainer.current) return;
    const mapboxgl = (window as any).mapboxgl;
    if (!mapboxgl) return;
    mapboxgl.accessToken = process.env.EXPO_PUBLIC_MAPBOX_TOKEN;

    const node = (mapContainer.current as any).getDOMNode
      ? (mapContainer.current as any).getDOMNode()
      : mapContainer.current;

    map.current = new mapboxgl.Map({
      container: node,
      style: "mapbox://styles/mapbox/streets-v12",
      center: [71.4460, 51.1801],
      zoom: 11,
      language: "ru",
    });

    map.current.addControl(
      new mapboxgl.NavigationControl({ showCompass: false }),
      "bottom-right"
    );
    map.current.on("load", () => {
      hospitals.forEach((hospital: any) => {
        const el = document.createElement("div");
        el.style.cssText = `
          width: 40px; height: 40px;
          background: #1a5276;
          border: 3px solid #fff;
          border-radius: 50%;
          cursor: pointer;
          display: flex; align-items: center; justify-content: center;
          font-size: 18px;
          box-shadow: 0 2px 8px rgba(0,0,0,0.3);
        `;
        el.innerHTML = "🏥";
        el.addEventListener("click", () => openHospital(hospital));
        new mapboxgl.Marker({ element: el })
          .setLngLat([hospital.longitude, hospital.latitude])
          .addTo(map.current);
      });
    });
  }

  function getStatusColor(status: string) {
    if (status === "working_available") return "#27ae60";
    if (status === "working_booked") return "#f39c12";
    return "#e74c3c";
  }

  function getStatusDot(status: string) {
    if (status === "working_available") return "🟢";
    if (status === "working_booked") return "🟡";
    return "🔴";
  }

  function getStatusLabel(status: string) {
    if (status === "working_available") return "Доступно";
    if (status === "working_booked") return "Занято";
    return "Не работает";
  }

  function formatTime(timestamp: string) {
    if (!timestamp) return "";
    const diff = Math.floor((Date.now() - new Date(timestamp).getTime()) / 60000);
    if (diff < 1) return "только что";
    if (diff < 60) return `${diff} мин назад`;
    return `${Math.floor(diff / 60)} ч назад`;
  }

  const equipment = resources.filter((r: any) => r.resources?.category === "equipment");
  const specialists = resources.filter((r: any) => r.resources?.category === "specialist");

  const sheetHeight = sheetAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, sheetExpanded ? SHEET_EXPANDED : SHEET_COLLAPSED],
  });

  return (
    <View style={styles.container}>
      <View style={styles.appFrame}>

        {/* Top Bar */}
        <View style={styles.topBar}>
          <View style={styles.logo}>
            <Text style={styles.logoText}>mm</Text>
          </View>
          <Text style={styles.appName}>MedMap</Text>
          <TouchableOpacity style={styles.profileBtn}>
            <Text style={styles.profileIcon}>👤</Text>
          </TouchableOpacity>
        </View>

        {/* Map — fixed height, always visible */}
        <View
          style={styles.mapView}
          ref={mapContainer}
        />

        {/* Find Help button — always floating above bottom content */}
        <TouchableOpacity
          style={styles.findBtn}
          onPress={() => router.push("/find/intro")}
        >
          <Text style={styles.findBtnText}>🔍 Найти помощь</Text>
        </TouchableOpacity>

        {/* Hospital bottom sheet */}
        {selectedHospital && (
          <Animated.View style={[styles.sheet, { height: sheetHeight }]}>
            <View style={styles.sheetHeader}>
              <View style={styles.sheetHandle} />
              <TouchableOpacity style={styles.sheetClose} onPress={closeSheet}>
                <Text style={styles.sheetCloseText}>✕</Text>
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>

              <Text style={styles.sheetName}>{selectedHospital.name}</Text>
              {selectedHospital.address ? (
                <Text style={styles.sheetMeta}>📍 {selectedHospital.address}, {selectedHospital.city}</Text>
              ) : (
                <Text style={styles.sheetMeta}>📍 {selectedHospital.city}</Text>
              )}
              {selectedHospital.working_hours ? (
                <Text style={styles.sheetMeta}>🕐 {selectedHospital.working_hours}</Text>
              ) : null}
              {selectedHospital.phone ? (
                <Text style={styles.sheetMeta}>📞 {selectedHospital.phone}</Text>
              ) : null}

              {/* Quick dots */}
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.quickDots}>
                {resources.slice(0, 6).map((r: any) => (
                  <View key={r.id} style={styles.quickDot}>
                    <Text style={styles.quickDotIcon}>{getStatusDot(r.status)}</Text>
                    <Text style={styles.quickDotLabel} numberOfLines={1}>
                      {r.resources?.name_russian?.split(" ")[0] || r.machine_type}
                    </Text>
                  </View>
                ))}
              </ScrollView>

              {/* Buttons */}
              <View style={styles.sheetBtns}>
                <TouchableOpacity
                  style={styles.callBtn}
                  onPress={() => Linking.openURL(`tel:${selectedHospital.phone}`)}
                >
                  <Text style={styles.callBtnText}>📞 Позвонить</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.expandBtn}
                  onPress={() => setSheetExpanded(!sheetExpanded)}
                >
                  <Text style={styles.expandBtnText}>{sheetExpanded ? "▼ Скрыть" : "▲ Подробнее"}</Text>
                </TouchableOpacity>
              </View>

              {/* 2GIS */}
              {selectedHospital.two_gis_url ? (
                <TouchableOpacity
                  style={styles.gisRow}
                  onPress={() => Linking.openURL(selectedHospital.two_gis_url)}
                >
                  <Text style={styles.gisRowText}>🗺️ Открыть в 2ГИС — отзывы и рейтинг</Text>
                  <Text style={styles.gisRowArrow}>→</Text>
                </TouchableOpacity>
              ) : null}

              {/* Expanded resource list */}
              {sheetExpanded && (
                <View style={styles.expandedSection}>
                  {equipment.length > 0 && (
                    <View style={styles.section}>
                      <Text style={styles.sectionTitle}>Оборудование</Text>
                      {equipment.map((r: any) => (
                        <View key={r.id} style={styles.resourceRow}>
                          <Text>{getStatusDot(r.status)}</Text>
                          <Text style={styles.resourceName}>
                            {r.resources?.name_russian || r.machine_type}
                            {r.quantity > 1 ? ` ×${r.quantity}` : ""}
                          </Text>
                          <View style={styles.resourceRight}>
                            <Text style={[styles.resourceStatus, { color: getStatusColor(r.status) }]}>
                              {getStatusLabel(r.status)}
                            </Text>
                            {r.last_updated ? (
                              <Text style={styles.resourceTime}>{formatTime(r.last_updated)}</Text>
                            ) : null}
                          </View>
                        </View>
                      ))}
                    </View>
                  )}

                  {specialists.length > 0 && (
                    <View style={styles.section}>
                      <Text style={styles.sectionTitle}>Специалисты</Text>
                      {specialists.map((r: any) => (
                        <View key={r.id} style={styles.resourceRow}>
                          <Text>{getStatusDot(r.status)}</Text>
                          <Text style={styles.resourceName}>
                            {r.resources?.name_russian || r.machine_type}
                          </Text>
                          <Text style={[styles.resourceStatus, { color: getStatusColor(r.status) }]}>
                            {getStatusLabel(r.status)}
                          </Text>
                        </View>
                      ))}
                    </View>
                  )}

                  <Text style={styles.disclaimer}>
                    MedMap помогает найти оборудование.{" "}
                    <Text style={styles.disclaimerRed}>В экстренных случаях звоните 103.</Text>
                  </Text>
                </View>
              )}

            </ScrollView>
          </Animated.View>
        )}

        {/* Nearby list — only when no hospital selected */}
        {!selectedHospital && (
          <View style={styles.bottomPanel}>
            <Text style={styles.nearbyLabel}>Ближайшие больницы</Text>
            {loading ? (
              <Text style={styles.loadingText}>Загрузка...</Text>
            ) : (
              <ScrollView showsVerticalScrollIndicator={false}>
                {hospitals.map((h: any) => (
                  <TouchableOpacity key={h.id} style={styles.hospitalRow} onPress={() => openHospital(h)}>
                    <View style={styles.hospitalIcon}><Text style={{ fontSize: 16 }}>🏥</Text></View>
                    <View style={styles.hospitalInfo}>
                      <Text style={styles.hospitalName}>{h.name}</Text>
                      <Text style={styles.hospitalCity}>{h.city}</Text>
                    </View>
                    <Text style={styles.hospitalArrow}>→</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            )}
          </View>
        )}

      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#e8f0e9", alignItems: "center" },
  appFrame: { flex: 1, width: "100%", maxWidth: 390, backgroundColor: "#fff", position: "relative", overflow: "hidden" },
  topBar: { height: 60, backgroundColor: "#fff", flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 20, borderBottomWidth: 0.5, borderBottomColor: "#e0e0e0", zIndex: 10 },
  logo: { width: 38, height: 38, backgroundColor: "#0d2137", borderRadius: 10, alignItems: "center", justifyContent: "center" },
  logoText: { color: "#fff", fontSize: 16, fontWeight: "700", fontStyle: "italic" },
  appName: { fontSize: 18, fontWeight: "700", color: "#0d2137" },
  profileBtn: { width: 38, height: 38, backgroundColor: "#e8edf2", borderRadius: 19, alignItems: "center", justifyContent: "center" },
  profileIcon: { fontSize: 18 },
  mapView: { height: MAP_HEIGHT, width: "100%", backgroundColor: "#e8f0e9" },
  findBtn: { position: "absolute", bottom: BOTTOM_LIST_HEIGHT + 12, left: 16, right: 16, backgroundColor: "#1a5276", height: 58, borderRadius: 18, alignItems: "center", justifyContent: "center", zIndex: 10, shadowColor: "#000", shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.25, shadowRadius: 10 },
  findBtnText: { color: "#fff", fontSize: 18, fontWeight: "800", letterSpacing: 0.3 },
  sheet: { position: "absolute", bottom: 0, left: 0, right: 0, backgroundColor: "#fff", borderTopLeftRadius: 24, borderTopRightRadius: 24, zIndex: 20, shadowColor: "#000", shadowOffset: { width: 0, height: -4 }, shadowOpacity: 0.12, shadowRadius: 16, overflow: "hidden" },
  sheetHeader: { flexDirection: "row", alignItems: "center", justifyContent: "center", paddingTop: 14, paddingHorizontal: 20, marginBottom: 4 },
  sheetHandle: { width: 40, height: 4, backgroundColor: "#d0d0d0", borderRadius: 2 },
  sheetClose: { position: "absolute", right: 20, padding: 6 },
  sheetCloseText: { fontSize: 16, color: "#aaa" },
  sheetName: { fontSize: 20, fontWeight: "800", color: "#0d2137", paddingHorizontal: 20, marginBottom: 4 },
  sheetMeta: { fontSize: 13, color: "#666", paddingHorizontal: 20, marginBottom: 3 },
  quickDots: { paddingHorizontal: 20, marginTop: 12, marginBottom: 14 },
  quickDot: { alignItems: "center", marginRight: 18, width: 52 },
  quickDotIcon: { fontSize: 22, marginBottom: 3 },
  quickDotLabel: { fontSize: 10, color: "#888", textAlign: "center" },
  sheetBtns: { flexDirection: "row", gap: 8, paddingHorizontal: 20, marginBottom: 10 },
  callBtn: { flex: 1, height: 50, backgroundColor: "#1a5276", borderRadius: 14, alignItems: "center", justifyContent: "center" },
  callBtnText: { color: "#fff", fontSize: 15, fontWeight: "700" },
  expandBtn: { height: 50, paddingHorizontal: 16, backgroundColor: "#f0f6fb", borderRadius: 14, alignItems: "center", justifyContent: "center" },
  expandBtnText: { color: "#1a5276", fontSize: 13, fontWeight: "600" },
  gisRow: { flexDirection: "row", alignItems: "center", marginHorizontal: 20, marginBottom: 12, padding: 12, backgroundColor: "#f5f9fd", borderRadius: 12, borderWidth: 1, borderColor: "#e0e8f0" },
  gisRowText: { flex: 1, fontSize: 13, color: "#1a5276", fontWeight: "500" },
  gisRowArrow: { fontSize: 16, color: "#1a5276" },
  expandedSection: { paddingHorizontal: 20 },
  section: { marginBottom: 16 },
  sectionTitle: { fontSize: 11, fontWeight: "700", color: "#888", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 10 },
  resourceRow: { flexDirection: "row", alignItems: "center", paddingVertical: 10, borderBottomWidth: 0.5, borderBottomColor: "#f5f5f5", gap: 8 },
  resourceName: { flex: 1, fontSize: 13, color: "#111", fontWeight: "500" },
  resourceRight: { alignItems: "flex-end" },
  resourceStatus: { fontSize: 12, fontWeight: "600" },
  resourceTime: { fontSize: 10, color: "#bbb" },
  disclaimer: { fontSize: 11, color: "#bbb", textAlign: "center", lineHeight: 16, marginTop: 8, marginBottom: 20 },
  disclaimerRed: { color: "#e74c3c" },
  bottomPanel: { height: BOTTOM_LIST_HEIGHT, backgroundColor: "#fff", paddingHorizontal: 16, paddingTop: 10, borderTopWidth: 0.5, borderTopColor: "#e0e0e0" },
  nearbyLabel: { fontSize: 11, color: "#999", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 8 },
  loadingText: { fontSize: 14, color: "#999", textAlign: "center", padding: 16 },
  hospitalRow: { flexDirection: "row", alignItems: "center", paddingVertical: 10, borderBottomWidth: 0.5, borderBottomColor: "#f5f5f5" },
  hospitalIcon: { width: 34, height: 34, backgroundColor: "#e8f0f7", borderRadius: 8, alignItems: "center", justifyContent: "center", marginRight: 10 },
  hospitalInfo: { flex: 1 },
  hospitalName: { fontSize: 14, fontWeight: "600", color: "#111" },
  hospitalCity: { fontSize: 12, color: "#999" },
  hospitalArrow: { fontSize: 16, color: "#1a5276" },
});