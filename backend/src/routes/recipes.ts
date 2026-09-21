import { Router } from "express";
import { z } from "zod";
import { FridgeItemSchema } from "../schemas/fridgeItems.js";
import { generateRecipes } from "../services/claudeService.js";

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
    res.json(result);
  } catch (err) {
    next(err);
  }
});
