import { z } from "zod";

/**
 * A single food item detected in a fridge/pantry photo.
 */
export const FridgeItemSchema = z.object({
  name: z.string().describe("Common name of the food item, e.g. 'Eggs' or 'Bell pepper'"),
  category: z
    .enum([
      "vegetable",
      "fruit",
      "dairy",
      "meat",
      "fish",
      "grain",
      "condiment",
      "beverage",
      "spice",
      "other",
    ])
    .describe("Food category"),
  estimatedQuantity: z
    .string()
    .describe("Rough estimate of quantity/amount visible, e.g. '3 pieces', '~500g', 'half full'"),
  confidence: z
    .number()
    .min(0)
    .max(1)
    .describe("Model's confidence that this item was correctly identified, 0-1"),
});

export const FridgeAnalysisSchema = z.object({
  items: z.array(FridgeItemSchema).describe("All distinct food items detected in the image"),
  notes: z
    .string()
    .optional()
    .describe("Optional short note, e.g. if the image was unclear or poorly lit"),
});

export type FridgeItem = z.infer<typeof FridgeItemSchema>;
export type FridgeAnalysis = z.infer<typeof FridgeAnalysisSchema>;
