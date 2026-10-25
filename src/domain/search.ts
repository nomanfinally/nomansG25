// Admix_IRE/shared/searchText.cjs ranking, adapted to typed prepared fields with multi-field cross matching.
export interface SearchField {
  lower: string;
  compact: string;
  parts: string[];
}
export interface SearchQuery extends SearchField {}

export function searchTerms(value: string) {
  return String(value ?? "")
    .normalize("NFKD")
    .replace(/\p{M}+/gu, "")
    .replace(/['’`]/g, "") // strip internal apostrophes so Mal'ta and Malta match identically
    .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
    .replace(/([A-Za-z])([0-9])/g, "$1 $2")
    .replace(/([0-9])([A-Za-z])/g, "$1 $2")
    .toLowerCase()
    .split(/[^a-z0-9]+/g)
    .filter(Boolean);
}

export function prepareSearch(value: string): SearchField {
  const parts = searchTerms(value);
  return { lower: parts.join(" "), compact: parts.join(""), parts };
}

export function scoreSearch(fields: SearchField[], query: SearchQuery) {
  const { lower, compact, parts: queryTerms } = query;
  if (!lower || !compact) return Infinity;
  let best = Infinity;

  // Single-field matching tests
  for (const field of fields) {
    if (!field?.lower) continue;
    if (field.lower === lower) best = Math.min(best, 0);
    if (field.lower.startsWith(lower)) best = Math.min(best, 10);
    if (field.parts.some((part) => part === lower)) best = Math.min(best, 15);
    if (field.parts.some((part) => part.startsWith(lower)))
      best = Math.min(best, 20);
    if (
      queryTerms.length > 1 &&
      queryTerms.every((term) =>
        field.parts.some((part) => part === term || part.startsWith(term)),
      )
    )
      best = Math.min(best, 25);
    const index = field.lower.indexOf(lower);
    if (index !== -1) best = Math.min(best, 30 + index / 1000);
    const compactIndex = field.compact.indexOf(compact);
    if (compactIndex !== -1) best = Math.min(best, 40 + compactIndex / 1000);
    if (
      queryTerms.length > 1 &&
      queryTerms.every((term) => field.compact.includes(term))
    )
      best = Math.min(best, 50);

    // Fuzzy subsequence matching with gap penalty
    let position = -1,
      gap = 0;
    for (const char of compact) {
      const next = field.compact.indexOf(char, position + 1);
      if (next === -1) {
        gap = Infinity;
        break;
      }
      gap += next - position - 1;
      position = next;
    }
    if (gap !== Infinity) best = Math.min(best, 80 + gap / 10);
  }

  // Cross-field matching (e.g. searching "Russia MA1" across group and genetic ID)
  if (fields.length > 1 && queryTerms.length > 1 && !Number.isFinite(best)) {
    const allParts = fields.flatMap((f) => f.parts);
    if (
      queryTerms.every((term) =>
        allParts.some((part) => part === term || part.startsWith(term)),
      )
    ) {
      best = Math.min(best, 28);
    } else {
      const allCompact = fields.map((f) => f.compact).join(" ");
      if (queryTerms.every((term) => allCompact.includes(term))) {
        best = Math.min(best, 52);
      }
    }
  }

  return best;
}
