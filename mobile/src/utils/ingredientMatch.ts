function normalize(s: string): string {
  return s.trim().toLowerCase();
}

/** Loose match: a recipe ingredient counts as "present" if its name and a detected
 * item's name share a common substring (handles "Zwiebel" vs "Rote Zwiebel" etc.).
 * Not exact - this is a convenience heuristic, not a guarantee. */
export function ingredientPresent(ingredientName: string, detectedNames: string[]): boolean {
  const name = normalize(ingredientName);
  if (!name) return false;
  return detectedNames.some((raw) => {
    const detected = normalize(raw);
    return detected.length > 2 && (name.includes(detected) || detected.includes(name));
  });
}

/** Fraction (0-1) of ingredientNames that appear to be present among detectedNames. */
export function matchRatio(ingredientNames: string[], detectedNames: string[]): number {
  if (!ingredientNames.length) return 0;
  const matched = ingredientNames.filter((n) => ingredientPresent(n, detectedNames)).length;
  return matched / ingredientNames.length;
}
