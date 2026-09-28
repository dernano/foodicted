import { Ionicons } from "@expo/vector-icons";
import React, { useMemo, useState } from "react";
import { ActivityIndicator, Alert, FlatList, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import type { MainTabsScreenProps } from "../navigation";
import { useFavorites } from "../context/FavoritesContext";
import { RECIPE_CATEGORY_LABELS, type FavoriteRecipe, type RecipeCategory } from "../types";
import { colors, radius, shadow, spacing, type as t } from "../constants/theme";

type Props = MainTabsScreenProps<"Favoriten">;
type CategoryFilter = RecipeCategory | "alle";

export default function FavoritesScreen({ navigation }: Props) {
  const { favorites, removeFavorite, ready, shared } = useFavorites();
  const [filter, setFilter] = useState<CategoryFilter>("alle");
  const [tagFilter, setTagFilter] = useState<string[]>([]);

  const presentCategories = useMemo(() => {
    const set = new Set<RecipeCategory>();
    favorites.forEach((f) => set.add(f.category));
    return Array.from(set);
  }, [favorites]);

  const presentTags = useMemo(() => {
    const set = new Set<string>();
    favorites.forEach((f) => f.tags.forEach((t) => set.add(t)));
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [favorites]);

  function toggleTagFilter(tag: string) {
    setTagFilter((prev) => (prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]));
  }

  const filtered = favorites
    .filter((f) => filter === "alle" || f.category === filter)
    .filter((f) => tagFilter.length === 0 || f.tags.some((t) => tagFilter.includes(t)));

  function confirmRemove(recipe: FavoriteRecipe) {
    Alert.alert("Rezept entfernen?", `„${recipe.title}" aus den Favoriten entfernen?`, [
      { text: "Abbrechen", style: "cancel" },
      { text: "Entfernen", style: "destructive", onPress: () => removeFavorite(recipe.id) },
    ]);
  }

  // Wait until we know for sure whether this account belongs to a household -
  // otherwise we'd briefly show an empty local list before the shared one loads.
  if (!ready) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  return (
    <FlatList
      style={styles.container}
      contentContainerStyle={{ padding: spacing.lg, paddingBottom: spacing.xxl, flexGrow: 1 }}
      data={filtered}
      keyExtractor={(item) => item.id}
      ListHeaderComponent={
        <View>
          {shared && (
            <View style={styles.sharedBanner}>
              <Ionicons name="people" size={15} color={colors.primary} />
              <Text style={styles.sharedBannerText}>Geteilt mit deinem Haushalt - live synchron</Text>
            </View>
          )}
          {presentCategories.length > 1 && (
            <View style={styles.filterRow}>
              <TouchableOpacity
                style={[styles.filterChip, filter === "alle" && styles.filterChipSelected]}
                onPress={() => setFilter("alle")}
              >
                <Text style={[styles.filterChipText, filter === "alle" && styles.filterChipTextSelected]}>
                  Alle
                </Text>
              </TouchableOpacity>
              {presentCategories.map((c) => (
                <TouchableOpacity
                  key={c}
                  style={[styles.filterChip, filter === c && styles.filterChipSelected]}
                  onPress={() => setFilter(c)}
                >
                  <Text style={[styles.filterChipText, filter === c && styles.filterChipTextSelected]}>
                    {RECIPE_CATEGORY_LABELS[c]}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
          {presentTags.length > 0 && (
            <View style={styles.filterRow}>
              {presentTags.map((tag) => (
                <TouchableOpacity
                  key={tag}
                  style={[styles.tagFilterChip, tagFilter.includes(tag) && styles.tagFilterChipSelected]}
                  onPress={() => toggleTagFilter(tag)}
                >
                  <Text
                    style={[styles.tagFilterChipText, tagFilter.includes(tag) && styles.tagFilterChipTextSelected]}
                  >
                    #{tag}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>
      }
      ListEmptyComponent={
        <View style={styles.emptyState}>
          <View style={styles.emptyIconCircle}>
            <Ionicons name="heart" size={28} color={colors.primary} />
          </View>
          <Text style={styles.emptyTitle}>Noch keine Lieblingsrezepte</Text>
          <Text style={styles.emptyText}>
            Tippe bei einem Rezeptvorschlag auf das Herz-Symbol, um es hier zu speichern - inklusive aller
            benötigten Zutaten.
          </Text>
        </View>
      }
      renderItem={({ item }) => (
        <TouchableOpacity
          style={styles.card}
          onPress={() => navigation.navigate("RecipeDetail", { recipe: item })}
          onLongPress={() => confirmRemove(item)}
          activeOpacity={0.85}
        >
          <View style={styles.cardHeader}>
            <View style={{ flex: 1, marginRight: spacing.sm }}>
              <Text style={styles.categoryBadge}>{RECIPE_CATEGORY_LABELS[item.category]}</Text>
              <Text style={styles.title}>{item.title}</Text>
            </View>
            <TouchableOpacity onPress={() => confirmRemove(item)} hitSlop={10}>
              <Ionicons name="trash-outline" size={18} color={colors.textMuted} />
            </TouchableOpacity>
          </View>
          <Text style={styles.description}>{item.description}</Text>

          <View style={styles.metaRow}>
            <View style={styles.metaItem}>
              <Ionicons name="time-outline" size={13} color={colors.textSecondary} />
              <Text style={styles.metaItemText}>
                {item.prepTimeMinutes + item.cookTimeMinutes ? `${item.prepTimeMinutes + item.cookTimeMinutes} min` : "-"}
              </Text>
            </View>
            <View style={styles.metaItem}>
              <Ionicons name="restaurant-outline" size={13} color={colors.textSecondary} />
              <Text style={styles.metaItemText}>{item.servings} Port.</Text>
            </View>
            {!!item.nutrition.calories && (
              <View style={styles.metaItem}>
                <Ionicons name="flame-outline" size={13} color={colors.textSecondary} />
                <Text style={styles.metaItemText}>{item.nutrition.calories} kcal</Text>
              </View>
            )}
          </View>

          <Text style={styles.ingredientsLabel}>Benötigte Zutaten</Text>
          <Text style={styles.ingredientsText} numberOfLines={3}>
            {item.ingredients.map((ing) => `${ing.amount} ${ing.name}`).join(" · ")}
          </Text>

          {!!item.missingIngredients.length && (
            <Text style={styles.shopping}>Einzukaufen: {item.missingIngredients.join(", ")}</Text>
          )}
          {!!item.tags.length && (
            <View style={styles.tagRow}>
              {item.tags.map((tag) => (
                <View key={tag} style={styles.tagPill}>
                  <Text style={styles.tagPillText}>#{tag}</Text>
                </View>
              ))}
            </View>
          )}
        </TouchableOpacity>
      )}
    />
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  loadingContainer: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: colors.bg },
  sharedBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    backgroundColor: colors.bgAlt,
    borderRadius: radius.control,
    paddingVertical: spacing.sm + 2,
    paddingHorizontal: spacing.md + 2,
    marginBottom: spacing.md + 2,
  },
  sharedBannerText: { fontSize: 12, color: colors.textPrimary, fontWeight: "600" },
  filterRow: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm, marginBottom: spacing.md + 2 },
  filterChip: {
    borderRadius: radius.pill,
    paddingVertical: 7,
    paddingHorizontal: spacing.md + 1,
    backgroundColor: colors.chipInactiveBg,
  },
  filterChipSelected: { backgroundColor: colors.primary },
  filterChipText: { color: colors.chipInactiveText, fontSize: 12, fontWeight: "600" },
  filterChipTextSelected: { color: colors.textOnDark },
  tagFilterChip: {
    borderRadius: radius.pill,
    paddingVertical: 6,
    paddingHorizontal: spacing.md,
    backgroundColor: colors.chipInactiveBg,
  },
  tagFilterChipSelected: { backgroundColor: colors.brandDark },
  tagFilterChipText: { color: colors.chipInactiveText, fontSize: 11, fontWeight: "600" },
  tagFilterChipTextSelected: { color: colors.textOnDark },
  emptyState: { flex: 1, alignItems: "center", justifyContent: "center", paddingTop: 80, paddingHorizontal: 32 },
  emptyIconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.bgAlt,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.lg,
  },
  emptyTitle: { ...t.section, color: colors.textPrimary, marginBottom: spacing.sm },
  emptyText: { fontSize: 14, color: colors.textMuted, textAlign: "center", lineHeight: 20 },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.card,
    padding: spacing.lg,
    marginBottom: spacing.md + 2,
    ...shadow.soft,
  },
  cardHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" },
  categoryBadge: { fontSize: 11, color: colors.primary, fontWeight: "700", marginBottom: 2, textTransform: "uppercase" },
  title: { fontSize: 16, fontWeight: "800", color: colors.textPrimary },
  description: { fontSize: 13, color: colors.textSecondary, marginTop: spacing.sm, lineHeight: 18 },
  metaRow: { flexDirection: "row", flexWrap: "wrap", gap: spacing.md, marginTop: spacing.md },
  metaItem: { flexDirection: "row", alignItems: "center", gap: 4 },
  metaItemText: { fontSize: 12, color: colors.textSecondary },
  ingredientsLabel: { fontSize: 12, fontWeight: "700", color: colors.textPrimary, marginTop: spacing.md },
  ingredientsText: { fontSize: 12, color: colors.textSecondary, marginTop: spacing.xs, lineHeight: 17 },
  shopping: { fontSize: 12, color: colors.noticeText, marginTop: spacing.sm },
  tagRow: { flexDirection: "row", flexWrap: "wrap", gap: spacing.xs, marginTop: spacing.md },
  tagPill: { backgroundColor: colors.bgAlt, borderRadius: radius.pill, paddingVertical: 4, paddingHorizontal: spacing.sm },
  tagPillText: { fontSize: 11, color: colors.textPrimary, fontWeight: "600" },
});
