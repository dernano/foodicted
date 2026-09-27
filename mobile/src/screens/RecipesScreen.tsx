import React from "react";
import { FlatList, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import type { RootStackScreenProps } from "../navigation";
import { useFavorites } from "../context/FavoritesContext";
import { RECIPE_CATEGORY_LABELS, type Recipe } from "../types";

type Props = RootStackScreenProps<"Recipes">;

export default function RecipesScreen({ route, navigation }: Props) {
  const { recipes } = route.params;
  const { isFavorite, toggleFavorite } = useFavorites();

  return (
    <FlatList
      style={styles.container}
      contentContainerStyle={{ padding: 16, paddingBottom: 32 }}
      data={recipes}
      keyExtractor={(item, i) => `${item.title}-${i}`}
      ListEmptyComponent={<Text style={styles.empty}>Keine Rezepte gefunden. Versuch es mit anderen Zutaten.</Text>}
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
            <Text style={styles.description}>{item.description}</Text>
            <View style={styles.metaRow}>
              <Text style={styles.metaItem}>⏱ {item.prepTimeMinutes + item.cookTimeMinutes} min</Text>
              <Text style={styles.metaItem}>🍽 {item.servings} Port.</Text>
              <Text style={styles.metaItem}>🔥 {item.nutrition.calories} kcal</Text>
              <Text style={styles.metaItem}>💪 {item.nutrition.proteinGrams}g Protein</Text>
            </View>
            {!!item.tags.length && (
              <View style={styles.tagRow}>
                {item.tags.slice(0, 4).map((tag) => (
                  <View key={tag} style={styles.tag}>
                    <Text style={styles.tagText}>{tag}</Text>
                  </View>
                ))}
              </View>
            )}
            {!!item.missingIngredients.length && (
              <Text style={styles.missing}>Fehlt noch: {item.missingIngredients.join(", ")}</Text>
            )}
          </TouchableOpacity>
        );
      }}
    />
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  empty: { textAlign: "center", color: "#7a8f83", marginTop: 32 },
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
  tagRow: { flexDirection: "row", flexWrap: "wrap", gap: 6, marginTop: 10 },
  tag: { backgroundColor: "#d8f0dc", borderRadius: 12, paddingVertical: 4, paddingHorizontal: 10 },
  tagText: { fontSize: 11, color: "#1b4332", fontWeight: "600" },
  missing: { fontSize: 12, color: "#966b1f", marginTop: 10 },
});
