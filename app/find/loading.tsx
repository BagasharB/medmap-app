import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useRef } from "react";
import { Animated, Easing, Image, StyleSheet, Text, View } from "react-native";
import { supabase } from "../../lib/supabase";

const ambulanceBody = require("../../assets/images/ambulance-body.png");
const wheelImg = require("../../assets/images/wheel.png");
const smoke1Img = require("../../assets/images/smoke1.png");
const smoke2Img = require("../../assets/images/smoke2.png");
const smoke3Img = require("../../assets/images/smoke3.png");

export default function Loading() {
  const params = useLocalSearchParams();
  const bounceAnim = useRef(new Animated.Value(0)).current;
  const wheelRotate = useRef(new Animated.Value(0)).current;
  const smokeAnim1 = useRef(new Animated.Value(0)).current;
  const smokeAnim2 = useRef(new Animated.Value(0)).current;
  const smokeAnim3 = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    // Occasional bounce — bumps every few seconds
    Animated.loop(
      Animated.sequence([
        Animated.delay(800),
        Animated.timing(bounceAnim, { toValue: -8, duration: 120, useNativeDriver: true }),
        Animated.timing(bounceAnim, { toValue: 2, duration: 80, useNativeDriver: true }),
        Animated.timing(bounceAnim, { toValue: -4, duration: 80, useNativeDriver: true }),
        Animated.timing(bounceAnim, { toValue: 0, duration: 100, useNativeDriver: true }),
        Animated.delay(200),
      ])
    ).start();

    // Wheels — fast and visible spin
    Animated.loop(
      Animated.timing(wheelRotate, {
        toValue: 1,
        duration: 300,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    ).start();

    // Smoke puffs staggered
    const animSmoke = (anim: Animated.Value, delay: number) => {
      Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.timing(anim, { toValue: 1, duration: 900, useNativeDriver: true }),
          Animated.timing(anim, { toValue: 0, duration: 0, useNativeDriver: true }),
        ])
      ).start();
    };
    animSmoke(smokeAnim1, 0);
    animSmoke(smokeAnim2, 300);
    animSmoke(smokeAnim3, 600);

    // Logo pulse
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.08, duration: 700, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 700, useNativeDriver: true }),
      ])
    ).start();

    runAIMatch();
  }, []);

  const wheelSpin = wheelRotate.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "360deg"],
  });

  async function runAIMatch() {
    try {
      const response = await fetch(
        "https://ddsjldbgcsgxhsuwhigr.supabase.co/functions/v1/ai-match",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY}`,
          },
          body: JSON.stringify({
            forWho: params.forWho,
            problemType: params.problemType,
            bodyPart: params.bodyPart,
            urgency: params.urgency,
            description: params.description,
          }),
        }
      );

      const parsed = await response.json();
      const resourceKey = parsed.resource_key;
      const forChild = params.forWho === "child";

      const { data: resources } = await supabase
        .from("hospital_resources")
        .select("id, machine_type, status, last_updated, hospital_id, hospitals(id, name, phone, city, accepts_children)")
        .eq("machine_type", resourceKey)
        .eq("status", "working_available");

      let matched = (resources || []) as any[];
      if (forChild) matched = matched.filter((r: any) => r.hospitals?.accepts_children === true);

      if (matched.length > 0) {
        router.push({
          pathname: "/find/result",
          params: { ...params, resourceKey, hospitalId: matched[0].hospital_id, reasoning: parsed.reasoning }
        });
      } else {
        router.push({
          pathname: "/find/result",
          params: { ...params, resourceKey, noMatch: "true", reasoning: parsed.reasoning || "Подходящая больница не найдена." }
        });
      }
    } catch (error) {
      router.push({ pathname: "/find/result", params });
    }
  }

  return (
    <View style={styles.outer}>
      <View style={styles.container}>

        <Animated.View style={[styles.logo, { transform: [{ scale: pulseAnim }] }]}>
          <Text style={styles.logoText}>mm</Text>
        </Animated.View>

        <Text style={styles.title}>Ищем ближайшую помощь...</Text>
        <Text style={styles.sub}>ИИ анализирует ваши ответы</Text>

        {/* Scene */}
        <View style={styles.scene}>

          {/* Smoke — left side behind ambulance */}
          <Animated.Image source={smoke1Img} style={[styles.smokeBase, styles.smoke1, {
            opacity: smokeAnim1.interpolate({ inputRange: [0, 0.3, 1], outputRange: [0, 1, 0] }),
            transform: [
              { translateY: smokeAnim1.interpolate({ inputRange: [0, 1], outputRange: [0, -20] }) },
              { scale: smokeAnim1.interpolate({ inputRange: [0, 1], outputRange: [0.5, 1.1] }) },
            ]
          }]} />
          <Animated.Image source={smoke2Img} style={[styles.smokeBase, styles.smoke2, {
            opacity: smokeAnim2.interpolate({ inputRange: [0, 0.3, 1], outputRange: [0, 0.8, 0] }),
            transform: [
              { translateY: smokeAnim2.interpolate({ inputRange: [0, 1], outputRange: [0, -28] }) },
              { scale: smokeAnim2.interpolate({ inputRange: [0, 1], outputRange: [0.6, 1.3] }) },
            ]
          }]} />
          <Animated.Image source={smoke3Img} style={[styles.smokeBase, styles.smoke3, {
            opacity: smokeAnim3.interpolate({ inputRange: [0, 0.3, 1], outputRange: [0, 0.6, 0] }),
            transform: [
              { translateY: smokeAnim3.interpolate({ inputRange: [0, 1], outputRange: [0, -36] }) },
              { scale: smokeAnim3.interpolate({ inputRange: [0, 1], outputRange: [0.7, 1.5] }) },
            ]
          }]} />

          {/* Ambulance group — body + wheels bounce together */}
          <Animated.View style={[styles.ambulanceGroup, { transform: [{ translateY: bounceAnim }] }]}>
            <Image source={ambulanceBody} style={styles.bodyImg} />
            <Animated.Image
              source={wheelImg}
              style={[styles.wheel, styles.wheelBack, { transform: [{ rotate: wheelSpin }] }]}
            />
            <Animated.Image
              source={wheelImg}
              style={[styles.wheel, styles.wheelFront, { transform: [{ rotate: wheelSpin }] }]}
            />
          </Animated.View>

        </View>

      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  outer: { flex: 1, backgroundColor: "#0d2137", alignItems: "center" },
  container: {
    flex: 1,
    width: "100%",
    maxWidth: 390,
    backgroundColor: "#0d2137",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 32,
  },
  logo: {
    width: 64, height: 64,
    backgroundColor: "rgba(255,255,255,0.1)",
    borderRadius: 18,
    alignItems: "center", justifyContent: "center",
    marginBottom: 24,
  },
  logoText: { color: "#fff", fontSize: 24, fontWeight: "700", fontStyle: "italic" },
  title: { fontSize: 20, fontWeight: "700", color: "#fff", textAlign: "center", marginBottom: 8 },
  sub: { fontSize: 14, color: "rgba(255,255,255,0.4)", textAlign: "center", marginBottom: 48 },

  scene: {
    width: 180,
    height: 90,
    position: "relative",
  },

  smokeBase: { position: "absolute", resizeMode: "contain" },
  smoke1: { left: -10, bottom: 28, width: 30, height: 30 },
  smoke2: { left: -22, bottom: 30, width: 42, height: 42 },
  smoke3: { left: -34, bottom: 32, width: 54, height: 54 },

  ambulanceGroup: {
    position: "absolute",
    bottom: 0,
    left: 40,
    width: 110,
    height: 70,
  },
  bodyImg: {
    position: "absolute",
    bottom: 14,
    left: 0,
    width: 110,
    height: 50,
    resizeMode: "contain",
  },
  wheel: {
    position: "absolute",
    bottom: 0,
    width: 22,
    height: 22,
    resizeMode: "contain",
  },
  wheelBack: { left: 11, bottom: 7 },
  wheelFront: { left: 75, bottom: 7 },
});