import { prepareSearch, scoreSearch, type SearchField } from "./search";
import type { CatalogueRow } from "./database";
export interface MetadataFilter {
  id: number;
  field: string;
  operator: "contains" | "equals" | "min" | "max";
  value: string;
  includeMissing: boolean;
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
export function rowSearch(row: CatalogueRow) {
  if (!prepared.has(row))
    prepared.set(row, [prepareSearch(row.group), prepareSearch(row.geneticId)]);
  return prepared.get(row)!;
}
export function filterRows(
  rows: CatalogueRow[],
  query: string,
  filters: MetadataFilter[],
) {
  const key = query.trim(),
    search = prepareSearch(query);
  return rows.filter(
    (row) =>
      (!key || Number.isFinite(scoreSearch(rowSearch(row), search))) &&
      filters.every((filter) => matchesFilter(row, filter)),
  );
}
