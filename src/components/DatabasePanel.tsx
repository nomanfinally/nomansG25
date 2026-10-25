import { useMemo, useRef, useState, useLayoutEffect, useEffect } from "react";
import {
  Check,
  ChevronDown,
  ChevronRight,
  FileUp,
  X,
  Search,
  PanelLeftClose,
} from "lucide-react";
import type { CatalogueState } from "../hooks/useCatalogue";
import { belongs, tokenKey, type CatalogueRow } from "../domain/database";
import { prepareSearch, scoreSearch } from "../domain/search";
import { filterRows, rowSearch } from "../domain/filters";
import type { Scaling } from "../domain/g25";

export function DatabasePanel({
  catalogue,
  busy,
  error,
  query,
  onQuery,
  available,
  onAdvanced,
  advanced,
  criteriaCount,
  onCollapse,
}: {
  catalogue: CatalogueState;
  busy: boolean;
  error: string;
  query: string;
  onQuery: (value: string) => void;
  available: CatalogueRow[];
  onAdvanced: () => void;
  advanced: boolean;
  criteriaCount: number;
  onCollapse: () => void;
}) {
  const { rows, tokens, selected } = catalogue;
  const setQuery = onQuery;
  const box = useRef<HTMLDivElement>(null);
  const [focused, setFocused] = useState(false);
  const [popup, setPopup] = useState({
    left: 0,
    top: 0,
    width: 300,
    maxHeight: 310,
  });
  useLayoutEffect(() => {
    const update = () => {
      const rect = box.current?.getBoundingClientRect();
      if (rect)
        setPopup({
          left: rect.left,
          top: rect.bottom + 4,
          width: rect.width,
          maxHeight: Math.max(
            100,
            Math.min(350, window.innerHeight - rect.bottom - 12),
          ),
        });
    };
    update();
    const observer = new ResizeObserver(update);
    if (box.current) observer.observe(box.current);
    window.addEventListener("resize", update);
    document.addEventListener("scroll", update, true);
    return () => {
      observer.disconnect();
      window.removeEventListener("resize", update);
      document.removeEventListener("scroll", update, true);
    };
  }, [tokens, query, advanced]);
  useEffect(() => {
    const outside = (event: PointerEvent) => {
      if (
        !box.current?.contains(event.target as Node) &&
        !results.current?.contains(event.target as Node)
      )
        setFocused(false);
    };
    document.addEventListener("pointerdown", outside);
    return () => document.removeEventListener("pointerdown", outside);
  }, []);
  const [expanded, setExpanded] = useState(new Set<string>());
  const [databaseScaling, setDatabaseScaling] = useState<Scaling>("scaled");
  const [limits, setLimits] = useState<Record<string, number>>({});
  const search = useRef<HTMLInputElement>(null),
    file = useRef<HTMLInputElement>(null),
    results = useRef<HTMLDivElement>(null);
  const index = useMemo(() => {
    const groups = new Map<
      string,
      {
        key: string;
        group: string;
        origin: CatalogueRow["origin"];
        rows: CatalogueRow[];
        prepared: ReturnType<typeof prepareSearch>;
      }
    >();
    for (const row of available) {
      const key = `${row.origin}:${row.group}`;
      if (!groups.has(key))
        groups.set(key, {
          key,
          group: row.group,
          origin: row.origin,
          rows: [],
          prepared: prepareSearch(row.group),
        });
      groups.get(key)!.rows.push(row);
    }
    return {
      groups: [...groups.values()].sort((a, b) =>
        a.group.localeCompare(b.group),
      ),
      samples: available.map((row) => ({
        row,
        prepared: rowSearch(row),
      })),
    };
  }, [available]);
  const key = query.trim().toLowerCase();
  const matches = useMemo(() => {
    if (!key) return { groups: [], samples: [], groupCount: 0, sampleCount: 0 };
    const prepared = prepareSearch(query);
    const samples = index.samples
      .map((item) => ({
        ...item,
        score: scoreSearch(item.prepared, prepared),
      }))
      .filter((item) => Number.isFinite(item.score))
      .sort(
        (a, b) =>
          a.score - b.score || a.row.geneticId.localeCompare(b.row.geneticId),
      );
    const scores = new Map(
      index.groups.map((group) => [
        group.key,
        scoreSearch([group.prepared], prepared),
      ]),
    );
    for (const item of samples) {
      const groupKey = `${item.row.origin}:${item.row.group}`;
      scores.set(
        groupKey,
        Math.min(scores.get(groupKey) ?? Infinity, item.score + 5),
      );
    }
    const groups = index.groups
      .filter((group) => Number.isFinite(scores.get(group.key)))
      .sort(
        (a, b) =>
          scores.get(a.key)! - scores.get(b.key)! ||
          a.group.localeCompare(b.group),
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
    const target = available.filter(
      (row) => row.group === group && row.origin === origin,
    );
    catalogue.select(target, !target.every((row) => chosen.has(row.id)));
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
      <header className="panel-heading">
        <h2>Populations</h2>
        <div className="heading-actions">
          <span className="data-count">
            {selected.length.toLocaleString()} selected
          </span>
          <button
            className="icon-button"
            aria-label="Collapse data panel"
            title="Collapse data panel"
            onClick={onCollapse}
          >
            <PanelLeftClose size={15} />
          </button>
        </div>
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
        <div className="search-scope-actions">
          <button
            className="text-button"
            aria-label="Advanced search"
            aria-pressed={advanced}
            onClick={onAdvanced}
          >
            <Search size={13} />
            Advanced search
            {criteriaCount > 0 && (
              <span className="count-badge">{criteriaCount}</span>
            )}
          </button>
          <button
            className="text-button"
            disabled={!available.length}
            onClick={() => catalogue.select(filterRows(available, query, []))}
          >
            Add all matches
          </button>
        </div>
        <div
          className="population-token-box"
          ref={box}
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
                <button
                  type="button"
                  className="population-chip-text"
                  title={`Search ${label}`}
                  onClick={() => {
                    setQuery(label);
                    search.current?.focus();
                    search.current?.select();
                  }}
                >
                  {label}
                </button>
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
            onFocus={() => setFocused(true)}
            onChange={(event) => {
              setQuery(event.target.value);
              setFocused(true);
            }}
            onKeyDown={(event) => {
              if (event.key === "Backspace" && !query && tokens.length)
                catalogue.removeToken(tokens[tokens.length - 1]);
              if (event.key === "Escape") {
                setQuery("");
                event.stopPropagation();
              }
              if (event.key === "ArrowDown" && key) {
                event.preventDefault();
                results.current
                  ?.querySelector<HTMLButtonElement>(
                    ".group-select,.database-sample",
                  )
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
      <section className="manual-source" aria-label="Manual coordinates">
        <details>
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
      <div
        ref={results}
        className="database-results"
        style={{
          position: "fixed",
          ...popup,
          display: key && focused ? undefined : "none",
        }}
        onPointerDown={(event) => event.preventDefault()}
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
                  const groupChosen = selectedCount === group.rows.length;
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
