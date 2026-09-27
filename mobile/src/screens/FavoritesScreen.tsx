import React from "react";
import { Alert, FlatList, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import type { MainTabsScreenProps } from "../navigation";
import { useFavorites } from "../context/FavoritesContext";
import type { FavoriteRecipe } from "../types";

type Props = MainTabsScreenProps<"Favoriten">;

export default function FavoritesScreen({ navigation }: Props) {
  const { favorites, removeFavorite } = useFavorites();

  function confirmRemove(recipe: FavoriteRecipe) {
    Alert.alert("Rezept entfernen?", `„${recipe.title}" aus den Favoriten entfernen?`, [
      { text: "Abbrechen", style: "cancel" },
      { text: "Entfernen", style: "destructive", onPress: () => removeFavorite(recipe.id) },
    ]);
  }

  return (
    <FlatList
      style={styles.container}
      contentContainerStyle={{ padding: 16, paddingBottom: 32, flexGrow: 1 }}
      data={favorites}
      keyExtractor={(item) => item.id}
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
            <Text style={styles.title}>{item.title}</Text>
            <TouchableOpacity onPress={() => confirmRemove(item)} hitSlop={10}>
              <Text style={styles.removeIcon}>🗑</Text>
            </TouchableOpacity>
          </View>
          <Text style={styles.description}>{item.description}</Text>

          <View style={styles.metaRow}>
            <Text style={styles.metaItem}>⏱ {item.prepTimeMinutes + item.cookTimeMinutes} min</Text>
            <Text style={styles.metaItem}>🍽 {item.servings} Port.</Text>
            <Text style={styles.metaItem}>🔥 {item.nutrition.calories} kcal</Text>
          </View>

          <Text style={styles.ingredientsLabel}>Benötigte Zutaten:</Text>
          <Text style={styles.ingredientsText} numberOfLines={3}>
            {item.ingredients.map((ing) => `${ing.amount} ${ing.name}`).join(" · ")}
          </Text>

          {!!item.missingIngredients.length && (
            <Text style={styles.shopping}>🛒 Einzukaufen: {item.missingIngredients.join(", ")}</Text>
          )}
        </TouchableOpacity>
      )}
    />
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
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
  title: { fontSize: 17, fontWeight: "800", color: "#1b4332", flex: 1, marginRight: 8 },
  removeIcon: { fontSize: 18 },
  description: { fontSize: 13, color: "#40616b", marginTop: 6, lineHeight: 18 },
  metaRow: { flexDirection: "row", flexWrap: "wrap", gap: 12, marginTop: 10 },
  metaItem: { fontSize: 12, color: "#40616b" },
  ingredientsLabel: { fontSize: 12, fontWeight: "700", color: "#1b4332", marginTop: 12 },
  ingredientsText: { fontSize: 12, color: "#40616b", marginTop: 4, lineHeight: 17 },
  shopping: { fontSize: 12, color: "#966b1f", marginTop: 8 },
});
