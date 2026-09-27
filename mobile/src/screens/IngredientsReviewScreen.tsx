import { NativeStackScreenProps } from "@react-navigation/native-stack";
import React, { useState } from "react";
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

export default function IngredientsReviewScreen({ route, navigation }: Props) {
  const { preferences } = usePreferences();
  const [items, setItems] = useState<FridgeItem[]>(route.params.items);
  const [newItemName, setNewItemName] = useState("");
  const [loading, setLoading] = useState(false);

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
      {!!route.params.notes && <Text style={styles.notes}>{route.params.notes}</Text>}

      <FlatList
        data={items}
        keyExtractor={(_, i) => String(i)}
        contentContainerStyle={{ paddingBottom: 16 }}
        ListEmptyComponent={<Text style={styles.empty}>Keine Zutaten erkannt - füge unten welche hinzu.</Text>}
        renderItem={({ item, index }) => (
          <View style={styles.itemRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.itemName}>{item.name}</Text>
              <Text style={styles.itemMeta}>
                {CATEGORY_LABELS[item.category]}
                {item.estimatedQuantity ? ` · ${item.estimatedQuantity}` : ""}
              </Text>
            </View>
            <TouchableOpacity onPress={() => removeItem(index)} style={styles.removeButton}>
              <Text style={styles.removeButtonText}>✕</Text>
            </TouchableOpacity>
          </View>
        )}
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
