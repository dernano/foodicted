import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import type { MainTabsScreenProps } from "../navigation";
import { usePreferences } from "../context/PreferencesContext";
import { useRecentRecipes } from "../context/RecentRecipesContext";

type Props = MainTabsScreenProps<"Start">;

function preferenceLines(preferences: ReturnType<typeof usePreferences>["preferences"]): string[] {
  const lines: string[] = [];
  lines.push(`Ziel: ${preferences.goal || "-"}`);
  lines.push(`Diät: ${preferences.diet || "-"}`);
  lines.push(`Portionen: ${preferences.servings ?? 2}`);
  if (preferences.maxTimeMinutes) lines.push(`Max. Zubereitungszeit: ${preferences.maxTimeMinutes} min`);
  if (preferences.allergies?.length) lines.push(`Allergien: ${preferences.allergies.join(", ")}`);
  if (preferences.dislikedIngredients?.length) lines.push(`Mag nicht: ${preferences.dislikedIngredients.join(", ")}`);
  if (preferences.cuisines?.length) lines.push(`Küchen: ${preferences.cuisines.join(", ")}`);
  if (preferences.targetCaloriesPerServing) lines.push(`Ziel-Kalorien: ~${preferences.targetCaloriesPerServing} kcal`);
  if (preferences.notes) lines.push(`Notizen: ${preferences.notes}`);
  return lines;
}

export default function HomeScreen({ navigation }: Props) {
  const { preferences } = usePreferences();
  const { recent } = useRecentRecipes();

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Image source={require("../../assets/logo-full.png")} style={styles.logo} resizeMode="contain" />

      <Text style={styles.subtitle}>
        Fotografiere deinen Kühlschrank und lass dir passende Rezepte vorschlagen - passend zu dem, was du
        wirklich zuhause hast.
      </Text>

      <TouchableOpacity style={styles.primaryButton} onPress={() => navigation.navigate("Camera")}>
        <Ionicons name="camera" size={20} color="#fff" />
        <Text style={styles.primaryButtonText}>Kühlschrank scannen</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.secondaryButton}
        onPress={() => navigation.navigate("IngredientsReview", { items: [] })}
      >
        <Ionicons name="create-outline" size={19} color="#2f9e44" />
        <Text style={styles.secondaryButtonText}>Zutaten manuell eingeben</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.secondaryButton} onPress={() => navigation.navigate("AddFavoriteRecipe")}>
        <Ionicons name="book-outline" size={19} color="#2f9e44" />
        <Text style={styles.secondaryButtonText}>Eigenes Rezept hinzufügen</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.tertiaryButton} onPress={() => navigation.navigate("Preferences")}>
        <Ionicons name="settings-outline" size={15} color="#5c7a6a" />
        <Text style={styles.tertiaryButtonText}>Präferenzen anpassen</Text>
      </TouchableOpacity>

      {!!recent.length && (
        <View style={styles.recentCard}>
          <Text style={styles.recentTitle}>Zuletzt angesehen</Text>
          {recent.slice(0, 5).map((recipe, i) => (
            <TouchableOpacity
              key={`${recipe.title}-${i}`}
              style={styles.recentRow}
              onPress={() => navigation.navigate("RecipeDetail", { recipe })}
            >
              <Ionicons name="restaurant-outline" size={16} color="#2f9e44" />
              <Text style={styles.recentRowText} numberOfLines={1}>
                {recipe.title}
              </Text>
              <Ionicons name="chevron-forward" size={16} color="#c3d6c8" />
            </TouchableOpacity>
          ))}
        </View>
      )}

      <View style={styles.summaryCard}>
        <Text style={styles.summaryTitle}>Aktuelle Präferenzen</Text>
        {preferenceLines(preferences).map((line, i) => (
          <Text key={i} style={styles.summaryLine}>
            {line}
          </Text>
        ))}
      </View>

      <Text style={styles.copyright}>© {new Date().getFullYear()} Mario Stöffler</Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flexGrow: 1, alignItems: "center", padding: 24, backgroundColor: "#f6fbf6" },
  logo: { width: 220, height: 170, marginTop: 12, marginBottom: 4 },
  subtitle: { fontSize: 15, color: "#40616b", textAlign: "center", marginTop: 4, marginBottom: 28, lineHeight: 21 },
  primaryButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    backgroundColor: "#2f9e44",
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 14,
    width: "100%",
    marginBottom: 12,
    shadowColor: "#2f9e44",
    shadowOpacity: 0.25,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  primaryButtonText: { color: "#fff", fontSize: 17, fontWeight: "700" },
  secondaryButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    borderWidth: 1.5,
    borderColor: "#2f9e44",
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: 14,
    width: "100%",
    marginBottom: 12,
    backgroundColor: "#fff",
  },
  secondaryButtonText: { color: "#2f9e44", fontSize: 16, fontWeight: "700" },
  tertiaryButton: { flexDirection: "row", alignItems: "center", gap: 6, paddingVertical: 10 },
  tertiaryButtonText: { color: "#5c7a6a", fontSize: 14, fontWeight: "600" },
  recentCard: {
    marginTop: 20,
    width: "100%",
    backgroundColor: "#fff",
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: "#e6f0e8",
  },
  recentTitle: { fontWeight: "700", fontSize: 14, marginBottom: 10, color: "#1b4332" },
  recentRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingVertical: 9,
    borderTopWidth: 1,
    borderTopColor: "#f0f5f1",
  },
  recentRowText: { flex: 1, fontSize: 13, color: "#1b4332", fontWeight: "600" },
  summaryCard: {
    marginTop: 16,
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
  copyright: { fontSize: 11, color: "#c3d6c8", marginTop: 20, marginBottom: 4 },
});
