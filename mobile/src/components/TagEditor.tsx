import React, { useState } from "react";
import { StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";

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
            <TouchableOpacity key={tag} style={styles.tagChip} onPress={() => remove(tag)}>
              <Text style={styles.tagChipText}>{tag} ✕</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}
      <View style={styles.addRow}>
        <TextInput
          style={styles.addInput}
          placeholder={placeholder}
          value={draft}
          onChangeText={setDraft}
          onSubmitEditing={add}
        />
        <TouchableOpacity style={styles.addButton} onPress={add}>
          <Text style={styles.addButtonText}>+</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  tagWrap: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 10 },
  tagChip: {
    backgroundColor: "#eaf7ec",
    borderRadius: 16,
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  tagChipText: { color: "#1b4332", fontSize: 12, fontWeight: "600" },
  addRow: { flexDirection: "row", gap: 8 },
  addInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#d8e6da",
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 14,
    backgroundColor: "#fafffb",
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
