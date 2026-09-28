import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { Alert, Image, SectionList, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import type { RootStackScreenProps } from "../navigation";
import { useFavorites } from "../context/FavoritesContext";
import { useShoppingList } from "../context/ShoppingListContext";
import { RECIPE_CATEGORY_LABELS, type Recipe } from "../types";
import { colors, radius, shadow, spacing, type as t } from "../constants/theme";

type Props = RootStackScreenProps<"Recipes">;

interface Section {
  title: string;
  subtitle?: string;
  extra: boolean;
  data: Recipe[];
}

export default function RecipesScreen({ route, navigation }: Props) {
  const { recipes } = route.params;
  const { isFavorite, toggleFavorite } = useFavorites();
  const { addItems } = useShoppingList();

  const readyRecipes = recipes.filter((r) => r.missingIngredients.length === 0);
  const extraRecipes = recipes.filter((r) => r.missingIngredients.length > 0);

  const sections: Section[] = [];
  if (readyRecipes.length) {
    sections.push({ title: "Mit deinen Zutaten machbar", extra: false, data: readyRecipes });
  }
  if (extraRecipes.length) {
    sections.push({
      title: "Weitere Ideen",
      subtitle: "Diese Rezepte brauchen noch ein paar Zutaten, die du nicht im Vorrat hast.",
      extra: true,
      data: extraRecipes,
    });
  }

  function addMissingToShoppingList(recipe: Recipe) {
    addItems(recipe.missingIngredients, recipe.title);
    Alert.alert("Hinzugefügt", "Die fehlenden Zutaten wurden zu deiner Einkaufsliste hinzugefügt.");
  }

  return (
    <SectionList
      style={styles.container}
      contentContainerStyle={{ padding: spacing.lg, paddingBottom: spacing.xxl }}
      sections={sections}
      stickySectionHeadersEnabled={false}
      keyExtractor={(item, i) => `${item.title}-${i}`}
      ListEmptyComponent={<Text style={styles.empty}>Keine Rezepte gefunden. Versuch es mit anderen Zutaten.</Text>}
      renderSectionHeader={({ section }) => (
        <View style={[styles.sectionHeader, (section as Section).extra && styles.sectionHeaderExtra]}>
          <Text style={[styles.sectionTitle, (section as Section).extra && styles.sectionTitleExtra]}>
            {section.title}
          </Text>
          {!!(section as Section).subtitle && (
            <Text style={styles.sectionSubtitle}>{(section as Section).subtitle}</Text>
          )}
        </View>
      )}
      renderItem={({ item, section }: { item: Recipe; section: Section }) => {
        const favorite = isFavorite(item);
        const extra = section.extra;
        return (
          <TouchableOpacity
            style={[styles.card, extra && styles.cardExtra]}
            onPress={() => navigation.navigate("RecipeDetail", { recipe: item })}
            activeOpacity={0.85}
          >
            <View style={styles.cardHeader}>
              {item.imageUrl ? (
                <Image source={{ uri: item.imageUrl }} style={styles.categoryIcon} />
              ) : (
                <View style={styles.categoryIcon}>
                  <Ionicons name="restaurant" size={16} color={extra ? colors.attention : colors.primary} />
                </View>
              )}
              <View style={{ flex: 1, marginRight: spacing.sm }}>
                <Text style={[styles.categoryBadge, extra && styles.categoryBadgeExtra]}>
                  {RECIPE_CATEGORY_LABELS[item.category]}
                </Text>
                <Text style={styles.title}>{item.title}</Text>
              </View>
              <TouchableOpacity onPress={() => toggleFavorite(item)} hitSlop={10}>
                <Ionicons name={favorite ? "heart" : "heart-outline"} size={22} color={favorite ? colors.danger : colors.textMuted} />
              </TouchableOpacity>
            </View>
            <Text style={styles.description} numberOfLines={2}>
              {item.description}
            </Text>
            <View style={styles.metaRow}>
              <MetaItem icon="time-outline" value={`${item.prepTimeMinutes + item.cookTimeMinutes} min`} />
              <MetaItem icon="restaurant-outline" value={`${item.servings} Port.`} />
              {!!item.nutrition.calories && <MetaItem icon="flame-outline" value={`${item.nutrition.calories} kcal`} />}
            </View>
            {!!item.tags.length && (
              <View style={styles.tagRow}>
                {item.tags.slice(0, 3).map((tag) => (
                  <View key={tag} style={styles.tag}>
                    <Text style={styles.tagText}>{tag}</Text>
                  </View>
                ))}
              </View>
            )}
            {extra && !!item.missingIngredients.length && (
              <View style={styles.missingBox}>
                <Text style={styles.missing}>Zusätzlich benötigt: {item.missingIngredients.join(", ")}</Text>
                <TouchableOpacity
                  style={styles.missingButton}
                  onPress={() => addMissingToShoppingList(item)}
                  hitSlop={8}
                  activeOpacity={0.8}
                >
                  <Ionicons name="cart-outline" size={14} color={colors.textOnDark} />
                  <Text style={styles.missingButtonText}>Zur Einkaufsliste</Text>
                </TouchableOpacity>
              </View>
            )}
          </TouchableOpacity>
        );
      }}
    />
  );
}

function MetaItem({ icon, value }: { icon: keyof typeof Ionicons.glyphMap; value: string }) {
  return (
    <View style={styles.metaItem}>
      <Ionicons name={icon} size={13} color={colors.textSecondary} />
      <Text style={styles.metaItemText}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  empty: { textAlign: "center", color: colors.textMuted, marginTop: 32 },
  sectionHeader: { marginTop: spacing.xs, marginBottom: spacing.md },
  sectionHeaderExtra: { marginTop: spacing.xl },
  sectionTitle: { ...t.section, fontSize: 15, color: colors.textPrimary },
  sectionTitleExtra: { color: colors.attention },
  sectionSubtitle: { fontSize: 12, color: colors.textMuted, marginTop: 3, lineHeight: 17 },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.card,
    padding: spacing.lg,
    marginBottom: spacing.md + 2,
    ...shadow.soft,
  },
  cardExtra: {
    backgroundColor: colors.attentionBg,
    borderWidth: 1,
    borderColor: colors.attentionBorder,
    shadowOpacity: 0,
    elevation: 0,
  },
  cardHeader: { flexDirection: "row", alignItems: "flex-start", gap: spacing.md },
  categoryIcon: {
    width: 64,
    height: 64,
    borderRadius: radius.control,
    backgroundColor: colors.bgAlt,
    alignItems: "center",
    justifyContent: "center",
  },
  categoryBadge: { fontSize: 11, color: colors.primary, fontWeight: "700", marginBottom: 2, textTransform: "uppercase" },
  categoryBadgeExtra: { color: colors.attention },
  title: { fontSize: 16, fontWeight: "800", color: colors.textPrimary },
  description: { fontSize: 13, color: colors.textSecondary, marginTop: spacing.sm, lineHeight: 18 },
  metaRow: { flexDirection: "row", flexWrap: "wrap", gap: spacing.md, marginTop: spacing.md },
  metaItem: { flexDirection: "row", alignItems: "center", gap: 4 },
  metaItemText: { fontSize: 12, color: colors.textSecondary },
  tagRow: { flexDirection: "row", flexWrap: "wrap", gap: spacing.xs, marginTop: spacing.md },
  tag: { backgroundColor: colors.bgAlt, borderRadius: radius.pill, paddingVertical: 4, paddingHorizontal: spacing.sm },
  tagText: { fontSize: 11, color: colors.textPrimary, fontWeight: "600" },
  missingBox: {
    marginTop: spacing.md,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.attentionBorder,
  },
  missing: { fontSize: 12, color: colors.noticeText, lineHeight: 17 },
  missingButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    alignSelf: "flex-start",
    backgroundColor: colors.attention,
    borderRadius: radius.control,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    marginTop: spacing.md,
  },
  missingButtonText: { color: colors.textOnDark, fontSize: 12, fontWeight: "700" },
});
