import { Ionicons } from "@expo/vector-icons";
import React, { useEffect, useMemo } from "react";
import { Alert, ScrollView, Share, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import type { RootStackScreenProps } from "../navigation";
import { useFavorites } from "../context/FavoritesContext";
import { usePantry } from "../context/PantryContext";
import { useRecentRecipes } from "../context/RecentRecipesContext";
import { useShoppingList } from "../context/ShoppingListContext";
import { ingredientPresent } from "../utils/ingredientMatch";
import { DIFFICULTY_LABELS, RECIPE_CATEGORY_LABELS, type Nutrition, type Recipe } from "../types";

function sameRecipe(a: { title: string }, b: { title: string }): boolean {
  return a.title.trim().toLowerCase() === b.title.trim().toLowerCase();
}

type Props = RootStackScreenProps<"RecipeDetail">;

function hasNutritionData(nutrition: Nutrition): boolean {
  return nutrition.calories > 0 || nutrition.proteinGrams > 0 || nutrition.carbsGrams > 0 || nutrition.fatGrams > 0;
}

/** When we know the user's current pantry, use that to decide what's still
 * missing (live, always up to date). Otherwise fall back to whatever was
 * known at the time this recipe was generated/saved. */
function shoppingItemsFor(recipe: Recipe, pantryNames: string[]): string[] {
  if (pantryNames.length) {
    return recipe.ingredients
      .filter((ing) => !ingredientPresent(ing.name, pantryNames))
      .map((ing) => `${ing.amount} ${ing.name}`.trim());
  }
  return recipe.missingIngredients.length
    ? recipe.missingIngredients
    : recipe.ingredients.map((ing) => `${ing.amount} ${ing.name}`.trim());
}

function buildShoppingListText(recipe: Recipe, pantryNames: string[]): string {
  const items = shoppingItemsFor(recipe, pantryNames);
  return `Einkaufsliste für "${recipe.title}":\n\n${items.map((item) => `- ${item}`).join("\n")}`;
}

async function shareShoppingList(recipe: Recipe, pantryNames: string[]) {
  try {
    await Share.share({ message: buildShoppingListText(recipe, pantryNames) });
  } catch {
    // User cancelled the share sheet - nothing to do.
  }
}

export default function RecipeDetailScreen({ route, navigation }: Props) {
  const { recipe } = route.params;
  const { favorites, isFavorite, toggleFavorite } = useFavorites();
  const { pantry } = usePantry();
  const { addRecent } = useRecentRecipes();
  const { addItems } = useShoppingList();
  const favorite = isFavorite(recipe);
  const favoriteEntry = favorites.find((f) => sameRecipe(f, recipe));

  const pantryNames = useMemo(() => pantry.items.map((i) => i.name), [pantry.items]);
  const ingredientChecks = useMemo(
    () =>
      recipe.ingredients.map((ingredient) => ({
        ingredient,
        present: pantryNames.length ? ingredientPresent(ingredient.name, pantryNames) : null,
      })),
    [recipe.ingredients, pantryNames]
  );
  const presentCount = ingredientChecks.filter((c) => c.present).length;
  const missingNames = ingredientChecks.filter((c) => c.present === false).map((c) => c.ingredient.name);

  function addToShoppingList() {
    addItems(shoppingItemsFor(recipe, pantryNames), recipe.title);
    Alert.alert("Hinzugefügt", "Die Zutaten wurden zu deiner Einkaufsliste hinzugefügt.");
  }

  useEffect(() => {
    addRecent(recipe);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [recipe.title]);

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ padding: 20, paddingBottom: 48 }}>
      <Text style={styles.categoryBadge}>{RECIPE_CATEGORY_LABELS[recipe.category]}</Text>
      <View style={styles.titleRow}>
        <Text style={styles.title}>{recipe.title}</Text>
        <View style={styles.titleActions}>
          {favoriteEntry && (
            <TouchableOpacity
              onPress={() => navigation.navigate("EditFavoriteRecipe", { recipe: favoriteEntry })}
              hitSlop={10}
            >
              <Ionicons name="create-outline" size={24} color="#2f9e44" />
            </TouchableOpacity>
          )}
          <TouchableOpacity onPress={() => toggleFavorite(recipe)} hitSlop={10}>
            <Text style={styles.heart}>{favorite ? "❤️" : "🤍"}</Text>
          </TouchableOpacity>
        </View>
      </View>
      <Text style={styles.description}>{recipe.description}</Text>
      {!!recipe.tags.length && (
        <View style={styles.tagRow}>
          {recipe.tags.map((tag) => (
            <View key={tag} style={styles.tagPill}>
              <Text style={styles.tagPillText}>#{tag}</Text>
            </View>
          ))}
        </View>
      )}
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

      <Text style={styles.sectionTitle}>Zutaten</Text>
      <View style={styles.shoppingActionsRow}>
        <TouchableOpacity style={styles.shareListButton} onPress={addToShoppingList}>
          <Ionicons name="cart-outline" size={15} color="#2f9e44" />
          <Text style={styles.shareListButtonText}>Zur Einkaufsliste</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.shareListButton} onPress={() => shareShoppingList(recipe, pantryNames)}>
          <Ionicons name="share-outline" size={15} color="#2f9e44" />
          <Text style={styles.shareListButtonText}>Teilen</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.shareListButton}
          onPress={() => navigation.navigate("Camera", { matchRecipe: recipe })}
        >
          <Ionicons name="camera-outline" size={15} color="#2f9e44" />
          <Text style={styles.shareListButtonText}>Foto-Abgleich</Text>
        </TouchableOpacity>
      </View>
      {pantryNames.length ? (
        <Text style={styles.pantrySummary}>
          {presentCount} von {recipe.ingredients.length} Zutaten in deinem Vorrat
        </Text>
      ) : null}
      {ingredientChecks.map(({ ingredient, present }, i) => (
        <View key={i} style={styles.ingredientRow}>
          <Text style={styles.ingredientBullet}>{present === null ? "•" : present ? "✅" : "🛒"}</Text>
          <Text style={styles.ingredientText}>
            {ingredient.amount} {ingredient.name}
          </Text>
        </View>
      ))}
      {pantryNames.length ? (
        !!missingNames.length && (
          <Text style={styles.missingNote}>🛒 = fehlt in deinem Vorrat: {missingNames.join(", ")}</Text>
        )
      ) : (
        !!recipe.missingIngredients.length && (
          <Text style={styles.missingNote}>🛒 = musst du noch besorgen: {recipe.missingIngredients.join(", ")}</Text>
        )
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
  categoryBadge: { fontSize: 12, color: "#2f9e44", fontWeight: "700", textTransform: "uppercase", marginBottom: 6 },
  titleRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" },
  title: { fontSize: 24, fontWeight: "800", color: "#1b4332", flex: 1, marginRight: 12 },
  titleActions: { flexDirection: "row", alignItems: "center", gap: 14, paddingTop: 4 },
  heart: { fontSize: 26 },
  description: { fontSize: 14, color: "#40616b", marginTop: 8, lineHeight: 20 },
  tagRow: { flexDirection: "row", flexWrap: "wrap", gap: 6, marginTop: 10 },
  tagPill: { backgroundColor: "#d8f0dc", borderRadius: 12, paddingVertical: 4, paddingHorizontal: 10 },
  tagPillText: { fontSize: 11, color: "#1b4332", fontWeight: "600" },
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
  shoppingActionsRow: { flexDirection: "row", flexWrap: "wrap", gap: 14, marginBottom: 4 },
  shareListButton: { flexDirection: "row", alignItems: "center", gap: 5 },
  shareListButtonText: { color: "#2f9e44", fontSize: 12, fontWeight: "700" },
  pantrySummary: { fontSize: 12, color: "#2f9e44", fontWeight: "700", marginBottom: 10 },
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
