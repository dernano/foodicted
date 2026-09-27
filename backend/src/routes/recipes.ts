import { Router } from "express";
import { z } from "zod";
import { FridgeItemSchema } from "../schemas/fridgeItems.js";
import { generateRecipes, refineRecipe } from "../services/claudeService.js";
import { notifyUsage } from "../services/notifyService.js";

export const recipesRouter = Router();

const preferencesSchema = z
  .object({
    goal: z.string().optional(),
    diet: z.string().optional(),
    allergies: z.array(z.string()).optional(),
    dislikedIngredients: z.array(z.string()).optional(),
    cuisines: z.array(z.string()).optional(),
    maxTimeMinutes: z.number().int().positive().optional(),
    servings: z.number().int().positive().optional(),
    targetCaloriesPerServing: z.number().int().positive().optional(),
    notes: z.string().optional(),
    recipeCount: z.number().int().min(1).max(14).optional(),
  })
  .default({});

const generateRequestSchema = z.object({
  items: z.array(FridgeItemSchema).default([]),
  preferences: preferencesSchema,
});

/**
 * POST /api/recipes/generate
 * Body: { items: FridgeItem[], preferences: RecipePreferences }
 */
recipesRouter.post("/generate", async (req, res, next) => {
  try {
    const parsed = generateRequestSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: "Invalid request body", details: parsed.error.flatten() });
      return;
    }
    const { items, preferences } = parsed.data;
    const result = await generateRecipes(items, preferences);
    notifyUsage("Rezepte generiert");
    res.json(result);
  } catch (err) {
    next(err);
  }
});

const refineRequestSchema = z.object({
  title: z.string().min(1),
  ingredientLines: z.array(z.string().min(1)).min(1),
  preparationNotes: z.string().optional().default(""),
  servings: z.number().int().positive().optional(),
});

/**
 * POST /api/recipes/refine
 * Body: { title, ingredientLines, preparationNotes?, servings? }
 * Turns a user's own rough recipe idea into a complete, structured recipe.
 */
recipesRouter.post("/refine", async (req, res, next) => {
  try {
    const parsed = refineRequestSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: "Invalid request body", details: parsed.error.flatten() });
      return;
    }
    const recipe = await refineRecipe(parsed.data);
    notifyUsage("Eigenes Rezept vervollständigt");
    res.json({ recipe });
  } catch (err) {
    next(err);
  }
});
