import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { FlatList, Image, StyleSheet, Text, TouchableOpacity, View } from "react-native";
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
        const metaLine = [
          item.prepTimeMinutes + item.cookTimeMinutes ? `${item.prepTimeMinutes + item.cookTimeMinutes} min` : null,
          `${item.servings} Port.`,
          item.nutrition.calories ? `${item.nutrition.calories} kcal` : null,
        ]
          .filter(Boolean)
          .join(" · ");

        return (
          <TouchableOpacity
            style={styles.card}
            onPress={() => navigation.navigate("RecipeDetail", { recipe: item })}
            activeOpacity={0.85}
          >
            {item.imageUrl ? (
              <Image source={{ uri: item.imageUrl }} style={styles.cardImage} />
            ) : (
              <View style={styles.cardImageFallback}>
                <Ionicons name="restaurant" size={22} color={colors.primary} />
              </View>
            )}
            <View style={styles.cardBody}>
              <Text style={styles.categoryBadge}>{RECIPE_CATEGORY_LABELS[item.category]}</Text>
              <Text style={styles.title} numberOfLines={2}>
                {item.title}
              </Text>
              <Text style={styles.metaLine} numberOfLines={1}>
                {metaLine}
              </Text>
            </View>
            <TouchableOpacity onPress={() => toggleFavorite(item)} hitSlop={10} style={styles.favoriteButton}>
              <Ionicons name={favorite ? "heart" : "heart-outline"} size={19} color={favorite ? colors.danger : colors.textMuted} />
            </TouchableOpacity>
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
    flexDirection: "row",
    alignItems: "flex-start",
    backgroundColor: colors.surface,
    borderRadius: radius.card,
    padding: spacing.md,
    marginBottom: spacing.md,
    gap: spacing.md,
    ...shadow.soft,
  },
  cardImage: { width: 64, height: 64, borderRadius: radius.control, backgroundColor: colors.bgAlt },
  cardImageFallback: {
    width: 64,
    height: 64,
    borderRadius: radius.control,
    backgroundColor: colors.bgAlt,
    alignItems: "center",
    justifyContent: "center",
  },
  cardBody: { flex: 1 },
  favoriteButton: { padding: 2 },
  categoryBadge: { fontSize: 11, color: colors.primary, fontWeight: "700", marginBottom: 2, textTransform: "uppercase" },
  title: { fontSize: 15, fontWeight: "800", color: colors.textPrimary, lineHeight: 19 },
  metaLine: { fontSize: 12, color: colors.textSecondary, marginTop: 4 },
});
