import { colors, symbols, groupMarker } from "./markers";
import type { PcaResult } from "./pca";
import type { Entry, PlotView } from "./figure";

type Position = [number, number];

export interface MarkerAppearance {
  color: string;
  symbol: string;
  size: number;
  opacity: number;
  line: { color: string; width: number };
  colorIndex: number;
  symbolIndex: number;
}

const rgb = (hex: string) =>
  [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255);
const colorVectors = colors.map(rgb);

const colorDistance = (a: number, b: number) =>
  Math.sqrt(
    colorVectors[a].reduce(
      (sum, value, i) =>
        sum + [0.3, 0.59, 0.11][i] * (value - colorVectors[b][i]) ** 2,
      0,
    ),
  );

// Group symbols into visual shape families
const family = (symbolIdx: number) => {
  // 0: circle, 1: square, 2: tri-up, 3: diamond, 4: tri-down, 5: cross, 6: x,
  // 7: tri-left, 8: tri-right, 9: hexagon, 10: pentagon, 11: star, 12: octagon
  if (symbolIdx === 0 || symbolIdx === 9 || symbolIdx === 10 || symbolIdx === 12) return 0; // round / polygon
  if (symbolIdx === 1 || symbolIdx === 3) return 1; // square / diamond
  if (symbolIdx === 2 || symbolIdx === 4 || symbolIdx === 7 || symbolIdx === 8) return 2; // triangles
  return 3; // crosses
};

/** Persistent group marker registry so dots/marker shape and color don't change once assigned */
const persistentRegistry = new Map<string, MarkerAppearance>();

export function resetMarkerRegistry() {
  persistentRegistry.clear();
}

/**
 * Deterministic local contrast algorithm:
 * 1. Preserves existing assigned markers for known groups.
 * 2. For newly added groups, chooses color & dot shape pairs that maximize visual
 *    contrast against nearby groups in the active 2D projection.
 */
export function entryMarkers(
  result: PcaResult,
  entries: Entry[],
  view: Pick<PlotView, "x" | "y">,
): MarkerAppearance[] {
  // Compute 2D centroid position for each entry
  const positions: Position[] = entries.map((entry) => {
    let x = 0,
      y = 0;
    for (const i of entry.indices) {
      x += result.scores[i][view.x] / entry.indices.length;
      y += result.scores[i][view.y] / entry.indices.length;
    }
    return [x, y];
  });

  // Calculate bounding ranges for normalized distance calculation
  const ranges = [0, 1].map((axis) => {
    let min = Infinity,
      max = -Infinity;
    for (const point of positions) {
      min = Math.min(min, point[axis]);
      max = Math.max(max, point[axis]);
    }
    return Math.max(max - min, 1e-12);
  });

  const normalized: Position[] = positions.map(
    (p) => [p[0] / ranges[0], p[1] / ranges[1]],
  );

  // Keep track of how many times each (color, symbol), color, and symbol is used
  const pairUsage = new Map<string, number>();
  const colorUsage = new Map<number, number>();
  const symbolUsage = new Map<number, number>();

  for (const m of persistentRegistry.values()) {
    const pairKey = `${m.colorIndex}:${m.symbolIndex}`;
    pairUsage.set(pairKey, (pairUsage.get(pairKey) ?? 0) + 1);
    colorUsage.set(m.colorIndex, (colorUsage.get(m.colorIndex) ?? 0) + 1);
    symbolUsage.set(m.symbolIndex, (symbolUsage.get(m.symbolIndex) ?? 0) + 1);
  }

  // Assign markers for any entries not yet registered
  for (let i = 0; i < entries.length; i++) {
    const entry = entries[i];
    if (persistentRegistry.has(entry.name)) {
      continue;
    }

    const pos = normalized[i];

    // Find nearby entries that already have an assigned marker
    const neighbors: { distance: number; marker: MarkerAppearance }[] = [];
    for (let j = 0; j < entries.length; j++) {
      if (i === j) continue;
      const otherEntry = entries[j];
      const otherMarker = persistentRegistry.get(otherEntry.name);
      if (otherMarker) {
        const otherPos = normalized[j];
        const d2 = (pos[0] - otherPos[0]) ** 2 + (pos[1] - otherPos[1]) ** 2;
        neighbors.push({ distance: Math.sqrt(d2), marker: otherMarker });
      }
    }

    // Sort neighbors by proximity (closest first)
    neighbors.sort((a, b) => a.distance - b.distance);

    let bestColorIdx = 0;
    let bestSymbolIdx = 0;
    let bestPenalty = Infinity;

    // Test all combinations of 31 colors and 13 symbols
    // Order pairs so that both color and symbol rotate systematically
    for (let c = 0; c < colors.length; c++) {
      for (let s = 0; s < symbols.length; s++) {
        let penalty = 0;

        // Base usage penalty to encourage variety across whole plot
        const pairKey = `${c}:${s}`;
        const pairsUsed = pairUsage.get(pairKey) ?? 0;
        const colUsed = colorUsage.get(c) ?? 0;
        const symUsed = symbolUsage.get(s) ?? 0;

        penalty += pairsUsed * 1000;
        penalty += colUsed * 15;
        penalty += symUsed * 10;

        // Proximity penalty against nearby neighbors in the plot
        for (const { distance, marker } of neighbors) {
          // Weight decays with distance: close neighbors have dominant influence
          const weight = 1 / (distance * distance + 0.05);

          // Identical symbol penalty (heavily penalize same dot shape nearby)
          if (s === marker.symbolIndex) {
            penalty += 120 * weight;
          } else if (family(s) === family(marker.symbolIndex)) {
            penalty += 40 * weight;
          }

          // Identical or close color penalty (heavily penalize same or similar colors nearby)
          if (c === marker.colorIndex) {
            penalty += 140 * weight;
          } else {
            const cd = colorDistance(c, marker.colorIndex);
            if (cd < 0.4) {
              penalty += (0.4 - cd) * 100 * weight;
            }
          }
        }

        if (penalty < bestPenalty) {
          bestPenalty = penalty;
          bestColorIdx = c;
          bestSymbolIdx = s;
        }
      }
    }

    // Construct the assigned marker
    const base = groupMarker(bestColorIdx);
    const assigned: MarkerAppearance = {
      ...base,
      symbol: symbols[bestSymbolIdx],
      colorIndex: bestColorIdx,
      symbolIndex: bestSymbolIdx,
    };

    persistentRegistry.set(entry.name, assigned);
    const pairKey = `${bestColorIdx}:${bestSymbolIdx}`;
    pairUsage.set(pairKey, (pairUsage.get(pairKey) ?? 0) + 1);
    colorUsage.set(bestColorIdx, (colorUsage.get(bestColorIdx) ?? 0) + 1);
    symbolUsage.set(bestSymbolIdx, (symbolUsage.get(bestSymbolIdx) ?? 0) + 1);
  }

  return entries.map((entry) => persistentRegistry.get(entry.name)!);
}
