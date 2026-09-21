import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import type { RootStackParamList } from "../navigation";
import { usePreferences } from "../context/PreferencesContext";

type Props = NativeStackScreenProps<RootStackParamList, "Home">;

export default function HomeScreen({ navigation }: Props) {
  const { preferences } = usePreferences();

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.emoji}>🥗</Text>
      <Text style={styles.title}>Willkommen bei Foodicted</Text>
      <Text style={styles.subtitle}>
        Fotografiere deinen Kühlschrank und lass dir passende Rezepte vorschlagen - basierend auf dem,
        was du wirklich zuhause hast.
      </Text>

      <TouchableOpacity style={styles.primaryButton} onPress={() => navigation.navigate("Camera")}>
        <Text style={styles.primaryButtonText}>📷 Kühlschrank scannen</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.secondaryButton} onPress={() => navigation.navigate("Preferences")}>
        <Text style={styles.secondaryButtonText}>⚙️ Präferenzen anpassen</Text>
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
  emoji: { fontSize: 56, marginTop: 24, marginBottom: 8 },
  title: { fontSize: 26, fontWeight: "800", color: "#1b4332", textAlign: "center" },
  subtitle: { fontSize: 15, color: "#40616b", textAlign: "center", marginTop: 12, marginBottom: 32, lineHeight: 21 },
  primaryButton: {
    backgroundColor: "#2f9e44",
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 14,
    width: "100%",
    alignItems: "center",
    marginBottom: 12,
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
  },
  secondaryButtonText: { color: "#2f9e44", fontSize: 16, fontWeight: "700" },
  summaryCard: {
    marginTop: 36,
    width: "100%",
    backgroundColor: "#fff",
    borderRadius: 14,
    padding: 18,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  summaryTitle: { fontWeight: "700", fontSize: 15, marginBottom: 8, color: "#1b4332" },
  summaryLine: { fontSize: 14, color: "#40616b", marginBottom: 4 },
});
