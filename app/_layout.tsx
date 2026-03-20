import { Stack } from "expo-router";
import { useEffect } from "react";
import { Platform } from "react-native";

export default function RootLayout() {
  useEffect(() => {
    if (Platform.OS === "web") {
      const link = document.createElement("link");
      link.rel = "stylesheet";
      link.href = "https://api.mapbox.com/mapbox-gl-js/v3.0.0/mapbox-gl.css";
      document.head.appendChild(link);

      const script = document.createElement("script");
      script.src = "https://api.mapbox.com/mapbox-gl-js/v3.0.0/mapbox-gl.js";
      script.async = true;
      document.head.appendChild(script);
    }
  }, []);

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: "#f5f5f5" },
        animation: "slide_from_right",
      }}
    />
  );
}