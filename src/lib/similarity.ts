/**
 * Lightweight text similarity for uniqueness guard.
 * Normalizes and uses token (word) overlap; returns a score in [0, 1].
 */

function normalize(s: string): string {
  return s
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
}

function tokenize(s: string): string[] {
  return normalize(s)
    .split(/\s+/)
    .filter((t) => t.length > 0);
}

/**
 * Jaccard similarity: |A ∩ B| / |A ∪ B| on word tokens.
 * Returns a number in [0, 1]; 1 = identical token sets.
 */
export function similarityScore(a: string, b: string): number {
  if (!a.trim() || !b.trim()) return 0;
  const setA = new Set(tokenize(a));
  const setB = new Set(tokenize(b));
  if (setA.size === 0 && setB.size === 0) return 0;
  let intersection = 0;
  for (const t of setA) {
    if (setB.has(t)) intersection++;
  }
  const union = setA.size + setB.size - intersection;
  return union === 0 ? 0 : intersection / union;
}

/** Threshold above which we consider a suggestion "too similar" to reference texts. */
export const UNIQUENESS_THRESHOLD = 0.6;

export const UNIQUENESS_THRESHOLD_FAMILIAR = 0.75; // Higher similarity allowed
export const UNIQUENESS_THRESHOLD_RELATED = 0.6; // Moderate (current default)
export const UNIQUENESS_THRESHOLD_NOVEL = 0.4; // Strict "not similar"

/**
 * Returns the similarity threshold for a given uniqueness preference.
 */
export function getUniquenessThreshold(
  uniqueness: "familiar" | "related" | "novel",
): number {
  switch (uniqueness) {
    case "familiar":
      return UNIQUENESS_THRESHOLD_FAMILIAR;
    case "related":
      return UNIQUENESS_THRESHOLD_RELATED;
    case "novel":
      return UNIQUENESS_THRESHOLD_NOVEL;
  }
}

/**
 * Returns true if title or nextAction is too similar to any reference string.
 */
export function isTooSimilar(
  title: string,
  nextAction: string,
  referenceTexts: string[],
  threshold: number = UNIQUENESS_THRESHOLD,
): boolean {
  for (const ref of referenceTexts) {
    if (!ref.trim()) continue;
    if (similarityScore(title, ref) >= threshold) return true;
    if (similarityScore(nextAction, ref) >= threshold) return true;
  }
  return false;
}
