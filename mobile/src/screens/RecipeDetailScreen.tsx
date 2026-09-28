import { Ionicons } from "@expo/vector-icons";
import React, { useEffect, useMemo } from "react";
import { Alert, ImageBackground, ScrollView, Share, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import type { RootStackScreenProps } from "../navigation";
import { useFavorites } from "../context/FavoritesContext";
import { usePantry } from "../context/PantryContext";
import { useRecentRecipes } from "../context/RecentRecipesContext";
import { useShoppingList } from "../context/ShoppingListContext";
import { ingredientPresent } from "../utils/ingredientMatch";
import { DIFFICULTY_LABELS, RECIPE_CATEGORY_LABELS, type Nutrition, type Recipe } from "../types";
import { colors, radius, shadow, spacing, type as t } from "../constants/theme";

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

  const heroContent = (
    <>
      <View style={styles.heroTopRow}>
        <Text style={styles.categoryBadge}>{RECIPE_CATEGORY_LABELS[recipe.category]}</Text>
        <View style={styles.titleActions}>
          {favoriteEntry && (
            <TouchableOpacity
              onPress={() => navigation.navigate("EditFavoriteRecipe", { recipe: favoriteEntry })}
              hitSlop={10}
            >
              <Ionicons name="create-outline" size={22} color={colors.textOnDark} />
            </TouchableOpacity>
          )}
          <TouchableOpacity onPress={() => toggleFavorite(recipe)} hitSlop={10}>
            <Ionicons name={favorite ? "heart" : "heart-outline"} size={22} color={favorite ? colors.danger : colors.textOnDark} />
          </TouchableOpacity>
        </View>
      </View>

      <Text style={styles.title}>{recipe.title}</Text>
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
    </>
  );

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 48 }} showsVerticalScrollIndicator={false}>
      {recipe.imageUrl ? (
        <ImageBackground
          source={{ uri: recipe.imageUrl }}
          style={[styles.hero, styles.heroWithPhoto]}
          imageStyle={styles.heroImage}
        >
          <View style={styles.heroScrim} />
          {heroContent}
        </ImageBackground>
      ) : (
        <View style={styles.hero}>{heroContent}</View>
      )}

      <View style={styles.content}>
        <View style={styles.metaRow}>
          <MetaBox label="Vorbereitung" value={recipe.prepTimeMinutes ? `${recipe.prepTimeMinutes} min` : "-"} />
          <MetaBox label="Kochzeit" value={recipe.cookTimeMinutes ? `${recipe.cookTimeMinutes} min` : "-"} />
          <MetaBox label="Portionen" value={String(recipe.servings)} />
          <MetaBox label="Schwierigkeit" value={DIFFICULTY_LABELS[recipe.difficulty]} />
        </View>

        {hasNutritionData(recipe.nutrition) ? (
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Nährwerte pro Portion</Text>
            <View style={styles.nutritionRow}>
              <NutritionBox label="Kalorien" value={`${recipe.nutrition.calories} kcal`} />
              <NutritionBox label="Protein" value={`${recipe.nutrition.proteinGrams} g`} />
              <NutritionBox label="Kohlenhydrate" value={`${recipe.nutrition.carbsGrams} g`} />
              <NutritionBox label="Fett" value={`${recipe.nutrition.fatGrams} g`} />
            </View>
          </View>
        ) : (
          <View style={styles.card}>
            <Text style={styles.noNutritionText}>
              Keine Nährwertangaben hinterlegt - dieses Rezept wurde ohne KI-Unterstützung gespeichert.
            </Text>
          </View>
        )}

        <Text style={styles.sectionTitle}>Zutaten</Text>
        <View style={styles.shoppingActionsRow}>
          <TouchableOpacity style={styles.shareListButton} onPress={addToShoppingList} activeOpacity={0.7}>
            <Ionicons name="cart-outline" size={15} color={colors.primary} />
            <Text style={styles.shareListButtonText}>Zur Einkaufsliste</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.shareListButton}
            onPress={() => shareShoppingList(recipe, pantryNames)}
            activeOpacity={0.7}
          >
            <Ionicons name="share-outline" size={15} color={colors.primary} />
            <Text style={styles.shareListButtonText}>Teilen</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.shareListButton}
            onPress={() => navigation.navigate("Camera", { matchRecipe: recipe })}
            activeOpacity={0.7}
          >
            <Ionicons name="camera-outline" size={15} color={colors.primary} />
            <Text style={styles.shareListButtonText}>Foto-Abgleich</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.ingredientsCard}>
          {pantryNames.length ? (
            <Text style={styles.pantrySummary}>
              {presentCount} von {recipe.ingredients.length} Zutaten in deinem Vorrat
            </Text>
          ) : null}
          {ingredientChecks.map(({ ingredient, present }, i) => (
            <View key={i} style={[styles.ingredientRow, i === 0 && styles.ingredientRowFirst]}>
              {present === null ? (
                <View style={styles.ingredientDot} />
              ) : (
                <Ionicons
                  name={present ? "checkmark-circle" : "cart"}
                  size={16}
                  color={present ? colors.primary : colors.attention}
                />
              )}
              <Text style={styles.ingredientText}>
                {ingredient.amount} {ingredient.name}
              </Text>
            </View>
          ))}
          {pantryNames.length ? (
            !!missingNames.length && (
              <Text style={styles.missingNote}>Fehlt in deinem Vorrat: {missingNames.join(", ")}</Text>
            )
          ) : (
            !!recipe.missingIngredients.length && (
              <Text style={styles.missingNote}>Musst du noch besorgen: {recipe.missingIngredients.join(", ")}</Text>
            )
          )}
        </View>

        <Text style={styles.sectionTitle}>Zubereitung</Text>
        {recipe.instructions.map((step, i) => (
          <View key={i} style={styles.stepRow}>
            <Text style={styles.stepNumber}>{i + 1}</Text>
            <Text style={styles.stepText}>{step}</Text>
          </View>
        ))}
      </View>
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
  container: { flex: 1, backgroundColor: colors.bg },
  hero: {
    backgroundColor: colors.brandDark,
    borderBottomLeftRadius: radius.hero,
    borderBottomRightRadius: radius.hero,
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.lg,
    paddingBottom: spacing.xxl,
    overflow: "hidden",
  },
  heroWithPhoto: { minHeight: 340, justifyContent: "flex-end" },
  heroImage: { borderBottomLeftRadius: radius.hero, borderBottomRightRadius: radius.hero },
  heroScrim: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(27,67,50,0.6)",
  },
  heroTopRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  categoryBadge: {
    fontSize: 11,
    color: colors.textOnDark,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    backgroundColor: "rgba(255,255,255,0.14)",
    paddingVertical: 4,
    paddingHorizontal: spacing.sm,
    borderRadius: radius.pill,
    overflow: "hidden",
  },
  titleActions: { flexDirection: "row", alignItems: "center", gap: spacing.md },
  title: { ...t.title, color: colors.textOnDark, marginTop: spacing.md },
  description: { ...t.body, color: colors.textOnDarkMuted, marginTop: spacing.sm, lineHeight: 20 },
  tagRow: { flexDirection: "row", flexWrap: "wrap", gap: spacing.xs, marginTop: spacing.md },
  tagPill: { backgroundColor: "rgba(255,255,255,0.14)", borderRadius: radius.pill, paddingVertical: 4, paddingHorizontal: spacing.sm },
  tagPillText: { fontSize: 11, color: colors.textOnDark, fontWeight: "600" },
  favoriteHint: { fontSize: 12, color: colors.textOnDarkMuted, marginTop: spacing.md, fontStyle: "italic" },
  content: { padding: spacing.xl },
  metaRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    backgroundColor: colors.surface,
    borderRadius: radius.card,
    paddingVertical: spacing.lg,
    marginTop: -spacing.xxl,
    ...shadow.soft,
  },
  metaBox: { alignItems: "center", flex: 1 },
  metaValue: { fontSize: 15, fontWeight: "700", color: colors.textPrimary },
  metaLabel: { fontSize: 11, color: colors.textMuted, marginTop: 2 },
  card: { backgroundColor: colors.surface, borderRadius: radius.card, padding: spacing.lg, marginTop: spacing.lg, ...shadow.soft },
  noNutritionText: { fontSize: 13, color: colors.textMuted, fontStyle: "italic", lineHeight: 18 },
  nutritionRow: { flexDirection: "row", justifyContent: "space-between", marginTop: spacing.sm },
  nutritionBox: { alignItems: "center", flex: 1 },
  nutritionValue: { fontSize: 14, fontWeight: "700", color: colors.textPrimary },
  nutritionLabel: { fontSize: 11, color: colors.textMuted, marginTop: 2 },
  sectionTitle: { ...t.section, color: colors.textPrimary, marginTop: spacing.xxl, marginBottom: spacing.md },
  shoppingActionsRow: { flexDirection: "row", flexWrap: "wrap", gap: spacing.lg, marginBottom: spacing.md },
  shareListButton: { flexDirection: "row", alignItems: "center", gap: 5 },
  shareListButtonText: { color: colors.primary, fontSize: 12, fontWeight: "700" },
  ingredientsCard: { backgroundColor: colors.surface, borderRadius: radius.card, padding: spacing.lg, ...shadow.soft },
  pantrySummary: { fontSize: 12, color: colors.primary, fontWeight: "700", marginBottom: spacing.sm },
  ingredientRow: { flexDirection: "row", alignItems: "center", paddingVertical: spacing.xs + 2, gap: spacing.sm },
  ingredientRowFirst: { paddingTop: 0 },
  ingredientDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: colors.border, marginHorizontal: 5 },
  ingredientText: { fontSize: 14, color: colors.textPrimary, flex: 1 },
  missingNote: { fontSize: 12, color: colors.noticeText, marginTop: spacing.sm, fontStyle: "italic" },
  stepRow: { flexDirection: "row", alignItems: "flex-start", marginBottom: spacing.md + 2, gap: spacing.md },
  stepNumber: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.primary,
    color: colors.textOnDark,
    fontSize: 12,
    fontWeight: "700",
    textAlign: "center",
    lineHeight: 24,
    overflow: "hidden",
  },
  stepText: { fontSize: 14, color: colors.textPrimary, flex: 1, lineHeight: 20 },
});
