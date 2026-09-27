import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { Alert, SectionList, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import type { RootStackScreenProps } from "../navigation";
import { useFavorites } from "../context/FavoritesContext";
import { useShoppingList } from "../context/ShoppingListContext";
import { RECIPE_CATEGORY_LABELS, type Recipe } from "../types";

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
      contentContainerStyle={{ padding: 16, paddingBottom: 32 }}
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
          >
            <View style={styles.cardHeader}>
              <View style={{ flex: 1, marginRight: 8 }}>
                <Text style={[styles.categoryBadge, extra && styles.categoryBadgeExtra]}>
                  {RECIPE_CATEGORY_LABELS[item.category]}
                </Text>
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
            {extra && !!item.missingIngredients.length && (
              <View style={styles.missingBox}>
                <Text style={styles.missing}>🛒 Zusätzlich benötigt: {item.missingIngredients.join(", ")}</Text>
                <TouchableOpacity
                  style={styles.missingButton}
                  onPress={() => addMissingToShoppingList(item)}
                  hitSlop={8}
                >
                  <Ionicons name="cart-outline" size={14} color="#fff" />
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

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  empty: { textAlign: "center", color: "#7a8f83", marginTop: 32 },
  sectionHeader: { marginTop: 4, marginBottom: 12 },
  sectionHeaderExtra: { marginTop: 20 },
  sectionTitle: { fontSize: 15, fontWeight: "800", color: "#1b4332" },
  sectionTitleExtra: { color: "#c2670c" },
  sectionSubtitle: { fontSize: 12, color: "#7a8f83", marginTop: 3, lineHeight: 17 },
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
  cardExtra: {
    backgroundColor: "#fff8ee",
    borderWidth: 1,
    borderColor: "#f6d9a8",
  },
  cardHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" },
  categoryBadge: { fontSize: 11, color: "#2f9e44", fontWeight: "700", marginBottom: 2, textTransform: "uppercase" },
  categoryBadgeExtra: { color: "#c2670c" },
  title: { fontSize: 17, fontWeight: "800", color: "#1b4332" },
  heart: { fontSize: 20 },
  description: { fontSize: 13, color: "#40616b", marginTop: 6, lineHeight: 18 },
  metaRow: { flexDirection: "row", flexWrap: "wrap", gap: 12, marginTop: 10 },
  metaItem: { fontSize: 12, color: "#40616b" },
  tagRow: { flexDirection: "row", flexWrap: "wrap", gap: 6, marginTop: 10 },
  tag: { backgroundColor: "#d8f0dc", borderRadius: 12, paddingVertical: 4, paddingHorizontal: 10 },
  tagText: { fontSize: 11, color: "#1b4332", fontWeight: "600" },
  missingBox: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#f6d9a8",
  },
  missing: { fontSize: 12, color: "#966b1f", lineHeight: 17 },
  missingButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    alignSelf: "flex-start",
    backgroundColor: "#e0951a",
    borderRadius: 10,
    paddingVertical: 8,
    paddingHorizontal: 12,
    marginTop: 10,
  },
  missingButtonText: { color: "#fff", fontSize: 12, fontWeight: "700" },
});
