import { Ionicons } from "@expo/vector-icons";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  ImageBackground,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import type { RootStackScreenProps } from "../navigation";
import {
  addComment,
  deleteComment,
  deleteCommunityRecipe,
  fetchComments,
  fetchCommunityRecipeStats,
  fetchMyRating,
  setRating,
} from "../api/community";
import { useAuth } from "../context/AuthContext";
import { useFavorites } from "../context/FavoritesContext";
import { usePantry } from "../context/PantryContext";
import { useShoppingList } from "../context/ShoppingListContext";
import { ingredientPresent } from "../utils/ingredientMatch";
import { DIFFICULTY_LABELS, RECIPE_CATEGORY_LABELS, type CommunityComment, type Recipe } from "../types";
import { colors, radius, shadow, spacing, type as t } from "../constants/theme";

type Props = RootStackScreenProps<"CommunityRecipeDetail">;

function hasNutritionData(n: { calories: number; proteinGrams: number; carbsGrams: number; fatGrams: number }): boolean {
  return n.calories > 0 || n.proteinGrams > 0 || n.carbsGrams > 0 || n.fatGrams > 0;
}

function StarPicker({ value, onChange, size = 26 }: { value: number; onChange: (v: number) => void; size?: number }) {
  return (
    <View style={{ flexDirection: "row", gap: 4 }}>
      {[1, 2, 3, 4, 5].map((i) => (
        <TouchableOpacity key={i} onPress={() => onChange(i)} hitSlop={6}>
          <Ionicons name={value >= i ? "star" : "star-outline"} size={size} color={colors.attention} />
        </TouchableOpacity>
      ))}
    </View>
  );
}

