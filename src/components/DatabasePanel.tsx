import { useMemo, useRef, useState, useEffect } from "react";
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
import { prepareSearch, scoreSearch, type SearchField } from "../domain/search";
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
  const searchInputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const candidateMenuRef = useRef<HTMLDivElement>(null);

  const [focused, setFocused] = useState(false);
  const [expanded, setExpanded] = useState(new Set<string>());
  const [databaseScaling, setDatabaseScaling] = useState<Scaling>("scaled");
  const [limits, setLimits] = useState<Record<string, number>>({});
  const [highlightIndex, setHighlightIndex] = useState(0);

  // Close candidate menu on click outside
  useEffect(() => {
    const handleOutsideClick = (event: PointerEvent) => {
      const target = event.target as Node;
      if (
        !box.current?.contains(target) &&
        !candidateMenuRef.current?.contains(target)
      ) {
        setFocused(false);
      }
    };
    document.addEventListener("pointerdown", handleOutsideClick);
    return () => document.removeEventListener("pointerdown", handleOutsideClick);
  }, []);

  // Prepare index of available populations and individual samples
  // Strictly indexes Group ID, normalized Group ID, Genetic ID, and Individual ID
  const index = useMemo(() => {
    const groups = new Map<
      string,
      {
        key: string;
        group: string;
        normalizedGroup: string;
        origin: CatalogueRow["origin"];
        rows: CatalogueRow[];
        prepared: SearchField[];
      }
    >();

    for (const row of available) {
      const key = `${row.origin}:${row.group}`;
      const normalizedGroup =
        row.metadata?.["normalized Group ID"] ||
        row.metadata?.["normalized group id"] ||
        row.group;

      if (!groups.has(key)) {
        const prepared = [prepareSearch(row.group)];
        if (normalizedGroup && normalizedGroup !== row.group) {
          prepared.push(prepareSearch(normalizedGroup));
        }
        groups.set(key, {
          key,
          group: row.group,
          normalizedGroup,
          origin: row.origin,
          rows: [],
          prepared,
        });
      }
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

  // Score candidates with Admix_IRE ranking
  const matches = useMemo(() => {
    if (!key) return { groups: [], samples: [], groupCount: 0, sampleCount: 0 };
    const preparedQuery = prepareSearch(query);

    // 1. Score individual samples
    const scoredSamples = index.samples
      .map((item) => ({
        ...item,
        score: scoreSearch(item.prepared, preparedQuery),
      }))
      .filter((item) => Number.isFinite(item.score))
      .sort(
        (a, b) =>
          a.score - b.score || a.row.geneticId.localeCompare(b.row.geneticId),
      );

    // 2. Score groups directly
    const groupScores = new Map(
      index.groups.map((group) => [
        group.key,
        scoreSearch(group.prepared, preparedQuery),
      ]),
    );

    // 3. Promote parent groups of matching samples (with offset +5)
    for (const item of scoredSamples) {
      const groupKey = `${item.row.origin}:${item.row.group}`;
      const current = groupScores.get(groupKey) ?? Infinity;
      groupScores.set(groupKey, Math.min(current, item.score + 5));
    }

    const scoredGroups = index.groups
      .filter((group) => Number.isFinite(groupScores.get(group.key)))
      .sort(
        (a, b) =>
          groupScores.get(a.key)! - groupScores.get(b.key)! ||
          a.group.localeCompare(b.group),
      );

    return {
      groups: scoredGroups.slice(0, 40),
      samples: scoredSamples.slice(0, 30).map((item) => item.row),
      groupCount: scoredGroups.length,
      sampleCount: scoredSamples.length,
    };
  }, [index, key, query]);

  // Combined flat list of candidate options for keyboard navigation
  const flatOptions = useMemo(() => {
    const list: Array<
      | { type: "group"; group: string; origin: CatalogueRow["origin"] }
      | { type: "sample"; row: CatalogueRow }
    > = [];
    for (const g of matches.groups) {
      list.push({ type: "group", group: g.group, origin: g.origin });
    }
    for (const s of matches.samples) {
      list.push({ type: "sample", row: s });
    }
    return list;
  }, [matches]);

  // Reset highlight index when query changes
  useEffect(() => {
    setHighlightIndex(0);
  }, [query]);

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
    setFocused(true);
    searchInputRef.current?.focus();
  };

  const chooseSample = (row: CatalogueRow, clear = true) => {
    catalogue.sample(row);
    if (clear) {
      setQuery("");
      setFocused(true);
      searchInputRef.current?.focus();
    }
  };

  const sampleButton = (row: CatalogueRow, nested = false) => (
    <button
      key={row.id}
      type="button"
      className={`database-sample${nested ? " nested" : ""}`}
      aria-pressed={chosen.has(row.id)}
      aria-label={`${chosen.has(row.id) ? "Remove" : "Select"} sample ${row.geneticId} in ${row.group}`}
      onMouseDown={(e) => e.preventDefault()}
      onClick={() => chooseSample(row, !nested)}
    >
      <span className="choice-check">
        {chosen.has(row.id) && <Check size={13} />}
      </span>
      <span className="sample-copy">
        <span className="sample-id-text">{row.geneticId}</span>
        {!nested && <small className="sample-group-text">{row.group}</small>}
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
        </div>
      </header>

      {/* TSV Load & Status */}
      <section className="database-source" aria-label="Database file">
        <div className="database-load-row">
          <button
            type="button"
            className="btn btn-sm btn-outline-primary"
            onClick={() => fileInputRef.current?.click()}
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
            ref={fileInputRef}
            className="sr-only"
            tabIndex={-1}
            type="file"
            accept=".tsv,.txt,text/tab-separated-values,text/plain"
            aria-label="Load database TSV"
            onChange={(event) => {
              const file = event.target.files?.[0];
              if (file) void catalogue.loadDatabase(file, databaseScaling);
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
                  {catalogue.database.skipped === 1 ? "row" : "rows"} without coordinates skipped
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

      {/* Admix_IRE Population & Genetic ID Picker */}
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
            className={`text-button ${advanced ? "active" : ""}`}
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

        {/* Population Token Box & Search Input */}
        <div className="search-box-anchor-container">
          <div
            className="population-token-box"
            ref={box}
            onClick={(event) => {
              if (!(event.target as HTMLElement).closest("button")) {
                searchInputRef.current?.focus();
              }
            }}
          >
            {tokens.map((token) => {
              const row =
                token.kind === "sample"
                  ? rows.find((r) => r.id === token.value)
                  : undefined;
              const label =
                token.kind === "group"
                  ? token.value
                  : (row?.geneticId ?? token.value);
              const count =
                token.kind === "group"
                  ? rows.filter((r) => belongs(r, token)).length
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
                    title={`Click to search ${label}`}
                    onClick={() => {
                      setQuery(label);
                      setFocused(true);
                      searchInputRef.current?.focus();
                      searchInputRef.current?.select();
                    }}
                  >
                    {label}
                  </button>
                  {token.kind === "group" && (
                    <span className="chip-count">{count}</span>
                  )}
                  <button
                    type="button"
                    className="chip-remove"
                    aria-label={`Remove ${label}`}
                    onClick={() => catalogue.removeToken(token)}
                  >
                    <X size={12} />
                  </button>
                </span>
              );
            })}

            <input
              id="population-search"
              ref={searchInputRef}
              type="search"
              aria-label="Search populations or genetic IDs"
              autoComplete="off"
              spellCheck={false}
              placeholder={
                tokens.length === 0
                  ? "Search group ID or genetic ID…"
                  : "Search more…"
              }
              value={query}
              disabled={!rows.length}
              onFocus={() => setFocused(true)}
              onChange={(event) => {
                setQuery(event.target.value);
                setFocused(true);
              }}
              onKeyDown={(event) => {
                if (event.key === "Backspace" && !query && tokens.length) {
                  catalogue.removeToken(tokens[tokens.length - 1]);
                }
                if (event.key === "Escape") {
                  setQuery("");
                  setFocused(false);
                  event.stopPropagation();
                }
                if (event.key === "ArrowDown") {
                  event.preventDefault();
                  if (flatOptions.length > 0) {
                    setHighlightIndex((prev) => (prev + 1) % flatOptions.length);
                  }
                  if (key) {
                    candidateMenuRef.current
                      ?.querySelector<HTMLButtonElement>(".candidate-pop-select, .candidate-sample-select")
                      ?.focus();
                  }
                }
                if (event.key === "ArrowUp") {
                  event.preventDefault();
                  if (flatOptions.length > 0) {
                    setHighlightIndex(
                      (prev) => (prev - 1 + flatOptions.length) % flatOptions.length,
                    );
                  }
                }
                if (event.key === "Enter" && key) {
                  event.preventDefault();
                  // Check exact genetic ID match first
                  const exactSample = matches.samples.find(
                    (s) => s.geneticId.toLowerCase() === key,
                  );
                  if (exactSample) {
                    chooseSample(exactSample);
                    return;
                  }

                  // Otherwise choose highlighted option
                  const highlighted = flatOptions[highlightIndex];
                  if (highlighted) {
                    if (highlighted.type === "group") {
                      chooseGroup(highlighted.group, highlighted.origin);
                    } else {
                      chooseSample(highlighted.row);
                    }
                  } else if (matches.groups[0]) {
                    chooseGroup(matches.groups[0].group, matches.groups[0].origin);
                  } else if (matches.samples[0]) {
                    chooseSample(matches.samples[0]);
                  }
                }
              }}
            />
          </div>

          {/* Admix_IRE Anchored Suggestion Menu */}
          {key && focused && (
            <div
              ref={candidateMenuRef}
              className="candidate-menu database-results"
              role="listbox"
              aria-label="Population and sample suggestions"
              onKeyDown={(event) => {
                if (event.key === "Escape") {
                  setQuery("");
                  searchInputRef.current?.focus();
                }
                if (event.key === "ArrowDown" || event.key === "ArrowUp") {
                  const buttons = [
                    ...(candidateMenuRef.current?.querySelectorAll<HTMLButtonElement>(
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
              {matches.groups.length > 0 && (
                <>
                  <div className="candidate-title result-heading">
                    Populations ({matches.groupCount.toLocaleString()})
                  </div>
                  {matches.groups.map((group, gIdx) => {
                    const isHighlighted = highlightIndex === gIdx;
                    const open = expanded.has(group.key);
                    const selectedCount = group.rows.filter((r) =>
                      chosen.has(r.id),
                    ).length;
                    const isGroupChosen = selectedCount === group.rows.length;

                    return (
                      <div key={group.key} className="candidate-group-entry database-group">
                        <div
                          className={`candidate-row population-row ${isHighlighted ? "highlighted" : ""}`}
                          onMouseEnter={() => setHighlightIndex(gIdx)}
                        >
                          <button
                            type="button"
                            className="group-expand-btn"
                            aria-label={`${open ? "Collapse" : "Expand"} population ${group.group}`}
                            aria-expanded={open}
                            onMouseDown={(e) => e.preventDefault()}
                            onClick={() =>
                              setExpanded((curr) => {
                                const next = new Set(curr);
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
                            className="candidate-pop-select group-select"
                            aria-label={`Select population ${group.group}`}
                            aria-pressed={
                              isGroupChosen
                                ? true
                                : selectedCount > 0
                                  ? "mixed"
                                  : false
                            }
                            onMouseDown={(e) => e.preventDefault()}
                            onClick={() => chooseGroup(group.group, group.origin)}
                          >
                            <span className="candidate-pop-label">
                              {group.group}
                              {group.origin === "manual" && (
                                <small className="pasted-badge">pasted</small>
                              )}
                            </span>
                            <span className="candidate-pop-count">
                              {selectedCount > 0 ? `${selectedCount}/` : ""}
                              {group.rows.length}{" "}
                              {group.rows.length === 1 ? "sample" : "samples"}
                            </span>
                          </button>
                        </div>

                        {/* Expanded Individual Group Samples */}
                        {open && (
                          <div className="database-group-samples">
                            {group.rows
                              .slice(0, limits[group.key] ?? 50)
                              .map((r) => sampleButton(r, true))}
                            {group.rows.length > (limits[group.key] ?? 50) && (
                              <button
                                type="button"
                                className="data-text-action more-samples"
                                onMouseDown={(e) => e.preventDefault()}
                                onClick={() =>
                                  setLimits((curr) => ({
                                    ...curr,
                                    [group.key]: (curr[group.key] ?? 50) + 50,
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
                </>
              )}

              {matches.samples.length > 0 && (
                <>
                  <div className="candidate-title sample-title result-heading">
                    Individual samples ({matches.sampleCount.toLocaleString()})
                  </div>
                  {matches.samples.map((s, sIdx) => {
                    const optionIndex = matches.groups.length + sIdx;
                    const isHighlighted = highlightIndex === optionIndex;

                    return (
                      <div
                        key={s.id}
                        className={`candidate-row sample-row ${isHighlighted ? "highlighted" : ""}`}
                        onMouseEnter={() => setHighlightIndex(optionIndex)}
                      >
                        {sampleButton(s)}
                      </div>
                    );
                  })}
                </>
              )}

              {!matches.groups.length && !matches.samples.length && (
                <div className="candidate-empty" role="status">
                  No group ID or genetic ID matches “{query.trim()}”
                </div>
              )}
            </div>
          )}
        </div>

        <p className="picker-hint">
          Click a population to add its chip. Expand to toggle individuals.
        </p>
      </section>

      {/* Manual Coordinates Paste */}
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
