import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { FlatList, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import type { RootStackScreenProps } from "../navigation";
import { useFavorites } from "../context/FavoritesContext";
import { useRecentRecipes } from "../context/RecentRecipesContext";
import { RECIPE_CATEGORY_LABELS, type Recipe } from "../types";
import { colors, radius, shadow, spacing, type as t } from "../constants/theme";

type Props = RootStackScreenProps<"RecentRecipes">;

export default function RecentRecipesScreen({ navigation }: Props) {
  const { recent } = useRecentRecipes();
  const { isFavorite, toggleFavorite } = useFavorites();

  return (
    <FlatList
      style={styles.container}
      contentContainerStyle={{ padding: spacing.lg, paddingBottom: spacing.xxl }}
      data={recent}
      keyExtractor={(item, i) => `${item.title}-${i}`}
      ListEmptyComponent={
        <View style={styles.emptyState}>
          <View style={styles.emptyIconCircle}>
            <Ionicons name="time-outline" size={28} color={colors.primary} />
          </View>
          <Text style={styles.emptyTitle}>Noch keine Rezepte angesehen</Text>
          <Text style={styles.emptyText}>Rezepte, die du dir ansiehst, landen hier - die letzten 20.</Text>
        </View>
      }
      renderItem={({ item }: { item: Recipe }) => {
        const favorite = isFavorite(item);
        return (
          <TouchableOpacity
            style={styles.card}
            onPress={() => navigation.navigate("RecipeDetail", { recipe: item })}
            activeOpacity={0.85}
          >
            <View style={styles.cardHeader}>
              <View style={{ flex: 1, marginRight: spacing.sm }}>
                <Text style={styles.categoryBadge}>{RECIPE_CATEGORY_LABELS[item.category]}</Text>
                <Text style={styles.title}>{item.title}</Text>
              </View>
              <TouchableOpacity onPress={() => toggleFavorite(item)} hitSlop={10}>
                <Ionicons name={favorite ? "heart" : "heart-outline"} size={20} color={favorite ? colors.danger : colors.textMuted} />
              </TouchableOpacity>
            </View>
            <Text style={styles.description} numberOfLines={2}>
              {item.description}
            </Text>
            <View style={styles.metaRow}>
              <View style={styles.metaItem}>
                <Ionicons name="time-outline" size={13} color={colors.textSecondary} />
                <Text style={styles.metaItemText}>{item.prepTimeMinutes + item.cookTimeMinutes} min</Text>
              </View>
              <View style={styles.metaItem}>
                <Ionicons name="restaurant-outline" size={13} color={colors.textSecondary} />
                <Text style={styles.metaItemText}>{item.servings} Port.</Text>
              </View>
              {!!item.nutrition.calories && (
                <View style={styles.metaItem}>
                  <Ionicons name="flame-outline" size={13} color={colors.textSecondary} />
                  <Text style={styles.metaItemText}>{item.nutrition.calories} kcal</Text>
                </View>
              )}
            </View>
          </TouchableOpacity>
        );
      }}
    />
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  emptyState: { alignItems: "center", justifyContent: "center", paddingTop: 80, paddingHorizontal: 32 },
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
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.card,
    padding: spacing.lg,
    marginBottom: spacing.md + 2,
    ...shadow.soft,
  },
  cardHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" },
  categoryBadge: { fontSize: 11, color: colors.primary, fontWeight: "700", marginBottom: 2, textTransform: "uppercase" },
  title: { fontSize: 16, fontWeight: "800", color: colors.textPrimary },
  description: { fontSize: 13, color: colors.textSecondary, marginTop: spacing.sm, lineHeight: 18 },
  metaRow: { flexDirection: "row", flexWrap: "wrap", gap: spacing.md, marginTop: spacing.md },
  metaItem: { flexDirection: "row", alignItems: "center", gap: 4 },
  metaItemText: { fontSize: 12, color: colors.textSecondary },
});