export default function CommunityRecipeDetailScreen({ route, navigation }: Props) {
  const { recipe } = route.params;
  const { session } = useAuth();
  const { isFavorite, toggleFavorite } = useFavorites();
  const { pantry } = usePantry();
  const { addItems } = useShoppingList();

  const [avgRating, setAvgRating] = useState(recipe.avgRating);
  const [ratingCount, setRatingCount] = useState(recipe.ratingCount);
  const [myRating, setMyRating] = useState<number | null>(null);
  const [comments, setComments] = useState<CommunityComment[]>([]);
  const [commentDraft, setCommentDraft] = useState("");
  const [loadingComments, setLoadingComments] = useState(true);
  const [busy, setBusy] = useState(false);

  const asFavoriteCandidate: Recipe = useMemo(
    () => ({
      title: recipe.title,
      description: recipe.description,
      category: recipe.category,
      prepTimeMinutes: recipe.prepTimeMinutes,
      cookTimeMinutes: recipe.cookTimeMinutes,
      servings: recipe.servings,
      difficulty: recipe.difficulty,
      tags: recipe.tags,
      ingredients: recipe.ingredients,
      missingIngredients: [],
      instructions: recipe.instructions,
      nutrition: recipe.nutrition,
      imageUrl: recipe.imageUrl,
    }),
    [recipe]
  );
  const favorite = isFavorite(asFavoriteCandidate);
  const isOwner = session?.user.id === recipe.authorId;

  const pantryNames = useMemo(() => pantry.items.map((i) => i.name), [pantry.items]);
  const ingredientChecks = useMemo(
    () =>
      recipe.ingredients.map((ingredient) => ({
        ingredient,
        present: pantryNames.length ? ingredientPresent(ingredient.name, pantryNames) : null,
      })),
    [recipe.ingredients, pantryNames]
  );
  const presentCount = ingredientChecks.filter((c) => c.present).length;

  const loadComments = useCallback(async () => {
    try {
      setComments(await fetchComments(recipe.id));
    } catch (err) {
      console.warn("Failed to load comments", err);
    } finally {
      setLoadingComments(false);
    }
  }, [recipe.id]);

  useEffect(() => {
    loadComments();
    if (session) fetchMyRating(recipe.id, session.user.id).then(setMyRating);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [recipe.id, session?.user.id]);

  async function handleRate(value: number) {
    if (!session) {
      Alert.alert("Anmeldung nötig", "Melde dich an, um Rezepte zu bewerten.");
      return;
    }
    setMyRating(value);
    try {
      await setRating(recipe.id, session.user.id, value);
      const stats = await fetchCommunityRecipeStats(recipe.id);
      setAvgRating(stats.avgRating);
      setRatingCount(stats.ratingCount);
    } catch (err) {
      Alert.alert("Fehler", "Bewertung konnte nicht gespeichert werden.");
    }
  }

  async function handleAddComment() {
    const text = commentDraft.trim();
    if (!text) return;
    if (!session) {
      Alert.alert("Anmeldung nötig", "Melde dich an, um zu kommentieren.");
      return;
    }
    setBusy(true);
    try {
      const created = await addComment(recipe.id, session.user.id, text);
      setComments((prev) => [...prev, created]);
      setCommentDraft("");
    } catch (err) {
      Alert.alert("Fehler", "Kommentar konnte nicht gespeichert werden.");
    } finally {
      setBusy(false);
    }
  }

  function confirmDeleteComment(comment: CommunityComment) {
    Alert.alert("Kommentar löschen?", undefined, [
      { text: "Abbrechen", style: "cancel" },
      {
        text: "Löschen",
        style: "destructive",
        onPress: async () => {
          await deleteComment(comment.id);
          setComments((prev) => prev.filter((c) => c.id !== comment.id));
        },
      },
    ]);
  }

  function confirmDeleteRecipe() {
    Alert.alert("Rezept löschen?", `„${recipe.title}" wird für alle entfernt.`, [
      { text: "Abbrechen", style: "cancel" },
      {
        text: "Löschen",
        style: "destructive",
        onPress: async () => {
          await deleteCommunityRecipe(recipe.id);
          navigation.goBack();
        },
      },
    ]);
  }

  function addToShoppingList() {
    addItems(
      recipe.ingredients.map((i) => `${i.amount} ${i.name}`.trim()),
      recipe.title
    );
    Alert.alert("Hinzugefügt", "Die Zutaten wurden zu deiner Einkaufsliste hinzugefügt.");
  }

  const heroContent = (
    <>
      <View style={styles.heroTopRow}>
        <Text style={styles.categoryBadge}>{RECIPE_CATEGORY_LABELS[recipe.category]}</Text>
        <View style={styles.titleActions}>
          {isOwner && (
            <TouchableOpacity onPress={() => navigation.navigate("PublishCommunityRecipe", { recipe })} hitSlop={10}>
              <Ionicons name="create-outline" size={22} color={colors.textOnDark} />
            </TouchableOpacity>
          )}
          <TouchableOpacity onPress={() => toggleFavorite(asFavoriteCandidate)} hitSlop={10}>
            <Ionicons name={favorite ? "heart" : "heart-outline"} size={22} color={favorite ? colors.danger : colors.textOnDark} />
          </TouchableOpacity>
        </View>
      </View>
      <Text style={styles.title}>{recipe.title}</Text>
      <TouchableOpacity
        onPress={() => navigation.navigate("CommunityProfile", { authorId: recipe.authorId, authorName: recipe.authorName })}
      >
        <Text style={styles.authorLink}>von {recipe.authorName}</Text>
      </TouchableOpacity>
      <Text style={styles.description}>{recipe.description}</Text>
      {!!recipe.tags.length && (
        <View style={styles.tagRow}>
          {recipe.tags.map((tag) => (
            <View key={tag} style={styles.tagPill}>
              <Text style={styles.tagPillText}>#{tag}</Text>
            </View>
          ))}
        </View>
      )}
    </>
  );

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 48 }} showsVerticalScrollIndicator={false}>
      {recipe.imageUrl ? (
        <ImageBackground source={{ uri: recipe.imageUrl }} style={[styles.hero, styles.heroWithPhoto]} imageStyle={styles.heroImage}>
          <View style={styles.heroScrim} />
          {heroContent}
        </ImageBackground>
      ) : (
        <View style={styles.hero}>{heroContent}</View>
      )}

      <View style={styles.content}>
        <View style={styles.metaRow}>
          <MetaBox label="Vorbereitung" value={recipe.prepTimeMinutes ? `${recipe.prepTimeMinutes} min` : "-"} />
          <MetaBox label="Kochzeit" value={recipe.cookTimeMinutes ? `${recipe.cookTimeMinutes} min` : "-"} />
          <MetaBox label="Portionen" value={String(recipe.servings)} />
          <MetaBox label="Schwierigkeit" value={DIFFICULTY_LABELS[recipe.difficulty]} />
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Bewertung</Text>
          <View style={styles.ratingSummaryRow}>
            <StarPicker value={Math.round(avgRating)} onChange={() => {}} size={18} />
            <Text style={styles.ratingSummaryText}>
              {avgRating.toFixed(1)} · {ratingCount} {ratingCount === 1 ? "Bewertung" : "Bewertungen"}
            </Text>
          </View>
          <Text style={styles.rateLabel}>{myRating ? "Deine Bewertung" : "Jetzt bewerten"}</Text>
          <StarPicker value={myRating ?? 0} onChange={handleRate} />
        </View>

        {hasNutritionData(recipe.nutrition) && (
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Nährwerte pro Portion</Text>
            <View style={styles.nutritionRow}>
              <NutritionBox label="Kalorien" value={`${recipe.nutrition.calories} kcal`} />
              <NutritionBox label="Protein" value={`${recipe.nutrition.proteinGrams} g`} />
              <NutritionBox label="Kohlenhydrate" value={`${recipe.nutrition.carbsGrams} g`} />
              <NutritionBox label="Fett" value={`${recipe.nutrition.fatGrams} g`} />
            </View>
          </View>
        )}

        <Text style={styles.sectionTitle}>Zutaten</Text>
        <TouchableOpacity style={styles.shareListButton} onPress={addToShoppingList} activeOpacity={0.7}>
          <Ionicons name="cart-outline" size={15} color={colors.primary} />
          <Text style={styles.shareListButtonText}>Zur Einkaufsliste</Text>
        </TouchableOpacity>
        <View style={styles.ingredientsCard}>
          {pantryNames.length ? (
            <Text style={styles.pantrySummary}>
              {presentCount} von {recipe.ingredients.length} Zutaten in deinem Vorrat
            </Text>
          ) : null}
          {ingredientChecks.map(({ ingredient, present }, i) => (
            <View key={i} style={[styles.ingredientRow, i === 0 && styles.ingredientRowFirst]}>
              {present === null ? (
                <View style={styles.ingredientDot} />
              ) : (
                <Ionicons name={present ? "checkmark-circle" : "cart"} size={16} color={present ? colors.primary : colors.attention} />
              )}
              <Text style={styles.ingredientText}>
                {ingredient.amount} {ingredient.name}
              </Text>
            </View>
          ))}
        </View>

        <Text style={styles.sectionTitle}>Zubereitung</Text>
        {recipe.instructions.map((step, i) => (
          <View key={i} style={styles.stepRow}>
            <Text style={styles.stepNumber}>{i + 1}</Text>
            <Text style={styles.stepText}>{step}</Text>
          </View>
        ))}

        <Text style={styles.sectionTitle}>Kommentare</Text>
        {loadingComments ? (
          <ActivityIndicator color={colors.primary} style={{ marginTop: spacing.md }} />
        ) : (
          <View style={styles.card}>
            {comments.length === 0 && <Text style={styles.noCommentsText}>Noch keine Kommentare.</Text>}
            {comments.map((comment, i) => (
              <View key={comment.id} style={[styles.commentRow, i === 0 && styles.commentRowFirst]}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.commentAuthor}>{comment.authorName}</Text>
                  <Text style={styles.commentText}>{comment.text}</Text>
                </View>
                {comment.userId === session?.user.id && (
                  <TouchableOpacity onPress={() => confirmDeleteComment(comment)} hitSlop={10}>
                    <Ionicons name="trash-outline" size={15} color={colors.textMuted} />
                  </TouchableOpacity>
                )}
              </View>
            ))}
            <View style={styles.commentAddRow}>
              <TextInput
                style={styles.commentInput}
                placeholder={session ? "Kommentar schreiben ..." : "Zum Kommentieren anmelden"}
                placeholderTextColor={colors.textMuted}
                value={commentDraft}
                onChangeText={setCommentDraft}
                editable={!!session}
                multiline
              />
              <TouchableOpacity style={styles.commentSendButton} onPress={handleAddComment} disabled={busy} activeOpacity={0.8}>
                <Ionicons name="send" size={16} color={colors.textOnDark} />
              </TouchableOpacity>
            </View>
          </View>
        )}

        {isOwner && (
          <TouchableOpacity style={styles.deleteRecipeButton} onPress={confirmDeleteRecipe}>
            <Ionicons name="trash-outline" size={15} color={colors.danger} />
            <Text style={styles.deleteRecipeText}>Rezept löschen</Text>
          </TouchableOpacity>
        )}
      </View>
    </ScrollView>
  );
}

