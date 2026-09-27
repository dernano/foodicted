import React from "react";
import { Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import type { MainTabsScreenProps } from "../navigation";
import { usePreferences } from "../context/PreferencesContext";

type Props = MainTabsScreenProps<"Start">;

export default function HomeScreen({ navigation }: Props) {
  const { preferences } = usePreferences();

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Image source={require("../../assets/logo-full.png")} style={styles.logo} resizeMode="contain" />

      <Text style={styles.subtitle}>
        Fotografiere deinen Kühlschrank und lass dir passende Rezepte vorschlagen - passend zu dem, was du
        wirklich zuhause hast.
      </Text>

      <TouchableOpacity style={styles.primaryButton} onPress={() => navigation.navigate("Camera")}>
        <Text style={styles.primaryButtonText}>📷 Kühlschrank scannen</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.secondaryButton}
        onPress={() => navigation.navigate("IngredientsReview", { items: [] })}
      >
        <Text style={styles.secondaryButtonText}>✏️ Zutaten manuell eingeben</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.tertiaryButton} onPress={() => navigation.navigate("Preferences")}>
        <Text style={styles.tertiaryButtonText}>⚙️ Präferenzen anpassen</Text>
      </TouchableOpacity>

      <View style={styles.summaryCard}>
        <Text style={styles.summaryTitle}>Aktuelle Präferenzen</Text>
        <Text style={styles.summaryLine}>Ziel: {preferences.goal || "-"}</Text>
        <Text style={styles.summaryLine}>Diät: {preferences.diet || "-"}</Text>
        <Text style={styles.summaryLine}>Portionen: {preferences.servings ?? 2}</Text>
        {!!preferences.allergies?.length && (
          <Text style={styles.summaryLine}>Allergien: {preferences.allergies.join(", ")}</Text>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flexGrow: 1, alignItems: "center", padding: 24, backgroundColor: "#f6fbf6" },
  logo: { width: 220, height: 170, marginTop: 12, marginBottom: 4 },
  subtitle: { fontSize: 15, color: "#40616b", textAlign: "center", marginTop: 4, marginBottom: 28, lineHeight: 21 },
  primaryButton: {
    backgroundColor: "#2f9e44",
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 14,
    width: "100%",
    alignItems: "center",
    marginBottom: 12,
    shadowColor: "#2f9e44",
    shadowOpacity: 0.25,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  primaryButtonText: { color: "#fff", fontSize: 17, fontWeight: "700" },
  secondaryButton: {
    borderWidth: 1.5,
    borderColor: "#2f9e44",
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: 14,
    width: "100%",
    alignItems: "center",
    marginBottom: 12,
    backgroundColor: "#fff",
  },
  secondaryButtonText: { color: "#2f9e44", fontSize: 16, fontWeight: "700" },
  tertiaryButton: { paddingVertical: 10 },
  tertiaryButtonText: { color: "#5c7a6a", fontSize: 14, fontWeight: "600" },
  summaryCard: {
    marginTop: 28,
    width: "100%",
    backgroundColor: "#fff",
    borderRadius: 14,
    padding: 18,
    borderWidth: 1,
    borderColor: "#e6f0e8",
    shadowColor: "#000",
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 1,
  },
  summaryTitle: { fontWeight: "700", fontSize: 15, marginBottom: 8, color: "#1b4332" },
  summaryLine: { fontSize: 14, color: "#40616b", marginBottom: 4 },
});
