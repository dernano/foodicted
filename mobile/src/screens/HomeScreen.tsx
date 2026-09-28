import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import type { MainTabsScreenProps } from "../navigation";
import VersionBadge from "../components/VersionBadge";
import { usePreferences } from "../context/PreferencesContext";
import { useRecentRecipes } from "../context/RecentRecipesContext";
import { colors, radius, shadow, spacing, type as t } from "../constants/theme";

type Props = MainTabsScreenProps<"Start">;

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

  return (
    <View style={styles.screen}>
      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        <View style={styles.hero}>
          <Image source={require("../../assets/logo-full.png")} style={styles.logo} resizeMode="contain" />
          <Text style={styles.slogan}>Erst scannen, dann schlemmen.</Text>
          <Text style={styles.subtitle}>
            Fotografiere deinen Kühlschrank, deine Vorratskammer oder den Küchenschrank und lass dir passende
            Rezepte vorschlagen.
          </Text>
        </View>
        {/* Note: the logo artwork itself is dark-green-on-transparent, so the
            hero stays on a light surface - a dark-green hero would swallow it. */}

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
            <Ionicons name="create-outline" size={18} color={colors.textPrimary} />
            <Text style={styles.secondaryButtonText}>Zutaten manuell eingeben</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.secondaryButton}
            onPress={() => navigation.navigate("AddFavoriteRecipe")}
            activeOpacity={0.7}
          >
            <Ionicons name="book-outline" size={18} color={colors.textPrimary} />
            <Text style={styles.secondaryButtonText}>Eigenes Rezept hinzufügen</Text>
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
                <Ionicons name="restaurant-outline" size={16} color={colors.primary} />
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
          <Ionicons name="information-circle-outline" size={14} color={colors.textMuted} />
          <Text style={styles.aboutLinkText}>Über Foodicted</Text>
        </TouchableOpacity>
        <Text style={styles.copyright}>© {new Date().getFullYear()} Mario Stöffler</Text>
      </ScrollView>
      <VersionBadge />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  container: { flexGrow: 1, alignItems: "center", padding: spacing.xxl, paddingBottom: spacing.xxl, backgroundColor: colors.bg },
  hero: {
    width: "100%",
    backgroundColor: colors.bgAlt,
    borderRadius: radius.hero,
    alignItems: "center",
    paddingVertical: spacing.xxl,
    paddingHorizontal: spacing.xl,
    marginBottom: spacing.xl,
  },
  logo: { width: 190, height: 145 },
  slogan: { ...t.section, color: colors.primary, textAlign: "center", marginTop: spacing.sm },
  subtitle: {
    ...t.body,
    color: colors.textSecondary,
    textAlign: "center",
    marginTop: spacing.sm,
    lineHeight: 21,
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
    marginBottom: spacing.md,
    ...shadow.button,
  },
  primaryButtonText: { color: colors.textOnDark, fontSize: 17, fontWeight: "700" },
  secondaryRow: { width: "100%", gap: spacing.sm, marginBottom: spacing.md },
  secondaryButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
    backgroundColor: colors.bgAlt,
    paddingVertical: spacing.md + 2,
    borderRadius: radius.button,
    width: "100%",
  },
  secondaryButtonText: { color: colors.textPrimary, fontSize: 15, fontWeight: "700" },
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
    paddingVertical: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.borderAlt,
  },
  recentRowFirst: { borderTopWidth: 0, paddingTop: spacing.xs },
  recentRowText: { flex: 1, fontSize: 14, color: colors.textPrimary, fontWeight: "600" },
  summaryLine: { fontSize: 14, color: colors.textSecondary, marginBottom: spacing.xs, lineHeight: 19 },
  aboutLink: { flexDirection: "row", alignItems: "center", gap: 5, marginTop: spacing.xl },
  aboutLinkText: { fontSize: 12, color: colors.textMuted, fontWeight: "600" },
  copyright: { fontSize: 12, color: colors.textMuted, marginTop: spacing.xs, marginBottom: spacing.xs, fontWeight: "600" },
});
