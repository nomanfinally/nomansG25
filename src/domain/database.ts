import { parseG25, type G25Dataset, type G25Sample, type Scaling } from "./g25";

export interface CatalogueRow {
  id: string;
  group: string;
  geneticId: string;
  origin: "database" | "manual";
  sample: G25Sample;
  metadata?: Record<string, string>;
}
export type SelectionToken =
  | {
      kind: "group";
      value: string;
      origin: CatalogueRow["origin"];
      excluded: string[];
    }
  | { kind: "sample"; value: string };
export interface DatabaseImport {
  rows: CatalogueRow[];
  skipped: number;
  total: number;
  scaling: Scaling;
  columns: string[];
}

// TSV fields may be quoted, contain tabs/newlines, or escape quotes as "".
function readTsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [],
    field = "",
    quoted = false,
    endedQuote = false;
  text = text.replace(/^\uFEFF/, "");
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (quoted) {
      if (c === '"') {
        if (text[i + 1] === '"') {
          field += '"';
          i++;
        } else {
          quoted = false;
          endedQuote = true;
        }
      } else field += c;
    } else if (c === '"' && !field && !endedQuote) quoted = true;
    else if (c === "\t" || c === "\n" || c === "\r") {
      row.push(field);
      field = "";
      endedQuote = false;
      if (c !== "\t") {
        if (c === "\r" && text[i + 1] === "\n") i++;
        if (row.some((value) => value.trim())) rows.push(row);
        row = [];
      }
    } else {
      if (endedQuote)
        throw new Error("Invalid TSV: unexpected text after a quoted field.");
      field += c;
    }
  }
  if (quoted) throw new Error("Invalid TSV: a quoted field is not closed.");
  row.push(field);
  if (row.some((value) => value.trim())) rows.push(row);
  return rows;
}
const missing = (value: string) => /^(?:|\.\.|n\/?a|null)$/i.test(value.trim());
const headerKey = (value: string) =>
  value
    .trim()
    .toLowerCase()
    .replace(/[\s_-]+/g, "");

export function parseDatabase(text: string, scaling: Scaling): DatabaseImport {
  const table = readTsv(text);
  if (table.length < 2)
    throw new Error("The TSV needs a header and at least one sample row.");
  const headers = table[0].map(headerKey);
  const groupIndex = headers.indexOf("groupid"),
    idIndex = headers.indexOf("geneticid");
  const coordsIndex = headers.indexOf("g25coords");
  const pcIndices = Array.from({ length: 25 }, (_, i) =>
    headers.indexOf(`pc${i + 1}`),
  );
  if (
    groupIndex < 0 ||
    idIndex < 0 ||
    (coordsIndex < 0 && pcIndices.some((i) => i < 0))
  )
    throw new Error(
      "Expected Group ID, Genetic ID and G25_coords columns (or PC1–PC25). Other metadata columns are allowed.",
    );
  const rows: CatalogueRow[] = [],
    seen = new Set<string>();
  let skipped = 0;
  for (let i = 1; i < table.length; i++) {
    const fields = table[i];
    if (fields.length !== headers.length)
      throw new Error(
        `TSV row ${i + 1}: expected ${headers.length} columns; found ${fields.length}.`,
      );
    const coords =
      coordsIndex >= 0
        ? fields[coordsIndex].trim()
        : pcIndices.map((j) => fields[j].trim()).join(",");
    if (
      coordsIndex >= 0
        ? missing(coords)
        : pcIndices.every((j) => missing(fields[j]))
    ) {
      skipped++;
      continue;
    }
    const group = fields[groupIndex].trim(),
      geneticId = fields[idIndex].trim();
    if (missing(group) || missing(geneticId))
      throw new Error(
        `TSV row ${i + 1}: Group ID and Genetic ID are required for a sample with coordinates.`,
      );
    if (/[,:\r\n\t]/.test(group) || /[,\r\n\t]/.test(geneticId))
      throw new Error(`TSV row ${i + 1}: the IDs contain a G25 row separator.`);
    if (seen.has(geneticId))
      throw new Error(
        `TSV row ${i + 1}: duplicate Genetic ID “${geneticId}”. Use one coordinate row per genetic ID.`,
      );
    const values = coords.split(",").map((value) => value.trim());
    // Archaeobase G25_coords embeds the original name before the 25 values.
    if (values.length === 26) values.shift();
    let sample: G25Sample;
    try {
      sample = parseG25([`${group}:${geneticId}`, ...values].join(","), scaling)
        .samples[0];
    } catch (error) {
      throw new Error(
        `TSV row ${i + 1}: ${error instanceof Error ? error.message : "invalid G25 coordinates"}`,
      );
    }
    seen.add(geneticId);
    rows.push({
      id: `database:${geneticId}`,
      group,
      geneticId,
      origin: "database",
      metadata: Object.fromEntries(
        table[0]
          .map((header, j) => [header.trim(), fields[j]])
          .filter((_, j) => j !== coordsIndex && !pcIndices.includes(j)),
      ),
      sample,
    });
  }
  if (!rows.length)
    throw new Error("This TSV has no samples with usable G25 coordinates.");
  return {
    rows,
    skipped,
    total: table.length - 1,
    scaling,
    columns: table[0]
      .map((h, j) =>
        j !== coordsIndex && !pcIndices.includes(j) ? h.trim() : "",
      )
      .filter(Boolean),
  };
}

