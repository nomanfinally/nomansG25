import { expect, test } from "vitest";
import {
  parseDatabase,
  selectRows,
  selectedRows,
  type SelectionToken,
} from "./database";
import {
  filterRows,
  matchesFilter,
  filterError,
  type MetadataFilter,
} from "./filters";
import { prepareSearch, scoreSearch } from "./search";
import { calculatePca } from "./pca";
import {
  initialAddOptions,
  initialPlotView,
  createEntries,
  buildFigure,
} from "./figure";
import { entryMarkers } from "./markerAssignment";
const coords = (id: string, x: number, y: number) =>
  [id, x, y, ...Array(23).fill(0)].join(",");
const database = parseDatabase(
  [
    "Group ID\tGenetic ID\tG25_coords\tRegions\tYear CE",
    `Mödling_Avar\ta1\t${coords("old", 0, 0)}\tEurope\t650`,
    `Mödling_Avar\ta2\t${coords("old", 1, 1)}\tEurope\t..`,
    `Other\tb1\t${coords("old", 2, 0)}\tAsia\t800`,
  ].join("\n"),
  "scaled",
);
const rule: MetadataFilter = {
  id: 1,
  field: "Year CE",
  operator: "min",
  value: "700",
  includeMissing: false,
};
test("metadata is retained separately from coordinates for the complete registry", () => {
  expect(database.columns).toContain("Regions");
  expect(database.columns).not.toContain("G25_coords");
  expect(database.rows[0].metadata?.["Year CE"]).toBe("650");
});
test("numeric bounds exclude missing explicitly and include it only when requested", () => {
  expect(database.rows.map((row) => matchesFilter(row, rule))).toEqual([
    false,
    false,
    true,
  ]);
  expect(
    database.rows.map((row) =>
      matchesFilter(row, { ...rule, includeMissing: true }),
    ),
  ).toEqual([false, true, true]);
  expect(filterError({ ...rule, value: "nonsense" })).not.toBe("");
  expect(
    database.rows.some((row) =>
      matchesFilter(row, { ...rule, value: "nonsense" }),
    ),
  ).toBe(false);
});
test("criteria apply before groups are selected; hidden unmatched members stay excluded", () => {
  const target = filterRows(database.rows, "modling", [
    { ...rule, operator: "max", value: "700" },
  ]);
  const tokens = selectRows(database.rows, [], target);
  expect(target).toHaveLength(1);
  expect(
    selectedRows(database.rows, tokens).map((row) => row.geneticId),
  ).toEqual(["a1"]);
  expect(tokens[0]).toMatchObject({ kind: "group", excluded: ["database:a2"] });
});
test("bulk membership is additive, deduplicated, and can reselect previously excluded rows", () => {
  let tokens: SelectionToken[] = selectRows(
    database.rows,
    [],
    [database.rows[0]],
  );
  tokens = selectRows(database.rows, tokens, database.rows);
  tokens = selectRows(database.rows, tokens, database.rows);
  expect(selectedRows(database.rows, tokens)).toHaveLength(3);
  tokens = selectRows(database.rows, tokens, [database.rows[0]], false);
  expect(
    selectedRows(database.rows, tokens)
      .map((row) => row.geneticId)
      .sort(),
  ).toEqual(["a2", "b1"]);
});
test.each(["modling", "Mödling", "modlingavar", "avar modling", "mdlng"])(
  "Admix search handles accents, separators, terms and subsequences: %s",
  (query) => {
    expect(
      scoreSearch([prepareSearch("Mödling_Avar")], prepareSearch(query)),
    ).toBeLessThan(Infinity);
  },
);
test("Admix ranking puts exact IDs before prefix, word and fuzzy matches", () => {
  const query = prepareSearch("I123");
  const values = ["I123", "I1234", "Group:I123", "sampleI1xx2xx3"];
  const scores = values.map((value) =>
    scoreSearch([prepareSearch(value)], query),
  );
  expect(scores[0]).toBe(0);
  expect(scores[0]).toBeLessThan(scores[1]);
  expect(scores[1]).toBeLessThan(scores[2]);
  expect(scores[2]).toBeLessThan(scores[3]);
});
test("nearby groups receive deterministic distinct color/shape pairs using the PCA palette", () => {
  const text = Array.from({ length: 60 }, (_, i) =>
    coords(`Group_${i}:id`, Math.sin(i) * 0.001, Math.cos(i * 2) * 0.001),
  ).join("\n");
  const result = calculatePca(text, "scaled"),
    entries = createEntries(result, initialAddOptions);
  const styles = entryMarkers(result, entries, initialPlotView);
  expect(new Set(styles.map((s) => s.color + ":" + s.symbol)).size).toBe(
    styles.length,
  );
  expect(new Set(styles.map((s) => s.symbol)).size).toBeGreaterThan(3);
  expect(entryMarkers(result, entries, initialPlotView)).toEqual(styles);
  const figure = buildFigure(result, initialPlotView);
  expect((figure.traces[0] as any).marker.size).toBe(7);
  expect(figure.annotations.every((a) => a.visible === false)).toBe(true);
});
