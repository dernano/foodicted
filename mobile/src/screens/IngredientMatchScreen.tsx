import { Ionicons } from "@expo/vector-icons";
import React, { useMemo } from "react";
import { Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import type { RootStackScreenProps } from "../navigation";
import { useShoppingList } from "../context/ShoppingListContext";
import { ingredientPresent } from "../utils/ingredientMatch";
import type { RecipeIngredient } from "../types";

type Props = RootStackScreenProps<"IngredientMatch">;

export default function IngredientMatchScreen({ route, navigation }: Props) {
  const { recipe, detectedItems } = route.params;
  const { addItems } = useShoppingList();

  const detectedNames = useMemo(() => detectedItems.map((i) => i.name), [detectedItems]);

  const checked: { ingredient: RecipeIngredient; present: boolean }[] = useMemo(
    () =>
      recipe.ingredients.map((ingredient) => ({
        ingredient,
        present: ingredientPresent(ingredient.name, detectedNames),
      })),
    [recipe.ingredients, detectedNames]
  );

  const missing = checked.filter((c) => !c.present);
  const presentCount = checked.length - missing.length;

  function addMissingToShoppingList() {
    addItems(
      missing.map(({ ingredient }) => `${ingredient.amount} ${ingredient.name}`.trim()),
      recipe.title
    );
    Alert.alert("Hinzugefügt", "Die fehlenden Zutaten wurden zu deiner Einkaufsliste hinzugefügt.");
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ padding: 20, paddingBottom: 48 }}>
      <Text style={styles.title}>{recipe.title}</Text>
      <Text style={styles.summary}>
        {presentCount} von {checked.length} Zutaten auf dem Foto erkannt
      </Text>

      {checked.map(({ ingredient, present }, i) => (
        <View key={i} style={styles.row}>
          <Ionicons
            name={present ? "checkmark-circle" : "cart"}
            size={20}
            color={present ? "#2f9e44" : "#c2670c"}
          />
          <Text style={styles.rowText}>
            {ingredient.amount} {ingredient.name}
          </Text>
        </View>
      ))}

      <Text style={styles.disclaimer}>
        Der Abgleich ist eine grobe Einschätzung per Foto - im Zweifel selbst nachschauen.
      </Text>

      {!!missing.length && (
        <TouchableOpacity style={styles.addButton} onPress={addMissingToShoppingList}>
          <Ionicons name="cart-outline" size={17} color="#fff" />
          <Text style={styles.addButtonText}>Fehlende Zutaten zur Einkaufsliste hinzufügen</Text>
        </TouchableOpacity>
      )}

      <TouchableOpacity
        style={styles.doneButton}
        onPress={() => navigation.replace("RecipeDetail", { recipe })}
      >
        <Text style={styles.doneButtonText}>Zurück zum Rezept</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  title: { fontSize: 20, fontWeight: "800", color: "#1b4332" },
  summary: { fontSize: 14, color: "#40616b", marginTop: 6, marginBottom: 20 },
  row: { flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 12 },
  rowText: { fontSize: 15, color: "#1b4332", flex: 1 },
  disclaimer: { fontSize: 12, color: "#9db5a6", fontStyle: "italic", marginTop: 8, marginBottom: 24 },
  addButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: "#c2670c",
    borderRadius: 14,
    paddingVertical: 16,
    marginBottom: 12,
  },
  addButtonText: { color: "#fff", fontSize: 15, fontWeight: "700" },
  doneButton: {
    backgroundColor: "#2f9e44",
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: "center",
  },
  doneButtonText: { color: "#fff", fontSize: 15, fontWeight: "700" },
});
