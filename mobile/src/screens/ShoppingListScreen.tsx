import { Ionicons } from "@expo/vector-icons";
import React, { useState } from "react";
import { ActivityIndicator, FlatList, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import { useShoppingList } from "../context/ShoppingListContext";
import type { ShoppingListItem } from "../types";
import { colors, radius, spacing, type as t } from "../constants/theme";

export default function ShoppingListScreen() {
  const { items, ready, shared, addItem, toggleChecked, removeItem, clearChecked } = useShoppingList();
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

  // Wait until we know for sure whether this account belongs to a household -
  // otherwise we'd briefly show an empty local list before the shared one loads.
  if (!ready) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Input pinned to the top, below the header - the keyboard can never
          cover it here, unlike a bottom-pinned input inside a tab screen. */}
      <View style={styles.topSection}>
        {shared && (
          <View style={styles.sharedPill}>
            <Ionicons name="checkmark-circle" size={13} color={colors.primary} />
            <Text style={styles.sharedPillText}>Haushalt · live synchron</Text>
          </View>
        )}
        <View style={styles.addRow}>
          <TextInput
            style={styles.addInput}
            placeholder="Artikel hinzufügen"
            placeholderTextColor={colors.textMuted}
            value={draft}
            onChangeText={setDraft}
            onSubmitEditing={handleAdd}
            returnKeyType="done"
          />
          <TouchableOpacity style={styles.addButton} onPress={handleAdd} activeOpacity={0.8}>
            <Ionicons name="add" size={24} color={colors.textOnDark} />
          </TouchableOpacity>
        </View>
        {hasChecked && (
          <TouchableOpacity style={styles.clearButton} onPress={() => clearChecked()}>
            <Ionicons name="trash-outline" size={14} color={colors.noticeText} />
            <Text style={styles.clearButtonText}>Erledigte löschen ({checkedItems.length})</Text>
          </TouchableOpacity>
        )}
      </View>

      <FlatList
        style={{ flex: 1 }}
        contentContainerStyle={{ padding: spacing.lg, paddingTop: spacing.xs, paddingBottom: spacing.xxl, flexGrow: 1 }}
        keyboardShouldPersistTaps="handled"
        data={sorted}
        keyExtractor={(item) => item.id}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <View style={styles.emptyIconCircle}>
              <Ionicons name="cart-outline" size={28} color={colors.primary} />
            </View>
            <Text style={styles.emptyTitle}>Einkaufsliste ist leer</Text>
            <Text style={styles.emptyText}>
              Füge oben Artikel hinzu, oder tippe bei einem Rezept auf „Zur Einkaufsliste".
            </Text>
          </View>
        }
        renderItem={({ item }: { item: ShoppingListItem }) => (
          <TouchableOpacity style={styles.row} onPress={() => toggleChecked(item.id)} activeOpacity={0.7}>
            <Ionicons
              name={item.checked ? "checkbox" : "square-outline"}
              size={22}
              color={item.checked ? colors.primary : colors.border}
            />
            <View style={{ flex: 1 }}>
              <Text style={[styles.rowText, item.checked && styles.rowTextChecked]}>{item.text}</Text>
              {!!item.source && <Text style={styles.rowSource}>aus: {item.source}</Text>}
            </View>
            <TouchableOpacity onPress={() => removeItem(item.id)} hitSlop={10}>
              <Ionicons name="close" size={18} color={colors.danger} />
            </TouchableOpacity>
          </TouchableOpacity>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  loadingContainer: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: colors.bg },
  topSection: {
    padding: spacing.lg,
    paddingBottom: spacing.sm,
    backgroundColor: colors.bg,
  },
  sharedPill: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    gap: 5,
    backgroundColor: colors.bgAlt,
    borderRadius: radius.pill,
    paddingVertical: 5,
    paddingHorizontal: spacing.md,
    marginBottom: spacing.md,
  },
  sharedPillText: { fontSize: 11, color: colors.textSecondary, fontWeight: "700" },
  clearButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    alignSelf: "flex-start",
    marginTop: spacing.md,
  },
  clearButtonText: { fontSize: 12, color: colors.noticeText, fontWeight: "600" },
  emptyState: { alignItems: "center", justifyContent: "center", paddingTop: 48, paddingHorizontal: 32 },
  emptyIconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.bgAlt,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.lg,
  },
  emptyTitle: { ...t.section, color: colors.textPrimary, marginBottom: spacing.sm },
  emptyText: { fontSize: 13, color: colors.textMuted, textAlign: "center", lineHeight: 19 },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: radius.control,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md + 2,
    marginBottom: spacing.sm,
  },
  rowText: { fontSize: 15, color: colors.textPrimary, fontWeight: "600" },
  rowTextChecked: { color: colors.textMuted, textDecorationLine: "line-through" },
  rowSource: { fontSize: 11, color: colors.textMuted, marginTop: 2, fontStyle: "italic" },
  addRow: { flexDirection: "row", gap: spacing.xs, alignItems: "stretch" },
  addInput: {
    flex: 1,
    height: 48,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.control,
    paddingHorizontal: spacing.md + 2,
    fontSize: 14,
    color: colors.textPrimary,
    backgroundColor: colors.surface,
  },
  addButton: {
    width: 48,
    height: 48,
    borderRadius: radius.control,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
});
