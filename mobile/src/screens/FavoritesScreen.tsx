import { Ionicons } from "@expo/vector-icons";
import React, { useMemo, useState } from "react";
import { ActivityIndicator, Alert, FlatList, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import type { MainTabsScreenProps } from "../navigation";
import { useFavorites } from "../context/FavoritesContext";
import { RECIPE_CATEGORY_LABELS, type FavoriteRecipe, type RecipeCategory } from "../types";

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
        <ActivityIndicator color="#2f9e44" />
      </View>
    );
  }

  return (
    <FlatList
      style={styles.container}
      contentContainerStyle={{ padding: 16, paddingBottom: 32, flexGrow: 1 }}
      data={filtered}
      keyExtractor={(item) => item.id}
      ListHeaderComponent={
        <View>
          {shared && (
            <View style={styles.sharedBanner}>
              <Ionicons name="people" size={15} color="#2f9e44" />
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
          <Text style={styles.emptyEmoji}>💚</Text>
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
        >
          <View style={styles.cardHeader}>
            <View style={{ flex: 1, marginRight: 8 }}>
              <Text style={styles.categoryBadge}>{RECIPE_CATEGORY_LABELS[item.category]}</Text>
              <Text style={styles.title}>{item.title}</Text>
            </View>
            <TouchableOpacity onPress={() => confirmRemove(item)} hitSlop={10}>
              <Text style={styles.removeIcon}>🗑</Text>
            </TouchableOpacity>
          </View>
          <Text style={styles.description}>{item.description}</Text>

          <View style={styles.metaRow}>
            <Text style={styles.metaItem}>
              ⏱ {item.prepTimeMinutes + item.cookTimeMinutes ? `${item.prepTimeMinutes + item.cookTimeMinutes} min` : "-"}
            </Text>
            <Text style={styles.metaItem}>🍽 {item.servings} Port.</Text>
            {!!item.nutrition.calories && <Text style={styles.metaItem}>🔥 {item.nutrition.calories} kcal</Text>}
          </View>

          <Text style={styles.ingredientsLabel}>Benötigte Zutaten:</Text>
          <Text style={styles.ingredientsText} numberOfLines={3}>
            {item.ingredients.map((ing) => `${ing.amount} ${ing.name}`).join(" · ")}
          </Text>

          {!!item.missingIngredients.length && (
            <Text style={styles.shopping}>🛒 Einzukaufen: {item.missingIngredients.join(", ")}</Text>
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
  container: { flex: 1, backgroundColor: "#fff" },
  loadingContainer: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: "#fff" },
  sharedBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "#eaf7ec",
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 14,
    marginBottom: 14,
  },
  sharedBannerText: { fontSize: 12, color: "#1b4332", fontWeight: "600" },
  filterRow: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 14 },
  filterChip: {
    borderWidth: 1,
    borderColor: "#c9e6cf",
    borderRadius: 20,
    paddingVertical: 7,
    paddingHorizontal: 13,
    backgroundColor: "#fff",
  },
  filterChipSelected: { backgroundColor: "#2f9e44", borderColor: "#2f9e44" },
  filterChipText: { color: "#1b4332", fontSize: 12, fontWeight: "600" },
  filterChipTextSelected: { color: "#fff" },
  tagFilterChip: {
    borderWidth: 1,
    borderColor: "#d8e6da",
    borderRadius: 20,
    paddingVertical: 6,
    paddingHorizontal: 12,
    backgroundColor: "#fafffb",
  },
  tagFilterChipSelected: { backgroundColor: "#1b4332", borderColor: "#1b4332" },
  tagFilterChipText: { color: "#5c7a6a", fontSize: 11, fontWeight: "600" },
  tagFilterChipTextSelected: { color: "#fff" },
  emptyState: { flex: 1, alignItems: "center", justifyContent: "center", paddingTop: 80, paddingHorizontal: 32 },
  emptyEmoji: { fontSize: 48, marginBottom: 16 },
  emptyTitle: { fontSize: 17, fontWeight: "700", color: "#1b4332", marginBottom: 8 },
  emptyText: { fontSize: 14, color: "#7a8f83", textAlign: "center", lineHeight: 20 },
  card: {
    backgroundColor: "#f6fbf6",
    borderRadius: 14,
    padding: 16,
    marginBottom: 14,
    shadowColor: "#000",
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 1,
  },
  cardHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" },
  categoryBadge: { fontSize: 11, color: "#2f9e44", fontWeight: "700", marginBottom: 2, textTransform: "uppercase" },
  title: { fontSize: 17, fontWeight: "800", color: "#1b4332" },
  removeIcon: { fontSize: 18 },
  description: { fontSize: 13, color: "#40616b", marginTop: 6, lineHeight: 18 },
  metaRow: { flexDirection: "row", flexWrap: "wrap", gap: 12, marginTop: 10 },
  metaItem: { fontSize: 12, color: "#40616b" },
  ingredientsLabel: { fontSize: 12, fontWeight: "700", color: "#1b4332", marginTop: 12 },
  ingredientsText: { fontSize: 12, color: "#40616b", marginTop: 4, lineHeight: 17 },
  shopping: { fontSize: 12, color: "#966b1f", marginTop: 8 },
  tagRow: { flexDirection: "row", flexWrap: "wrap", gap: 6, marginTop: 10 },
  tagPill: { backgroundColor: "#d8f0dc", borderRadius: 12, paddingVertical: 4, paddingHorizontal: 10 },
  tagPillText: { fontSize: 11, color: "#1b4332", fontWeight: "600" },
});
