export type FoodCategory =
  | "vegetable"
  | "fruit"
  | "dairy"
  | "meat"
  | "fish"
  | "grain"
  | "condiment"
  | "beverage"
  | "spice"
  | "other";

export interface FridgeItem {
  name: string;
  category: FoodCategory;
  estimatedQuantity: string;
  confidence: number;
}

export interface FridgeAnalysis {
  items: FridgeItem[];
  notes?: string;
}

export interface RecipePreferences {
  goal?: string;
  diet?: string;
  allergies?: string[];
  dislikedIngredients?: string[];
  cuisines?: string[];
  maxTimeMinutes?: number;
  servings?: number;
  targetCaloriesPerServing?: number;
  notes?: string;
}

export interface Nutrition {
  calories: number;
  proteinGrams: number;
  carbsGrams: number;
  fatGrams: number;
}

export interface RecipeIngredient {
  name: string;
  amount: string;
  fromFridge: boolean;
}

export interface Recipe {
  title: string;
  description: string;
  prepTimeMinutes: number;
  cookTimeMinutes: number;
  servings: number;
  difficulty: "easy" | "medium" | "hard";
  tags: string[];
  ingredients: RecipeIngredient[];
  missingIngredients: string[];
  instructions: string[];
  nutrition: Nutrition;
}

export interface RecipeGenerationResult {
  recipes: Recipe[];
}

/** Preset goals shown as quick-pick chips in the preferences screen. */
export const GOAL_PRESETS = [
  "Gesund & ausgewogen",
  "Eiweißreich",
  "Kalorienarm",
  "Schnell & einfach",
  "Vegetarisch",
  "Low-Carb",
] as const;

export const DIET_PRESETS = [
  "Keine Einschränkung",
  "Vegetarisch",
  "Vegan",
  "Pescetarisch",
  "Low-Carb",
  "Keto",
] as const;
