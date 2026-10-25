import { prepareSearch, scoreSearch, type SearchField } from "./search";
import type { CatalogueRow } from "./database";

export interface MetadataFilter {
  id: number;
  field: string;
  operator: "contains" | "equals" | "min" | "max";
  value: string;
  includeMissing: boolean;
}

export interface CompiledRegexSearch {
  query: string;
  regex: RegExp | null;
  error: string;
}

export function compileSearch(rawQuery: string): CompiledRegexSearch {
  const query = String(rawQuery || "").trim();
  if (!query) return { query: "", regex: null, error: "" };
  const slash = query.match(/^\/(.*)\/([imsu]*)$/);
  const regexSource = query.toLowerCase().startsWith("re:")
    ? query.slice(3).trim()
    : slash?.[1];
  if (regexSource !== undefined) {
    try {
      return {
        query,
        regex: new RegExp(regexSource, slash?.[2] || "i"),
        error: "",
      };
    } catch (error) {
      return {
        query,
        regex: null,
        error: `Invalid regular expression: ${error instanceof Error ? error.message : String(error)}`,
      };
    }
  }
  return { query: query.toLowerCase(), regex: null, error: "" };
}

export function matchesSearchValue(
  rawValue: string,
  compiled: CompiledRegexSearch,
): boolean {
  if (!compiled.query || compiled.error) return !compiled.error;
  const value = String(rawValue ?? "");
  if (compiled.regex) {
    compiled.regex.lastIndex = 0;
    return compiled.regex.test(value);
  }
  return value.toLowerCase().includes(compiled.query);
}

export function matchesRowRegex(
  row: CatalogueRow,
  scopeField: string,
  compiled: CompiledRegexSearch,
): boolean {
  if (!compiled.query || compiled.error) return true;
  if (scopeField && scopeField !== "All fields") {
    return matchesSearchValue(fieldValue(row, scopeField), compiled);
  }
  // Check across group, genetic ID, and all metadata fields
  if (matchesSearchValue(row.group, compiled)) return true;
  if (matchesSearchValue(row.geneticId, compiled)) return true;
  if (row.metadata) {
    for (const val of Object.values(row.metadata)) {
      if (matchesSearchValue(val, compiled)) return true;
    }
  }
  return false;
}

export const isMissing = (value: string) =>
  /^(?:|\.\.|n\/?a|null|unknown)$/i.test(value.trim());

export const fieldValue = (row: CatalogueRow, field: string) =>
  field === "Group ID"
    ? row.group
    : field === "Genetic ID"
      ? row.geneticId
      : (row.metadata?.[field] ?? "");

export function filterError(filter: MetadataFilter) {
  return (filter.operator === "min" || filter.operator === "max") &&
    filter.value.trim() &&
    !Number.isFinite(Number(filter.value))
    ? "Enter a finite numeric bound."
    : "";
}

export function matchesFilter(row: CatalogueRow, filter: MetadataFilter) {
  if (!filter.value.trim()) return true;
  if (filterError(filter)) return false;
  const value = fieldValue(row, filter.field).trim();
  if (isMissing(value)) return filter.includeMissing;
  const query = filter.value.trim().toLowerCase();
  if (filter.operator === "equals") return value.toLowerCase() === query;
  if (filter.operator === "contains")
    return value.toLowerCase().includes(query);
  const number = Number(value);
  return (
    Number.isFinite(number) &&
    (filter.operator === "min"
      ? number >= Number(query)
      : number <= Number(query))
  );
}

const prepared = new WeakMap<CatalogueRow, SearchField[]>();

/** Prepares search fields strictly for population search: Group ID and Genetic ID (including normalized variants if present) */
export function rowSearch(row: CatalogueRow): SearchField[] {
  if (!prepared.has(row)) {
    const fields = [prepareSearch(row.group), prepareSearch(row.geneticId)];
    if (row.metadata?.["normalized Group ID"]) {
      fields.push(prepareSearch(row.metadata["normalized Group ID"]));
    }
    if (row.metadata?.["Individual ID"]) {
      fields.push(prepareSearch(row.metadata["Individual ID"]));
    }
    prepared.set(row, fields);
  }
  return prepared.get(row)!;
}

export function filterRows(
  rows: CatalogueRow[],
  query: string,
  filters: MetadataFilter[],
  regexScope = { field: "All fields", query: "" },
) {
  const key = query.trim(),
    search = prepareSearch(query);
  const compiledRegex = regexScope.query
    ? compileSearch(regexScope.query)
    : null;

  return rows.filter((row) => {
    if (key && !Number.isFinite(scoreSearch(rowSearch(row), search))) {
      return false;
    }
    if (compiledRegex && !matchesRowRegex(row, regexScope.field, compiledRegex)) {
      return false;
    }
    return filters.every((filter) => matchesFilter(row, filter));
  });
}
