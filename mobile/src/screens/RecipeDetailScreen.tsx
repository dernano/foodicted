import { Ionicons } from "@expo/vector-icons";
import React, { useEffect } from "react";
import { ScrollView, Share, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import type { RootStackScreenProps } from "../navigation";
import { useFavorites } from "../context/FavoritesContext";
import { useRecentRecipes } from "../context/RecentRecipesContext";
import { DIFFICULTY_LABELS, type Nutrition, type Recipe } from "../types";

type Props = RootStackScreenProps<"RecipeDetail">;

function hasNutritionData(nutrition: Nutrition): boolean {
  return nutrition.calories > 0 || nutrition.proteinGrams > 0 || nutrition.carbsGrams > 0 || nutrition.fatGrams > 0;
}

function buildShoppingListText(recipe: Recipe): string {
  const items = recipe.missingIngredients.length
    ? recipe.missingIngredients
    : recipe.ingredients.map((ing) => `${ing.amount} ${ing.name}`.trim());
  return `Einkaufsliste für "${recipe.title}":\n\n${items.map((item) => `- ${item}`).join("\n")}`;
}

async function shareShoppingList(recipe: Recipe) {
  try {
    await Share.share({ message: buildShoppingListText(recipe) });
  } catch {
    // User cancelled the share sheet - nothing to do.
  }
}

export default function RecipeDetailScreen({ route }: Props) {
  const { recipe } = route.params;
  const { isFavorite, toggleFavorite } = useFavorites();
  const { addRecent } = useRecentRecipes();
  const favorite = isFavorite(recipe);

  useEffect(() => {
    addRecent(recipe);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [recipe.title]);

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ padding: 20, paddingBottom: 48 }}>
      <View style={styles.titleRow}>
        <Text style={styles.title}>{recipe.title}</Text>
        <TouchableOpacity onPress={() => toggleFavorite(recipe)} hitSlop={10} style={styles.favoriteButton}>
          <Text style={styles.heart}>{favorite ? "❤️" : "🤍"}</Text>
        </TouchableOpacity>
      </View>
      <Text style={styles.description}>{recipe.description}</Text>
      <Text style={styles.favoriteHint}>
        {favorite ? "In deinen Lieblingsrezepten gespeichert" : "Tippe auf das Herz, um es zu speichern"}
      </Text>

      <View style={styles.metaRow}>
        <MetaBox label="Vorbereitung" value={recipe.prepTimeMinutes ? `${recipe.prepTimeMinutes} min` : "-"} />
        <MetaBox label="Kochzeit" value={recipe.cookTimeMinutes ? `${recipe.cookTimeMinutes} min` : "-"} />
        <MetaBox label="Portionen" value={String(recipe.servings)} />
        <MetaBox label="Schwierigkeit" value={DIFFICULTY_LABELS[recipe.difficulty]} />
      </View>

      {hasNutritionData(recipe.nutrition) ? (
        <View style={styles.nutritionCard}>
          <Text style={styles.sectionTitle}>Nährwerte pro Portion</Text>
          <View style={styles.nutritionRow}>
            <NutritionBox label="Kalorien" value={`${recipe.nutrition.calories} kcal`} />
            <NutritionBox label="Protein" value={`${recipe.nutrition.proteinGrams} g`} />
            <NutritionBox label="Kohlenhydrate" value={`${recipe.nutrition.carbsGrams} g`} />
            <NutritionBox label="Fett" value={`${recipe.nutrition.fatGrams} g`} />
          </View>
        </View>
      ) : (
        <View style={styles.nutritionCard}>
          <Text style={styles.noNutritionText}>
            Keine Nährwertangaben hinterlegt - dieses Rezept wurde ohne KI-Unterstützung gespeichert.
          </Text>
        </View>
      )}

      <View style={styles.sectionHeaderRow}>
        <Text style={styles.sectionTitle}>Zutaten</Text>
        <TouchableOpacity style={styles.shareListButton} onPress={() => shareShoppingList(recipe)}>
          <Ionicons name="share-outline" size={15} color="#2f9e44" />
          <Text style={styles.shareListButtonText}>Einkaufsliste teilen</Text>
        </TouchableOpacity>
      </View>
      {recipe.ingredients.map((ing, i) => (
        <View key={i} style={styles.ingredientRow}>
          <Text style={styles.ingredientBullet}>{ing.fromFridge ? "✅" : "🛒"}</Text>
          <Text style={styles.ingredientText}>
            {ing.amount} {ing.name}
          </Text>
        </View>
      ))}
      {!!recipe.missingIngredients.length && (
        <Text style={styles.missingNote}>🛒 = musst du noch besorgen: {recipe.missingIngredients.join(", ")}</Text>
      )}

      <Text style={styles.sectionTitle}>Zubereitung</Text>
      {recipe.instructions.map((step, i) => (
        <View key={i} style={styles.stepRow}>
          <Text style={styles.stepNumber}>{i + 1}</Text>
          <Text style={styles.stepText}>{step}</Text>
        </View>
      ))}
    </ScrollView>
  );
}

