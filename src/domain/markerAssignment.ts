import { colors, symbols, groupMarker } from "./markers";
import type { PcaResult } from "./pca";
import type { Entry, PlotView } from "./figure";
interface Node {
  index: number;
  axis: number;
  left?: Node;
  right?: Node;
}
type Position = [number, number];
function tree(
  indices: number[],
  positions: Position[],
  depth = 0,
): Node | undefined {
  if (!indices.length) return;
  const axis = depth % 2;
  indices.sort((a, b) => positions[a][axis] - positions[b][axis] || a - b);
  const mid = indices.length >> 1;
  return {
    index: indices[mid],
    axis,
    left: tree(indices.slice(0, mid), positions, depth + 1),
    right: tree(indices.slice(mid + 1), positions, depth + 1),
  };
}
function neighbors(
  index: number,
  root: Node | undefined,
  points: Position[],
  count = 16,
) {
  const found: { index: number; distance: number }[] = [];
  function visit(node?: Node) {
    if (!node) return;
    const p = points[index],
      q = points[node.index];
    const distance = (p[0] - q[0]) ** 2 + (p[1] - q[1]) ** 2;
    if (node.index !== index) {
      found.push({ index: node.index, distance });
      found.sort((a, b) => a.distance - b.distance || a.index - b.index);
      if (found.length > count) found.pop();
    }
    const delta = p[node.axis] - q[node.axis];
    visit(delta < 0 ? node.left : node.right);
    if (found.length < count || delta ** 2 <= found[found.length - 1].distance)
      visit(delta < 0 ? node.right : node.left);
  }
  visit(root);
  return found;
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
const family = (symbol: number) =>
  symbol === 0 || symbol >= 9
    ? 0
    : symbol === 5 || symbol === 6
      ? 1
      : symbol === 1 || symbol === 3
        ? 2
        : 3;
const cache = new WeakMap<
  PcaResult,
  Map<string, ReturnType<typeof groupMarker>[]>
>();
/** Deterministic local contrast: discourage similar colors AND silhouettes among nearest group centroids. */
export function entryMarkers(
  result: PcaResult,
  entries: Entry[],
  view: Pick<PlotView, "x" | "y">,
) {
  const key = `${view.x}:${view.y}:${entries.map((entry) => entry.name).join("\u0000")}`;
  const stored = cache.get(result)?.get(key);
  if (stored) return stored;
  const positions: Position[] = entries.map((entry) => {
    let x = 0,
      y = 0;
    for (const i of entry.indices) {
      x += result.scores[i][view.x] / entry.indices.length;
      y += result.scores[i][view.y] / entry.indices.length;
    }
    return [x, y];
  });
  const ranges = [0, 1].map((axis) => {
    let min = Infinity,
      max = -Infinity;
    for (const point of positions) {
      min = Math.min(min, point[axis]);
      max = Math.max(max, point[axis]);
    }
    return Math.max(max - min, 1e-12);
  });
  const normalized = positions.map(
    (p) => [p[0] / ranges[0], p[1] / ranges[1]] as Position,
  );
  const root = tree(
    entries.map((_, i) => i),
    normalized,
  );
  const assignments: { color: number; symbol: number }[] = [];
  const uses = new Map<number, number>();
  for (let i = 0; i < entries.length; i++) {
    const near = neighbors(i, root, normalized).filter(
      (n) => assignments[n.index],
    );
    let best = 0,
      bestScore = -Infinity;
    for (let c = 0; c < colors.length * symbols.length; c++) {
      const color = c % colors.length,
        symbol = Math.floor(c / colors.length);
      let separation = near.length ? Infinity : 1;
      for (const neighbor of near) {
        const other = assignments[neighbor.index];
        const contrast =
          colorDistance(color, other.color) +
          (symbol === other.symbol
            ? 0
            : family(symbol) !== family(other.symbol)
              ? 0.8
              : 0.35);
        separation = Math.min(
          separation,
          contrast * (1 + Math.min(Math.sqrt(neighbor.distance), 1)),
        );
      }
      // Prefer unused combinations, then visual contrast nearby; never tie color and shape periods together.
      const score = separation - (uses.get(c) ?? 0) * 0.3 - c * 1e-7;
      if (score > bestScore) {
        bestScore = score;
        best = c;
      }
    }
    assignments[i] = {
      color: best % colors.length,
      symbol: Math.floor(best / colors.length),
    };
    uses.set(best, (uses.get(best) ?? 0) + 1);
  }
  const markers = assignments.map((style) => ({
    ...groupMarker(style.color),
    symbol: symbols[style.symbol],
  }));
  if (!cache.has(result)) cache.set(result, new Map());
  // Bound the cache to the last few component/grouping combinations.
  const bucket = cache.get(result)!;
  if (bucket.size >= 6) bucket.delete(bucket.keys().next().value!);
  bucket.set(key, markers);
  return markers;
}
