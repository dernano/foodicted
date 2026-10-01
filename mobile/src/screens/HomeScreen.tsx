import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { Image, ScrollView, StyleSheet, Text, TouchableOpacity, useWindowDimensions, View } from "react-native";
import type { MainTabsScreenProps } from "../navigation";
import { usePreferences } from "../context/PreferencesContext";
import { useRecentRecipes } from "../context/RecentRecipesContext";
import { colors, radius, shadow, spacing, type as t } from "../constants/theme";

type Props = MainTabsScreenProps<"Start">;

/** Sampled from the calm lower area of the hero photo so the Home canvas
 * reads as one continuous surface instead of a visible image rectangle.
 * Scoped to this screen only - other screens keep the shared `colors.bg`. */
const HERO_BG = "#f2efe5";

/** height / width of the source asset (941x1672) - a tall background plate
 * with food concentrated near the top, deliberately larger than any hero
 * crop. We scale it to the full device width and let it overflow downward,
 * clipped by the (shorter) hero window - see heroWrap/HomeScreen below. */
const HERO_SOURCE_ASPECT = 1672 / 941;

/** rgb() of HERO_BG, used to fade the photo into the canvas without any
 * gradient library (a stack of increasingly-opaque bands, pure Views). Kept
 * to a moderate band count - more/thinner bands than this started showing
 * faint seams between adjacent bands on real devices instead of reading as
 * one smooth fade. */
const HERO_BG_RGB = "242,239,229";
function buildFadeSteps(count: number): number[] {
  return Array.from({ length: count }, (_, i) => Math.pow((i + 1) / count, 1.6));
}
const HERO_FADE_STEPS = buildFadeSteps(14);

/** Responsive hero height: ~30% of the window, clamped so it stays sensible
 * on very small or very large screens instead of one fixed pixel value. */
function useHeroHeight(): number {
  const { height } = useWindowDimensions();
  return Math.min(Math.max(height * 0.3, 210), 300);
}

function preferenceLines(
  preferences: ReturnType<typeof usePreferences>["preferences"]
): { label: string; value: string }[] {
  const lines: { label: string; value: string }[] = [];
  lines.push({ label: "Ziel", value: preferences.goal || "-" });
  lines.push({ label: "Diät", value: preferences.diet || "-" });
  lines.push({ label: "Portionen", value: String(preferences.servings ?? 2) });
  lines.push({ label: "Rezeptvorschläge", value: `bis zu ${preferences.recipeCount ?? 7}` });
  if (preferences.maxTimeMinutes) lines.push({ label: "Max. Zubereitungszeit", value: `${preferences.maxTimeMinutes} min` });
  if (preferences.allergies?.length) lines.push({ label: "Allergien", value: preferences.allergies.join(", ") });
  if (preferences.dislikedIngredients?.length) lines.push({ label: "Mag nicht", value: preferences.dislikedIngredients.join(", ") });
  if (preferences.cuisines?.length) lines.push({ label: "Küchen", value: preferences.cuisines.join(", ") });
  if (preferences.targetCaloriesPerServing) lines.push({ label: "Ziel-Kalorien", value: `~${preferences.targetCaloriesPerServing} kcal` });
  if (preferences.notes) lines.push({ label: "Notizen", value: preferences.notes });
  return lines;
}