function MetaBox({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.metaBox}>
      <Text style={styles.metaValue}>{value}</Text>
      <Text style={styles.metaLabel}>{label}</Text>
    </View>
  );
}

function NutritionBox({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.nutritionBox}>
      <Text style={styles.nutritionValue}>{value}</Text>
      <Text style={styles.nutritionLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  titleRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" },
  title: { fontSize: 24, fontWeight: "800", color: "#1b4332", flex: 1, marginRight: 12 },
  favoriteButton: { paddingTop: 4 },
  heart: { fontSize: 26 },
  description: { fontSize: 14, color: "#40616b", marginTop: 8, lineHeight: 20 },
  favoriteHint: { fontSize: 12, color: "#9db5a6", marginTop: 6, fontStyle: "italic" },
  metaRow: { flexDirection: "row", justifyContent: "space-between", marginTop: 20 },
  metaBox: { alignItems: "center", flex: 1 },
  metaValue: { fontSize: 15, fontWeight: "700", color: "#1b4332" },
  metaLabel: { fontSize: 11, color: "#7a8f83", marginTop: 2 },
  nutritionCard: { backgroundColor: "#f6fbf6", borderRadius: 14, padding: 16, marginTop: 24 },
  noNutritionText: { fontSize: 13, color: "#7a8f83", fontStyle: "italic", lineHeight: 18 },
  nutritionRow: { flexDirection: "row", justifyContent: "space-between", marginTop: 10 },
  nutritionBox: { alignItems: "center", flex: 1 },
  nutritionValue: { fontSize: 14, fontWeight: "700", color: "#1b4332" },
  nutritionLabel: { fontSize: 11, color: "#7a8f83", marginTop: 2 },
  sectionTitle: { fontSize: 16, fontWeight: "700", color: "#1b4332", marginTop: 28, marginBottom: 12 },
  sectionHeaderRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  shareListButton: { flexDirection: "row", alignItems: "center", gap: 5 },
  shareListButtonText: { color: "#2f9e44", fontSize: 12, fontWeight: "700" },
  ingredientRow: { flexDirection: "row", alignItems: "flex-start", marginBottom: 8, gap: 8 },
  ingredientBullet: { fontSize: 14 },
  ingredientText: { fontSize: 14, color: "#1b4332", flex: 1 },
  missingNote: { fontSize: 12, color: "#966b1f", marginTop: 8, fontStyle: "italic" },
  stepRow: { flexDirection: "row", alignItems: "flex-start", marginBottom: 14, gap: 12 },
  stepNumber: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: "#2f9e44",
    color: "#fff",
    fontSize: 12,
    fontWeight: "700",
    textAlign: "center",
    lineHeight: 24,
    overflow: "hidden",
  },
  stepText: { fontSize: 14, color: "#1b4332", flex: 1, lineHeight: 20 },
});
