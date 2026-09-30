import { supabase } from "../lib/supabase";
import type { CommunityComment, CommunityRecipe, Nutrition, Recipe, RecipeCategory, RecipeIngredient } from "../types";

const FALLBACK_AUTHOR_NAME = "Foodicted-Nutzer";

interface CommunityRecipeRow {
  id: string;
  author_id: string;
  title: string;
  description: string;
  prep_time_minutes: number;
  cook_time_minutes: number;
  servings: number;
  category: string;
  difficulty: string;
  tags: string[];
  ingredients: RecipeIngredient[];
  instructions: string[];
  nutrition: Nutrition;
  image_url: string | null;
  created_at: string;
  avg_rating: number | null;
  rating_count: number | null;
}

interface CommentRow {
  id: string;
  recipe_id: string;
  user_id: string;
  text: string;
  created_at: string;
}

function rowToCommunityRecipe(row: CommunityRecipeRow, authorName: string): CommunityRecipe {
  return {
    id: row.id,
    authorId: row.author_id,
    authorName,
    title: row.title,
    description: row.description,
    category: (row.category as RecipeCategory) || "sonstiges",
    prepTimeMinutes: row.prep_time_minutes,
    cookTimeMinutes: row.cook_time_minutes,
    servings: row.servings,
    difficulty: (row.difficulty as Recipe["difficulty"]) || "medium",
    tags: row.tags ?? [],
    ingredients: row.ingredients ?? [],
    instructions: row.instructions ?? [],
    nutrition: row.nutrition ?? { calories: 0, proteinGrams: 0, carbsGrams: 0, fatGrams: 0 },
    imageUrl: row.image_url ?? undefined,
    avgRating: Number(row.avg_rating ?? 0),
    ratingCount: Number(row.rating_count ?? 0),
    createdAt: new Date(row.created_at).getTime(),
  };
}

/** Profiles don't have a foreign-key relationship PostgREST can embed (both
 * community_recipes.author_id and profiles.id independently reference
 * auth.users), so author names are resolved with a second batched query. */
async function fetchAuthorNames(userIds: string[]): Promise<Map<string, string>> {
  const unique = Array.from(new Set(userIds));
  if (!unique.length) return new Map();
  const { data, error } = await supabase.from("profiles").select("id, display_name").in("id", unique);
  if (error || !data) return new Map();
  return new Map(data.map((p) => [p.id as string, (p.display_name as string | null) || FALLBACK_AUTHOR_NAME]));
}

function recipeToRow(recipe: Recipe) {
  return {
    title: recipe.title,
    description: recipe.description,
    category: recipe.category,
    prep_time_minutes: recipe.prepTimeMinutes,
    cook_time_minutes: recipe.cookTimeMinutes,
    servings: recipe.servings,
    difficulty: recipe.difficulty,
    tags: recipe.tags,
    ingredients: recipe.ingredients,
    instructions: recipe.instructions,
    nutrition: recipe.nutrition,
    image_url: recipe.imageUrl ?? null,
  };
}

export async function fetchCommunityRecipes(): Promise<CommunityRecipe[]> {
  const { data, error } = await supabase
    .from("community_recipes_with_stats")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(200);
  if (error) throw error;
  const rows = (data ?? []) as CommunityRecipeRow[];
  const names = await fetchAuthorNames(rows.map((r) => r.author_id));
  return rows.map((r) => rowToCommunityRecipe(r, names.get(r.author_id) ?? FALLBACK_AUTHOR_NAME));
}

export async function fetchCommunityRecipesByAuthor(authorId: string): Promise<CommunityRecipe[]> {
  const { data, error } = await supabase
    .from("community_recipes_with_stats")
    .select("*")
    .eq("author_id", authorId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  const rows = (data ?? []) as CommunityRecipeRow[];
  const names = await fetchAuthorNames(rows.map((r) => r.author_id));
  return rows.map((r) => rowToCommunityRecipe(r, names.get(r.author_id) ?? FALLBACK_AUTHOR_NAME));
}

export async function fetchAuthorProfile(authorId: string): Promise<string> {
  const names = await fetchAuthorNames([authorId]);
  return names.get(authorId) ?? FALLBACK_AUTHOR_NAME;
}

export async function publishCommunityRecipe(recipe: Recipe, authorId: string): Promise<CommunityRecipe> {
  const { data, error } = await supabase
    .from("community_recipes")
    .insert({ ...recipeToRow(recipe), author_id: authorId })
    .select("*")
    .single();
  if (error) throw error;
  const authorName = await fetchAuthorProfile(authorId);
  return rowToCommunityRecipe({ ...(data as CommunityRecipeRow), avg_rating: 0, rating_count: 0 }, authorName);
}

export async function updateCommunityRecipe(id: string, recipe: Recipe): Promise<void> {
  const { error } = await supabase.from("community_recipes").update(recipeToRow(recipe)).eq("id", id);
  if (error) throw error;
}

export async function deleteCommunityRecipe(id: string): Promise<void> {
  const { error } = await supabase.from("community_recipes").delete().eq("id", id);
  if (error) throw error;
}

export async function fetchCommunityRecipeStats(id: string): Promise<{ avgRating: number; ratingCount: number }> {
  const { data, error } = await supabase
    .from("community_recipes_with_stats")
    .select("avg_rating, rating_count")
    .eq("id", id)
    .single();
  if (error || !data) return { avgRating: 0, ratingCount: 0 };
  return { avgRating: Number(data.avg_rating ?? 0), ratingCount: Number(data.rating_count ?? 0) };
}

export async function fetchMyRating(recipeId: string, userId: string): Promise<number | null> {
  const { data } = await supabase
    .from("community_recipe_ratings")
    .select("rating")
    .eq("recipe_id", recipeId)
    .eq("user_id", userId)
    .maybeSingle();
  return data ? (data.rating as number) : null;
}

/** Upsert: a user rates a recipe at most once, re-rating just updates it. */
export async function setRating(recipeId: string, userId: string, rating: number): Promise<void> {
  const { error } = await supabase
    .from("community_recipe_ratings")
    .upsert({ recipe_id: recipeId, user_id: userId, rating }, { onConflict: "recipe_id,user_id" });
  if (error) throw error;
}

export async function fetchComments(recipeId: string): Promise<CommunityComment[]> {
  const { data, error } = await supabase
    .from("community_recipe_comments")
    .select("*")
    .eq("recipe_id", recipeId)
    .order("created_at", { ascending: true });
  if (error) throw error;
  const rows = (data ?? []) as CommentRow[];
  const names = await fetchAuthorNames(rows.map((r) => r.user_id));
  return rows.map((r) => ({
    id: r.id,
    recipeId: r.recipe_id,
    userId: r.user_id,
    authorName: names.get(r.user_id) ?? FALLBACK_AUTHOR_NAME,
    text: r.text,
    createdAt: new Date(r.created_at).getTime(),
  }));
}

export async function addComment(recipeId: string, userId: string, text: string): Promise<CommunityComment> {
  const { data, error } = await supabase
    .from("community_recipe_comments")
    .insert({ recipe_id: recipeId, user_id: userId, text })
    .select("*")
    .single();
  if (error) throw error;
  const authorName = await fetchAuthorProfile(userId);
  const row = data as CommentRow;
  return {
    id: row.id,
    recipeId: row.recipe_id,
    userId: row.user_id,
    authorName,
    text: row.text,
    createdAt: new Date(row.created_at).getTime(),
  };
}

export async function deleteComment(id: string): Promise<void> {
  const { error } = await supabase.from("community_recipe_comments").delete().eq("id", id);
  if (error) throw error;
}
