import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import React from "react";
import { Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import type { RootStackScreenProps } from "../navigation";

export const ONBOARDING_SEEN_KEY = "foodicted.onboardingSeen";

type Props = RootStackScreenProps<"Onboarding">;

const FEATURES: { icon: keyof typeof Ionicons.glyphMap; title: string; text: string }[] = [
  {
    icon: "camera",
    title: "Kühlschrank scannen",
    text: "Foto machen, die KI erkennt automatisch, welche Lebensmittel du zuhause hast.",
  },
  {
    icon: "restaurant",
    title: "Passende Rezepte",
    text: "Vorschläge abgestimmt auf deine Präferenzen - Ziele, Diät, Allergien, Lieblingsküchen.",
  },
  {
    icon: "heart",
    title: "Lieblingsrezepte speichern",
    text: "Rezepte merken, oder eigene hinzufügen und optional von der KI vervollständigen lassen.",
  },
  {
    icon: "cart",
    title: "Einkaufsliste",
    text: "Fehlende Zutaten direkt auf die Einkaufsliste - live geteilt mit deinem Haushalt.",
  },
  {
    icon: "people",
    title: "Gemeinsam als Haushalt",
    text: "Mit Google anmelden und per Einladungscode Rezepte & Liste mit der Familie teilen.",
  },
];

export default function OnboardingScreen({ navigation }: Props) {
  async function handleContinue() {
    try {
      await AsyncStorage.setItem(ONBOARDING_SEEN_KEY, "true");
    } catch (err) {
      console.warn("Failed to persist onboarding flag", err);
    }
    navigation.replace("MainTabs", { screen: "Start" });
  }

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Image source={require("../../assets/logo-full.png")} style={styles.logo} resizeMode="contain" />
        <Text style={styles.title}>Willkommen bei Foodicted!</Text>
        <Text style={styles.subtitle}>Das kann die App für dich:</Text>

        {FEATURES.map((f) => (
          <View key={f.title} style={styles.featureRow}>
            <View style={styles.iconCircle}>
              <Ionicons name={f.icon} size={20} color="#2f9e44" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.featureTitle}>{f.title}</Text>
              <Text style={styles.featureText}>{f.text}</Text>
            </View>
          </View>
        ))}
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity style={styles.button} onPress={handleContinue}>
          <Text style={styles.buttonText}>Los geht's</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f6fbf6" },
  scrollContent: { padding: 24, paddingBottom: 8, alignItems: "center" },
  logo: { width: 170, height: 130, marginTop: 20, marginBottom: 8 },
  title: { fontSize: 22, fontWeight: "800", color: "#1b4332", textAlign: "center", marginBottom: 4 },
  subtitle: { fontSize: 14, color: "#5c7a6a", marginBottom: 24 },
  featureRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 14,
    width: "100%",
    marginBottom: 20,
  },
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#eaf7ec",
    alignItems: "center",
    justifyContent: "center",
  },
  featureTitle: { fontSize: 15, fontWeight: "700", color: "#1b4332", marginBottom: 2 },
  featureText: { fontSize: 13, color: "#5c7a6a", lineHeight: 18 },
  footer: { padding: 20, backgroundColor: "#f6fbf6" },
  button: {
    backgroundColor: "#2f9e44",
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: "center",
    shadowColor: "#2f9e44",
    shadowOpacity: 0.25,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  buttonText: { color: "#fff", fontSize: 16, fontWeight: "700" },
});
