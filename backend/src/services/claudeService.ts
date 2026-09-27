import Anthropic from "@anthropic-ai/sdk";
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";
import { config } from "../config.js";
import { FridgeAnalysisSchema, type FridgeAnalysis } from "../schemas/fridgeItems.js";
import { RecipeGenerationResultSchema, RecipeSchema, type RecipeGenerationResult, type Recipe } from "../schemas/recipe.js";
import type { FridgeItem } from "../schemas/fridgeItems.js";
import type { RecipePreferences } from "../types.js";

const MODEL = "claude-opus-5";

let client: Anthropic | null = null;

function getClient(): Anthropic {
  if (!client) {
    client = new Anthropic({ apiKey: config.anthropicApiKey });
  }
  return client;
}

/** Supported inbound image mime types for the vision request. */
export type ImageMediaType = "image/jpeg" | "image/png" | "image/webp" | "image/gif";

/**
 * Sends a fridge/pantry photo to Claude and asks it to identify visible food items.
 */
export async function analyzeFridgeImage(
  imageBase64: string,
  mediaType: ImageMediaType
): Promise<FridgeAnalysis> {
  const response = await getClient().messages.parse({
    model: MODEL,
    max_tokens: 4096,
    system:
      "You are a meticulous kitchen inventory assistant. Look carefully at the photo of a " +
      "fridge, freezer, pantry, kitchen cupboard, or other food storage and list every " +
      "distinct food item you can identify. " +
      "Group identical items together instead of listing them multiple times. Ignore " +
      "non-food objects (containers, shelves, packaging brands) unless the food inside is " +
      "identifiable. If the image is blurry or a shelf is hard to see, do your best and use " +
      "the notes field to say so - never refuse to answer. Respond entirely in German " +
      "(item names, categories are fixed enum values, quantity estimates, and any notes must " +
      "be in natural German).",
    messages: [
      {
        role: "user",
        content: [
          {
            type: "image",
            source: { type: "base64", media_type: mediaType, data: imageBase64 },
          },
          {
            type: "text",
            text: "Identify every food item visible in this fridge/pantry photo.",
          },
        ],
      },
    ],
    output_config: {
      format: zodOutputFormat(FridgeAnalysisSchema),
    },
  });

  if (!response.parsed_output) {
    throw new Error("Claude did not return a parsable fridge analysis.");
  }
  return response.parsed_output;
}

function formatPreferences(prefs: RecipePreferences): string {
  const lines: string[] = [];
  if (prefs.goal) lines.push(`Goal: ${prefs.goal}`);
  if (prefs.diet) lines.push(`Diet style: ${prefs.diet}`);
  if (prefs.allergies?.length) lines.push(`Strictly avoid (allergies): ${prefs.allergies.join(", ")}`);
  if (prefs.dislikedIngredients?.length)
    lines.push(`Avoid if possible (dislikes): ${prefs.dislikedIngredients.join(", ")}`);
  if (prefs.cuisines?.length) lines.push(`Preferred cuisines: ${prefs.cuisines.join(", ")}`);
  if (prefs.maxTimeMinutes) lines.push(`Max total time: ${prefs.maxTimeMinutes} minutes`);
  if (prefs.servings) lines.push(`Servings needed: ${prefs.servings}`);
  if (prefs.targetCaloriesPerServing)
    lines.push(`Target calories per serving: ~${prefs.targetCaloriesPerServing} kcal`);
  if (prefs.notes) lines.push(`Additional notes: ${prefs.notes}`);
  return lines.length ? lines.join("\n") : "No specific preferences - surprise me with something tasty and balanced.";
}

/**
 * Generates recipe suggestions from a list of available ingredients and the user's preferences.
 */
