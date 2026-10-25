import { useMemo, useRef, useState } from "react";
import { Check, ChevronDown, ChevronRight, FileUp, X } from "lucide-react";
import type { CatalogueState } from "../hooks/useCatalogue";
import { belongs, tokenKey, type CatalogueRow } from "../domain/database";
import type { Scaling } from "../domain/g25";

export function DatabasePanel({
  catalogue,
  busy,
  error,
}: {
  catalogue: CatalogueState;
  busy: boolean;
  error: string;
}) {
  const [query, setQuery] = useState(""),
    [expanded, setExpanded] = useState(new Set<string>());
  const [databaseScaling, setDatabaseScaling] = useState<Scaling>("scaled");
  const [limits, setLimits] = useState<Record<string, number>>({});
  const search = useRef<HTMLInputElement>(null),
    file = useRef<HTMLInputElement>(null),
    results = useRef<HTMLDivElement>(null);
  const { rows, tokens, selected } = catalogue;
  const index = useMemo(() => {
    const groups = new Map<
      string,
      {
        key: string;
        group: string;
        origin: CatalogueRow["origin"];
        rows: CatalogueRow[];
        search: string;
      }
    >();
    for (const row of rows) {
      const key = `${row.origin}:${row.group}`;
      if (!groups.has(key))
        groups.set(key, {
          key,
          group: row.group,
          origin: row.origin,
          rows: [],
          search: row.group.toLowerCase(),
        });
      groups.get(key)!.rows.push(row);
    }
    return {
      groups: [...groups.values()].sort((a, b) =>
        a.group.localeCompare(b.group),
      ),
      samples: rows.map((row) => ({
        row,
        search: row.geneticId.toLowerCase(),
      })),
    };
  }, [rows]);
  const key = query.trim().toLowerCase();
  const matches = useMemo(() => {
    if (!key) return { groups: [], samples: [], groupCount: 0, sampleCount: 0 };
    const score = (value: string) =>
      value === key ? 0 : value.startsWith(key) ? 1 : 2;
    const groups = index.groups
      .filter((group) => group.search.includes(key))
      .sort(
        (a, b) =>
          score(a.search) - score(b.search) || a.group.localeCompare(b.group),
      );
    const samples = index.samples
      .filter((item) => item.search.includes(key))
      .sort(
        (a, b) =>
          score(a.search) - score(b.search) ||
          a.row.geneticId.localeCompare(b.row.geneticId),
      );
    return {
      groups: groups.slice(0, 40),
      samples: samples.slice(0, 30).map((item) => item.row),
      groupCount: groups.length,
      sampleCount: samples.length,
    };
  }, [index, key]);
  const chosen = useMemo(
    () => new Set(selected.map((row) => row.id)),
    [selected],
  );
  const chooseGroup = (group: string, origin: CatalogueRow["origin"]) => {
    catalogue.group(group, origin);
    setQuery("");
    search.current?.focus();
  };
  const chooseSample = (row: CatalogueRow, clear = true) => {
    catalogue.sample(row);
    if (clear) {
      setQuery("");
      search.current?.focus();
    }
  };
  const sampleButton = (row: CatalogueRow, nested = false) => (
    <button
      key={row.id}
      type="button"
      className={`database-sample${nested ? " nested" : ""}`}
      aria-pressed={chosen.has(row.id)}
      aria-label={`${chosen.has(row.id) ? "Remove" : "Select"} sample ${row.geneticId} in ${row.group}`}
      onClick={() => chooseSample(row, !nested)}
    >
      <span className="choice-check">
        {chosen.has(row.id) && <Check size={14} />}
      </span>
      <span className="sample-copy">
        <span>{row.geneticId}</span>
        {!nested && <small>{row.group}</small>}
      </span>
    </button>
  );
  return (
    <aside className="database-panel" aria-label="PCA data">
      <header className="data-heading">
        <span>Data</span>
        <span className="data-count">
          {selected.length.toLocaleString()} selected
        </span>
      </header>
      <section className="database-source" aria-label="Database file">
        <div className="database-load-row">
          <button
            type="button"
            className="btn btn-sm btn-outline-primary"
            onClick={() => file.current?.click()}
          >
            <FileUp size={14} />{" "}
            {catalogue.loading
              ? "Loading TSV…"
              : catalogue.database
                ? "Replace TSV"
                : "Load database TSV"}
          </button>
          <select
            className="custom-select custom-select-sm"
            aria-label="TSV coordinate scaling"
            value={databaseScaling}
            onChange={(event) =>
              setDatabaseScaling(event.target.value as Scaling)
            }
          >
            <option value="scaled">Scaled</option>
            <option value="raw">Raw</option>
          </select>
          <input
            ref={file}
            className="sr-only"
            tabIndex={-1}
            type="file"
            accept=".tsv,.txt,text/tab-separated-values,text/plain"
            aria-label="Load database TSV"
            onChange={(event) => {
              const chosen = event.target.files?.[0];
              if (chosen) void catalogue.loadDatabase(chosen, databaseScaling);
              event.target.value = "";
            }}
          />
        </div>
        <div className="database-file-status" role="status">
          {catalogue.database ? (
            <>
              <span className="database-filename" title={catalogue.filename}>
                {catalogue.filename}
              </span>
              <span>
                {catalogue.database.rows.length.toLocaleString()} samples ·{" "}
                {new Set(
                  catalogue.database.rows.map((row) => row.group),
                ).size.toLocaleString()}{" "}
                groups · {catalogue.database.scaling}
              </span>
              {catalogue.database.skipped > 0 && (
                <span>
                  {catalogue.database.skipped.toLocaleString()}{" "}
                  {catalogue.database.skipped === 1 ? "row" : "rows"} without
                  coordinates skipped
                </span>
              )}
            </>
          ) : (
            <span>Load a TSV, or paste coordinates below.</span>
          )}
          {catalogue.loading && <span>Reading and indexing coordinates…</span>}
        </div>
        {catalogue.databaseError && (
          <p className="data-error" role="alert">
            {catalogue.databaseError}
          </p>
        )}
      </section>
      <section className="population-picker" aria-label="Population selection">
        <div className="picker-heading">
          <label htmlFor="population-search">Populations &amp; samples</label>
          {tokens.length > 0 && (
            <button
              type="button"
              className="data-text-action"
              onClick={() => {
                catalogue.clearSelection();
                setQuery("");
              }}
            >
              Clear selection
            </button>
          )}
        </div>
        <div
          className="population-token-box"
          onClick={(event) => {
            if (!(event.target as HTMLElement).closest("button"))
              search.current?.focus();
          }}
        >
          {tokens.map((token) => {
            const row =
              token.kind === "sample"
                ? rows.find((row) => row.id === token.value)
                : undefined;
            const label =
              token.kind === "group"
                ? token.value
                : (row?.geneticId ?? token.value);
            const count =
              token.kind === "group"
                ? rows.filter((row) => belongs(row, token)).length
                : 1;
            return (
              <span
                key={tokenKey(token)}
                className={`population-chip ${token.kind === "sample" ? "individual" : ""}`}
                title={
                  token.kind === "group"
                    ? `${label}: ${count} selected samples${token.origin === "manual" ? " · pasted" : ""}`
                    : `${label} · ${row?.group}`
                }
              >
                <span className="population-chip-text">{label}</span>
                {token.kind === "group" && (
                  <span className="chip-count">{count}</span>
                )}
                <button
                  type="button"
                  aria-label={`Remove ${label}`}
                  onClick={() => catalogue.removeToken(token)}
                >
                  <X size={13} />
                </button>
              </span>
            );
          })}
          <input
            id="population-search"
            ref={search}
            type="search"
            aria-label="Search populations or genetic IDs"
            autoComplete="off"
            spellCheck={false}
            placeholder={
              rows.length
                ? "Search group ID or genetic ID…"
                : "Load a TSV to search…"
            }
            value={query}
            disabled={!rows.length}
            aria-controls={key ? "population-results" : undefined}
            onChange={(event) => setQuery(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Escape") {
                setQuery("");
                event.stopPropagation();
              }
              if (event.key === "ArrowDown" && key) {
                event.preventDefault();
                results.current
                  ?.querySelector<HTMLButtonElement>("button")
                  ?.focus();
              }
              if (event.key === "Enter" && key) {
                event.preventDefault();
                const exact = matches.samples.find(
                  (row) => row.geneticId.toLowerCase() === key,
                );
                if (exact) chooseSample(exact);
                else if (matches.groups[0])
                  chooseGroup(
                    matches.groups[0].group,
                    matches.groups[0].origin,
                  );
                else if (matches.samples[0]) chooseSample(matches.samples[0]);
              }
            }}
          />
        </div>
        <p className="picker-hint">
          Click a population to select it. Expand to choose individual samples.
        </p>
      </section>
      <div
        ref={results}
        className="database-results"
        id="population-results"
        role="region"
        aria-label="Database search results"
        onKeyDown={(event) => {
          if (event.key === "Escape") {
            setQuery("");
            search.current?.focus();
          }
          if (event.key === "ArrowDown" || event.key === "ArrowUp") {
            const buttons = [
              ...(results.current?.querySelectorAll<HTMLButtonElement>(
                "button",
              ) ?? []),
            ];
            const i = buttons.indexOf(event.target as HTMLButtonElement);
            if (i >= 0) {
              event.preventDefault();
              buttons[
                (i + (event.key === "ArrowDown" ? 1 : buttons.length - 1)) %
                  buttons.length
              ]?.focus();
            }
          }
        }}
      >
        {key && (
          <>
            {matches.groups.length > 0 && (
              <>
                <div className="result-heading">
                  Populations <span>{matches.groupCount.toLocaleString()}</span>
                </div>
                {matches.groups.map((group) => {
                  const open = expanded.has(group.key),
                    selectedCount = group.rows.filter((row) =>
                      chosen.has(row.id),
                    ).length;
                  const groupChosen = tokens.some(
                    (token) =>
                      token.kind === "group" &&
                      token.value === group.group &&
                      token.origin === group.origin,
                  );
                  return (
                    <div key={group.key} className="database-group">
                      <div className="database-group-row">
                        <button
                          type="button"
                          className="group-expand"
                          aria-label={`${open ? "Collapse" : "Expand"} population ${group.group}`}
                          aria-expanded={open}
                          onClick={() =>
                            setExpanded((current) => {
                              const next = new Set(current);
                              if (open) next.delete(group.key);
                              else next.add(group.key);
                              return next;
                            })
                          }
                        >
                          {open ? (
                            <ChevronDown size={14} />
                          ) : (
                            <ChevronRight size={14} />
                          )}
                        </button>
                        <button
                          type="button"
                          className="group-select"
                          aria-label={`${groupChosen ? "Remove" : "Select"} population ${group.group}`}
                          aria-pressed={
                            groupChosen
                              ? true
                              : selectedCount > 0
                                ? "mixed"
                                : false
                          }
                          onClick={() => chooseGroup(group.group, group.origin)}
                        >
                          <span>
                            {group.group}
                            {group.origin === "manual" && <small>pasted</small>}
                          </span>
                          <span className="group-sample-count">
                            {selectedCount > 0 ? `${selectedCount}/` : ""}
                            {group.rows.length}{" "}
                            {group.rows.length === 1 ? "sample" : "samples"}
                          </span>
                        </button>
                      </div>
                      {open && (
                        <div className="database-group-samples">
                          {group.rows
                            .slice(0, limits[group.key] ?? 50)
                            .map((row) => sampleButton(row, true))}
                          {group.rows.length > (limits[group.key] ?? 50) && (
                            <button
                              type="button"
                              className="data-text-action more-samples"
                              onClick={() =>
                                setLimits((current) => ({
                                  ...current,
                                  [group.key]: (current[group.key] ?? 50) + 50,
                                }))
                              }
                            >
                              Show more samples
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
                {matches.groupCount > 40 && (
                  <p className="result-limit">
                    Showing 40 populations. Refine your search for the rest.
                  </p>
                )}
              </>
            )}
            {matches.samples.length > 0 && (
              <>
                <div className="result-heading">
                  Individual samples{" "}
                  <span>{matches.sampleCount.toLocaleString()}</span>
                </div>
                {matches.samples.map((row) => sampleButton(row))}
                {matches.sampleCount > 30 && (
                  <p className="result-limit">
                    Showing 30 samples. Refine your genetic ID search.
                  </p>
                )}
              </>
            )}
            {!matches.groups.length && !matches.samples.length && (
              <p className="result-empty">
                No group ID or genetic ID matches “{query.trim()}”.
              </p>
            )}
          </>
        )}
      </div>
      <section className="manual-source" aria-label="Manual coordinates">
        <details open>
          <summary>Paste coordinates</summary>
          <div className="manual-entry">
            <textarea
              aria-label="Global25 coordinates"
              className="form-control form-control-sm"
              rows={3}
              spellCheck={false}
              value={catalogue.text}
              placeholder="Group:sample,PC1,PC2,…,PC25"
              aria-invalid={!!catalogue.manualError}
              aria-describedby="manual-coordinate-help"
              onChange={(event) => {
                catalogue.setText(event.target.value);
                catalogue.setManualError("");
              }}
              onKeyDown={(event) => {
                if (event.key === "Enter" && (event.ctrlKey || event.metaKey)) {
                  event.preventDefault();
                  catalogue.addManual();
                }
              }}
            />
            <div className="manual-actions">
              <select
                className="custom-select custom-select-sm"
                aria-label="Manual coordinate scaling"
                value={catalogue.manualScaling}
                onChange={(event) =>
                  catalogue.setManualScaling(event.target.value as Scaling)
                }
              >
                <option value="scaled">Scaled</option>
                <option value="raw">Raw</option>
              </select>
              <button
                type="button"
                className="btn btn-sm btn-outline-primary"
                disabled={!catalogue.text.trim()}
                onClick={() => catalogue.addManual()}
              >
                Add coordinates
              </button>
            </div>
            <p id="manual-coordinate-help" className="picker-hint">
              One named G25 row per line. Ctrl/⌘ + Enter to add.
            </p>
            {catalogue.manualError && (
              <p className="data-error" role="alert">
                {catalogue.manualError}
              </p>
            )}
          </div>
        </details>
      </section>
      <div className="selection-status" role="status" aria-live="polite">
        {busy
          ? "Updating PCA…"
          : error ||
            (selected.length < 3
              ? "Select at least 3 samples to fit Custom PCA."
              : `${selected.length.toLocaleString()} samples in the current PCA.`)}
      </div>
    </aside>
  );
}
