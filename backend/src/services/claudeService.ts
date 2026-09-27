import Anthropic from "@anthropic-ai/sdk";
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";
import { config } from "../config.js";
import { FridgeAnalysisSchema, type FridgeAnalysis } from "../schemas/fridgeItems.js";
import { RecipeGenerationResultSchema, type RecipeGenerationResult } from "../schemas/recipe.js";
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
      "fridge, freezer, or pantry and list every distinct food item you can identify. " +
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
      "person has available and their preferences, propose 2-4 realistic recipes they can " +
      "actually cook. Prioritize recipes that use mostly what they already have - list any " +
      "additional required ingredients in missingIngredients. Respect allergies and disliked " +
      "ingredients absolutely; treat other preferences as strong guidance. Keep instructions " +
      "clear and numbered. Give honest, reasonable nutrition estimates per serving. Respond " +
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
