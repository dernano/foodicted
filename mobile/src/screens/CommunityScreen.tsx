import { Ionicons } from "@expo/vector-icons";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { ActivityIndicator, FlatList, Image, RefreshControl, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import type { MainTabsScreenProps } from "../navigation";
import { communityRecipeToRecipe, fetchCommunityRecipes } from "../api/community";
import { useAuth } from "../context/AuthContext";
import { useFavorites } from "../context/FavoritesContext";
import { usePantry } from "../context/PantryContext";
import { matchRatio } from "../utils/ingredientMatch";
import { RECIPE_CATEGORY_LABELS, type CommunityRecipe, type RecipeCategory } from "../types";
import { colors, radius, shadow, spacing, type as t } from "../constants/theme";

type Props = MainTabsScreenProps<"Community">;
type CategoryFilter = RecipeCategory | "alle";
type SortMode = "neu" | "bewertung" | "match" | "zeit" | "kalorien";

const SORT_OPTIONS: { value: SortMode; label: string }[] = [
  { value: "neu", label: "Neueste" },
  { value: "bewertung", label: "Beste Bewertung" },
  { value: "match", label: "Dein Vorrat" },
  { value: "zeit", label: "Schnellste" },
  { value: "kalorien", label: "Wenigste Kalorien" },
];

function StarRating({ value, size = 12 }: { value: number; size?: number }) {
  return (
    <View style={{ flexDirection: "row", gap: 1 }}>
      {[1, 2, 3, 4, 5].map((i) => (
        <Ionicons key={i} name={value >= i ? "star" : value >= i - 0.5 ? "star-half" : "star-outline"} size={size} color={colors.attention} />
      ))}
    </View>
  );
}

export default function CommunityScreen({ navigation }: Props) {
  const { session } = useAuth();
  const { pantry } = usePantry();
  const { isFavorite, toggleFavorite } = useFavorites();
  const [recipes, setRecipes] = useState<CommunityRecipe[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState<CategoryFilter>("alle");
  const [tagFilter, setTagFilter] = useState<string[]>([]);
  const [equipmentFilter, setEquipmentFilter] = useState<string[]>([]);
  const [sort, setSort] = useState<SortMode>("neu");

  const pantryNames = useMemo(() => pantry.items.map((i) => i.name), [pantry.items]);

  const load = useCallback(async () => {
    try {
      const data = await fetchCommunityRecipes();
      setRecipes(data);
    } catch (err) {
      console.warn("Failed to load community recipes", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  function onRefresh() {
    setRefreshing(true);
    load();
  }

  const presentCategories = useMemo(() => {
    const set = new Set<RecipeCategory>();
    recipes.forEach((r) => set.add(r.category));
    return Array.from(set);
  }, [recipes]);

  const presentTags = useMemo(() => {
    const set = new Set<string>();
    recipes.forEach((r) => r.tags.forEach((tag) => set.add(tag)));
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [recipes]);

  const presentEquipment = useMemo(() => {
    const set = new Set<string>();
    recipes.forEach((r) => (r.requiredEquipment ?? []).forEach((item) => set.add(item)));
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [recipes]);

  function toggleTagFilter(tag: string) {
    setTagFilter((prev) => (prev.includes(tag) ? prev.filter((x) => x !== tag) : [...prev, tag]));
  }

  function toggleEquipmentFilter(item: string) {
    setEquipmentFilter((prev) => (prev.includes(item) ? prev.filter((x) => x !== item) : [...prev, item]));
  }

  const matchFor = useCallback(
    (recipe: CommunityRecipe) => matchRatio(recipe.ingredients.map((i) => i.name), pantryNames),
    [pantryNames]
  );

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    let list = recipes.filter((r) => {
      if (category !== "alle" && r.category !== category) return false;
      if (tagFilter.length && !r.tags.some((tag) => tagFilter.includes(tag))) return false;
      if (equipmentFilter.length && !(r.requiredEquipment ?? []).some((item) => equipmentFilter.includes(item))) return false;
      if (query) {
        const haystack = [
          r.title,
          r.description,
          r.authorName,
          ...r.tags,
          ...(r.requiredEquipment ?? []),
          ...r.ingredients.map((i) => i.name),
        ]
          .join(" ")
          .toLowerCase();
        if (!haystack.includes(query)) return false;
      }
      return true;
    });

    list = [...list].sort((a, b) => {
      switch (sort) {
        case "bewertung":
          return b.avgRating - a.avgRating || b.ratingCount - a.ratingCount;
        case "match":
          return matchFor(b) - matchFor(a);
        case "zeit":
          return a.prepTimeMinutes + a.cookTimeMinutes - (b.prepTimeMinutes + b.cookTimeMinutes);
        case "kalorien":
          return (a.nutrition.calories || Infinity) - (b.nutrition.calories || Infinity);
        default:
          return b.createdAt - a.createdAt;
      }
    });
    return list;
  }, [recipes, search, category, tagFilter, equipmentFilter, sort, matchFor]);

  if (loading) {
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
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
      ListHeaderComponent={
        <View>
          <View style={styles.searchRow}>
            <Ionicons name="search" size={16} color={colors.textMuted} />
            <TextInput
              style={styles.searchInput}
              placeholder="Rezepte, Zutaten, Autoren durchsuchen"
              placeholderTextColor={colors.textMuted}
              value={search}
              onChangeText={setSearch}
            />
          </View>

          <View style={styles.filterRow}>
            {SORT_OPTIONS.map((opt) => (
              <TouchableOpacity
                key={opt.value}
                style={[styles.filterChip, sort === opt.value && styles.filterChipSelected]}
                onPress={() => setSort(opt.value)}
              >
                <Text style={[styles.filterChipText, sort === opt.value && styles.filterChipTextSelected]}>
                  {opt.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {presentCategories.length > 1 && (
            <View style={styles.filterRow}>
              <TouchableOpacity
                style={[styles.filterChip, category === "alle" && styles.filterChipSelected]}
                onPress={() => setCategory("alle")}
              >
                <Text style={[styles.filterChipText, category === "alle" && styles.filterChipTextSelected]}>Alle</Text>
              </TouchableOpacity>
              {presentCategories.map((c) => (
                <TouchableOpacity
                  key={c}
                  style={[styles.filterChip, category === c && styles.filterChipSelected]}
                  onPress={() => setCategory(c)}
                >
                  <Text style={[styles.filterChipText, category === c && styles.filterChipTextSelected]}>
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
                  <Text style={[styles.tagFilterChipText, tagFilter.includes(tag) && styles.tagFilterChipTextSelected]}>
                    #{tag}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          )}

          {presentEquipment.length > 0 && (
            <View style={styles.filterRow}>
              {presentEquipment.map((item) => {
                const selected = equipmentFilter.includes(item);
                return (
                  <TouchableOpacity
                    key={item}
                    style={[styles.equipmentFilterChip, selected && styles.equipmentFilterChipSelected]}
                    onPress={() => toggleEquipmentFilter(item)}
                  >
                    <Ionicons name="construct-outline" size={11} color={selected ? colors.textOnDark : colors.chipInactiveText} />
                    <Text style={[styles.equipmentFilterChipText, selected && styles.equipmentFilterChipTextSelected]}>
                      {item}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          )}

          {!session && (
            <View style={styles.guestNotice}>
              <Ionicons name="information-circle-outline" size={14} color={colors.textMuted} />
              <Text style={styles.guestNoticeText}>Zum Bewerten, Kommentieren und Veröffentlichen anmelden.</Text>
            </View>
          )}
        </View>
      }
      ListEmptyComponent={
        <View style={styles.emptyState}>
          <View style={styles.emptyIconCircle}>
            <Ionicons name="compass-outline" size={28} color={colors.primary} />
          </View>
          <Text style={styles.emptyTitle}>Noch keine Community-Rezepte</Text>
          <Text style={styles.emptyText}>Sei die erste Person, die ein Rezept veröffentlicht.</Text>
        </View>
      }
      renderItem={({ item }) => {
        const favorite = isFavorite(communityRecipeToRecipe(item));
        const match = pantryNames.length ? Math.round(matchFor(item) * 100) : null;
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
            onPress={() => navigation.navigate("CommunityRecipeDetail", { recipe: item })}
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
              <View style={styles.cardTopRow}>
                <Text style={styles.categoryBadge}>{RECIPE_CATEGORY_LABELS[item.category]}</Text>
                {match !== null && (
                  <View style={styles.matchBadge}>
                    <Text style={styles.matchBadgeText}>{match}% Match</Text>
                  </View>
                )}
              </View>
              <Text style={styles.title} numberOfLines={2}>
                {item.title}
              </Text>
              <Text style={styles.author} numberOfLines={1}>
                von {item.authorName}
              </Text>
              <View style={styles.ratingRow}>
                <StarRating value={item.avgRating} />
                <Text style={styles.ratingCount}>({item.ratingCount})</Text>
              </View>
              <Text style={styles.metaLine} numberOfLines={1}>
                {metaLine}
              </Text>
            </View>
            <TouchableOpacity
              onPress={() => toggleFavorite(communityRecipeToRecipe(item))}
              hitSlop={10}
              style={styles.favoriteButton}
            >
              <Ionicons name={favorite ? "heart" : "heart-outline"} size={19} color={favorite ? colors.danger : colors.textMuted} />
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
  searchRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    backgroundColor: colors.surface,
    borderRadius: radius.control,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.md,
    marginBottom: spacing.md,
  },
  searchInput: { flex: 1, paddingVertical: spacing.sm + 2, fontSize: 14, color: colors.textPrimary },
  filterRow: { flexDirection: "row", flexWrap: "wrap", gap: spacing.xs, marginBottom: spacing.sm },
  filterChip: { borderRadius: radius.pill, paddingVertical: 6, paddingHorizontal: spacing.md, backgroundColor: colors.chipInactiveBg },
  filterChipSelected: { backgroundColor: colors.primary },
  filterChipText: { color: colors.chipInactiveText, fontSize: 12, fontWeight: "600" },
  filterChipTextSelected: { color: colors.textOnDark },
  tagFilterChip: { borderRadius: radius.pill, paddingVertical: 6, paddingHorizontal: spacing.md, backgroundColor: colors.chipInactiveBg },
  tagFilterChipSelected: { backgroundColor: colors.brandDark },
  tagFilterChipText: { color: colors.chipInactiveText, fontSize: 11, fontWeight: "600" },
  tagFilterChipTextSelected: { color: colors.textOnDark },
  equipmentFilterChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    borderRadius: radius.pill,
    paddingVertical: 6,
    paddingHorizontal: spacing.md,
    backgroundColor: colors.chipInactiveBg,
  },
  equipmentFilterChipSelected: { backgroundColor: colors.brandDark },
  equipmentFilterChipText: { color: colors.chipInactiveText, fontSize: 11, fontWeight: "600" },
  equipmentFilterChipTextSelected: { color: colors.textOnDark },
  guestNotice: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: spacing.sm,
  },
  guestNoticeText: { fontSize: 11, color: colors.textMuted, flex: 1 },
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
  favoriteButton: { padding: 2 },
  cardTopRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  categoryBadge: { fontSize: 11, color: colors.primary, fontWeight: "700", textTransform: "uppercase" },
  matchBadge: { backgroundColor: colors.bgAlt, borderRadius: radius.pill, paddingVertical: 2, paddingHorizontal: spacing.sm },
  matchBadgeText: { fontSize: 10, color: colors.primary, fontWeight: "700" },
  title: { fontSize: 15, fontWeight: "800", color: colors.textPrimary, lineHeight: 19, marginTop: 2 },
  author: { fontSize: 11, color: colors.textMuted, marginTop: 2 },
  ratingRow: { flexDirection: "row", alignItems: "center", gap: 4, marginTop: 4 },
  ratingCount: { fontSize: 11, color: colors.textMuted },
  metaLine: { fontSize: 12, color: colors.textSecondary, marginTop: 4 },
});
