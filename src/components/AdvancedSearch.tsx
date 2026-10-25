import { useEffect, useMemo, useRef, useState } from "react";
import {
  Plus,
  X,
  Table2,
  Columns2,
  Maximize2,
  ChevronDown,
  Search,
} from "lucide-react";
import type { CatalogueState } from "../hooks/useCatalogue";
import type { CatalogueRow } from "../domain/database";
import {
  fieldValue,
  filterError,
  isMissing,
  compileSearch,
  type MetadataFilter,
} from "../domain/filters";

export function AdvancedSearch({
  catalogue,
  criteria,
  onCriteria,
  regexScope,
  onRegexScope,
  matches,
  scope,
  table,
  onTable,
  onClose,
}: {
  catalogue: CatalogueState;
  criteria: MetadataFilter[];
  onCriteria: (value: MetadataFilter[]) => void;
  regexScope: { field: string; query: string };
  onRegexScope: (scope: { field: string; query: string }) => void;
  matches: CatalogueRow[];
  scope: CatalogueRow[];
  table: boolean;
  onTable: () => void;
  onClose: () => void;
}) {
  const columns = useMemo(
    () => [
      ...new Set([
        "Group ID",
        "Genetic ID",
        ...(catalogue.database?.columns ?? []),
      ]),
    ],
    [catalogue.database],
  );

  const [scroll, setScroll] = useState(0);
  const [height, setHeight] = useState(400);
  const scroller = useRef<HTMLDivElement>(null);

  const compiled = useMemo(
    () => compileSearch(regexScope.query),
    [regexScope.query],
  );

  useEffect(() => {
    setScroll(0);
    scroller.current?.scrollTo(0, 0);
  }, [matches]);

  useEffect(() => {
    if (!scroller.current) return;
    const observer = new ResizeObserver((entries) =>
      setHeight(entries[0].contentRect.height),
    );
    observer.observe(scroller.current);
    return () => observer.disconnect();
  }, [table]);

  const chosen = useMemo(
    () => new Set(catalogue.selected.map((row) => row.id)),
    [catalogue.selected],
  );

  const start = Math.max(0, Math.floor(scroll / 28) - 6);
  const end = Math.min(matches.length, start + Math.ceil(height / 28) + 14);

  const patch = (id: number, change: Partial<MetadataFilter>) =>
    onCriteria(
      criteria.map((rule) => (rule.id === id ? { ...rule, ...change } : rule)),
    );

  return (
    <section
      className={`advanced-search ${table ? "with-table" : ""}`}
      aria-label="Advanced search"
    >
      <header className="panel-heading">
        <h2>Advanced search</h2>
        <div className="heading-actions">
          <button
            className={`icon-button ${table ? "active" : ""}`}
            aria-label={table ? "Compact table view" : "Expand table view"}
            title={table ? "Compact table view" : "Expand table view (full width)"}
            aria-pressed={table}
            onClick={onTable}
          >
            {table ? <Columns2 size={15} /> : <Maximize2 size={15} />}
          </button>
          <button
            className="icon-button"
            aria-label="Close advanced search"
            title="Close advanced search"
            onClick={onClose}
          >
            <X size={15} />
          </button>
        </div>
      </header>

      {/* Regex-Compatible Property Search Bar (G25_Manager / ArchaeoBase style) */}
      <div className="advanced-regex-bar" role="search" aria-label="Metadata search">
        <div className="regex-scope-row">
          <div className="property-select regex-property-select">
            <select
              aria-label="Search scope property"
              value={regexScope.field}
              onChange={(e) =>
                onRegexScope({ ...regexScope, field: e.target.value })
              }
            >
              <option value="All fields">All fields</option>
              {columns.map((col) => (
                <option key={col} value={col}>
                  {col}
                </option>
              ))}
            </select>
            <span className="property-value" aria-hidden="true">
              {regexScope.field}
            </span>
            <ChevronDown size={13} aria-hidden="true" />
          </div>
          <div className="regex-input-wrapper">
            <Search size={13} className="regex-search-icon" />
            <input
              type="text"
              aria-label="Search text or regular expression"
              placeholder="Search or /regex/…"
              value={regexScope.query}
              onChange={(e) =>
                onRegexScope({ ...regexScope, query: e.target.value })
              }
            />
            {regexScope.query && (
              <button
                type="button"
                className="chip-remove"
                aria-label="Clear regex search"
                onClick={() => onRegexScope({ ...regexScope, query: "" })}
              >
                <X size={12} />
              </button>
            )}
          </div>
        </div>
        {compiled.error && (
          <p className="data-error regex-error" role="alert">
            {compiled.error}
          </p>
        )}
      </div>

      {/* Structured Criteria Filters (G25_Manager style) */}
      <div className="advanced-criteria">
        <p className="section-hint">
          Match all criteria. Use the top bar for regex or field-specific queries.
        </p>

        {criteria.map((rule) => {
          const missing = scope.filter((row) =>
            isMissing(fieldValue(row, rule.field)),
          ).length;

          const values = [
            ...new Set(
              scope
                .map((row) => fieldValue(row, rule.field))
                .filter((value) => !isMissing(value)),
            ),
          ]
            .sort()
            .slice(0, 80);

          return (
            <div
              className="criterion"
              role="group"
              aria-label={`Search criterion ${rule.id}`}
              key={`${rule.id}:${table ? "table" : "compact"}`}
            >
              <div className="criterion-fields">
                <div className="property-select">
                  <select
                    aria-label={`Property ${rule.id}`}
                    value={rule.field}
                    onChange={(e) => patch(rule.id, { field: e.target.value })}
                  >
                    {columns.map((column) => (
                      <option key={column}>{column}</option>
                    ))}
                  </select>
                  <span className="property-value" aria-hidden="true">
                    {rule.field}
                  </span>
                  <ChevronDown size={13} aria-hidden="true" />
                </div>
                <button
                  className="icon-button"
                  aria-label={`Remove criterion ${rule.id}`}
                  onClick={() =>
                    onCriteria(criteria.filter((item) => item.id !== rule.id))
                  }
                >
                  <X size={13} />
                </button>
              </div>

              <div className="criterion-value">
                <select
                  aria-label={`Operator ${rule.id}`}
                  value={rule.operator}
                  onChange={(e) =>
                    patch(rule.id, {
                      operator: e.target.value as MetadataFilter["operator"],
                    })
                  }
                >
                  <option value="contains">contains</option>
                  <option value="equals">equals</option>
                  <option value="min">at least (≥)</option>
                  <option value="max">at most (≤)</option>
                </select>
                <input
                  aria-label={`Value ${rule.id}`}
                  placeholder="Value…"
                  value={rule.value}
                  list={`values-${rule.id}`}
                  onChange={(e) => patch(rule.id, { value: e.target.value })}
                />
                <datalist id={`values-${rule.id}`}>
                  {values.map((value) => (
                    <option key={value} value={value} />
                  ))}
                </datalist>
              </div>

              <label className="missing-choice">
                <input
                  type="checkbox"
                  checked={rule.includeMissing}
                  onChange={(e) =>
                    patch(rule.id, { includeMissing: e.target.checked })
                  }
                />
                Include missing{" "}
                <span>({missing.toLocaleString()} in search scope)</span>
              </label>

              {filterError(rule) && (
                <p role="alert" className="data-error">
                  {filterError(rule)}
                </p>
              )}
            </div>
          );
        })}

        <div className="criteria-actions">
          <button
            className="text-button"
            onClick={() =>
              onCriteria([
                ...criteria,
                {
                  id:
                    Math.max(0, ...criteria.map((criterion) => criterion.id)) +
                    1,
                  field: columns.find((c) => c === "Regions") ?? "Group ID",
                  operator: "contains",
                  value: "",
                  includeMissing: false,
                },
              ])
            }
            disabled={!catalogue.rows.length}
          >
            <Plus size={13} />
            Add criterion
          </button>
          {criteria.length > 0 && (
            <button className="text-button" onClick={() => onCriteria([])}>
              Clear criteria
            </button>
          )}
        </div>
      </div>

      <div className="advanced-results-heading">
        <span>{matches.length.toLocaleString()} matching samples</span>
        <div>
          <button
            className="text-button"
            aria-label="Add all advanced search matches"
            disabled={
              !matches.length || criteria.some((rule) => !!filterError(rule))
            }
            onClick={() => catalogue.select(matches)}
          >
            Add all matches
          </button>
          {!table && (
            <button
              className="text-button open-table-action"
              onClick={onTable}
            >
              Open table view
            </button>
          )}
        </div>
      </div>

      {/* Virtualized Metadata Table */}
      {table && (
        <div
          className="metadata-table-scroll advanced-table-wrap"
          ref={scroller}
          tabIndex={0}
          aria-label="Sample metadata table"
          onScroll={(e) => setScroll(e.currentTarget.scrollTop)}
        >
          <table className="metadata-table advanced-table">
            <thead>
              <tr>
                <th className="select-col" aria-label="Select row">
                  <input
                    type="checkbox"
                    aria-label="Toggle all visible rows"
                    checked={
                      matches.length > 0 &&
                      matches.every((r) => chosen.has(r.id))
                    }
                    onChange={(e) => catalogue.select(matches, e.target.checked)}
                  />
                </th>
                <th>Group ID</th>
                <th>Genetic ID</th>
                {columns
                  .filter((c) => c !== "Group ID" && c !== "Genetic ID")
                  .map((col) => (
                    <th key={col}>{col}</th>
                  ))}
              </tr>
            </thead>
            <tbody>
              {start > 0 && (
                <tr
                  style={{ height: start * 28 }}
                  aria-hidden="true"
                  className="table-spacer"
                />
              )}
              {matches.slice(start, end).map((row) => (
                <tr
                  key={row.id}
                  aria-selected={chosen.has(row.id) || undefined}
                  className={chosen.has(row.id) ? "selected-row" : ""}
                >
                  <td className="select-col">
                    <input
                      type="checkbox"
                      checked={chosen.has(row.id)}
                      aria-label={`Select table sample ${row.geneticId}`}
                      onChange={() => catalogue.sample(row)}
                    />
                  </td>
                  <td>{row.group}</td>
                  <td>{row.geneticId}</td>
                  {columns
                    .filter((c) => c !== "Group ID" && c !== "Genetic ID")
                    .map((col) => (
                      <td key={col}>{row.metadata?.[col] ?? "–"}</td>
                    ))}
                </tr>
              ))}
              {end < matches.length && (
                <tr
                  style={{ height: (matches.length - end) * 28 }}
                  aria-hidden="true"
                  className="table-spacer"
                />
              )}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