export default function HomeScreen({ navigation }: Props) {
  const { preferences } = usePreferences();
  const { recent } = useRecentRecipes();
  const { width: windowWidth } = useWindowDimensions();
  const heroHeight = useHeroHeight();
  const heroImageHeight = windowWidth * HERO_SOURCE_ASPECT;
  const heroFadeHeight = heroHeight * 0.64;

  return (
    <View style={styles.screen}>
      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        {/* Full-bleed: an explicit windowWidth size, centered by the padded
            parent, overflows past its padding to reach both screen edges. */}
        <View style={[styles.heroWrap, { width: windowWidth, height: heroHeight }]}>
          {/* Scaled to the full device width and top-anchored (default flow
              position) - the source is much taller than the hero window, so
              the calm middle/bottom gets clipped instead of the food-forward
              top. Decorative only; the real, accessible copy is native text. */}
          <Image
            source={require("../../assets/images/foodicted-hero-bg.jpg")}
            style={{ width: windowWidth, height: heroImageHeight }}
            resizeMode="cover"
            accessibilityElementsHidden
            importantForAccessibility="no-hide-descendants"
          />
          {/* Soft fade into the canvas color - a stack of increasingly-opaque
              bands instead of a gradient library (would need a native rebuild). */}
          <View style={[styles.heroFade, { height: heroFadeHeight }]} pointerEvents="none">
            {HERO_FADE_STEPS.map((alpha, i) => (
              <View key={i} style={{ flex: 1, backgroundColor: `rgba(${HERO_BG_RGB},${alpha})` }} />
            ))}
          </View>
        </View>

        {/* Brand mark lives only in the header now - the hero stays pure
            photography, with the claim as plain copy below it instead of
            floating over the image. */}
        <Text style={styles.claim}>Erst scannen, dann schlemmen.</Text>

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
          <View style={styles.recentSection}>
            <View style={styles.cardHeaderRow}>
              <Text style={styles.recentTitle}>Zuletzt angesehen</Text>
              {recent.length > 5 && (
                <TouchableOpacity
                  style={styles.cardHeaderLinkRow}
                  onPress={() => navigation.navigate("RecentRecipes")}
                  hitSlop={8}
                >
                  <Text style={styles.cardHeaderLink}>Alle anzeigen</Text>
                  <Ionicons name="chevron-forward" size={14} color={colors.primary} />
                </TouchableOpacity>
              )}
            </View>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.recentScrollContent}
            >
              {recent.slice(0, 8).map((recipe, i) => {
                const totalMinutes = recipe.prepTimeMinutes + recipe.cookTimeMinutes;
                const meta = [totalMinutes ? `${totalMinutes} min` : null, recipe.nutrition.calories ? `${recipe.nutrition.calories} kcal` : null]
                  .filter(Boolean)
                  .join(" · ");
                return (
                  <TouchableOpacity
                    key={`${recipe.title}-${i}`}
                    style={styles.recentCard}
                    onPress={() => navigation.navigate("RecipeDetail", { recipe })}
                    activeOpacity={0.8}
                  >
                    {recipe.imageUrl ? (
                      <Image source={{ uri: recipe.imageUrl }} style={styles.recentCardImage} />
                    ) : (
                      <View style={styles.recentCardImageFallback}>
                        <Ionicons name="restaurant-outline" size={20} color={colors.primary} />
                      </View>
                    )}
                    <Text style={styles.recentCardTitle} numberOfLines={2}>
                      {recipe.title}
                    </Text>
                    {!!meta && (
                      <Text style={styles.recentCardMeta} numberOfLines={1}>
                        {meta}
                      </Text>
                    )}
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
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
            <View key={i} style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>{line.label}</Text>
              <Text style={styles.summaryValue} numberOfLines={2}>
                {line.value}
              </Text>
            </View>
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
  container: {
    flexGrow: 1,
    alignItems: "center",
    paddingHorizontal: spacing.xxl,
    paddingBottom: spacing.xxl,
    backgroundColor: HERO_BG,
  },
  heroWrap: {
    overflow: "hidden",
    backgroundColor: HERO_BG,
    marginBottom: spacing.xs,
  },
  heroFade: { position: "absolute", left: 0, right: 0, bottom: 0, flexDirection: "column" },
  claim: {
    fontSize: 21,
    fontWeight: "700",
    color: colors.brandDark,
    alignSelf: "flex-start",
    marginTop: spacing.lg,
    marginBottom: spacing.lg,
  },
  primaryButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
    backgroundColor: colors.primary,
    paddingVertical: spacing.lg + 2,
    borderRadius: radius.button,
    width: "100%",
    marginBottom: spacing.sm,
    shadowColor: colors.primary,
    shadowOpacity: 0.12,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 2,
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
  cardHeaderLinkRow: { flexDirection: "row", alignItems: "center", gap: 2 },
  cardHeaderLink: { fontSize: 14, fontWeight: "600", color: colors.primary },
  recentTitle: { fontSize: 19, fontWeight: "700", color: colors.textPrimary },
  recentSection: { width: "100%", marginTop: spacing.xxl },
  recentScrollContent: { gap: spacing.md, paddingRight: spacing.xxl, paddingVertical: spacing.xs },
  recentCard: { width: 128 },
  recentCardImage: { width: 128, height: 112, borderRadius: radius.card, backgroundColor: colors.bgAlt },
  recentCardImageFallback: {
    width: 128,
    height: 112,
    borderRadius: radius.card,
    backgroundColor: colors.bgAlt,
    alignItems: "center",
    justifyContent: "center",
  },
  recentCardTitle: { fontSize: 13, fontWeight: "700", color: colors.textPrimary, marginTop: spacing.xs, lineHeight: 17 },
  recentCardMeta: { fontSize: 11, color: colors.textMuted, marginTop: 2 },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: spacing.md,
    paddingVertical: 3,
  },
  summaryLabel: { fontSize: 13, color: colors.textMuted },
  summaryValue: { fontSize: 13, fontWeight: "600", color: colors.textSecondary, flexShrink: 1, textAlign: "right" },
  aboutLink: { flexDirection: "row", alignItems: "center", gap: 5, marginTop: spacing.lg, alignSelf: "center" },
  aboutLinkText: { fontSize: 11, color: colors.textMuted, fontWeight: "600" },
});
