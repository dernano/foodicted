import { Ionicons } from "@expo/vector-icons";
import React, { useState } from "react";
import { StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import { colors, radius, spacing } from "../constants/theme";

/** Free-text tag chips with add/remove - used on the add/edit recipe screens. */
export default function TagEditor({
  tags,
  onChange,
  placeholder = "Eigenes Tag, z. B. Meal Prep",
}: {
  tags: string[];
  onChange: (next: string[]) => void;
  placeholder?: string;
}) {
  const [draft, setDraft] = useState("");

  function add() {
    const value = draft.trim();
    if (!value) return;
    if (tags.some((t) => t.toLowerCase() === value.toLowerCase())) {
      setDraft("");
      return;
    }
    onChange([...tags, value]);
    setDraft("");
  }

  function remove(tag: string) {
    onChange(tags.filter((t) => t !== tag));
  }

  return (
    <View>
      {!!tags.length && (
        <View style={styles.tagWrap}>
          {tags.map((tag) => (
            <TouchableOpacity key={tag} style={styles.tagChip} onPress={() => remove(tag)} activeOpacity={0.7}>
              <Text style={styles.tagChipText}>{tag}</Text>
              <Ionicons name="close" size={12} color={colors.textPrimary} />
            </TouchableOpacity>
          ))}
        </View>
      )}
      <View style={styles.addRow}>
        <TextInput
          style={styles.addInput}
          placeholder={placeholder}
          placeholderTextColor={colors.textMuted}
          value={draft}
          onChangeText={setDraft}
          onSubmitEditing={add}
        />
        <TouchableOpacity style={styles.addButton} onPress={add} activeOpacity={0.8}>
          <Ionicons name="add" size={22} color={colors.textOnDark} />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  tagWrap: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm, marginBottom: spacing.md },
  tagChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: colors.bgAlt,
    borderRadius: radius.pill,
    paddingVertical: spacing.sm - 1,
    paddingHorizontal: spacing.md,
  },
  tagChipText: { color: colors.textPrimary, fontSize: 12, fontWeight: "600" },
  addRow: { flexDirection: "row", gap: spacing.sm },
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
});
