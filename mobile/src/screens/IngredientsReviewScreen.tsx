import { Ionicons } from "@expo/vector-icons";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import React, { useEffect, useMemo, useRef, useState } from "react";
import { ActivityIndicator, Alert, FlatList, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import type { RootStackParamList } from "../navigation";
import { CATEGORY_LABELS, type FridgeItem } from "../types";
import { generateRecipes } from "../api/client";
import { usePreferences } from "../context/PreferencesContext";
import { useFavorites } from "../context/FavoritesContext";
import { usePantry } from "../context/PantryContext";
import { matchRatio } from "../utils/ingredientMatch";
import { mergeFridgeItems } from "../utils/fridgeItems";
import { colors, radius, spacing } from "../constants/theme";

type Props = NativeStackScreenProps<RootStackParamList, "IngredientsReview">;

const MATCH_THRESHOLD = 0.8;

export default function IngredientsReviewScreen({ route, navigation }: Props) {
  const { preferences } = usePreferences();
  const { favorites } = useFavorites();
  const { pantry, loaded: pantryLoaded, updatePantry } = usePantry();
  const [items, setItems] = useState<FridgeItem[]>(route.params.items);
  const [notes, setNotes] = useState<string | undefined>(route.params.notes);
  const [newItemName, setNewItemName] = useState("");
  const [loading, setLoading] = useState(false);
  const lastMergedItemsRef = useRef(route.params.items);
  const pantryMergedRef = useRef(false);

  // Merge in the persisted pantry (previously scanned/entered ingredients)
  // once on load, so this list always reflects what the user already told
  // the app about - not just what was just scanned or typed this visit.
  useEffect(() => {
    if (pantryLoaded && !pantryMergedRef.current) {
      pantryMergedRef.current = true;
      setItems((prev) => mergeFridgeItems(pantry.items, prev));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pantryLoaded]);

  // Keep the persisted pantry in sync with whatever's currently in the list -
  // this is what lets any recipe's detail page later show "already have it".
  useEffect(() => {
    if (pantryMergedRef.current) {
      updatePantry(items, notes);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [items, notes]);

  // Free, local check (no AI call): which saved favorites could already be
  // cooked with what's currently in the list.
  const matchedFavorites = useMemo(() => {
    if (!items.length || !favorites.length) return [];
    const detectedNames = items.map((i) => i.name);
    return favorites
      .map((favorite) => ({
        favorite,
        score: matchRatio(
          favorite.ingredients.map((ing) => ing.name),
          detectedNames
        ),
      }))
      .filter(({ score }) => score >= MATCH_THRESHOLD)
      .sort((a, b) => b.score - a.score)
      .slice(0, 5);
  }, [items, favorites]);

  // If this screen is already open and the user scans another photo, Camera
  // navigates back here with a fresh batch of items - merge it in instead of
  // replacing, so multiple shelves/photos build up one combined list.
  useEffect(() => {
    if (route.params.items !== lastMergedItemsRef.current) {
      lastMergedItemsRef.current = route.params.items;
      setItems((prev) => mergeFridgeItems(prev, route.params.items));
      if (route.params.notes) setNotes(route.params.notes);
    }
  }, [route.params.items, route.params.notes]);

  function removeItem(index: number) {
    setItems((prev) => prev.filter((_, i) => i !== index));
  }

  function addItem() {
    const name = newItemName.trim();
    if (!name) return;
    setItems((prev) => [...prev, { name, category: "other", estimatedQuantity: "", confidence: 1 }]);
    setNewItemName("");
  }

  function clearAll() {
    if (!items.length) return;
    Alert.alert("Alle Zutaten entfernen?", "Das leert deine gesamte Liste (deinen Vorrat).", [
      { text: "Abbrechen", style: "cancel" },
      { text: "Entfernen", style: "destructive", onPress: () => setItems([]) },
    ]);
  }

  async function handleGenerate() {
    setLoading(true);
    try {
      const result = await generateRecipes(items, preferences);
      navigation.navigate("Recipes", { recipes: result.recipes });
    } catch (err) {
      Alert.alert(
        "Rezepte konnten nicht erstellt werden",
        err instanceof Error ? err.message : "Unbekannter Fehler."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <View style={styles.container}>
      {/* Add-row pinned to the top, below the header - the keyboard can never
          cover it here, unlike a bottom-pinned input on this screen. */}
      <View style={styles.topSection}>
        {!!notes && <Text style={styles.notes}>{notes}</Text>}

        <View style={styles.topButtonsRow}>
          <TouchableOpacity style={styles.addPhotoButton} onPress={() => navigation.navigate("Camera")}>
            <Ionicons name="camera-outline" size={17} color={colors.primary} />
            <Text style={styles.addPhotoButtonText}>Weiteres Foto scannen</Text>
          </TouchableOpacity>
          {!!items.length && (
            <TouchableOpacity style={styles.clearAllButton} onPress={clearAll}>
              <Ionicons name="trash-outline" size={14} color={colors.danger} />
              <Text style={styles.clearAllButtonText}>Alle entfernen</Text>
            </TouchableOpacity>
          )}
        </View>

        <View style={styles.addRow}>
          <TextInput
            style={styles.addInput}
            placeholder="Zutat manuell hinzufügen"
            placeholderTextColor={colors.textMuted}
            value={newItemName}
            onChangeText={setNewItemName}
            onSubmitEditing={addItem}
            returnKeyType="done"
          />
          <TouchableOpacity style={styles.addButton} onPress={addItem} activeOpacity={0.8}>
            <Ionicons name="add" size={24} color={colors.textOnDark} />
          </TouchableOpacity>
        </View>
      </View>

      <FlatList
        style={{ flex: 1 }}
        contentContainerStyle={{ padding: 16, paddingTop: 8, paddingBottom: 16, flexGrow: 1 }}
        keyboardShouldPersistTaps="handled"
        data={items}
        keyExtractor={(_, i) => String(i)}
        ListEmptyComponent={<Text style={styles.empty}>Keine Zutaten erkannt - füge oben welche hinzu.</Text>}
        ListFooterComponent={
          !!matchedFavorites.length ? (
            <View style={styles.matchSection}>
              <View style={styles.matchTitleRow}>
                <Ionicons name="checkmark-circle" size={16} color={colors.primary} />
                <Text style={styles.matchTitle}>Das kannst du bereits kochen</Text>
              </View>
              {matchedFavorites.map(({ favorite, score }) => (
                <TouchableOpacity
                  key={favorite.id}
                  style={styles.matchRow}
                  onPress={() => navigation.navigate("RecipeDetail", { recipe: favorite })}
                >
                  <View style={{ flex: 1 }}>
                    <Text style={styles.matchRowTitle}>{favorite.title}</Text>
                    <Text style={styles.matchRowMeta}>
                      {score >= 0.999 ? "Alle Zutaten vorhanden" : `${Math.round(score * 100)}% der Zutaten vorhanden`}
                    </Text>
                  </View>
                  <Ionicons name="chevron-forward" size={16} color={colors.border} />
                </TouchableOpacity>
              ))}
            </View>
          ) : null
        }
        renderItem={({ item, index }) => {
          const metaParts = [
            item.category !== "other" ? CATEGORY_LABELS[item.category] : null,
            item.estimatedQuantity || null,
          ].filter(Boolean);
          return (
            <View style={styles.itemRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.itemName}>{item.name}</Text>
                {!!metaParts.length && <Text style={styles.itemMeta}>{metaParts.join(" · ")}</Text>}
              </View>
              <TouchableOpacity onPress={() => removeItem(index)} style={styles.removeButton}>
                <Ionicons name="close" size={18} color={colors.danger} />
              </TouchableOpacity>
            </View>
          );
        }}
      />

      <View style={styles.bottomBar}>
        <TouchableOpacity style={styles.preferencesButton} onPress={() => navigation.navigate("Preferences")}>
          <Ionicons name="options-outline" size={15} color={colors.textSecondary} />
          <Text style={styles.preferencesButtonText}>Präferenzen anpassen</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.generateButton, loading && styles.generateButtonDisabled]}
          onPress={handleGenerate}
          disabled={loading}
          activeOpacity={0.85}
        >
          {loading ? (
            <ActivityIndicator color={colors.textOnDark} />
          ) : (
            <>
              <Ionicons name="sparkles" size={17} color={colors.textOnDark} />
              <Text style={styles.generateButtonText}>Rezepte vorschlagen</Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  topSection: {
    padding: spacing.lg,
    paddingBottom: spacing.xs,
    backgroundColor: colors.bg,
  },
  notes: { fontSize: 13, color: colors.noticeText, backgroundColor: colors.noticeBg, padding: spacing.md, borderRadius: radius.control, marginBottom: spacing.md },
  topButtonsRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: spacing.md + 2,
  },
  addPhotoButton: { flexDirection: "row", alignItems: "center", gap: spacing.sm, flexShrink: 1 },
  addPhotoButtonText: { color: colors.primary, fontSize: 13, fontWeight: "700", flexShrink: 1 },
  clearAllButton: { flexDirection: "row", alignItems: "center", gap: 4, paddingLeft: spacing.md },
  clearAllButtonText: { color: colors.danger, fontSize: 12, fontWeight: "700" },
  empty: { textAlign: "center", color: colors.textMuted, marginTop: 32 },
  itemRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md + 2,
    backgroundColor: colors.surface,
    borderRadius: radius.control,
    marginBottom: spacing.sm,
  },
  itemName: { fontSize: 15, fontWeight: "600", color: colors.textPrimary },
  itemMeta: { fontSize: 12, color: colors.textMuted, marginTop: 2, textTransform: "capitalize" },
  removeButton: { padding: 6 },
  matchSection: {
    marginTop: spacing.sm,
    backgroundColor: colors.surface,
    borderRadius: radius.card,
    padding: spacing.md + 2,
  },
  matchTitleRow: { flexDirection: "row", alignItems: "center", gap: spacing.xs, marginBottom: spacing.sm },
  matchTitle: { fontSize: 13, fontWeight: "700", color: colors.textPrimary },
  matchRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 9,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  matchRowTitle: { fontSize: 14, fontWeight: "700", color: colors.textPrimary },
  matchRowMeta: { fontSize: 11, color: colors.textMuted, marginTop: 2 },
  addRow: { flexDirection: "row", gap: spacing.sm, marginBottom: spacing.md + 2 },
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
  bottomBar: {
    padding: spacing.lg,
    backgroundColor: colors.bg,
  },
  preferencesButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: spacing.sm + 2,
    marginBottom: spacing.xs,
  },
  preferencesButtonText: { color: colors.textSecondary, fontSize: 13, fontWeight: "600" },
  generateButton: {
    flexDirection: "row",
    backgroundColor: colors.primary,
    borderRadius: radius.button,
    paddingVertical: spacing.lg,
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
  },
  generateButtonDisabled: { opacity: 0.7 },
  generateButtonText: { color: colors.textOnDark, fontSize: 16, fontWeight: "700" },
});
