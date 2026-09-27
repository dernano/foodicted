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

        <TouchableOpacity style={styles.addPhotoButton} onPress={() => navigation.navigate("Camera")}>
          <Ionicons name="camera-outline" size={17} color="#2f9e44" />
          <Text style={styles.addPhotoButtonText}>Weiteres Foto scannen (z. B. zweites Fach, Vorratsschrank)</Text>
        </TouchableOpacity>

        <View style={styles.addRow}>
          <TextInput
            style={styles.addInput}
            placeholder="Zutat manuell hinzufügen"
            value={newItemName}
            onChangeText={setNewItemName}
            onSubmitEditing={addItem}
            returnKeyType="done"
          />
          <TouchableOpacity style={styles.addButton} onPress={addItem}>
            <Text style={styles.addButtonText}>+</Text>
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
              <Text style={styles.matchTitle}>💚 Das kannst du bereits kochen</Text>
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
                  <Ionicons name="chevron-forward" size={16} color="#c3d6c8" />
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
                <Text style={styles.removeButtonText}>✕</Text>
              </TouchableOpacity>
            </View>
          );
        }}
      />

      <View style={styles.bottomBar}>
        <TouchableOpacity style={styles.preferencesButton} onPress={() => navigation.navigate("Preferences")}>
          <Ionicons name="settings-outline" size={15} color="#5c7a6a" />
          <Text style={styles.preferencesButtonText}>Präferenzen anpassen</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.generateButton, loading && styles.generateButtonDisabled]}
          onPress={handleGenerate}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.generateButtonText}>🍳 Rezepte vorschlagen</Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  topSection: {
    padding: 16,
    paddingBottom: 4,
    borderBottomWidth: 1,
    borderBottomColor: "#eef5ef",
    backgroundColor: "#fff",
  },
  notes: { fontSize: 13, color: "#966b1f", backgroundColor: "#fff7e0", padding: 10, borderRadius: 8, marginBottom: 12 },
  addPhotoButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    alignSelf: "flex-start",
    marginBottom: 14,
  },
  addPhotoButtonText: { color: "#2f9e44", fontSize: 13, fontWeight: "700", flexShrink: 1 },
  empty: { textAlign: "center", color: "#7a8f83", marginTop: 32 },
  itemRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 14,
    backgroundColor: "#f6fbf6",
    borderRadius: 10,
    marginBottom: 8,
  },
  itemName: { fontSize: 15, fontWeight: "600", color: "#1b4332" },
  itemMeta: { fontSize: 12, color: "#7a8f83", marginTop: 2, textTransform: "capitalize" },
  removeButton: { padding: 6 },
  removeButtonText: { color: "#c92a2a", fontSize: 16, fontWeight: "700" },
  matchSection: {
    marginTop: 8,
    backgroundColor: "#f6fbf6",
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: "#e6f0e8",
  },
  matchTitle: { fontSize: 13, fontWeight: "700", color: "#1b4332", marginBottom: 8 },
  matchRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 9,
    borderTopWidth: 1,
    borderTopColor: "#e6f0e8",
  },
  matchRowTitle: { fontSize: 14, fontWeight: "700", color: "#1b4332" },
  matchRowMeta: { fontSize: 11, color: "#7a8f83", marginTop: 2 },
  addRow: { flexDirection: "row", gap: 8, marginBottom: 14 },
  addInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#d8e6da",
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 14,
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
  bottomBar: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: "#eef5ef",
    backgroundColor: "#fff",
  },
  preferencesButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 10,
    marginBottom: 4,
  },
  preferencesButtonText: { color: "#5c7a6a", fontSize: 13, fontWeight: "600" },
  generateButton: {
    backgroundColor: "#2f9e44",
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: "center",
  },
  generateButtonDisabled: { opacity: 0.7 },
  generateButtonText: { color: "#fff", fontSize: 16, fontWeight: "700" },
});