export function manualRows(
  text: string,
  scaling: Scaling,
  existing: CatalogueRow[],
): CatalogueRow[] {
  const dataset = parseG25(text, scaling);
  const seen = new Set(existing.map((row) => row.sample.name));
  return dataset.samples.map((sample) => {
    if (seen.has(sample.name))
      throw new Error(
        `“${sample.name}” is already loaded. Select it through search or remove its existing chip first.`,
      );
    seen.add(sample.name);
    return {
      id: `manual:${sample.name}`,
      group: sample.group,
      geneticId: sample.name.includes(":")
        ? sample.name.slice(sample.name.indexOf(":") + 1)
        : sample.name,
      origin: "manual",
      sample,
    };
  });
}
export const tokenKey = (token: SelectionToken) =>
  token.kind === "sample"
    ? `sample:${token.value}`
    : `group:${token.origin}:${token.value}`;
export function belongs(row: CatalogueRow, token: SelectionToken) {
  return token.kind === "sample"
    ? row.id === token.value
    : row.group === token.value &&
        row.origin === token.origin &&
        !token.excluded.includes(row.id);
}
export function selectedRows(rows: CatalogueRow[], tokens: SelectionToken[]) {
  const byId = new Map(rows.map((row) => [row.id, row]));
  const groups = new Map<string, CatalogueRow[]>();
  for (const row of rows) {
    const key = `${row.origin}:${row.group}`;
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(row);
  }
  const selected = new Map<string, CatalogueRow>();
  for (const token of tokens) {
    if (token.kind === "sample") {
      const row = byId.get(token.value);
      if (row) selected.set(row.id, row);
    } else {
      for (const row of groups.get(`${token.origin}:${token.value}`) ?? [])
        if (!token.excluded.includes(row.id)) selected.set(row.id, row);
    }
  }
  return [...selected.values()];
}
export function datasetFromRows(rows: CatalogueRow[]): G25Dataset {
  // Each imported source was normalized separately, so mixed raw/scaled inputs are safe.
  return {
    samples: rows.map((row, key) => ({ ...row.sample, key })),
    groups: [...new Set(rows.map((row) => row.group))].sort((a, b) =>
      a.localeCompare(b),
    ),
    scaling: "scaled",
  };
}
export function toggleGroup(
  rows: CatalogueRow[],
  tokens: SelectionToken[],
  group: string,
  origin: CatalogueRow["origin"],
): SelectionToken[] {
  const groupRows = new Set(
    rows
      .filter((row) => row.group === group && row.origin === origin)
      .map((row) => row.id),
  );
  const exists = tokens.some(
    (t) => t.kind === "group" && t.value === group && t.origin === origin,
  );
  const next = tokens.filter((t) =>
    t.kind === "sample"
      ? !groupRows.has(t.value)
      : !(t.value === group && t.origin === origin),
  );
  return exists
    ? next
    : [...next, { kind: "group", value: group, origin, excluded: [] }];
}
export function toggleSample(
  rows: CatalogueRow[],
  tokens: SelectionToken[],
  row: CatalogueRow,
): SelectionToken[] {
  const parent = tokens.find(
    (t) =>
      t.kind === "group" && t.value === row.group && t.origin === row.origin,
  );
  if (parent?.kind === "group") {
    const excluded = parent.excluded.includes(row.id)
      ? parent.excluded.filter((id) => id !== row.id)
      : [...parent.excluded, row.id];
    const count = rows.filter(
      (r) => r.group === row.group && r.origin === row.origin,
    ).length;
    return tokens.flatMap((t) =>
      t === parent
        ? excluded.length === count
          ? []
          : [{ ...parent, excluded }]
        : [t],
    );
  }
  return tokens.some((t) => t.kind === "sample" && t.value === row.id)
    ? tokens.filter((t) => !(t.kind === "sample" && t.value === row.id))
    : [...tokens, { kind: "sample", value: row.id }];
}

/** Set membership on an entire filtered result, without creating duplicate sample chips. */
export function selectRows(
  all: CatalogueRow[],
  tokens: SelectionToken[],
  target: CatalogueRow[],
  select = true,
): SelectionToken[] {
  if (!target.length) return tokens;
  const ids = new Set(selectedRows(all, tokens).map((row) => row.id));
  for (const row of target) {
    if (select) ids.add(row.id);
    else ids.delete(row.id);
  }
  const affected = new Set(target.map((row) => `${row.origin}:${row.group}`));
  const byId = new Map(all.map((row) => [row.id, row]));
  const next = tokens.filter((token) =>
    token.kind === "group"
      ? !affected.has(`${token.origin}:${token.value}`)
      : !affected.has(
          `${byId.get(token.value)?.origin}:${byId.get(token.value)?.group}`,
        ),
  );
  const groups = new Map<string, CatalogueRow[]>();
  for (const row of all) {
    const key = `${row.origin}:${row.group}`;
    if (!affected.has(key)) continue;
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(row);
  }
  for (const group of groups.values()) {
    if (!group.some((row) => ids.has(row.id))) continue;
    next.push({
      kind: "group",
      value: group[0].group,
      origin: group[0].origin,
      excluded: group.filter((row) => !ids.has(row.id)).map((row) => row.id),
    });
  }
  return next;
}
