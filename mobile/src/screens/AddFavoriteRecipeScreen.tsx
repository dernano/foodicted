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
      ingredients: ingredientLines.map((line) => ({ name: line, amount: "", fromFridge: true })),
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
              <Text style={styles.removeIcon}>✕</Text>
            </TouchableOpacity>
          </View>
        ))}
        <View style={styles.addRow}>
          <TextInput
            style={styles.addInput}
            placeholder="z. B. 500g Kartoffeln"
            value={newIngredient}
            onChangeText={setNewIngredient}
            onSubmitEditing={addIngredient}
          />
          <TouchableOpacity style={styles.addButton} onPress={addIngredient}>
            <Text style={styles.addButtonText}>+</Text>
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
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.submitButtonText}>✨ Mit KI vervollständigen & speichern</Text>
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
  container: { flex: 1, backgroundColor: "#fff" },
  intro: { fontSize: 13, color: "#5c7a6a", lineHeight: 19, marginBottom: 20 },
  label: { fontSize: 14, fontWeight: "700", color: "#1b4332", marginBottom: 8, marginTop: 4 },
  input: {
    borderWidth: 1,
    borderColor: "#d8e6da",
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 14,
    color: "#1b4332",
    backgroundColor: "#fafffb",
    marginBottom: 18,
  },
  multiline: { minHeight: 90, textAlignVertical: "top" },
  chipRow: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 18 },
  chip: {
    borderWidth: 1,
    borderColor: "#c9e6cf",
    borderRadius: 20,
    paddingVertical: 8,
    paddingHorizontal: 14,
    backgroundColor: "#fafffb",
  },
  chipSelected: { backgroundColor: "#2f9e44", borderColor: "#2f9e44" },
  chipText: { color: "#1b4332", fontSize: 13, fontWeight: "600" },
  chipTextSelected: { color: "#fff" },
  ingredientRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#f6fbf6",
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 14,
    marginBottom: 8,
  },
  ingredientText: { fontSize: 14, color: "#1b4332", flex: 1 },
  removeIcon: { color: "#c92a2a", fontSize: 15, fontWeight: "700", marginLeft: 8 },
  addRow: { flexDirection: "row", gap: 8, marginBottom: 18 },
  addInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#d8e6da",
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 14,
    backgroundColor: "#fafffb",
  },
  addButton: {
    width: 44,
    height: 44,
    borderRadius: 10,
    backgroundColor: "#2f9e44",
    alignItems: "center",
    justifyContent: "center",
  },
  addButtonText: { color: "#fff", fontSize: 22, fontWeight: "700", lineHeight: 24 },
  submitButton: {
    backgroundColor: "#2f9e44",
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: "center",
    marginTop: 12,
    shadowColor: "#2f9e44",
    shadowOpacity: 0.25,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  submitButtonDisabled: { opacity: 0.7 },
  submitButtonText: { color: "#fff", fontSize: 15, fontWeight: "700" },
  plainButton: { paddingVertical: 14, alignItems: "center", marginTop: 4 },
  plainButtonText: { color: "#5c7a6a", fontSize: 14, fontWeight: "600" },
});
