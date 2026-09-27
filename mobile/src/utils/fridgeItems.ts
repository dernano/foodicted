import type { FridgeItem } from "../types";

/** Merges two ingredient lists, keeping all of `existing` and adding only the
 * items from `incoming` whose name isn't already present (case-insensitive). */
export function mergeFridgeItems(existing: FridgeItem[], incoming: FridgeItem[]): FridgeItem[] {
  const existingNames = new Set(existing.map((i) => i.name.trim().toLowerCase()));
  const newOnes = incoming.filter((i) => !existingNames.has(i.name.trim().toLowerCase()));
  return [...existing, ...newOnes];
}
