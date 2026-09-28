import { Ionicons } from "@expo/vector-icons";
import React, { useMemo } from "react";
import { Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import type { RootStackScreenProps } from "../navigation";
import { useShoppingList } from "../context/ShoppingListContext";
import { ingredientPresent } from "../utils/ingredientMatch";
import type { RecipeIngredient } from "../types";
import { colors, radius, shadow, spacing, type as t } from "../constants/theme";

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
    <ScrollView style={styles.container} contentContainerStyle={{ padding: spacing.xl, paddingBottom: 48 }} showsVerticalScrollIndicator={false}>
      <Text style={styles.title}>{recipe.title}</Text>
      <Text style={styles.summary}>
        {presentCount} von {checked.length} Zutaten auf dem Foto erkannt
      </Text>

      <View style={styles.card}>
        {checked.map(({ ingredient, present }, i) => (
          <View key={i} style={[styles.row, i === 0 && styles.rowFirst]}>
            <Ionicons
              name={present ? "checkmark-circle" : "cart"}
              size={20}
              color={present ? colors.primary : colors.attention}
            />
            <Text style={styles.rowText}>
              {ingredient.amount} {ingredient.name}
            </Text>
          </View>
        ))}
      </View>

      <Text style={styles.disclaimer}>
        Der Abgleich ist eine grobe Einschätzung per Foto - im Zweifel selbst nachschauen.
      </Text>

      {!!missing.length && (
        <TouchableOpacity style={styles.addButton} onPress={addMissingToShoppingList} activeOpacity={0.85}>
          <Ionicons name="cart-outline" size={17} color={colors.textOnDark} />
          <Text style={styles.addButtonText}>Fehlende Zutaten zur Einkaufsliste hinzufügen</Text>
        </TouchableOpacity>
      )}

      <TouchableOpacity
        style={styles.doneButton}
        onPress={() => navigation.replace("RecipeDetail", { recipe })}
        activeOpacity={0.85}
      >
        <Text style={styles.doneButtonText}>Zurück zum Rezept</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  title: { ...t.title, fontSize: 20, color: colors.textPrimary },
  summary: { fontSize: 14, color: colors.textSecondary, marginTop: spacing.xs, marginBottom: spacing.xl },
  card: { backgroundColor: colors.surface, borderRadius: radius.card, padding: spacing.lg, ...shadow.soft, marginBottom: spacing.lg },
  row: { flexDirection: "row", alignItems: "center", gap: spacing.md, paddingVertical: spacing.sm + 2 },
  rowFirst: { paddingTop: 0 },
  rowText: { fontSize: 15, color: colors.textPrimary, flex: 1 },
  disclaimer: { fontSize: 12, color: colors.textMuted, fontStyle: "italic", marginBottom: spacing.xl },
  addButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
    backgroundColor: colors.attention,
    borderRadius: radius.button,
    paddingVertical: spacing.lg,
    marginBottom: spacing.md,
  },
  addButtonText: { color: colors.textOnDark, fontSize: 15, fontWeight: "700" },
  doneButton: {
    backgroundColor: colors.primary,
    borderRadius: radius.button,
    paddingVertical: spacing.lg,
    alignItems: "center",
    ...shadow.button,
  },
  doneButtonText: { color: colors.textOnDark, fontSize: 15, fontWeight: "700" },
});
