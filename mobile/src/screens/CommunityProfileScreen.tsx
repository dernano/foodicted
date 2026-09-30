import { Ionicons } from "@expo/vector-icons";
import React, { useEffect, useState } from "react";
import { ActivityIndicator, FlatList, Image, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import type { RootStackScreenProps } from "../navigation";
import { fetchCommunityRecipesByAuthor, fetchProfileVisibility } from "../api/community";
import { useAuth } from "../context/AuthContext";
import { RECIPE_CATEGORY_LABELS, type CommunityRecipe } from "../types";
import { colors, radius, shadow, spacing, type as t } from "../constants/theme";

type Props = RootStackScreenProps<"CommunityProfile">;

export default function CommunityProfileScreen({ route, navigation }: Props) {
  const { authorId, authorName } = route.params;
  const { session } = useAuth();
  const isOwnProfile = session?.user.id === authorId;
  const [recipes, setRecipes] = useState<CommunityRecipe[]>([]);
  const [visible, setVisible] = useState<boolean | null>(null);
  const [isPublic, setIsPublic] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const profile = await fetchProfileVisibility(authorId);
        const canView = isOwnProfile || profile.isPublic;
        setIsPublic(profile.isPublic);
        setVisible(canView);
        if (canView) setRecipes(await fetchCommunityRecipesByAuthor(authorId));
      } catch (err) {
        console.warn("Failed to load profile", err);
        setVisible(isOwnProfile);
      } finally {
        setLoading(false);
      }
    })();
  }, [authorId, isOwnProfile]);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  if (!visible) {
    return (
      <View style={styles.loadingContainer}>
        <Ionicons name="lock-closed-outline" size={32} color={colors.textMuted} />
        <Text style={styles.privateText}>Dieses Profil ist privat.</Text>
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
          {isOwnProfile && !isPublic && (
            <Text style={styles.ownHint}>
              Nur du siehst diese Liste gerade - aktiviere "Community-Profil öffentlich" in deinem Konto, damit
              andere sie auch sehen können.
            </Text>
          )}
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
  ownHint: { fontSize: 12, color: colors.textMuted, textAlign: "center", marginTop: spacing.sm, paddingHorizontal: spacing.xl, lineHeight: 17 },
  privateText: { fontSize: 14, color: colors.textMuted, marginTop: spacing.md },
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
