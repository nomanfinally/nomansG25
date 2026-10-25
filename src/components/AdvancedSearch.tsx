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
  const [entityMode, setEntityMode] = useState<"individual" | "group">(
    "individual",
  );
  const scroller = useRef<HTMLDivElement>(null);

  const compiled = useMemo(
    () => compileSearch(regexScope.query),
    [regexScope.query],
  );

  const groupRows = useMemo(() => {
    const map = new Map<
      string,
      { group: string; origin: CatalogueRow["origin"]; members: CatalogueRow[] }
    >();
    for (const row of matches) {
      let entry = map.get(row.group);
      if (!entry) {
        entry = { group: row.group, origin: row.origin, members: [] };
        map.set(row.group, entry);
      }
      entry.members.push(row);
    }

    const nonIdColumns = columns.filter(
      (c) => c !== "Group ID" && c !== "Genetic ID",
    );
    const result: {
      group: string;
      origin: CatalogueRow["origin"];
      members: CatalogueRow[];
      sampleCount: number;
      metadata: Record<string, string>;
    }[] = [];

    for (const [group, entry] of map.entries()) {
      const metadata: Record<string, string> = {};
      for (const col of nonIdColumns) {
        const unique = [
          ...new Set(
            entry.members
              .map((m) => m.metadata?.[col]?.trim())
              .filter(Boolean),
          ),
        ];
        metadata[col] = unique.join(", ") || "–";
      }
      result.push({
        group,
        origin: entry.origin,
        members: entry.members,
        sampleCount: entry.members.length,
        metadata,
      });
    }

    return result;
  }, [matches, columns]);

  useEffect(() => {
    setScroll(0);
    scroller.current?.scrollTo(0, 0);
  }, [matches, entityMode]);

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

  const totalCount =
    entityMode === "individual" ? matches.length : groupRows.length;
  const start = Math.max(0, Math.floor(scroll / 28) - 6);
  const end = Math.min(totalCount, start + Math.ceil(height / 28) + 14);

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

      {/* Regex-Compatible Property Search Bar (G25_Manager / ArchaeoBase attached dropdown style) */}
      <div className="advanced-regex-bar" role="search" aria-label="Metadata search">
        <div
          className={`toolbar-search ${regexScope.query.trim() ? "search-expanded" : ""} ${compiled.error ? "invalid" : ""}`}
          id="search-control"
          title={
            compiled.error ||
            "Search text, /regular expression/, or re: expression (Esc to clear)"
          }
        >
          <Search size={14} className="search-icon" aria-hidden="true" />
          <input
            id="search-input"
            type="search"
            aria-label="Search text or regular expression"
            aria-invalid={Boolean(compiled.error)}
            placeholder="Search or /regex/…"
            value={regexScope.query}
            autoComplete="off"
            spellCheck={false}
            onChange={(e) =>
              onRegexScope({ ...regexScope, query: e.target.value })
            }
            onKeyDown={(e) => {
              if (e.key === "Escape" && regexScope.query) {
                e.stopPropagation();
                onRegexScope({ ...regexScope, query: "" });
              }
            }}
          />
          {regexScope.query && (
            <button
              type="button"
              className="search-clear"
              aria-label="Clear regex search"
              title="Clear search (Esc)"
              onClick={() => onRegexScope({ ...regexScope, query: "" })}
            >
              <X size={13} aria-hidden="true" />
            </button>
          )}
          <div
            className="search-field-attached"
            title={`Search property: ${regexScope.field}`}
          >
            <select
              id="search-field"
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
            <span className="search-field-label" aria-hidden="true">
              {regexScope.field}
            </span>
            <ChevronDown
              size={12}
              className="search-field-caret"
              aria-hidden="true"
            />
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
        <div className="heading-left-cluster">
          <div
            className="segmented tool-entity-toggle"
            role="group"
            aria-label="Entity level"
          >
            <button
              type="button"
              className={entityMode === "individual" ? "active" : ""}
              onClick={() => setEntityMode("individual")}
              aria-pressed={entityMode === "individual"}
            >
              Individual
            </button>
            <button
              type="button"
              className={entityMode === "group" ? "active" : ""}
              onClick={() => setEntityMode("group")}
              aria-pressed={entityMode === "group"}
            >
              Group
            </button>
          </div>
          <span className="results-count-label">
            {entityMode === "individual"
              ? `${matches.length.toLocaleString()} matching samples`
              : `${groupRows.length.toLocaleString()} matching groups (${matches.length.toLocaleString()} samples)`}
          </span>
        </div>

        <div className="heading-right-cluster">
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

      {/* Virtualized Metadata Table (Adjusts between Individual and Group modes) */}
      {table && (
        <div
          className="metadata-table-scroll advanced-table-wrap"
          ref={scroller}
          tabIndex={0}
          aria-label={
            entityMode === "individual"
              ? "Sample metadata table"
              : "Group metadata table"
          }
          onScroll={(e) => setScroll(e.currentTarget.scrollTop)}
        >
          <table className="metadata-table advanced-table">
            <thead>
              {entityMode === "individual" ? (
                <tr>
                  <th className="select-col" aria-label="Select row">
                    <input
                      type="checkbox"
                      aria-label="Toggle all visible rows"
                      checked={
                        matches.length > 0 &&
                        matches.every((r) => chosen.has(r.id))
                      }
                      onChange={(e) =>
                        catalogue.select(matches, e.target.checked)
                      }
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
              ) : (
                <tr>
                  <th className="select-col" aria-label="Select group">
                    <input
                      type="checkbox"
                      aria-label="Toggle all visible groups"
                      checked={
                        matches.length > 0 &&
                        matches.every((r) => chosen.has(r.id))
                      }
                      onChange={(e) =>
                        catalogue.select(matches, e.target.checked)
                      }
                    />
                  </th>
                  <th>Group ID</th>
                  <th>Samples</th>
                  {columns
                    .filter((c) => c !== "Group ID" && c !== "Genetic ID")
                    .map((col) => (
                      <th key={col}>{col}</th>
                    ))}
                </tr>
              )}
            </thead>
            <tbody>
              {start > 0 && (
                <tr
                  style={{ height: start * 28 }}
                  aria-hidden="true"
                  className="table-spacer"
                />
              )}
              {entityMode === "individual"
                ? matches.slice(start, end).map((row) => (
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
                  ))
                : groupRows.slice(start, end).map((group) => {
                    const allSelected = group.members.every((m) =>
                      chosen.has(m.id),
                    );
                    const someSelected = group.members.some((m) =>
                      chosen.has(m.id),
                    );
                    return (
                      <tr
                        key={group.group}
                        aria-selected={allSelected || undefined}
                        className={
                          allSelected
                            ? "selected-row"
                            : someSelected
                              ? "partially-selected-row"
                              : ""
                        }
                      >
                        <td className="select-col">
                          <input
                            type="checkbox"
                            checked={allSelected}
                            ref={(el) => {
                              if (el)
                                el.indeterminate = !allSelected && someSelected;
                            }}
                            aria-label={`Select table group ${group.group}`}
                            onChange={() => {
                              if (allSelected) {
                                catalogue.select(group.members, false);
                              } else {
                                catalogue.select(group.members, true);
                              }
                            }}
                          />
                        </td>
                        <td className="primary-cell font-medium">
                          {group.group}
                        </td>
                        <td>
                          <span className="group-sample-count">
                            {group.sampleCount}{" "}
                            {group.sampleCount === 1 ? "sample" : "samples"}
                          </span>
                        </td>
                        {columns
                          .filter((c) => c !== "Group ID" && c !== "Genetic ID")
                          .map((col) => (
                            <td key={col} title={group.metadata[col]}>
                              {group.metadata[col] || "–"}
                            </td>
                          ))}
                      </tr>
                    );
                  })}
              {end < totalCount && (
                <tr
                  style={{ height: (totalCount - end) * 28 }}
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
