import { z } from "zod";

export const NutritionSchema = z.object({
  calories: z.number().describe("Estimated calories per serving (kcal)"),
  proteinGrams: z.number().describe("Estimated protein per serving in grams"),
  carbsGrams: z.number().describe("Estimated carbohydrates per serving in grams"),
  fatGrams: z.number().describe("Estimated fat per serving in grams"),
});

export const RecipeIngredientSchema = z.object({
  name: z.string(),
  amount: z.string().describe("Amount needed, e.g. '2 cups', '150g', '1 tbsp'"),
  fromFridge: z
    .boolean()
    .describe("True if this ingredient was one of the items detected in the fridge photo"),
});

export const RecipeCategorySchema = z
  .enum(["fruehstueck", "hauptgericht", "vorspeise", "beilage", "dessert", "snack", "getraenk", "sonstiges"])
  .describe(
    "Meal-type category this recipe belongs to, for organizing a recipe collection - " +
      "fruehstueck (breakfast), hauptgericht (main course), vorspeise (starter), " +
      "beilage (side dish), dessert, snack, getraenk (drink), or sonstiges (other)"
  );

export const RecipeSchema = z.object({
  title: z.string(),
  description: z.string().describe("One or two sentence appetizing summary"),
  category: RecipeCategorySchema.default("hauptgericht"),
  prepTimeMinutes: z.number().int().nonnegative(),
  cookTimeMinutes: z.number().int().nonnegative(),
  servings: z.number().int().positive(),
  difficulty: z.enum(["easy", "medium", "hard"]),
  tags: z
    .array(z.string())
    .describe("Diet/preference tags this recipe satisfies, e.g. 'high-protein', 'vegetarian', 'low-carb'"),
  ingredients: z.array(RecipeIngredientSchema),
  missingIngredients: z
    .array(z.string())
    .describe("Ingredients required but NOT present among the detected fridge items"),
  instructions: z.array(z.string()).describe("Ordered step-by-step cooking instructions"),
  nutrition: NutritionSchema,
});

export const RecipeGenerationResultSchema = z.object({
  recipes: z.array(RecipeSchema).describe("2-4 recipe suggestions ranked best-match first"),
});

export type Recipe = z.infer<typeof RecipeSchema>;
export type RecipeGenerationResult = z.infer<typeof RecipeGenerationResultSchema>;
