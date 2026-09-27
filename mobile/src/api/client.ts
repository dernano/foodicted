import Constants from "expo-constants";
import type { FridgeAnalysis, FridgeItem, Recipe, RecipeGenerationResult, RecipePreferences } from "../types";

function getApiBaseUrl(): string {
  const fromExtra = Constants.expoConfig?.extra?.apiBaseUrl as string | undefined;
  return fromExtra ?? "http://localhost:4000";
}

export const API_BASE_URL = getApiBaseUrl();

async function handleResponse<T>(res: Response): Promise<T> {
  if (!res.ok) {
    let message = `Request failed with status ${res.status}`;
    try {
      const body = await res.json();
      if (typeof body?.error === "string") message = body.error;
    } catch {
      // ignore body parse failure, keep default message
    }
    throw new Error(message);
  }
  return (await res.json()) as T;
}

/**
 * Sends a fridge photo (base64 JPEG) to the backend for AI-based food
 * recognition. Returns the list of detected items.
 */
export async function analyzeFridgePhoto(imageBase64: string): Promise<FridgeAnalysis> {
  const res = await fetch(`${API_BASE_URL}/api/fridge/analyze`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ imageBase64, mediaType: "image/jpeg" }),
  });
  return handleResponse<FridgeAnalysis>(res);
}

/**
 * Requests AI-generated recipes for the given ingredients and preferences.
 */
export async function generateRecipes(
  items: FridgeItem[],
  preferences: RecipePreferences
): Promise<RecipeGenerationResult> {
  const res = await fetch(`${API_BASE_URL}/api/recipes/generate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ items, preferences }),
  });
  return handleResponse<RecipeGenerationResult>(res);
}

export interface RecipeDraft {
  title: string;
  ingredientLines: string[];
  preparationNotes: string;
  servings?: number;
}

/**
 * Turns a user's own rough recipe idea into a complete, structured recipe via AI -
 * used when manually adding a recipe to favorites.
 */
export async function refineRecipe(draft: RecipeDraft): Promise<Recipe> {
  const res = await fetch(`${API_BASE_URL}/api/recipes/refine`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(draft),
  });
  const data = await handleResponse<{ recipe: Recipe }>(res);
  return data.recipe;
}

export interface FoodProduct {
  code: string;
  name: string;
  brand?: string;
  imageUrl?: string;
  nutriments?: {
    energyKcal100g?: number;
    proteins100g?: number;
    carbohydrates100g?: number;
    fat100g?: number;
    sugars100g?: number;
    salt100g?: number;
  };
  nutriScoreGrade?: string;
}

/** Searches the free Open Food Facts database (proxied through our backend). */
export async function searchFood(query: string): Promise<FoodProduct[]> {
  const res = await fetch(`${API_BASE_URL}/api/food/search?q=${encodeURIComponent(query)}`);
  const data = await handleResponse<{ products: FoodProduct[] }>(res);
  return data.products;
}
