import { describe, expect, test } from "vitest";
import {
  parseDatabase,
  manualRows,
  selectedRows,
  toggleGroup,
  toggleSample,
  datasetFromRows,
  type SelectionToken,
} from "./database";
import { G25_EIGENVALUES } from "./g25";
import { fitPca } from "./pca";
const vector = (x: number, y: number) => [x, y, ...Array(23).fill(0)];
const coordinate = (name: string, x: number, y: number) =>
  [name, ...vector(x, y)].join(",");
const tsv = [
  "Genetic ID\tIndividual ID\tGroup ID\tG25_coords\tLocality",
  ...[
    ["a1", "A", -2, -1],
    ["a2", "A", 2, -1],
    ["b1", "B", -2, 1],
    ["b2", "B", 2, 1],
  ].map(([id, group, x, y]) =>
    [
      id,
      id,
      group,
      coordinate("Ignored:old", Number(x), Number(y)),
      '"A place\twith ""quotes"""',
    ].join("\t"),
  ),
  "missing\tmissing\tC\t\tunknown",
].join("\r\n");
const rows = parseDatabase(tsv, "scaled").rows;
describe("database import", () => {
  test("reads Archaeobase metadata, authoritative IDs, quoted TSV and missing coordinates", () => {
    const result = parseDatabase("\uFEFF" + tsv, "scaled");
    expect(result.total).toBe(5);
    expect(result.skipped).toBe(1);
    expect(result.rows.map((row) => row.sample.name)).toEqual([
      "A:a1",
      "A:a2",
      "B:b1",
      "B:b2",
    ]);
    expect(result.rows[0].sample.source.slice(0, 2)).toEqual([-2, -1]);
  });
  test("accepts PC1–PC25 columns and raw values without losing originals", () => {
    const text = [
      "group_id\tgenetic_id\t" +
        Array.from({ length: 25 }, (_, i) => `PC${i + 1}`).join("\t"),
      "A\ta1\t" + vector(2, 3).join("\t"),
    ].join("\n");
    const sample = parseDatabase(text, "raw").rows[0].sample;
    expect(sample.source[0]).toBe(2);
    expect(sample.scaled[0]).toBeCloseTo(2 * Math.sqrt(G25_EIGENVALUES[0]));
  });
  test.each([
    [tsv.replace("Genetic ID", "ID"), "Expected Group ID"],
    [tsv.replace("a2\ta2", "a1\ta2"), "duplicate Genetic ID"],
    [tsv.replace("-2,-1", "Infinity,-1"), "finite number"],
    [tsv + '\n"unclosed', "not closed"],
    ["Genetic ID\tGroup ID\tG25_coords\na\tA\t", "no samples"],
  ])("rejects broken imports atomically", (text, message) =>
    expect(() => parseDatabase(text, "scaled")).toThrow(message),
  );
});
describe("selection and automatic fit inputs", () => {
  test("groups and individual selections are deduplicated; selecting a group subsumes sample chips", () => {
    let tokens: SelectionToken[] = [{ kind: "sample", value: rows[0].id }];
    tokens = toggleGroup(rows, tokens, "A", "database");
    expect(tokens).toHaveLength(1);
    expect(selectedRows(rows, tokens)).toHaveLength(2);
    expect(
      selectedRows(rows, [...tokens, { kind: "sample", value: rows[0].id }]),
    ).toHaveLength(2);
    tokens = toggleGroup(rows, tokens, "A", "database");
    expect(selectedRows(rows, tokens)).toEqual([]);
  });
  test("excluding and restoring one sample preserves its population chip and peers", () => {
    let tokens = toggleGroup(rows, [], "A", "database");
    tokens = toggleSample(rows, tokens, rows[0]);
    expect(selectedRows(rows, tokens).map((row) => row.geneticId)).toEqual([
      "a2",
    ]);
    expect(tokens[0].kind).toBe("group");
    tokens = toggleSample(rows, tokens, rows[0]);
    expect(selectedRows(rows, tokens)).toHaveLength(2);
    tokens = toggleSample(rows, tokens, rows[0]);
    tokens = toggleSample(rows, tokens, rows[1]);
    expect(tokens).toEqual([]);
  });
  test("manual raw rows mix with scaled database rows and preserve source coordinates", () => {
    const manual = manualRows(coordinate("Manual:m", 0, 0.3), "raw", rows);
    const dataset = datasetFromRows([...rows, ...manual]);
    expect(dataset.samples[4].source[1]).toBe(0.3);
    expect(dataset.samples[4].scaled[1]).toBeCloseTo(
      0.3 * Math.sqrt(G25_EIGENVALUES[1]),
    );
    expect(fitPca(dataset).scores).toHaveLength(5);
    expect(() => manualRows(coordinate("A:a1", 0, 0), "scaled", rows)).toThrow(
      "already loaded",
    );
  });
});
