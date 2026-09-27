import { Ionicons } from "@expo/vector-icons";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import type { RootStackParamList } from "../navigation";
import { CATEGORY_LABELS, type FridgeItem } from "../types";
import { generateRecipes } from "../api/client";
import { usePreferences } from "../context/PreferencesContext";

type Props = NativeStackScreenProps<RootStackParamList, "IngredientsReview">;

function mergeItems(existing: FridgeItem[], incoming: FridgeItem[]): FridgeItem[] {
  const existingNames = new Set(existing.map((i) => i.name.trim().toLowerCase()));
  const newOnes = incoming.filter((i) => !existingNames.has(i.name.trim().toLowerCase()));
  return [...existing, ...newOnes];
}

export default function IngredientsReviewScreen({ route, navigation }: Props) {
  const { preferences } = usePreferences();
  const [items, setItems] = useState<FridgeItem[]>(route.params.items);
  const [notes, setNotes] = useState<string | undefined>(route.params.notes);
  const [newItemName, setNewItemName] = useState("");
  const [loading, setLoading] = useState(false);
  const lastMergedItemsRef = useRef(route.params.items);

  // If this screen is already open and the user scans another photo, Camera
  // navigates back here with a fresh batch of items - merge it in instead of
  // replacing, so multiple shelves/photos build up one combined list.
  useEffect(() => {
    if (route.params.items !== lastMergedItemsRef.current) {
      lastMergedItemsRef.current = route.params.items;
      setItems((prev) => mergeItems(prev, route.params.items));
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
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={Platform.OS === "ios" ? 90 : 0}
    >
      {!!notes && <Text style={styles.notes}>{notes}</Text>}

      <TouchableOpacity style={styles.addPhotoButton} onPress={() => navigation.navigate("Camera")}>
        <Ionicons name="camera-outline" size={17} color="#2f9e44" />
        <Text style={styles.addPhotoButtonText}>Weiteres Foto scannen (z. B. zweites Fach, Vorratsschrank)</Text>
      </TouchableOpacity>

      <FlatList
        data={items}
        keyExtractor={(_, i) => String(i)}
        contentContainerStyle={{ paddingBottom: 16 }}
        ListEmptyComponent={<Text style={styles.empty}>Keine Zutaten erkannt - füge unten welche hinzu.</Text>}
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

      <View style={styles.addRow}>
        <TextInput
          style={styles.addInput}
          placeholder="Zutat manuell hinzufügen"
          value={newItemName}
          onChangeText={setNewItemName}
          onSubmitEditing={addItem}
        />
        <TouchableOpacity style={styles.addButton} onPress={addItem}>
          <Text style={styles.addButtonText}>+</Text>
        </TouchableOpacity>
      </View>

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
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff", padding: 16 },
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
  addRow: { flexDirection: "row", gap: 8, marginTop: 8, marginBottom: 16 },
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
  generateButton: {
    backgroundColor: "#2f9e44",
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: "center",
  },
  generateButtonDisabled: { opacity: 0.7 },
  generateButtonText: { color: "#fff", fontSize: 16, fontWeight: "700" },
});
