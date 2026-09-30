import { Ionicons } from "@expo/vector-icons";
import React, { useEffect, useState } from "react";
import { ActivityIndicator, FlatList, Image, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import type { RootStackScreenProps } from "../navigation";
import { fetchCommunityRecipesByAuthor } from "../api/community";
import { RECIPE_CATEGORY_LABELS, type CommunityRecipe } from "../types";
import { colors, radius, shadow, spacing, type as t } from "../constants/theme";

type Props = RootStackScreenProps<"CommunityProfile">;

export default function CommunityProfileScreen({ route, navigation }: Props) {
  const { authorId, authorName } = route.params;
  const [recipes, setRecipes] = useState<CommunityRecipe[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCommunityRecipesByAuthor(authorId)
      .then(setRecipes)
      .catch((err) => console.warn("Failed to load profile recipes", err))
      .finally(() => setLoading(false));
  }, [authorId]);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  return (
    <FlatList
      style={styles.container}
      contentContainerStyle={{ padding: spacing.lg, paddingBottom: spacing.xxl, flexGrow: 1 }}
      data={recipes}
      keyExtractor={(item) => item.id}
      ListHeaderComponent={
        <View style={styles.header}>
          <View style={styles.avatarCircle}>
            <Ionicons name="person" size={26} color={colors.primary} />
          </View>
          <Text style={styles.authorName}>{authorName}</Text>
          <Text style={styles.recipeCount}>
            {recipes.length} {recipes.length === 1 ? "Rezept" : "Rezepte"} veröffentlicht
          </Text>
        </View>
      }
      ListEmptyComponent={
        <View style={styles.emptyState}>
          <Text style={styles.emptyText}>Noch keine veröffentlichten Rezepte.</Text>
        </View>
      }
      renderItem={({ item }) => (
        <TouchableOpacity
          style={styles.card}
          onPress={() => navigation.navigate("CommunityRecipeDetail", { recipe: item })}
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
            <View style={styles.ratingRow}>
              <Ionicons name="star" size={12} color={colors.attention} />
              <Text style={styles.ratingText}>
                {item.avgRating.toFixed(1)} ({item.ratingCount})
              </Text>
            </View>
          </View>
        </TouchableOpacity>
      )}
    />
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  loadingContainer: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: colors.bg },
  header: { alignItems: "center", marginBottom: spacing.xl, paddingTop: spacing.md },
  avatarCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.bgAlt,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.sm,
  },
  authorName: { ...t.section, color: colors.textPrimary },
  recipeCount: { fontSize: 13, color: colors.textMuted, marginTop: 2 },
  emptyState: { flex: 1, alignItems: "center", justifyContent: "center", paddingTop: 48 },
  emptyText: { fontSize: 14, color: colors.textMuted },
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
  categoryBadge: { fontSize: 11, color: colors.primary, fontWeight: "700", textTransform: "uppercase" },
  title: { fontSize: 15, fontWeight: "800", color: colors.textPrimary, lineHeight: 19, marginTop: 2 },
  ratingRow: { flexDirection: "row", alignItems: "center", gap: 4, marginTop: 4 },
  ratingText: { fontSize: 12, color: colors.textSecondary },
});
