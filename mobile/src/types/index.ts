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
  /** Desired number of recipe suggestions (1-14). The AI may return fewer if quality would suffer. */
  recipeCount?: number;
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

export type RecipeCategory =
  | "fruehstueck"
  | "hauptgericht"
  | "vorspeise"
  | "beilage"
  | "dessert"
  | "snack"
  | "getraenk"
  | "sonstiges";

export interface Recipe {
  title: string;
  description: string;
  category: RecipeCategory;
  prepTimeMinutes: number;
  cookTimeMinutes: number;
  servings: number;
  difficulty: "easy" | "medium" | "hard";
  tags: string[];
  ingredients: RecipeIngredient[];
  missingIngredients: string[];
  instructions: string[];
  nutrition: Nutrition;
  /** Photo of the cooked dish, added by the user after saving as a favorite. Not set for AI suggestions. */
  imageUrl?: string;
  /** Kitchen equipment needed to cook this (Pfanne, Ofen, Air Fryer, ...). */
  requiredEquipment: string[];
}

export interface RecipeGenerationResult {
  recipes: Recipe[];
}

/** A recipe the user has saved, with a stable id and save timestamp. */
export interface FavoriteRecipe extends Recipe {
  id: string;
  savedAt: number;
  /** Set when this favorite was published to the Community - lets later
   * edits here be pushed to that Community post too (one-way sync). */
  communityRecipeId?: string;
}

/** A recipe published to the Community - visible to every user, independent
 * of household. Unlike Recipe/FavoriteRecipe it has no missingIngredients
 * (that's a pantry-scan concept); a match % against the local pantry is
 * computed client-side instead, see utils/ingredientMatch. */
export interface CommunityRecipe {
  id: string;
  authorId: string;
  authorName: string;
  title: string;
  description: string;
  category: RecipeCategory;
  prepTimeMinutes: number;
  cookTimeMinutes: number;
  servings: number;
  difficulty: Recipe["difficulty"];
  tags: string[];
  ingredients: RecipeIngredient[];
  instructions: string[];
  nutrition: Nutrition;
  imageUrl?: string;
  requiredEquipment: string[];
  avgRating: number;
  ratingCount: number;
  createdAt: number;
}

export interface CommunityComment {
  id: string;
  recipeId: string;
  userId: string;
  authorName: string;
  text: string;
  createdAt: number;
}

export interface Profile {
  id: string;
  displayName: string;
}

/** A single entry on the shopping list. */
export interface ShoppingListItem {
  id: string;
  text: string;
  checked: boolean;
  addedAt: number;
  /** Name of the recipe this item was added from, if any. */
  source?: string;
}

/** German display labels for food categories. */
export const CATEGORY_LABELS: Record<FoodCategory, string> = {
  vegetable: "Gemüse",
  fruit: "Obst",
  dairy: "Milchprodukt",
  meat: "Fleisch",
  fish: "Fisch",
  grain: "Getreide",
  condiment: "Gewürz/Sauce",
  beverage: "Getränk",
  spice: "Gewürz",
  other: "Sonstiges",
};

/** German display labels for recipe difficulty. */
export const DIFFICULTY_LABELS: Record<Recipe["difficulty"], string> = {
  easy: "Einfach",
  medium: "Mittel",
  hard: "Anspruchsvoll",
};

/** German display labels for recipe categories. */
export const RECIPE_CATEGORY_LABELS: Record<RecipeCategory, string> = {
  fruehstueck: "Frühstück",
  hauptgericht: "Hauptgericht",
  vorspeise: "Vorspeise",
  beilage: "Beilage",
  dessert: "Dessert",
  snack: "Snack",
  getraenk: "Getränk",
  sonstiges: "Sonstiges",
};

export const RECIPE_CATEGORIES: RecipeCategory[] = [
  "fruehstueck",
  "hauptgericht",
  "vorspeise",
  "beilage",
  "dessert",
  "snack",
  "getraenk",
  "sonstiges",
];

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

/** Preset kitchen equipment shown as quick-pick chips when tagging a recipe;
 * users can add their own beyond this list too. */
export const EQUIPMENT_PRESETS = [
  "Pfanne",
  "Topf",
  "Backofen",
  "Mikrowelle",
  "Air Fryer",
  "Ninja Creami",
  "Grill",
  "Standmixer",
  "Stabmixer",
  "Küchenmaschine",
  "Toaster",
  "Wasserkocher",
  "Sous-Vide-Gerät",
  "Dampfgarer",
  "Slow Cooker",
  "Brotbackautomat",
  "Reiskocher",
  "Waffeleisen",
] as const;
