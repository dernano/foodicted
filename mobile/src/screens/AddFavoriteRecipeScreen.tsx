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
import { useFavorites } from "../context/FavoritesContext";
import { usePreferences } from "../context/PreferencesContext";

type Props = RootStackScreenProps<"AddFavoriteRecipe">;

export default function AddFavoriteRecipeScreen({ navigation }: Props) {
  const { preferences } = usePreferences();
  const { toggleFavorite } = useFavorites();

  const [title, setTitle] = useState("");
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

  async function handleSubmit() {
    if (!title.trim()) {
      Alert.alert("Titel fehlt", "Gib deinem Rezept einen Namen.");
      return;
    }
    if (ingredientLines.length === 0) {
      Alert.alert("Zutaten fehlen", "Füge mindestens eine Zutat hinzu.");
      return;
    }

    setLoading(true);
    try {
      const recipe = await refineRecipe({
        title: title.trim(),
        ingredientLines,
        preparationNotes: preparationNotes.trim(),
        servings: preferences.servings,
      });
      toggleFavorite(recipe);
      navigation.replace("RecipeDetail", { recipe });
    } catch (err) {
      Alert.alert(
        "Rezept konnte nicht erstellt werden",
        err instanceof Error ? err.message : "Unbekannter Fehler."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={Platform.OS === "ios" ? 90 : 0}
    >
      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 48 }} keyboardShouldPersistTaps="handled">
        <Text style={styles.intro}>
          Trag dein eigenes Rezept ein - Name, Zutaten und kurz wie es zubereitet wird. Die KI macht daraus ein
          vollständiges Rezept mit Anleitung und Nährwerten und speichert es direkt in deinen Favoriten.
        </Text>

        <Text style={styles.label}>Name des Rezepts</Text>
        <TextInput
          style={styles.input}
          placeholder="z. B. Omas Kartoffelsalat"
          value={title}
          onChangeText={setTitle}
        />

        <Text style={styles.label}>Zutaten</Text>
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
          onPress={handleSubmit}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.submitButtonText}>✨ Mit KI vervollständigen & speichern</Text>
          )}
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
});
