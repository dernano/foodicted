import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { Image, ScrollView, StyleSheet, Text, TouchableOpacity, useWindowDimensions, View } from "react-native";
import type { MainTabsScreenProps } from "../navigation";
import { usePreferences } from "../context/PreferencesContext";
import { useRecentRecipes } from "../context/RecentRecipesContext";
import { colors, radius, shadow, spacing, type as t } from "../constants/theme";

type Props = MainTabsScreenProps<"Start">;

/** Sampled from the hero photo's own background so the Home canvas reads as
 * one continuous surface instead of a visible image rectangle. Scoped to
 * this screen only - other screens keep the shared `colors.bg` token. */
const HERO_BG = "#f3f1e6";

/** height / width of the source asset (1672x941) - used to compute an exact
 * pixel height below, since `aspectRatio` alone is unreliable on Image and
 * was rendering it at its raw asset pixel size instead of scaling to fit. */
const HERO_ASPECT = 941 / 1672;

function preferenceLines(preferences: ReturnType<typeof usePreferences>["preferences"]): string[] {
  const lines: string[] = [];
  lines.push(`Ziel: ${preferences.goal || "-"}`);
  lines.push(`Diät: ${preferences.diet || "-"}`);
  lines.push(`Portionen: ${preferences.servings ?? 2}`);
  lines.push(`Rezeptvorschläge: bis zu ${preferences.recipeCount ?? 7}`);
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
  const { width: windowWidth } = useWindowDimensions();
  const heroWidth = windowWidth - spacing.xxl * 2;
  const heroHeight = heroWidth * HERO_ASPECT;

  return (
    <View style={styles.screen}>
      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        {/* "contain" (not "cover") so nothing of the baked-in logo/wordmark/
            slogan is ever cropped - the matching background color makes the
            image read as part of the page instead of a separate rectangle. */}
        <Image
          source={require("../../assets/images/foodicted-hero.jpg")}
          style={[styles.hero, { width: heroWidth, height: heroHeight }]}
          resizeMode="contain"
          accessible
          accessibilityRole="image"
          accessibilityLabel="Foodicted – Erst scannen, dann schlemmen."
        />

        <TouchableOpacity
          style={styles.primaryButton}
          onPress={() => navigation.navigate("Camera")}
          activeOpacity={0.85}
        >
          <Ionicons name="camera" size={20} color={colors.textOnDark} />
          <Text style={styles.primaryButtonText}>Vorrat scannen</Text>
        </TouchableOpacity>

        <View style={styles.secondaryRow}>
          <TouchableOpacity
            style={styles.secondaryButton}
            onPress={() => navigation.navigate("IngredientsReview", { items: [] })}
            activeOpacity={0.7}
          >
            <Ionicons name="create-outline" size={15} color={colors.textSecondary} />
            <Text style={styles.secondaryButtonText}>Zutaten eingeben</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.secondaryButton}
            onPress={() => navigation.navigate("AddFavoriteRecipe")}
            activeOpacity={0.7}
          >
            <Ionicons name="book-outline" size={15} color={colors.textSecondary} />
            <Text style={styles.secondaryButtonText}>Eigenes Rezept</Text>
          </TouchableOpacity>
        </View>

        {!!recent.length && (
          <View style={styles.card}>
            <View style={styles.cardHeaderRow}>
              <Text style={styles.cardTitle}>Zuletzt angesehen</Text>
              {recent.length > 5 && (
                <TouchableOpacity onPress={() => navigation.navigate("RecentRecipes")} hitSlop={8}>
                  <Text style={styles.cardHeaderLink}>Alle anzeigen</Text>
                </TouchableOpacity>
              )}
            </View>
            {recent.slice(0, 5).map((recipe, i) => (
              <TouchableOpacity
                key={`${recipe.title}-${i}`}
                style={[styles.recentRow, i === 0 && styles.recentRowFirst]}
                onPress={() => navigation.navigate("RecipeDetail", { recipe })}
                activeOpacity={0.6}
              >
                {recipe.imageUrl ? (
                  <Image source={{ uri: recipe.imageUrl }} style={styles.recentThumb} />
                ) : (
                  <View style={styles.recentThumbFallback}>
                    <Ionicons name="restaurant-outline" size={16} color={colors.primary} />
                  </View>
                )}
                <Text style={styles.recentRowText} numberOfLines={1}>
                  {recipe.title}
                </Text>
                <Ionicons name="chevron-forward" size={16} color={colors.border} />
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Tapping the whole card opens Preferences - keeps "Präferenzen anpassen"
            reachable but folded into the summary itself instead of a separate,
            easy-to-miss text link above. */}
        <TouchableOpacity
          style={[styles.card, styles.preferencesCard]}
          onPress={() => navigation.navigate("Preferences")}
          activeOpacity={0.8}
        >
          <View style={styles.cardHeaderRow}>
            <View style={styles.cardTitleWithIcon}>
              <Ionicons name="options-outline" size={16} color={colors.primary} />
              <Text style={styles.cardTitle}>Deine Präferenzen</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
          </View>
          {preferenceLines(preferences).map((line, i) => (
            <Text key={i} style={styles.summaryLine}>
              {line}
            </Text>
          ))}
        </TouchableOpacity>

        <TouchableOpacity style={styles.aboutLink} onPress={() => navigation.navigate("About")}>
          <Ionicons name="information-circle-outline" size={13} color={colors.textMuted} />
          <Text style={styles.aboutLinkText}>Über Foodicted · © {new Date().getFullYear()} Mario Stöffler</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: HERO_BG },
  container: { flexGrow: 1, alignItems: "center", padding: spacing.xxl, paddingBottom: spacing.xxl, backgroundColor: HERO_BG },
  hero: {
    backgroundColor: HERO_BG,
    marginBottom: spacing.sm,
  },
  primaryButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
    backgroundColor: colors.primary,
    paddingVertical: spacing.lg,
    borderRadius: radius.button,
    width: "100%",
    marginBottom: spacing.sm,
    ...shadow.button,
  },
  primaryButtonText: { color: colors.textOnDark, fontSize: 17, fontWeight: "700" },
  secondaryRow: { width: "100%", flexDirection: "row", gap: spacing.sm, marginBottom: spacing.md },
  secondaryButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: spacing.sm + 2,
    borderRadius: radius.control,
    borderWidth: 1,
    borderColor: colors.border,
  },
  secondaryButtonText: { color: colors.textSecondary, fontSize: 12, fontWeight: "700" },
  card: {
    marginTop: spacing.md,
    width: "100%",
    backgroundColor: colors.surface,
    borderRadius: radius.card,
    padding: spacing.lg,
    ...shadow.soft,
  },
  preferencesCard: { marginTop: spacing.lg },
  cardHeaderRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: spacing.sm },
  cardTitleWithIcon: { flexDirection: "row", alignItems: "center", gap: spacing.xs },
  cardTitle: { ...t.bodyStrong, color: colors.textPrimary },
  cardHeaderLink: { ...t.label, color: colors.primary },
  recentRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    paddingVertical: spacing.sm + 2,
    borderTopWidth: 1,
    borderTopColor: colors.borderAlt,
  },
  recentRowFirst: { borderTopWidth: 0, paddingTop: spacing.xs },
  recentThumb: { width: 44, height: 44, borderRadius: radius.control, backgroundColor: colors.bgAlt },
  recentThumbFallback: {
    width: 44,
    height: 44,
    borderRadius: radius.control,
    backgroundColor: colors.bgAlt,
    alignItems: "center",
    justifyContent: "center",
  },
  recentRowText: { flex: 1, fontSize: 14, color: colors.textPrimary, fontWeight: "600" },
  summaryLine: { fontSize: 14, color: colors.textSecondary, marginBottom: spacing.xs, lineHeight: 19 },
  aboutLink: { flexDirection: "row", alignItems: "center", gap: 5, marginTop: spacing.lg, alignSelf: "center" },
  aboutLinkText: { fontSize: 11, color: colors.textMuted, fontWeight: "600" },
});
