import { Ionicons } from "@expo/vector-icons";
import React, { useState } from "react";
import { FlatList, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import { useShoppingList } from "../context/ShoppingListContext";
import type { ShoppingListItem } from "../types";

export default function ShoppingListScreen() {
  const { items, shared, addItem, toggleChecked, removeItem, clearChecked } = useShoppingList();
  const [draft, setDraft] = useState("");

  function handleAdd() {
    const text = draft.trim();
    if (!text) return;
    addItem(text);
    setDraft("");
  }

  const openItems = items.filter((i) => !i.checked);
  const checkedItems = items.filter((i) => i.checked);
  const sorted = [...openItems, ...checkedItems];
  const hasChecked = checkedItems.length > 0;

  return (
    <View style={styles.container}>
      {/* Input pinned to the top, below the header - the keyboard can never
          cover it here, unlike a bottom-pinned input inside a tab screen. */}
      <View style={styles.topSection}>
        {shared && (
          <View style={styles.sharedBanner}>
            <Ionicons name="people" size={15} color="#2f9e44" />
            <Text style={styles.sharedBannerText}>Geteilt mit deinem Haushalt - live synchron</Text>
          </View>
        )}
        <View style={styles.addRow}>
          <TextInput
            style={styles.addInput}
            placeholder="Artikel hinzufügen"
            value={draft}
            onChangeText={setDraft}
            onSubmitEditing={handleAdd}
            returnKeyType="done"
          />
          <TouchableOpacity style={styles.addButton} onPress={handleAdd}>
            <Text style={styles.addButtonText}>+</Text>
          </TouchableOpacity>
        </View>
        {hasChecked && (
          <TouchableOpacity style={styles.clearButton} onPress={() => clearChecked()}>
            <Ionicons name="trash-outline" size={14} color="#966b1f" />
            <Text style={styles.clearButtonText}>Erledigte löschen ({checkedItems.length})</Text>
          </TouchableOpacity>
        )}
      </View>

      <FlatList
        style={{ flex: 1 }}
        contentContainerStyle={{ padding: 16, paddingTop: 4, paddingBottom: 24, flexGrow: 1 }}
        keyboardShouldPersistTaps="handled"
        data={sorted}
        keyExtractor={(item) => item.id}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Text style={styles.emptyEmoji}>🛒</Text>
            <Text style={styles.emptyTitle}>Einkaufsliste ist leer</Text>
            <Text style={styles.emptyText}>
              Füge oben Artikel hinzu, oder tippe bei einem Rezept auf „Zur Einkaufsliste".
            </Text>
          </View>
        }
        renderItem={({ item }: { item: ShoppingListItem }) => (
          <TouchableOpacity style={styles.row} onPress={() => toggleChecked(item.id)}>
            <Ionicons
              name={item.checked ? "checkbox" : "square-outline"}
              size={22}
              color={item.checked ? "#2f9e44" : "#c3d6c8"}
            />
            <Text style={[styles.rowText, item.checked && styles.rowTextChecked]}>{item.text}</Text>
            <TouchableOpacity onPress={() => removeItem(item.id)} hitSlop={10}>
              <Ionicons name="close" size={18} color="#c92a2a" />
            </TouchableOpacity>
          </TouchableOpacity>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  topSection: {
    padding: 16,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#eef5ef",
    backgroundColor: "#fff",
  },
  sharedBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "#eaf7ec",
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 14,
    marginBottom: 12,
  },
  sharedBannerText: { fontSize: 12, color: "#1b4332", fontWeight: "600" },
  clearButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    alignSelf: "flex-start",
    marginTop: 10,
  },
  clearButtonText: { fontSize: 12, color: "#966b1f", fontWeight: "600" },
  emptyState: { alignItems: "center", justifyContent: "center", paddingTop: 48, paddingHorizontal: 32 },
  emptyEmoji: { fontSize: 44, marginBottom: 14 },
  emptyTitle: { fontSize: 16, fontWeight: "700", color: "#1b4332", marginBottom: 6 },
  emptyText: { fontSize: 13, color: "#7a8f83", textAlign: "center", lineHeight: 19 },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: "#f6fbf6",
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 14,
    marginBottom: 8,
  },
  rowText: { flex: 1, fontSize: 15, color: "#1b4332", fontWeight: "600" },
  rowTextChecked: { color: "#9db5a6", textDecorationLine: "line-through" },
  addRow: { flexDirection: "row", gap: 8 },
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
});