function MetaBox({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.metaBox}>
      <Text style={styles.metaValue}>{value}</Text>
      <Text style={styles.metaLabel}>{label}</Text>
    </View>
  );
}

function NutritionBox({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.nutritionBox}>
      <Text style={styles.nutritionValue}>{value}</Text>
      <Text style={styles.nutritionLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  hero: {
    backgroundColor: colors.brandDark,
    borderBottomLeftRadius: radius.hero,
    borderBottomRightRadius: radius.hero,
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.lg,
    paddingBottom: spacing.xxl,
    overflow: "hidden",
  },
  heroWithPhoto: { minHeight: 340, justifyContent: "flex-end" },
  heroImage: { borderBottomLeftRadius: radius.hero, borderBottomRightRadius: radius.hero },
  heroScrim: { position: "absolute", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: "rgba(27,67,50,0.6)" },
  heroTopRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  categoryBadge: {
    fontSize: 11,
    color: colors.textOnDark,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    backgroundColor: "rgba(255,255,255,0.14)",
    paddingVertical: 4,
    paddingHorizontal: spacing.sm,
    borderRadius: radius.pill,
    overflow: "hidden",
  },
  titleActions: { flexDirection: "row", alignItems: "center", gap: spacing.md },
  title: { ...t.title, color: colors.textOnDark, marginTop: spacing.md },
  authorLink: { fontSize: 13, color: colors.textOnDarkMuted, marginTop: spacing.xs, fontWeight: "700", textDecorationLine: "underline" },
  description: { ...t.body, color: colors.textOnDarkMuted, marginTop: spacing.sm, lineHeight: 20 },
  tagRow: { flexDirection: "row", flexWrap: "wrap", gap: spacing.xs, marginTop: spacing.md },
  tagPill: { backgroundColor: "rgba(255,255,255,0.14)", borderRadius: radius.pill, paddingVertical: 4, paddingHorizontal: spacing.sm },
  tagPillText: { fontSize: 11, color: colors.textOnDark, fontWeight: "600" },
  content: { padding: spacing.xl },
  metaRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    backgroundColor: colors.surface,
    borderRadius: radius.card,
    paddingVertical: spacing.lg,
    marginTop: -spacing.xxl,
    ...shadow.soft,
  },
  metaBox: { alignItems: "center", flex: 1 },
  metaValue: { fontSize: 15, fontWeight: "700", color: colors.textPrimary },
  metaLabel: { fontSize: 11, color: colors.textMuted, marginTop: 2 },
  card: { backgroundColor: colors.surface, borderRadius: radius.card, padding: spacing.lg, marginTop: spacing.lg, ...shadow.soft },
  sectionTitle: { ...t.section, color: colors.textPrimary, marginTop: spacing.xxl, marginBottom: spacing.md },
  ratingSummaryRow: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
  ratingSummaryText: { fontSize: 13, color: colors.textSecondary, fontWeight: "600" },
  rateLabel: { fontSize: 12, color: colors.textMuted, marginTop: spacing.md, marginBottom: spacing.xs },
  nutritionRow: { flexDirection: "row", justifyContent: "space-between", marginTop: spacing.sm },
  nutritionBox: { alignItems: "center", flex: 1 },
  nutritionValue: { fontSize: 14, fontWeight: "700", color: colors.textPrimary },
  nutritionLabel: { fontSize: 11, color: colors.textMuted, marginTop: 2 },
  shareListButton: { flexDirection: "row", alignItems: "center", gap: 5, marginBottom: spacing.md },
  shareListButtonText: { color: colors.primary, fontSize: 12, fontWeight: "700" },
  ingredientsCard: { backgroundColor: colors.surface, borderRadius: radius.card, padding: spacing.lg, ...shadow.soft },
  pantrySummary: { fontSize: 12, color: colors.primary, fontWeight: "700", marginBottom: spacing.sm },
  ingredientRow: { flexDirection: "row", alignItems: "center", paddingVertical: spacing.xs + 2, gap: spacing.sm },
  ingredientRowFirst: { paddingTop: 0 },
  ingredientDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: colors.border, marginHorizontal: 5 },
  ingredientText: { fontSize: 14, color: colors.textPrimary, flex: 1 },
  stepRow: { flexDirection: "row", alignItems: "flex-start", marginBottom: spacing.md + 2, gap: spacing.md },
  stepNumber: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.primary,
    color: colors.textOnDark,
    fontSize: 12,
    fontWeight: "700",
    textAlign: "center",
    lineHeight: 24,
    overflow: "hidden",
  },
  stepText: { fontSize: 14, color: colors.textPrimary, flex: 1, lineHeight: 20 },
  noCommentsText: { fontSize: 13, color: colors.textMuted, fontStyle: "italic" },
  commentRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: spacing.sm,
    paddingVertical: spacing.sm + 2,
    borderTopWidth: 1,
    borderTopColor: colors.borderAlt,
  },
  commentRowFirst: { borderTopWidth: 0, paddingTop: 0 },
  commentAuthor: { fontSize: 12, fontWeight: "700", color: colors.textPrimary },
  commentText: { fontSize: 13, color: colors.textSecondary, marginTop: 2, lineHeight: 18 },
  commentAddRow: { flexDirection: "row", gap: spacing.sm, marginTop: spacing.md, alignItems: "flex-end" },
  commentInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.control,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 2,
    fontSize: 13,
    color: colors.textPrimary,
    maxHeight: 90,
  },
  commentSendButton: {
    width: 40,
    height: 40,
    borderRadius: radius.control,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  deleteRecipeButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    marginTop: spacing.xxl,
    paddingVertical: spacing.md,
  },
  deleteRecipeText: { color: colors.danger, fontSize: 13, fontWeight: "700" },
});
