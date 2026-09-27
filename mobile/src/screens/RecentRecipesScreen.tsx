import React from "react";
import { FlatList, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import type { RootStackScreenProps } from "../navigation";
import { useFavorites } from "../context/FavoritesContext";
import { useRecentRecipes } from "../context/RecentRecipesContext";
import { RECIPE_CATEGORY_LABELS, type Recipe } from "../types";

type Props = RootStackScreenProps<"RecentRecipes">;

export default function RecentRecipesScreen({ navigation }: Props) {
  const { recent } = useRecentRecipes();
  const { isFavorite, toggleFavorite } = useFavorites();

  return (
    <FlatList
      style={styles.container}
      contentContainerStyle={{ padding: 16, paddingBottom: 32 }}
      data={recent}
      keyExtractor={(item, i) => `${item.title}-${i}`}
      ListEmptyComponent={
        <View style={styles.emptyState}>
          <Text style={styles.emptyEmoji}>🕘</Text>
          <Text style={styles.emptyTitle}>Noch keine Rezepte angesehen</Text>
          <Text style={styles.emptyText}>Rezepte, die du dir ansiehst, landen hier - die letzten 20.</Text>
        </View>
      }
      renderItem={({ item }: { item: Recipe }) => {
        const favorite = isFavorite(item);
        return (
          <TouchableOpacity
            style={styles.card}
            onPress={() => navigation.navigate("RecipeDetail", { recipe: item })}
          >
            <View style={styles.cardHeader}>
              <View style={{ flex: 1, marginRight: 8 }}>
                <Text style={styles.categoryBadge}>{RECIPE_CATEGORY_LABELS[item.category]}</Text>
                <Text style={styles.title}>{item.title}</Text>
              </View>
              <TouchableOpacity onPress={() => toggleFavorite(item)} hitSlop={10}>
                <Text style={styles.heart}>{favorite ? "❤️" : "🤍"}</Text>
              </TouchableOpacity>
            </View>
            <Text style={styles.description} numberOfLines={2}>
              {item.description}
            </Text>
            <View style={styles.metaRow}>
              <Text style={styles.metaItem}>⏱ {item.prepTimeMinutes + item.cookTimeMinutes} min</Text>
              <Text style={styles.metaItem}>🍽 {item.servings} Port.</Text>
              {!!item.nutrition.calories && <Text style={styles.metaItem}>🔥 {item.nutrition.calories} kcal</Text>}
            </View>
          </TouchableOpacity>
        );
      }}
    />
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  emptyState: { alignItems: "center", justifyContent: "center", paddingTop: 80, paddingHorizontal: 32 },
  emptyEmoji: { fontSize: 44, marginBottom: 14 },
  emptyTitle: { fontSize: 16, fontWeight: "700", color: "#1b4332", marginBottom: 6 },
  emptyText: { fontSize: 13, color: "#7a8f83", textAlign: "center", lineHeight: 19 },
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
  heart: { fontSize: 20 },
  description: { fontSize: 13, color: "#40616b", marginTop: 6, lineHeight: 18 },
  metaRow: { flexDirection: "row", flexWrap: "wrap", gap: 12, marginTop: 10 },
  metaItem: { fontSize: 12, color: "#40616b" },
});
