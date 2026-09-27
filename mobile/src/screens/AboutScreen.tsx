import { Ionicons } from "@expo/vector-icons";
import Constants from "expo-constants";
import React from "react";
import { Image, ScrollView, StyleSheet, Text, View } from "react-native";
import { APP_FEATURES } from "../constants/features";

export default function AboutScreen() {
  const version = Constants.expoConfig?.version ?? "?";

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ padding: 24, paddingBottom: 48 }}>
      <View style={styles.header}>
        <Image source={require("../../assets/logo-full.png")} style={styles.logo} resizeMode="contain" />
        <Text style={styles.slogan}>Erst scannen, dann schlemmen.</Text>
      </View>

      <Text style={styles.sectionTitle}>Das kann die App</Text>
      {APP_FEATURES.map((f) => (
        <View key={f.title} style={styles.featureRow}>
          <View style={styles.iconCircle}>
            <Ionicons name={f.icon} size={18} color="#2f9e44" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.featureTitle}>{f.title}</Text>
            <Text style={styles.featureText}>{f.text}</Text>
          </View>
        </View>
      ))}

      <View style={styles.devCard}>
        <Ionicons name="person-circle-outline" size={36} color="#2f9e44" />
        <Text style={styles.devTitle}>Mario Stöffler</Text>
        <Text style={styles.devText}>
          Foodicted wird von mir entwickelt und laufend weiter ausgebaut. Feedback und Ideen sind jederzeit
          willkommen.
        </Text>
      </View>

      <Text style={styles.version}>Version {version}</Text>
      <Text style={styles.copyright}>© {new Date().getFullYear()} Mario Stöffler</Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  header: { alignItems: "center", marginBottom: 28 },
  logo: { width: 160, height: 120 },
  slogan: { fontSize: 13, color: "#2f9e44", fontWeight: "700", marginTop: 4 },
  sectionTitle: { fontSize: 15, fontWeight: "700", color: "#1b4332", marginBottom: 16 },
  featureRow: { flexDirection: "row", alignItems: "flex-start", gap: 14, marginBottom: 18 },
  iconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#eaf7ec",
    alignItems: "center",
    justifyContent: "center",
  },
  featureTitle: { fontSize: 14, fontWeight: "700", color: "#1b4332", marginBottom: 2 },
  featureText: { fontSize: 13, color: "#5c7a6a", lineHeight: 18 },
  devCard: {
    backgroundColor: "#f6fbf6",
    borderRadius: 14,
    padding: 20,
    alignItems: "center",
    marginTop: 12,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "#e6f0e8",
  },
  devTitle: { fontSize: 15, fontWeight: "700", color: "#1b4332", marginTop: 8, marginBottom: 6 },
  devText: { fontSize: 13, color: "#5c7a6a", textAlign: "center", lineHeight: 18 },
  version: { fontSize: 12, color: "#9db5a6", textAlign: "center", marginTop: 4 },
  copyright: { fontSize: 12, color: "#9db5a6", textAlign: "center", marginTop: 4 },
});
