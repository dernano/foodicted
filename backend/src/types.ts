/** User-configurable recipe preferences, set in the app before generating recipes. */
export interface RecipePreferences {
  /** Free-text or preset goal, e.g. "healthy", "high-protein", "quick weeknight dinner" */
  goal?: string;
  /** Diet style, e.g. "vegetarian", "vegan", "keto", "none" */
  diet?: string;
  /** Ingredients/allergens to strictly avoid */
  allergies?: string[];
  /** Ingredients the user dislikes but isn't allergic to */
  dislikedIngredients?: string[];
  /** Preferred cuisines, e.g. ["Italian", "Thai"] */
  cuisines?: string[];
  /** Maximum total time in minutes (prep + cook) */
  maxTimeMinutes?: number;
  /** Number of people to cook for */
  servings?: number;
  /** Target calorie range per serving, optional */
  targetCaloriesPerServing?: number;
  /** Any other free-text preference */
  notes?: string;
  /** Desired number of recipe suggestions (1-14). The AI may return fewer if quality would suffer. */
  recipeCount?: number;
}
