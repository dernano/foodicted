import { Ionicons } from "@expo/vector-icons";
import React, { useState } from "react";
import { StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import { EQUIPMENT_PRESETS } from "../types";
import { colors, radius, spacing } from "../constants/theme";

const PRESET_SET = new Set<string>(EQUIPMENT_PRESETS);

/** Required-equipment picker: toggleable preset chips (Pfanne, Ofen, Air
 * Fryer, ...) plus free-text entries for anything not in the preset list. */
export default function EquipmentEditor({
  value,
  onChange,
}: {
  value: string[];
  onChange: (next: string[]) => void;
}) {
  const [draft, setDraft] = useState("");
  const customEntries = value.filter((item) => !PRESET_SET.has(item));

  function toggle(item: string) {
    onChange(value.includes(item) ? value.filter((v) => v !== item) : [...value, item]);
  }

  function addCustom() {
    const item = draft.trim();
    if (!item) return;
    if (value.some((v) => v.toLowerCase() === item.toLowerCase())) {
      setDraft("");
      return;
    }
    onChange([...value, item]);
    setDraft("");
  }

  function removeCustom(item: string) {
    onChange(value.filter((v) => v !== item));
  }

  return (
    <View>
      <View style={styles.presetWrap}>
        {EQUIPMENT_PRESETS.map((preset) => {
          const selected = value.includes(preset);
          return (
            <TouchableOpacity
              key={preset}
              style={[styles.presetChip, selected && styles.presetChipSelected]}
              onPress={() => toggle(preset)}
            >
              <Text style={[styles.presetChipText, selected && styles.presetChipTextSelected]}>{preset}</Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {!!customEntries.length && (
        <View style={styles.customWrap}>
          {customEntries.map((item) => (
            <TouchableOpacity key={item} style={styles.customChip} onPress={() => removeCustom(item)} activeOpacity={0.7}>
              <Text style={styles.customChipText}>{item}</Text>
              <Ionicons name="close" size={12} color={colors.textPrimary} />
            </TouchableOpacity>
          ))}
        </View>
      )}

      <View style={styles.addRow}>
        <TextInput
          style={styles.addInput}
          placeholder="Eigenes Gerät, z. B. Reiskocher"
          placeholderTextColor={colors.textMuted}
          value={draft}
          onChangeText={setDraft}
          onSubmitEditing={addCustom}
        />
        <TouchableOpacity style={styles.addButton} onPress={addCustom} activeOpacity={0.8}>
          <Ionicons name="add" size={22} color={colors.textOnDark} />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  presetWrap: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm, marginBottom: spacing.sm },
  presetChip: { borderRadius: radius.pill, paddingVertical: spacing.sm, paddingHorizontal: spacing.md, backgroundColor: colors.chipInactiveBg },
  presetChipSelected: { backgroundColor: colors.primary },
  presetChipText: { color: colors.chipInactiveText, fontSize: 12, fontWeight: "600" },
  presetChipTextSelected: { color: colors.textOnDark },
  customWrap: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm, marginBottom: spacing.md },
  customChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: colors.bgAlt,
    borderRadius: radius.pill,
    paddingVertical: spacing.sm - 1,
    paddingHorizontal: spacing.md,
  },
  customChipText: { color: colors.textPrimary, fontSize: 12, fontWeight: "600" },
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
