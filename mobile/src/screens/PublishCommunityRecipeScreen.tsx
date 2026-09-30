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
import { publishCommunityRecipe, updateCommunityRecipe } from "../api/community";
import RecipeImagePicker from "../components/RecipeImagePicker";
import TagEditor from "../components/TagEditor";
import { useAuth } from "../context/AuthContext";
import { useFavorites } from "../context/FavoritesContext";
import { pickRecipeImage, saveCommunityRecipeImage } from "../utils/recipeImage";
import { RECIPE_CATEGORIES, RECIPE_CATEGORY_LABELS, type Nutrition, type Recipe, type RecipeCategory } from "../types";
import { colors, radius, shadow, spacing, type as t } from "../constants/theme";

type Props = RootStackScreenProps<"PublishCommunityRecipe">;

function isRemoteUrl(uri: string): boolean {
  return uri.startsWith("http://") || uri.startsWith("https://");
}

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

export default function PublishCommunityRecipeScreen({ route, navigation }: Props) {
  const existing = route.params?.recipe;
  // Publishing an already-saved recipe (favorite or AI suggestion) seeds the
  // form the same way editing an existing Community post does - just without
  // an id yet, since it isn't published until "Veröffentlichen" is tapped.
  const prefill = route.params?.prefill;
  const favoriteId = route.params?.favoriteId;
  const seed = existing ?? prefill;
  const { session } = useAuth();
  const { linkFavoriteToCommunity } = useFavorites();

  const [title, setTitle] = useState(seed?.title ?? "");
  const [description, setDescription] = useState(seed?.description ?? "");
  const [category, setCategory] = useState<RecipeCategory>(seed?.category ?? "hauptgericht");
  const [tags, setTags] = useState<string[]>(seed?.tags ?? []);
  const [servings, setServings] = useState(seed?.servings ?? 2);
  const [prepTimeMinutes, setPrepTimeMinutes] = useState(String(seed?.prepTimeMinutes ?? ""));
  const [cookTimeMinutes, setCookTimeMinutes] = useState(String(seed?.cookTimeMinutes ?? ""));
  const [difficulty, setDifficulty] = useState<Recipe["difficulty"]>(seed?.difficulty ?? "medium");
  const [ingredientLines, setIngredientLines] = useState<string[]>(
    seed?.ingredients.map((ing) => `${ing.amount} ${ing.name}`.trim()) ?? []
  );
  const [instructionLines, setInstructionLines] = useState<string[]>(seed?.instructions ?? []);
  const [nutrition, setNutrition] = useState<Nutrition>(
    seed?.nutrition ?? { calories: 0, proteinGrams: 0, carbsGrams: 0, fatGrams: 0 }
  );
  const [imageUri, setImageUri] = useState<string | null>(seed?.imageUrl ?? null);
  const [saving, setSaving] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);

  if (!session) {
    return (
      <View style={styles.signInPrompt}>
        <Ionicons name="lock-closed-outline" size={28} color={colors.primary} />
        <Text style={styles.signInText}>Melde dich an, um ein Rezept in der Community zu veröffentlichen.</Text>
        <TouchableOpacity style={styles.signInButton} onPress={() => navigation.navigate("Account")}>
          <Text style={styles.signInButtonText}>Zum Konto</Text>
        </TouchableOpacity>
      </View>
    );
  }

  async function handlePickImage() {
    const uri = await pickRecipeImage();
    if (uri) setImageUri(uri);
  }

  function validate(): boolean {
    if (!title.trim()) {
      Alert.alert("Titel fehlt", "Gib deinem Rezept einen Namen.");
      return false;
    }
    if (!ingredientLines.length) {
      Alert.alert("Zutaten fehlen", "Füge mindestens eine Zutat hinzu.");
      return false;
    }
    return true;
  }

  async function handleAiRefine() {
    if (!validate()) return;
    setAiLoading(true);
    try {
      const refined = await refineRecipe({
        title: title.trim(),
        ingredientLines,
        preparationNotes: description.trim() || instructionLines.join("\n"),
        servings,
      });
      setTitle(refined.title);
      setDescription(refined.description);
      setIngredientLines(refined.ingredients.map((ing) => `${ing.amount} ${ing.name}`.trim()));
      setInstructionLines(refined.instructions);
      setNutrition(refined.nutrition);
      setTags(Array.from(new Set([...refined.tags, ...tags])));
      Alert.alert("Fertig", "Die KI hat dein Rezept vervollständigt - prüf die Felder und speichere dann.");
    } catch (err) {
      Alert.alert("Fehler", err instanceof Error ? err.message : "KI-Anfrage fehlgeschlagen.");
    } finally {
      setAiLoading(false);
    }
  }

  async function handleSave() {
    if (!validate() || !session) return;
    setSaving(true);
    try {
      const recipe: Recipe = {
        title: title.trim(),
        description: description.trim(),
        category,
        prepTimeMinutes: Number(prepTimeMinutes) || 0,
        cookTimeMinutes: Number(cookTimeMinutes) || 0,
        servings: servings || 1,
        difficulty,
        tags,
        ingredients: ingredientLines.map((line) => ({ name: line, amount: "", fromFridge: false })),
        missingIngredients: [],
        instructions: instructionLines.length ? instructionLines : ["Keine detaillierte Zubereitung hinterlegt."],
        nutrition,
      };

      if (existing) {
        let imageUrl = existing.imageUrl;
        if (imageUri !== (existing.imageUrl ?? null)) {
          imageUrl = imageUri
            ? isRemoteUrl(imageUri)
              ? imageUri
              : await saveCommunityRecipeImage(imageUri, { recipeId: existing.id, authorId: session.user.id })
            : undefined;
        }
        const updated = { ...recipe, imageUrl };
        await updateCommunityRecipe(existing.id, updated);
        navigation.replace("CommunityRecipeDetail", {
          recipe: { ...existing, ...updated, imageUrl: imageUrl ?? undefined },
        });
      } else {
        // A prefilled favorite/AI recipe may already have a remote (household
        // Supabase) photo url - reuse it as-is instead of re-uploading it as
        // if it were a fresh local pick (uploading a http(s) url as a "local
        // file" would fail).
        const created = await publishCommunityRecipe(
          { ...recipe, imageUrl: imageUri && isRemoteUrl(imageUri) ? imageUri : undefined },
          session.user.id
        );
        let finalRecipe = created;
        if (imageUri && !isRemoteUrl(imageUri)) {
          try {
            const imageUrl = await saveCommunityRecipeImage(imageUri, { recipeId: created.id, authorId: session.user.id });
            await updateCommunityRecipe(created.id, { ...recipe, imageUrl });
            finalRecipe = { ...created, imageUrl };
          } catch (err) {
            console.warn("Failed to attach image to published recipe", err);
          }
        }
        if (favoriteId) {
          linkFavoriteToCommunity(favoriteId, created.id).catch((err) =>
            console.warn("Failed to link favorite to its new community post", err)
          );
        }
        navigation.replace("CommunityRecipeDetail", { recipe: finalRecipe });
      }
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
        <Text style={styles.intro}>
          Teile dein Rezept mit der Foodicted-Community - andere können es bewerten, kommentieren und als Favorit
          speichern.
        </Text>

        <RecipeImagePicker uri={imageUri} onPick={handlePickImage} onRemove={() => setImageUri(null)} />

        <Text style={styles.label}>Name des Rezepts</Text>
        <TextInput style={styles.input} placeholder="z. B. Omas Kartoffelsalat" value={title} onChangeText={setTitle} />

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

        <Text style={styles.label}>Beschreibung</Text>
        <TextInput
          style={[styles.input, styles.multiline]}
          placeholder="Kurze Beschreibung des Gerichts"
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
            <TextInput style={styles.input} keyboardType="number-pad" value={prepTimeMinutes} onChangeText={setPrepTimeMinutes} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.label}>Kochzeit (min)</Text>
            <TextInput style={styles.input} keyboardType="number-pad" value={cookTimeMinutes} onChangeText={setCookTimeMinutes} />
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
        <EditableList lines={ingredientLines} onChange={setIngredientLines} placeholder="z. B. 500g Kartoffeln" />

        <Text style={styles.label}>Zubereitung</Text>
        <EditableList lines={instructionLines} onChange={setInstructionLines} placeholder="Neuen Schritt hinzufügen" />

        <TouchableOpacity
          style={[styles.aiButton, aiLoading && styles.buttonDisabled]}
          onPress={handleAiRefine}
          disabled={aiLoading}
          activeOpacity={0.85}
        >
          {aiLoading ? (
            <ActivityIndicator color={colors.textOnDark} />
          ) : (
            <>
              <Ionicons name="sparkles" size={16} color={colors.textOnDark} />
              <Text style={styles.aiButtonText}>Mit KI vervollständigen (Nährwerte & Anleitung)</Text>
            </>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.saveButton, saving && styles.buttonDisabled]}
          onPress={handleSave}
          disabled={saving}
          activeOpacity={0.85}
        >
          {saving ? (
            <ActivityIndicator color={colors.textOnDark} />
          ) : (
            <Text style={styles.saveButtonText}>{existing ? "Änderungen speichern" : "Veröffentlichen"}</Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  intro: { fontSize: 13, color: colors.textSecondary, lineHeight: 19, marginBottom: spacing.xl },
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
  chipRow: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm },
  chip: { borderRadius: radius.pill, paddingVertical: spacing.sm, paddingHorizontal: spacing.md + 2, backgroundColor: colors.chipInactiveBg },
  chipSelected: { backgroundColor: colors.primary },
  chipText: { color: colors.chipInactiveText, fontSize: 13, fontWeight: "600" },
  chipTextSelected: { color: colors.textOnDark },
  stepperRow: { flexDirection: "row", alignItems: "center", gap: spacing.xl },
  stepperButton: { width: 38, height: 38, borderRadius: 19, backgroundColor: colors.primary, alignItems: "center", justifyContent: "center" },
  stepperButtonText: { color: colors.textOnDark, fontSize: 20, fontWeight: "700", lineHeight: 22 },
  stepperValue: { fontSize: 17, fontWeight: "700", color: colors.textPrimary, minWidth: 24, textAlign: "center" },
  timeRow: { flexDirection: "row", gap: spacing.md },
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
  addLineButton: { width: 40, height: 40, borderRadius: radius.control, backgroundColor: colors.primary, alignItems: "center", justifyContent: "center" },
  aiButton: {
    flexDirection: "row",
    gap: spacing.sm,
    backgroundColor: colors.brandDark,
    borderRadius: radius.button,
    paddingVertical: spacing.lg,
    alignItems: "center",
    justifyContent: "center",
    marginTop: spacing.xxl,
  },
  aiButtonText: { color: colors.textOnDark, fontSize: 13, fontWeight: "700", textAlign: "center", flexShrink: 1 },
  saveButton: {
    backgroundColor: colors.primary,
    borderRadius: radius.button,
    paddingVertical: spacing.lg,
    alignItems: "center",
    marginTop: spacing.md,
    ...shadow.button,
  },
  buttonDisabled: { opacity: 0.7 },
  saveButtonText: { color: colors.textOnDark, fontSize: 15, fontWeight: "700" },
  signInPrompt: { flex: 1, alignItems: "center", justifyContent: "center", padding: spacing.xxl, backgroundColor: colors.bg, gap: spacing.md },
  signInText: { fontSize: 14, color: colors.textSecondary, textAlign: "center", lineHeight: 20 },
  signInButton: { backgroundColor: colors.primary, borderRadius: radius.button, paddingVertical: spacing.md, paddingHorizontal: spacing.xxl, marginTop: spacing.sm },
  signInButtonText: { color: colors.textOnDark, fontWeight: "700", fontSize: 14 },
});