export async function generateRecipes(
  items: FridgeItem[],
  preferences: RecipePreferences
): Promise<RecipeGenerationResult> {
  const ingredientList = items
    .map((item) => `- ${item.name} (${item.estimatedQuantity}, ${item.category})`)
    .join("\n");

  const response = await getClient().messages.parse({
    model: MODEL,
    max_tokens: 8192,
    system:
      "You are a creative, practical home-cooking assistant. Given a list of ingredients a " +
      "person has available and their preferences, propose 3-5 realistic recipes they can " +
      "actually cook, split into two groups:\n" +
      "1. First, one or more recipes that can be made using ONLY the given ingredients (plus " +
      "basic staples like water, salt, pepper, oil which never count as missing). For these, " +
      "missingIngredients MUST be an empty array. Include as many of these as realistically " +
      "possible - this group matters most.\n" +
      "2. Then, additional recipes that would need a few more ingredients the person doesn't " +
      "have - list exactly what's missing in missingIngredients for those, and always include " +
      "the amount needed for each (e.g. '2 Zucchini', '500g Tomaten'), never just the bare name, " +
      "since this list is used to build a shopping list.\n" +
      "Order the recipes array with group 1 first, then group 2. Respect allergies and disliked " +
      "ingredients absolutely; treat other preferences as strong guidance. Keep instructions " +
      "clear and numbered. Give honest, reasonable nutrition estimates per serving. Assign each " +
      "recipe the meal-type category that fits it best. Respond " +
      "entirely in German - titles, descriptions, ingredient names and amounts, tags, " +
      "missingIngredients, and every instruction step must be written in natural German.",
    messages: [
      {
        role: "user",
        content:
          `Available ingredients (from a photo of my fridge/pantry):\n${ingredientList || "(none detected - suggest simple pantry-staple recipes)"}\n\n` +
          `My preferences:\n${formatPreferences(preferences)}\n\n` +
          "Suggest recipes I can make now.",
      },
    ],
    output_config: {
      format: zodOutputFormat(RecipeGenerationResultSchema),
    },
  });

  if (!response.parsed_output) {
    throw new Error("Claude did not return parsable recipes.");
  }
  return response.parsed_output;
}

export interface RecipeDraft {
  title: string;
  ingredientLines: string[];
  preparationNotes: string;
  servings?: number;
}

/**
 * Turns a user's own rough recipe idea (title, free-text ingredient lines, a short note on
 * how it's prepared) into a complete, well-structured recipe - used for manually adding a
 * recipe to favorites without going through fridge detection first.
 */
export async function refineRecipe(draft: RecipeDraft): Promise<Recipe> {
  const ingredientList = draft.ingredientLines.map((line) => `- ${line}`).join("\n");

  const response = await getClient().messages.parse({
    model: MODEL,
    max_tokens: 4096,
    system:
      "You are a professional recipe editor. The user gives you their own recipe idea: a " +
      "title, a rough free-text ingredient list (parse each line into a structured " +
      "ingredient with a name and an amount), and brief notes on how it's prepared. Turn " +
      "this into a complete, polished recipe: sensible step-by-step instructions, a " +
      "reasonable difficulty, prep/cook time estimates, and honest nutrition estimates per " +
      "serving. This is the user's own recipe, not a fridge-based suggestion, so mark every " +
      "ingredient fromFridge: true and leave missingIngredients empty. Assign the meal-type " +
      "category that fits best. Keep their original " +
      "title and intent - refine and complete it, don't reinvent it. Respond entirely in " +
      "German.",
    messages: [
      {
        role: "user",
        content:
          `Rezepttitel: ${draft.title}\n\n` +
          `Zutaten:\n${ingredientList}\n\n` +
          `Zubereitung (Notizen des Nutzers): ${draft.preparationNotes || "(keine weiteren Angaben)"}\n\n` +
          (draft.servings ? `Portionen: ${draft.servings}\n\n` : "") +
          "Vervollständige dieses Rezept.",
      },
    ],
    output_config: {
      format: zodOutputFormat(RecipeSchema),
    },
  });

  if (!response.parsed_output) {
    throw new Error("Claude did not return a parsable recipe.");
  }
  return response.parsed_output;
}
