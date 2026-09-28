import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { Image, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { colors, radius, spacing } from "../constants/theme";

/** Optional photo attach/change/remove control for the add/edit favorite recipe screens. */
export default function RecipeImagePicker({
  uri,
  onPick,
  onRemove,
}: {
  uri: string | null;
  onPick: () => void;
  onRemove: () => void;
}) {
  if (uri) {
    return (
      <View style={styles.previewWrap}>
        <Image source={{ uri }} style={styles.preview} />
        <View style={styles.previewActions}>
          <TouchableOpacity style={styles.previewButton} onPress={onPick} activeOpacity={0.85}>
            <Ionicons name="camera-outline" size={15} color={colors.textOnDark} />
            <Text style={styles.previewButtonText}>Ändern</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.previewButton, styles.removeButton]} onPress={onRemove} activeOpacity={0.85}>
            <Ionicons name="trash-outline" size={15} color={colors.textOnDark} />
            <Text style={styles.previewButtonText}>Entfernen</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <TouchableOpacity style={styles.placeholder} onPress={onPick} activeOpacity={0.8}>
      <Ionicons name="camera-outline" size={22} color={colors.primary} />
      <Text style={styles.placeholderText}>Foto hinzufügen (optional)</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  placeholder: {
    height: 120,
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderStyle: "dashed",
    backgroundColor: colors.bgAlt,
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
    marginBottom: spacing.xl,
  },
  placeholderText: { fontSize: 13, color: colors.primary, fontWeight: "700" },
  previewWrap: { marginBottom: spacing.xl },
  preview: { width: "100%", height: 180, borderRadius: radius.card, backgroundColor: colors.bgAlt },
  previewActions: { flexDirection: "row", gap: spacing.sm, marginTop: spacing.sm },
  previewButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: colors.primary,
    borderRadius: radius.control,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
  },
  removeButton: { backgroundColor: colors.danger },
  previewButtonText: { color: colors.textOnDark, fontSize: 12, fontWeight: "700" },
});
