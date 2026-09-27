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
import { useFavorites } from "../context/FavoritesContext";
import type { Recipe } from "../types";

type Props = RootStackScreenProps<"EditFavoriteRecipe">;

const DIFFICULTIES: { value: Recipe["difficulty"]; label: string }[] = [
  { value: "easy", label: "Einfach" },
  { value: "medium", label: "Mittel" },
  { value: "hard", label: "Anspruchsvoll" },
];

function EditableList({
  lines,
  onChange,
  placeholder,
}: {
  lines: string[];
  onChange: (next: string[]) => void;
  placeholder: string;
}) {
  const [draft, setDraft] = useState("");

  function updateLine(index: number, value: string) {
    const next = [...lines];
    next[index] = value;
    onChange(next);
  }

  function removeLine(index: number) {
    onChange(lines.filter((_, i) => i !== index));
  }

  function addLine() {
    const trimmed = draft.trim();
    if (!trimmed) return;
    onChange([...lines, trimmed]);
    setDraft("");
  }

  return (
    <View>
      {lines.map((line, i) => (
        <View key={i} style={styles.lineRow}>
          <TextInput style={styles.lineInput} value={line} onChangeText={(v) => updateLine(i, v)} multiline />
          <TouchableOpacity onPress={() => removeLine(i)} hitSlop={10} style={styles.removeLineButton}>
            <Ionicons name="close-circle" size={20} color="#c92a2a" />
          </TouchableOpacity>
        </View>
      ))}
      <View style={styles.addLineRow}>
        <TextInput
          style={styles.addLineInput}
          placeholder={placeholder}
          value={draft}
          onChangeText={setDraft}
          onSubmitEditing={addLine}
        />
        <TouchableOpacity style={styles.addLineButton} onPress={addLine}>
          <Text style={styles.addLineButtonText}>+</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

export default function EditFavoriteRecipeScreen({ route, navigation }: Props) {
  const { recipe } = route.params;
  const { updateFavorite } = useFavorites();

  const [title, setTitle] = useState(recipe.title);
  const [description, setDescription] = useState(recipe.description);
  const [servings, setServings] = useState(recipe.servings);
  const [prepTimeMinutes, setPrepTimeMinutes] = useState(String(recipe.prepTimeMinutes || ""));
  const [cookTimeMinutes, setCookTimeMinutes] = useState(String(recipe.cookTimeMinutes || ""));
  const [difficulty, setDifficulty] = useState<Recipe["difficulty"]>(recipe.difficulty);
  const [ingredientLines, setIngredientLines] = useState<string[]>(
    recipe.ingredients.map((ing) => `${ing.amount} ${ing.name}`.trim())
  );
  const [instructionLines, setInstructionLines] = useState<string[]>(recipe.instructions);
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    if (!title.trim()) {
      Alert.alert("Titel fehlt", "Gib dem Rezept einen Namen.");
      return;
    }
    if (!ingredientLines.length) {
      Alert.alert("Zutaten fehlen", "Mindestens eine Zutat wird benötigt.");
      return;
    }

    const updated: Recipe = {
      ...recipe,
      title: title.trim(),
      description: description.trim(),
      servings: servings || 1,
      prepTimeMinutes: Number(prepTimeMinutes) || 0,
      cookTimeMinutes: Number(cookTimeMinutes) || 0,
      difficulty,
      ingredients: ingredientLines.map((line) => ({ name: line, amount: "", fromFridge: true })),
      missingIngredients: recipe.missingIngredients,
      instructions: instructionLines.length ? instructionLines : ["Keine detaillierte Zubereitung hinterlegt."],
    };

    setSaving(true);
    try {
      await updateFavorite(recipe.id, updated);
      navigation.replace("RecipeDetail", { recipe: updated });
    } catch (err) {
      Alert.alert("Speichern fehlgeschlagen", err instanceof Error ? err.message : "Unbekannter Fehler.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={Platform.OS === "ios" ? 90 : 0}
    >
      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 48 }} keyboardShouldPersistTaps="handled">
        <Text style={styles.label}>Name</Text>
        <TextInput style={styles.input} value={title} onChangeText={setTitle} />

        <Text style={styles.label}>Beschreibung</Text>
        <TextInput
          style={[styles.input, styles.multiline]}
          value={description}
          onChangeText={setDescription}
          multiline
        />

        <Text style={styles.label}>Portionen</Text>
        <View style={styles.stepperRow}>
          <TouchableOpacity style={styles.stepperButton} onPress={() => setServings((s) => Math.max(1, s - 1))}>
            <Text style={styles.stepperButtonText}>−</Text>
          </TouchableOpacity>
          <Text style={styles.stepperValue}>{servings}</Text>
          <TouchableOpacity style={styles.stepperButton} onPress={() => setServings((s) => Math.min(20, s + 1))}>
            <Text style={styles.stepperButtonText}>+</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.timeRow}>
          <View style={{ flex: 1 }}>
            <Text style={styles.label}>Vorbereitung (min)</Text>
            <TextInput
              style={styles.input}
              keyboardType="number-pad"
              value={prepTimeMinutes}
              onChangeText={setPrepTimeMinutes}
            />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.label}>Kochzeit (min)</Text>
            <TextInput
              style={styles.input}
              keyboardType="number-pad"
              value={cookTimeMinutes}
              onChangeText={setCookTimeMinutes}
            />
          </View>
        </View>

        <Text style={styles.label}>Schwierigkeit</Text>
        <View style={styles.chipRow}>
          {DIFFICULTIES.map((d) => (
            <TouchableOpacity
              key={d.value}
              style={[styles.chip, difficulty === d.value && styles.chipSelected]}
              onPress={() => setDifficulty(d.value)}
            >
              <Text style={[styles.chipText, difficulty === d.value && styles.chipTextSelected]}>{d.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.label}>Zutaten</Text>
        <EditableList lines={ingredientLines} onChange={setIngredientLines} placeholder="Neue Zutat hinzufügen" />

        <Text style={styles.label}>Zubereitung</Text>
        <EditableList lines={instructionLines} onChange={setInstructionLines} placeholder="Neuen Schritt hinzufügen" />

        <TouchableOpacity style={[styles.saveButton, saving && styles.saveButtonDisabled]} onPress={handleSave} disabled={saving}>
          {saving ? <ActivityIndicator color="#fff" /> : <Text style={styles.saveButtonText}>Änderungen speichern</Text>}
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  label: { fontSize: 14, fontWeight: "700", color: "#1b4332", marginBottom: 8, marginTop: 18 },
  input: {
    borderWidth: 1,
    borderColor: "#d8e6da",
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 14,
    color: "#1b4332",
    backgroundColor: "#fafffb",
  },
  multiline: { minHeight: 70, textAlignVertical: "top" },
  stepperRow: { flexDirection: "row", alignItems: "center", gap: 20 },
  stepperButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: "#2f9e44",
    alignItems: "center",
    justifyContent: "center",
  },
  stepperButtonText: { color: "#fff", fontSize: 20, fontWeight: "700", lineHeight: 22 },
  stepperValue: { fontSize: 17, fontWeight: "700", color: "#1b4332", minWidth: 24, textAlign: "center" },
  timeRow: { flexDirection: "row", gap: 12 },
  chipRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
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
  lineRow: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 8 },
  lineInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#d8e6da",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 14,
    backgroundColor: "#f6fbf6",
  },
  removeLineButton: { padding: 2 },
  addLineRow: { flexDirection: "row", gap: 8, marginTop: 2 },
  addLineInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#d8e6da",
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 14,
    backgroundColor: "#fafffb",
  },
  addLineButton: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: "#2f9e44",
    alignItems: "center",
    justifyContent: "center",
  },
  addLineButtonText: { color: "#fff", fontSize: 20, fontWeight: "700", lineHeight: 22 },
  saveButton: {
    backgroundColor: "#2f9e44",
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: "center",
    marginTop: 28,
    shadowColor: "#2f9e44",
    shadowOpacity: 0.25,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  saveButtonDisabled: { opacity: 0.7 },
  saveButtonText: { color: "#fff", fontSize: 15, fontWeight: "700" },
});
