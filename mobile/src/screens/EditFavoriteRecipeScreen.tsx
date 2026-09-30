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
import EquipmentEditor from "../components/EquipmentEditor";
import RecipeImagePicker from "../components/RecipeImagePicker";
import TagEditor from "../components/TagEditor";
import { useAuth } from "../context/AuthContext";
import { useFavorites } from "../context/FavoritesContext";
import { pickRecipeImage, saveRecipeImage } from "../utils/recipeImage";
import { RECIPE_CATEGORIES, RECIPE_CATEGORY_LABELS, type Recipe } from "../types";
import { colors, radius, shadow, spacing, type as t } from "../constants/theme";

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
            <Ionicons name="close-circle" size={20} color={colors.danger} />
          </TouchableOpacity>
        </View>
      ))}
      <View style={styles.addLineRow}>
        <TextInput
          style={styles.addLineInput}
          placeholder={placeholder}
          placeholderTextColor={colors.textMuted}
          value={draft}
          onChangeText={setDraft}
          onSubmitEditing={addLine}
        />
        <TouchableOpacity style={styles.addLineButton} onPress={addLine} activeOpacity={0.8}>
          <Ionicons name="add" size={22} color={colors.textOnDark} />
        </TouchableOpacity>
      </View>
    </View>
  );
}

export default function EditFavoriteRecipeScreen({ route, navigation }: Props) {
  const { recipe } = route.params;
  const { household } = useAuth();
  const { updateFavorite } = useFavorites();

  const [title, setTitle] = useState(recipe.title);
  const [imageUri, setImageUri] = useState<string | null>(recipe.imageUrl ?? null);
  const [description, setDescription] = useState(recipe.description);
  const [category, setCategory] = useState(recipe.category);
  const [tags, setTags] = useState<string[]>(recipe.tags);
  const [requiredEquipment, setRequiredEquipment] = useState<string[]>(recipe.requiredEquipment ?? []);
  const [servings, setServings] = useState(recipe.servings);
  const [prepTimeMinutes, setPrepTimeMinutes] = useState(String(recipe.prepTimeMinutes || ""));
  const [cookTimeMinutes, setCookTimeMinutes] = useState(String(recipe.cookTimeMinutes || ""));
  const [difficulty, setDifficulty] = useState<Recipe["difficulty"]>(recipe.difficulty);
  const [ingredientLines, setIngredientLines] = useState<string[]>(
    recipe.ingredients.map((ing) => `${ing.amount} ${ing.name}`.trim())
  );
  const [instructionLines, setInstructionLines] = useState<string[]>(recipe.instructions);
  const [saving, setSaving] = useState(false);

  async function handlePickImage() {
    const uri = await pickRecipeImage();
    if (uri) setImageUri(uri);
  }

  async function handleSave() {
    if (!title.trim()) {
      Alert.alert("Titel fehlt", "Gib dem Rezept einen Namen.");
      return;
    }
    if (!ingredientLines.length) {
      Alert.alert("Zutaten fehlen", "Mindestens eine Zutat wird benötigt.");
      return;
    }

    setSaving(true);
    try {
      let imageUrl = recipe.imageUrl;
      if (imageUri !== (recipe.imageUrl ?? null)) {
        imageUrl = imageUri ? await saveRecipeImage(imageUri, { recipeId: recipe.id, householdId: household?.id }) : undefined;
      }

      const updated: Recipe = {
        ...recipe,
        title: title.trim(),
        description: description.trim(),
        category,
        tags,
        servings: servings || 1,
        prepTimeMinutes: Number(prepTimeMinutes) || 0,
        cookTimeMinutes: Number(cookTimeMinutes) || 0,
        difficulty,
        ingredients: ingredientLines.map((line) => ({ name: line, amount: "", fromFridge: false })),
        missingIngredients: recipe.missingIngredients,
        instructions: instructionLines.length ? instructionLines : ["Keine detaillierte Zubereitung hinterlegt."],
        imageUrl,
        requiredEquipment,
      };

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
        <RecipeImagePicker uri={imageUri} onPick={handlePickImage} onRemove={() => setImageUri(null)} />

        <Text style={styles.label}>Name</Text>
        <TextInput style={styles.input} value={title} onChangeText={setTitle} />

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

        <Text style={styles.label}>Tags</Text>
        <TagEditor tags={tags} onChange={setTags} />

        <Text style={styles.label}>Benötigte Küchengeräte</Text>
        <EquipmentEditor value={requiredEquipment} onChange={setRequiredEquipment} />

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

        <TouchableOpacity
          style={[styles.saveButton, saving && styles.saveButtonDisabled]}
          onPress={handleSave}
          disabled={saving}
          activeOpacity={0.85}
        >
          {saving ? <ActivityIndicator color={colors.textOnDark} /> : <Text style={styles.saveButtonText}>Änderungen speichern</Text>}
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  label: { ...t.bodyStrong, fontSize: 14, color: colors.textPrimary, marginBottom: spacing.sm, marginTop: spacing.xl },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.control,
    paddingHorizontal: spacing.md + 2,
    paddingVertical: spacing.md,
    fontSize: 14,
    color: colors.textPrimary,
    backgroundColor: colors.surface,
  },
  multiline: { minHeight: 70, textAlignVertical: "top" },
  stepperRow: { flexDirection: "row", alignItems: "center", gap: spacing.xl },
  stepperButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  stepperButtonText: { color: colors.textOnDark, fontSize: 20, fontWeight: "700", lineHeight: 22 },
  stepperValue: { fontSize: 17, fontWeight: "700", color: colors.textPrimary, minWidth: 24, textAlign: "center" },
  timeRow: { flexDirection: "row", gap: spacing.md },
  chipRow: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm },
  chip: {
    borderRadius: radius.pill,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md + 2,
    backgroundColor: colors.chipInactiveBg,
  },
  chipSelected: { backgroundColor: colors.primary },
  chipText: { color: colors.chipInactiveText, fontSize: 13, fontWeight: "600" },
  chipTextSelected: { color: colors.textOnDark },
  lineRow: { flexDirection: "row", alignItems: "center", gap: spacing.sm, marginBottom: spacing.sm },
  lineInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.control,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 2,
    fontSize: 14,
    color: colors.textPrimary,
    backgroundColor: colors.surface,
  },
  removeLineButton: { padding: 2 },
  addLineRow: { flexDirection: "row", gap: spacing.sm, marginTop: 2 },
  addLineInput: {
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
  addLineButton: {
    width: 40,
    height: 40,
    borderRadius: radius.control,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  saveButton: {
    backgroundColor: colors.primary,
    borderRadius: radius.button,
    paddingVertical: spacing.lg,
    alignItems: "center",
    marginTop: spacing.xxl + 4,
    ...shadow.button,
  },
  saveButtonDisabled: { opacity: 0.7 },
  saveButtonText: { color: colors.textOnDark, fontSize: 15, fontWeight: "700" },
});
