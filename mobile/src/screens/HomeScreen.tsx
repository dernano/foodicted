import { Ionicons } from "@expo/vector-icons";
import MaskedView from "@react-native-masked-view/masked-view";
import { LinearGradient } from "expo-linear-gradient";
import React from "react";
import { Image, ScrollView, StyleSheet, Text, TouchableOpacity, useWindowDimensions, View } from "react-native";
import type { MainTabsScreenProps } from "../navigation";
import { usePreferences } from "../context/PreferencesContext";
import { useRecentRecipes } from "../context/RecentRecipesContext";
import { colors, radius, shadow, spacing, type as t } from "../constants/theme";

type Props = MainTabsScreenProps<"Start">;

// The hero photo's own bright surface measured precisely (colors.headerBg) -
// not just "close to" the header color, but the exact same value, so the
// image's built-in alpha fade blends into both the page and the header with
// zero visible seam (any alpha blend of a color with itself is still that
// color, regardless of the fade curve).
const HOME_BG = colors.headerBg;

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
  // The hero is a composed cream surface, not a rectangular photo banner:
  // its height is chosen by the layout, independent of the food photo's own
  // dimensions. The photo is an oversized, absolutely-positioned decorative
  // element anchored top-right (see heroFoodImage below) - the UI dictates
  // how much of it shows, not the other way around.
  const heroHeight = Math.min(Math.max(windowWidth * 0.6, 220), 245);
  // Rendered larger than the hero box and shifted past the right edge, so
  // only its right portion (the actual food) sits over the visible area.
  // Sized at the asset's native aspect ratio (1500x1000) so the photo
  // itself isn't stretched - that's independent of the hero box's own
  // height above.
  const heroImageWidth = windowWidth * 0.82;
  const heroImageHeight = heroImageWidth / 1.5;
  const heroImageRight = -windowWidth * 0.16;
  const heroImageTop = 0;
  const headlineSize = Math.min(Math.max(windowWidth * 0.082, 30), 35);
  const heroTextTop = heroHeight * 0.34;

  return (
    <View style={styles.screen}>
      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        {/* width: windowWidth deliberately overflows the ScrollView's own
            horizontal padding (centered, so it overflows evenly both sides)
            so the photo can reach the true right screen edge - the text
            block below compensates with its own left inset to stay aligned
            with the rest of the page's content margin. overflow: hidden
            clips the oversized, overflowing heroFoodImage. */}
        <View style={[styles.hero, { width: windowWidth, height: heroHeight }]}>
          {/* MaskedView masks the photo's own opacity (black = visible,
              transparent = invisible) instead of painting a HOME_BG-colored
              gradient on top of it - the real screen background shows
              through directly, so there's no color-matching to get wrong
              and no risk of a visible seam or banding from an overlay. */}
          <MaskedView
            style={StyleSheet.absoluteFill}
            pointerEvents="none"
            maskElement={
              <LinearGradient
                colors={["transparent", "black", "black", "black", "transparent"]}
                locations={[0, 0.16, 0.68, 0.78, 1]}
                style={StyleSheet.absoluteFill}
              />
            }
          >
            <Image
              source={require("../../assets/images/foodicted-hero-ingredients.webp")}
              style={[
                styles.heroFoodImage,
                { width: heroImageWidth, height: heroImageHeight, right: heroImageRight, top: heroImageTop },
              ]}
              resizeMode="contain"
              accessibilityElementsHidden
              importantForAccessibility="no-hide-descendants"
            />
          </MaskedView>
          <View style={[styles.heroTextBlock, { top: heroTextTop }]} pointerEvents="none">
            <Text style={styles.eyebrow}>Aus deinem Vorrat</Text>
            <Text style={[styles.headline, { fontSize: headlineSize, lineHeight: headlineSize * 1.12 }]}>
              Erst scannen,{"\n"}dann schlemmen.
            </Text>
          </View>
        </View>

        <View style={styles.stepsRow}>
          <View style={styles.stepItem}>
            <Ionicons name="camera-outline" size={22} color={colors.brandDark} />
            <Text style={styles.stepLabel}>Zutaten{"\n"}scannen</Text>
          </View>
          <Ionicons name="arrow-forward-outline" size={14} color={colors.textMuted} />
          <View style={styles.stepItem}>
            <Ionicons name="restaurant-outline" size={22} color={colors.brandDark} />
            <Text style={styles.stepLabel}>Rezepte{"\n"}entdecken</Text>
          </View>
          <Ionicons name="arrow-forward-outline" size={14} color={colors.textMuted} />
          <View style={styles.stepItem}>
            <Ionicons name="heart-outline" size={22} color={colors.brandDark} />
            <Text style={styles.stepLabel}>Genießen</Text>
          </View>
        </View>

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
  screen: { flex: 1, backgroundColor: HOME_BG },
  container: {
    flexGrow: 1,
    alignItems: "center",
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.lg,
    paddingBottom: spacing.xxl,
    backgroundColor: HOME_BG,
  },
  hero: { position: "relative", overflow: "hidden", backgroundColor: HOME_BG },
  heroFoodImage: { position: "absolute", zIndex: 1 },
  heroTextBlock: {
    position: "absolute",
    zIndex: 2,
    // Re-adds the page's own content inset, since the hero itself overflows
    // that padding to let the photo reach the screen edge. `top` is set
    // inline (heroTextTop) rather than anchored to `bottom`.
    left: spacing.xl,
    width: "74%",
  },
  eyebrow: {
    fontSize: 12,
    fontWeight: "700",
    color: colors.primary,
    letterSpacing: 1.2,
    textTransform: "uppercase",
    marginBottom: 12,
  },
  headline: { fontWeight: "800", color: colors.brandDark },
  stepsRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    width: "100%",
    marginTop: spacing.lg + 2,
    marginBottom: spacing.md,
  },
  stepItem: { alignItems: "center", flex: 1, gap: 4 },
  stepLabel: { fontSize: 11, fontWeight: "600", color: colors.brandDark, textAlign: "center", lineHeight: 14 },
  primaryButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
    backgroundColor: colors.primary,
    paddingVertical: spacing.lg + 4,
    borderRadius: 16,
    width: "100%",
    marginBottom: spacing.sm,
    shadowColor: colors.primary,
    shadowOpacity: 0.08,
    shadowRadius: 5,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  primaryButtonText: { color: colors.textOnDark, fontSize: 16, fontWeight: "700" },
  secondaryRow: { width: "100%", flexDirection: "row", gap: spacing.sm, marginBottom: spacing.md },
  secondaryButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: spacing.lg,
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
