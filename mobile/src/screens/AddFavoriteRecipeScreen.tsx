import { Ionicons } from "@expo/vector-icons";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import type { RootStackScreenProps } from "../navigation";
import { refineRecipe } from "../api/client";
import TagEditor from "../components/TagEditor";
import { useFavorites } from "../context/FavoritesContext";
import { usePreferences } from "../context/PreferencesContext";
import { RECIPE_CATEGORIES, RECIPE_CATEGORY_LABELS, type Recipe, type RecipeCategory } from "../types";
import { colors, radius, shadow, spacing, type as t } from "../constants/theme";

type Props = RootStackScreenProps<"AddFavoriteRecipe">;

export default function AddFavoriteRecipeScreen({ navigation }: Props) {
  const { preferences } = usePreferences();
  const { toggleFavorite } = useFavorites();

  const [title, setTitle] = useState("");
  const [category, setCategory] = useState<RecipeCategory>("hauptgericht");
  const [tags, setTags] = useState<string[]>([]);
  const [ingredientLines, setIngredientLines] = useState<string[]>([]);
  const [newIngredient, setNewIngredient] = useState("");
  const [preparationNotes, setPreparationNotes] = useState("");
  const [loading, setLoading] = useState(false);

  function addIngredient() {
    const line = newIngredient.trim();
    if (!line) return;
    setIngredientLines((prev) => [...prev, line]);
    setNewIngredient("");
  }

  function removeIngredient(index: number) {
    setIngredientLines((prev) => prev.filter((_, i) => i !== index));
  }

  function validate(): boolean {
    if (!title.trim()) {
      Alert.alert("Titel fehlt", "Gib deinem Rezept einen Namen.");
      return false;
    }
    if (ingredientLines.length === 0) {
      Alert.alert("Zutaten fehlen", "Füge mindestens eine Zutat hinzu.");
      return false;
    }
    return true;
  }

  async function handleSubmitWithAi() {
    if (!validate()) return;
    setLoading(true);
    try {
      const recipe = await refineRecipe({
        title: title.trim(),
        ingredientLines,
        preparationNotes: preparationNotes.trim(),
        servings: preferences.servings,
      });
      const mergedTags = Array.from(
        new Set(
          [...recipe.tags, ...tags]
            .map((t) => t.trim())
            .filter(Boolean)
        )
      );
      const categorized = { ...recipe, category, tags: mergedTags };
      toggleFavorite(categorized);
      navigation.replace("RecipeDetail", { recipe: categorized });
    } catch (err) {
      Alert.alert(
        "Rezept konnte nicht erstellt werden",
        err instanceof Error ? err.message : "Unbekannter Fehler."
      );
    } finally {
      setLoading(false);
    }
  }

  function handleSaveDirectly() {
    if (!validate()) return;
    const notes = preparationNotes.trim();
    const instructions = notes
      ? notes
          .split(/\r?\n+/)
          .map((s) => s.trim())
          .filter(Boolean)
      : ["Keine detaillierte Zubereitung hinterlegt."];

    const recipe: Recipe = {
      title: title.trim(),
      description: notes || "Eigenes Rezept ohne KI-Unterstützung angelegt.",
      category,
      prepTimeMinutes: 0,
      cookTimeMinutes: 0,
      servings: preferences.servings ?? 2,
      difficulty: "medium",
      tags,
      ingredients: ingredientLines.map((line) => ({ name: line, amount: "", fromFridge: false })),
      missingIngredients: [],
      instructions,
      nutrition: { calories: 0, proteinGrams: 0, carbsGrams: 0, fatGrams: 0 },
    };
    toggleFavorite(recipe);
    navigation.replace("RecipeDetail", { recipe });
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={Platform.OS === "ios" ? 90 : 0}
    >
      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 48 }} keyboardShouldPersistTaps="handled">
        <Text style={styles.intro}>
          Trag dein eigenes Rezept ein - Name, Zutaten und kurz wie es zubereitet wird. Optional kannst du die KI
          daraus ein vollständiges Rezept mit Anleitung und Nährwerten machen lassen. Gespeichert wird direkt in
          deinen Favoriten.
        </Text>

        <Text style={styles.label}>Name des Rezepts</Text>
        <TextInput
          style={styles.input}
          placeholder="z. B. Omas Kartoffelsalat"
          value={title}
          onChangeText={setTitle}
        />

        <Text style={styles.label}>Kategorie</Text>
        <View style={styles.chipRow}>
          {RECIPE_CATEGORIES.map((c) => (
            <TouchableOpacity
              key={c}
              style={[styles.chip, category === c && styles.chipSelected]}
              onPress={() => setCategory(c)}
            >
              <Text style={[styles.chipText, category === c && styles.chipTextSelected]}>
                {RECIPE_CATEGORY_LABELS[c]}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.label}>Tags (optional)</Text>
        <TagEditor tags={tags} onChange={setTags} />

        <Text style={[styles.label, { marginTop: 18 }]}>Zutaten</Text>
        {ingredientLines.map((line, index) => (
          <View key={index} style={styles.ingredientRow}>
            <Text style={styles.ingredientText}>{line}</Text>
            <TouchableOpacity onPress={() => removeIngredient(index)} hitSlop={10}>
              <Ionicons name="close" size={16} color={colors.danger} />
            </TouchableOpacity>
          </View>
        ))}
        <View style={styles.addRow}>
          <TextInput
            style={styles.addInput}
            placeholder="z. B. 500g Kartoffeln"
            placeholderTextColor={colors.textMuted}
            value={newIngredient}
            onChangeText={setNewIngredient}
            onSubmitEditing={addIngredient}
          />
          <TouchableOpacity style={styles.addButton} onPress={addIngredient} activeOpacity={0.8}>
            <Ionicons name="add" size={24} color={colors.textOnDark} />
          </TouchableOpacity>
        </View>

        <Text style={styles.label}>Zubereitung (kurz)</Text>
        <TextInput
          style={[styles.input, styles.multiline]}
          placeholder="z. B. Kartoffeln kochen, würfeln, mit Zwiebeln, Essig und Öl mischen ..."
          value={preparationNotes}
          onChangeText={setPreparationNotes}
          multiline
        />

        <TouchableOpacity
          style={[styles.submitButton, loading && styles.submitButtonDisabled]}
          onPress={handleSubmitWithAi}
          disabled={loading}
          activeOpacity={0.85}
        >
          {loading ? (
            <ActivityIndicator color={colors.textOnDark} />
          ) : (
            <>
              <Ionicons name="sparkles" size={16} color={colors.textOnDark} />
              <Text style={styles.submitButtonText}>Mit KI vervollständigen & speichern</Text>
            </>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.plainButton, loading && styles.submitButtonDisabled]}
          onPress={handleSaveDirectly}
          disabled={loading}
        >
          <Text style={styles.plainButtonText}>Ohne KI direkt so speichern</Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  intro: { fontSize: 13, color: colors.textSecondary, lineHeight: 19, marginBottom: spacing.xl },
  label: { ...t.bodyStrong, fontSize: 14, color: colors.textPrimary, marginBottom: spacing.sm, marginTop: spacing.xs },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.control,
    paddingHorizontal: spacing.md + 2,
    paddingVertical: spacing.md,
    fontSize: 14,
    color: colors.textPrimary,
    backgroundColor: colors.surface,
    marginBottom: spacing.xl,
  },
  multiline: { minHeight: 90, textAlignVertical: "top" },
  chipRow: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm, marginBottom: spacing.xl },
  chip: {
    borderRadius: radius.pill,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md + 2,
    backgroundColor: colors.chipInactiveBg,
  },
  chipSelected: { backgroundColor: colors.primary },
  chipText: { color: colors.chipInactiveText, fontSize: 13, fontWeight: "600" },
  chipTextSelected: { color: colors.textOnDark },
  ingredientRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: colors.surface,
    borderRadius: radius.control,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md + 2,
    marginBottom: spacing.sm,
  },
  ingredientText: { fontSize: 14, color: colors.textPrimary, flex: 1 },
  addRow: { flexDirection: "row", gap: spacing.sm, marginBottom: spacing.xl },
  addInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.control,
    paddingHorizontal: spacing.md + 2,
    paddingVertical: spacing.md,
    fontSize: 14,
    color: colors.textPrimary,
    backgroundColor: colors.surface,
  },
  addButton: {
    width: 44,
    height: 44,
    borderRadius: radius.control,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  submitButton: {
    flexDirection: "row",
    gap: spacing.sm,
    backgroundColor: colors.primary,
    borderRadius: radius.button,
    paddingVertical: spacing.lg,
    alignItems: "center",
    justifyContent: "center",
    marginTop: spacing.md,
    ...shadow.button,
  },
  submitButtonDisabled: { opacity: 0.7 },
  submitButtonText: { color: colors.textOnDark, fontSize: 15, fontWeight: "700" },
  plainButton: { paddingVertical: spacing.md + 2, alignItems: "center", marginTop: spacing.xs },
  plainButtonText: { color: colors.textSecondary, fontSize: 14, fontWeight: "600" },
});
