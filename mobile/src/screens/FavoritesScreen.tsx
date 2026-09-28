import { Ionicons } from "@expo/vector-icons";
import React, { useMemo, useState } from "react";
import { ActivityIndicator, Alert, FlatList, Image, StyleSheet, Text, TouchableOpacity, View } from "react-native";
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
            <View style={styles.sharedPill}>
              <Ionicons name="checkmark-circle" size={13} color={colors.primary} />
              <Text style={styles.sharedPillText}>Haushalt · live synchron</Text>
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
      renderItem={({ item }) => {
        const metaLine = [
          item.prepTimeMinutes + item.cookTimeMinutes ? `${item.prepTimeMinutes + item.cookTimeMinutes} min` : null,
          `${item.servings} Port.`,
          item.nutrition.calories ? `${item.nutrition.calories} kcal` : null,
        ]
          .filter(Boolean)
          .join(" · ");

        return (
          <TouchableOpacity
            style={styles.card}
            onPress={() => navigation.navigate("RecipeDetail", { recipe: item })}
            onLongPress={() => confirmRemove(item)}
            activeOpacity={0.85}
          >
            {item.imageUrl ? (
              <Image source={{ uri: item.imageUrl }} style={styles.cardImage} />
            ) : (
              <View style={styles.cardImageFallback}>
                <Ionicons name="restaurant" size={24} color={colors.primary} />
              </View>
            )}
            <View style={styles.cardBody}>
              <Text style={styles.categoryBadge}>{RECIPE_CATEGORY_LABELS[item.category]}</Text>
              <Text style={styles.title} numberOfLines={2}>
                {item.title}
              </Text>
              <Text style={styles.metaLine} numberOfLines={1}>
                {metaLine}
              </Text>
              {!!item.tags.length && (
                <View style={styles.tagRow}>
                  {item.tags.slice(0, 3).map((tag) => (
                    <View key={tag} style={styles.tagPill}>
                      <Text style={styles.tagPillText}>#{tag}</Text>
                    </View>
                  ))}
                </View>
              )}
            </View>
            <TouchableOpacity onPress={() => confirmRemove(item)} hitSlop={10} style={styles.deleteButton}>
              <Ionicons name="trash-outline" size={16} color={colors.textMuted} />
            </TouchableOpacity>
          </TouchableOpacity>
        );
      }}
    />
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  loadingContainer: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: colors.bg },
  sharedPill: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    gap: 5,
    backgroundColor: colors.bgAlt,
    borderRadius: radius.pill,
    paddingVertical: 5,
    paddingHorizontal: spacing.md,
    marginBottom: spacing.md,
  },
  sharedPillText: { fontSize: 11, color: colors.textSecondary, fontWeight: "700" },
  filterRow: { flexDirection: "row", flexWrap: "wrap", gap: spacing.xs, marginBottom: spacing.sm + 2 },
  filterChip: {
    borderRadius: radius.pill,
    paddingVertical: 6,
    paddingHorizontal: spacing.md,
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
    flexDirection: "row",
    alignItems: "flex-start",
    backgroundColor: colors.surface,
    borderRadius: radius.card,
    padding: spacing.md,
    marginBottom: spacing.md,
    gap: spacing.md,
    ...shadow.soft,
  },
  cardImage: { width: 84, height: 84, borderRadius: radius.control, backgroundColor: colors.bgAlt },
  cardImageFallback: {
    width: 84,
    height: 84,
    borderRadius: radius.control,
    backgroundColor: colors.bgAlt,
    alignItems: "center",
    justifyContent: "center",
  },
  cardBody: { flex: 1 },
  categoryBadge: { fontSize: 11, color: colors.primary, fontWeight: "700", marginBottom: 2, textTransform: "uppercase" },
  title: { fontSize: 15, fontWeight: "800", color: colors.textPrimary, lineHeight: 19 },
  metaLine: { fontSize: 12, color: colors.textSecondary, marginTop: 4 },
  deleteButton: { padding: 2 },
  tagRow: { flexDirection: "row", flexWrap: "wrap", gap: spacing.xs, marginTop: spacing.sm },
  tagPill: { backgroundColor: colors.bgAlt, borderRadius: radius.pill, paddingVertical: 3, paddingHorizontal: spacing.sm },
  tagPillText: { fontSize: 11, color: colors.textPrimary, fontWeight: "600" },
});
