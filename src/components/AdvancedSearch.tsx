import { useEffect, useMemo, useRef, useState } from "react";
import {
  Plus,
  X,
  Table2,
  Columns2,
  Maximize2,
  ChevronDown,
} from "lucide-react";
import type { CatalogueState } from "../hooks/useCatalogue";
import type { CatalogueRow } from "../domain/database";
import {
  fieldValue,
  filterError,
  isMissing,
  type MetadataFilter,
} from "../domain/filters";
export function AdvancedSearch({
  catalogue,
  criteria,
  onCriteria,
  matches,
  scope,
  table,
  onTable,
  onClose,
}: {
  catalogue: CatalogueState;
  criteria: MetadataFilter[];
  onCriteria: (value: MetadataFilter[]) => void;
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
  const [scroll, setScroll] = useState(0),
    [height, setHeight] = useState(400);
  const scroller = useRef<HTMLDivElement>(null);
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
  const start = Math.max(0, Math.floor(scroll / 28) - 6),
    end = Math.min(matches.length, start + Math.ceil(height / 28) + 14);
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
            className="icon-button"
            aria-label={table ? "Compact advanced search" : "Expand table view"}
            title={table ? "Compact advanced search" : "Expand table view"}
            aria-pressed={table}
            onClick={onTable}
          >
            {table ? <Columns2 size={15} /> : <Maximize2 size={15} />}
          </button>
          <button
            className="icon-button"
            aria-label="Close advanced search"
            onClick={onClose}
          >
            <X size={15} />
          </button>
        </div>
      </header>
      <div className="advanced-criteria">
        <p className="section-hint">
          Match all criteria. Search by group or genetic ID in the population
          picker.
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
              className="icon-button"
              aria-label="Open advanced search table"
              title="Open table"
              onClick={onTable}
            >
              <Table2 size={15} />
            </button>
          )}
        </div>
      </div>
      {table ? (
        <div
          ref={scroller}
          className="metadata-table-scroll"
          onScroll={(e) => setScroll(e.currentTarget.scrollTop)}
        >
          <table className="metadata-table">
            <thead>
              <tr>
                <th aria-label="Selection" />
                {columns.map((column) => (
                  <th key={column} title={column}>
                    {column}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {start > 0 && (
                <tr aria-hidden="true">
                  <td
                    colSpan={columns.length + 1}
                    style={{ height: start * 28, padding: 0 }}
                  />
                </tr>
              )}
              {matches.slice(start, end).map((row) => (
                <tr key={row.id} aria-selected={chosen.has(row.id)}>
                  <td>
                    <input
                      type="checkbox"
                      aria-label={`Select table sample ${row.geneticId}`}
                      checked={chosen.has(row.id)}
                      onChange={() => catalogue.sample(row)}
                    />
                  </td>
                  {columns.map((column) => (
                    <td key={column} title={fieldValue(row, column)}>
                      {fieldValue(row, column) || "—"}
                    </td>
                  ))}
                </tr>
              ))}
              {end < matches.length && (
                <tr aria-hidden="true">
                  <td
                    colSpan={columns.length + 1}
                    style={{ height: (matches.length - end) * 28, padding: 0 }}
                  />
                </tr>
              )}
            </tbody>
          </table>
          {!matches.length && (
            <p className="result-empty">No samples match these criteria.</p>
          )}
        </div>
      ) : (
        <div className="advanced-intro">
          <Table2 size={20} />
          <p>
            Expand table view to inspect metadata and select samples directly.
          </p>
          <button className="text-button" onClick={onTable}>
            Open table view
          </button>
        </div>
      )}
    </section>
  );
}
