import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ChartScatter, Ruler, Layers3, PanelLeftOpen, PanelLeftClose } from "lucide-react";
import type { PcaResult } from "./domain/pca";
import {
  initialAddOptions,
  initialPlotView,
  type AddOptions,
  type PlotView,
} from "./domain/figure";
import {
  PcaChart,
  type ChartHandle,
  type ChartAction,
} from "./components/PcaChart";
import { DatabasePanel } from "./components/DatabasePanel";
import { AdvancedSearch } from "./components/AdvancedSearch";
import { PcaLegend } from "./components/PcaLegend";
import { PlotToolbar } from "./components/PlotToolbar";
import { ExportDialog } from "./components/ExportDialog";
import { useCatalogue } from "./hooks/useCatalogue";
import { datasetFromRows } from "./domain/database";
import { filterRows, type MetadataFilter } from "./domain/filters";

export default function App() {
  const catalogue = useCatalogue();
  const [options, setOptions] = useState<AddOptions>(initialAddOptions);
  const [result, setResult] = useState<PcaResult | null>(null);
  const [view, setView] = useState<PlotView>(initialPlotView);
  const [revision, setRevision] = useState(0);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [saveError, setSaveError] = useState("");
  const [collapsed, setCollapsed] = useState(false);
  const [advanced, setAdvanced] = useState(false);
  const [table, setTable] = useState(false);
  const [panelWidth, setPanelWidth] = useState(380);
  const [windowWidth, setWindowWidth] = useState(window.innerWidth);
  const [query, setQuery] = useState("");
  const [criteria, setCriteria] = useState<MetadataFilter[]>([]);
  const [regexScope, setRegexScope] = useState({ field: "All fields", query: "" });
  const [fullscreen, setFullscreen] = useState(false);
  const [exportOpen, setExportOpen] = useState(false);

  useEffect(() => {
    const handler = () => setFullscreen(!!document.fullscreenElement);
    document.addEventListener("fullscreenchange", handler);
    return () => document.removeEventListener("fullscreenchange", handler);
  }, []);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
    } else {
      document.exitFullscreen().catch(() => {});
    }
  };

  const plot = useRef<ChartHandle>(null);
  const worker = useRef<Worker | null>(null);
  const requestId = useRef(0);
  const resize = useRef<{ x: number; width: number } | null>(null);

  const maxPanel = Math.max(380, windowWidth - 32 - 360);
  const minPanel = advanced ? Math.min(640, maxPanel) : 320;
  const width = Math.max(minPanel, Math.min(panelWidth, maxPanel));

  const available = useMemo(
    () => filterRows(catalogue.rows, "", criteria, regexScope),
    [catalogue.rows, criteria, regexScope],
  );

  const matches = useMemo(
    () => filterRows(available, query, []),
    [available, query],
  );

  const scope = useMemo(
    () => filterRows(catalogue.rows, query, []),
    [catalogue.rows, query],
  );

  useEffect(() => {
    const changed = () => setWindowWidth(window.innerWidth);
    window.addEventListener("resize", changed);
    document.title = "noman’s G25";
    return () => {
      window.removeEventListener("resize", changed);
      worker.current?.terminate();
    };
  }, []);

  useEffect(() => {
    if (location.hash !== "#Custom")
      history.replaceState(
        null,
        "",
        location.pathname + location.search + "#Custom",
      );
    const selected = catalogue.selected;
    const id = ++requestId.current;
    worker.current?.terminate();
    worker.current = null;
    setError("");
    setBusy(selected.length >= 3);
    if (selected.length < 3) {
      setResult(null);
      setBusy(false);
      return;
    }
    const timer = window.setTimeout(() => {
      try {
        const next = new Worker(
          new URL("./workers/pca.worker.ts", import.meta.url),
          { type: "module" },
        );
        worker.current = next;
        next.onmessage = (
          event: MessageEvent<{ result?: PcaResult; error?: string }>,
        ) => {
          if (id !== requestId.current) return;
          if (event.data.result) {
            const fitted = event.data.result;
            setResult(fitted);
            setRevision((val) => val + 1);
            // Preserve tool settings and hidden traces when adding populations
            setView((current) => {
              const x = current.x < fitted.componentCount ? current.x : 0;
              const y =
                current.y < fitted.componentCount && current.y !== x
                  ? current.y
                  : x === 0
                    ? 1
                    : 0;
              return { ...current, x, y };
            });
          } else {
            setResult(null);
            setError(
              event.data.error ??
                "The selected samples could not form a 2D PCA.",
            );
          }
          setBusy(false);
          next.terminate();
          worker.current = null;
        };
        next.onerror = () => {
          if (id !== requestId.current) return;
          setResult(null);
          setBusy(false);
          setError("The PCA could not start. Reload and try again.");
          next.terminate();
          worker.current = null;
        };
        next.postMessage({ dataset: datasetFromRows(selected) });
      } catch {
        setBusy(false);
        setResult(null);
        setError("The PCA could not start. Reload and try again.");
      }
    }, 100);
    return () => clearTimeout(timer);
  }, [catalogue.selected]);

  const patch = useCallback(
    (change: Partial<PlotView>) =>
      setView((current) => ({ ...current, ...change })),
    [],
  );

  const hidden = useCallback(
    (hiddenTraces: number[]) =>
      setView((current) => ({ ...current, hiddenTraces })),
    [],
  );

  const action = (act: ChartAction) => {
    if (act === "subtitle") {
      const current = view.subtitle;
      const next = window.prompt("Chart subtitle:", current);
      if (next !== null) patch({ subtitle: next.trim() });
      return;
    }
    if (act === "legend") {
      patch({ legend: !view.legend });
      return;
    }
    setView((current) => {
      switch (act) {
        case "markerSize":
          return {
            ...current,
            markerSize: (current.markerSize + 1) % 3,
          };
        case "pointLabels":
          return {
            ...current,
            pointLabels: (current.pointLabels + 1) % 4,
          };
        case "labelStyle":
          return {
            ...current,
            labelStyle: (current.labelStyle + 1) % 3,
          };
        case "labels":
          return { ...current, labels: !current.labels };
        case "hulls":
          return { ...current, hulls: !current.hulls };
        case "hullOpacity":
          return {
            ...current,
            hullOpacity: (current.hullOpacity + 1) % 3,
          };
        case "regression":
          return { ...current, regression: !current.regression };
        case "projected": {
          const total = result?.dataset.groups.length ?? 0;
          return {
            ...current,
            hiddenTraces:
              current.hiddenTraces.length < total
                ? Array.from({ length: total }, (_, i) => i)
                : [],
          };
        }
        default:
          return current;
      }
    });
  };

  const toggleAdvanced = () => {
    if (advanced) {
      setAdvanced(false);
      setPanelWidth(380);
      setTable(false);
    } else {
      setAdvanced(true);
      setCollapsed(false);
      setPanelWidth(Math.min(720, maxPanel));
    }
  };

  const toggleTable = () => {
    setTable((current) => !current);
    setPanelWidth(table ? Math.min(720, maxPanel) : maxPanel);
  };

  const save = async (w: number, h: number) => {
    setSaveError("");
    try {
      await plot.current?.savePng(w, h);
    } catch (err) {
      setSaveError(
        err instanceof Error ? err.message : "Could not save the PNG.",
      );
    }
  };

  return (
    <div className="app-shell">
      {/* Top Header Bar (PCA_views style with noman's G25) */}
      <header className="topbar app-header">
        <div className="brand">
          <ChartScatter size={17} className="brand-icon" />
          <h1>noman’s G25</h1>
        </div>
        {catalogue.database && (
          <div className="header-meta">
            <span className="meta-stat">
              {catalogue.database.rows.length.toLocaleString()} samples
            </span>
            <span className="meta-divider">·</span>
            <span className="meta-stat">
              {new Set(catalogue.database.rows.map((r) => r.group)).size.toLocaleString()} groups
            </span>
            <span className="meta-divider">·</span>
            <span className="meta-stat scaling-badge">
              {catalogue.database.scaling}
            </span>
          </div>
        )}
        {result && (
          <div className="header-variance">
            <span className="variance-stat">
              PC{view.x + 1} ({(result.explainedVariance[view.x] * 100).toFixed(1)}%)
            </span>
            <span className="variance-dot">·</span>
            <span className="variance-stat">
              PC{view.y + 1} ({(result.explainedVariance[view.y] * 100).toFixed(1)}%)
            </span>
          </div>
        )}
      </header>

      <div className="app-content">
        {/* Full-Height Black Activity Rail */}
        <nav className="tool-rail" aria-label="G25 tools">
          <button
            className="rail-icon current"
            aria-label="G25 PCA"
            title="G25 PCA"
            aria-current="page"
          >
            <ChartScatter size={18} />
          </button>
          <button
            className="rail-icon"
            aria-label="G25 distances — planned"
            title="G25 distances — planned"
            disabled
          >
            <Ruler size={18} />
          </button>
          <button
            className="rail-icon"
            aria-label="G25 models — planned"
            title="G25 models — planned"
            disabled
          >
            <Layers3 size={18} />
          </button>
          {collapsed ? (
            <button
              className="rail-icon"
              aria-label="Open data panel"
              title="Open data panel"
              onClick={() => setCollapsed(false)}
            >
              <PanelLeftOpen size={18} />
            </button>
          ) : (
            <button
              className="rail-icon"
              aria-label="Collapse data panel"
              title="Collapse data panel"
              onClick={() => setCollapsed(true)}
            >
              <PanelLeftClose size={18} />
            </button>
          )}
        </nav>

        {/* Left Data Panels (Collapsible / Resizable) */}
        <div
          className={`data-panel-layout ${advanced ? "advanced-open" : ""}`}
          style={{
            width,
            display: collapsed ? "none" : undefined,
          }}
        >
          {advanced && (
            <AdvancedSearch
              catalogue={catalogue}
              criteria={criteria}
              onCriteria={setCriteria}
              regexScope={regexScope}
              onRegexScope={setRegexScope}
              matches={matches}
              scope={scope}
              table={table}
              onTable={toggleTable}
              onClose={toggleAdvanced}
            />
          )}
          <DatabasePanel
            catalogue={catalogue}
            busy={busy}
            error={error}
            query={query}
            onQuery={setQuery}
            available={available}
            onAdvanced={toggleAdvanced}
            advanced={advanced}
            criteriaCount={criteria.filter((rule) => rule.value.trim()).length}
            onCollapse={() => setCollapsed(true)}
          />
        </div>

        {/* Resizer bar */}
        {!collapsed && (
          <div
            className="panel-resizer"
            role="separator"
            aria-label="Resize data panel"
            aria-orientation="vertical"
            tabIndex={0}
            aria-valuemin={minPanel}
            aria-valuemax={maxPanel}
            aria-valuenow={Math.round(width)}
            onPointerDown={(event) => {
              if (event.button !== 0) return;
              event.preventDefault();
              resize.current = { x: event.clientX, width };
              event.currentTarget.setPointerCapture(event.pointerId);
            }}
            onPointerMove={(event) => {
              if (!resize.current) return;
              if (!(event.buttons & 1)) {
                resize.current = null;
                return;
              }
              setPanelWidth(
                Math.max(
                  minPanel,
                  Math.min(
                    maxPanel,
                    resize.current.width + event.clientX - resize.current.x,
                  ),
                ),
              );
            }}
            onPointerUp={() => {
              resize.current = null;
            }}
            onPointerCancel={() => {
              resize.current = null;
            }}
            onLostPointerCapture={() => {
              resize.current = null;
            }}
            onKeyDown={(event) => {
              if (event.key === "ArrowLeft" || event.key === "ArrowRight") {
                event.preventDefault();
                setPanelWidth(
                  Math.max(
                    minPanel,
                    Math.min(
                      maxPanel,
                      width + (event.key === "ArrowRight" ? 20 : -20),
                    ),
                  ),
                );
              }
            }}
          />
        )}

        {/* Main Chart Workspace */}
        <main className="workspace">
          <div className="plot-surface" aria-busy={busy}>
              {/* Floating Toolbar with non-fading edge toggles */}
              <PlotToolbar
                collapsed={collapsed}
                onPanel={() => setCollapsed((value) => !value)}
                view={view}
                patch={patch}
                action={action}
                plot={plot}
                result={result}
                options={options}
                onOptions={(change) => {
                  setOptions((current) => ({ ...current, ...change }));
                }}
                onClear={() => {
                  catalogue.clearSelection();
                  setSaveError("");
                }}
                onSave={(w, h) => void save(w, h)}
                onOpenExport={() => setExportOpen(true)}
                onTable={toggleTable}
                fullscreen={fullscreen}
                onFullscreen={toggleFullscreen}
              />

              <PcaChart
                ref={plot}
                result={result}
                view={view}
                additions={options}
                revision={revision}
                onAction={action}
                onHidden={hidden}
              />

              {result && view.legend && (
                <PcaLegend
                  result={result}
                  options={options}
                  view={view}
                  onHidden={hidden}
                  onClose={() => patch({ legend: false })}
                />
              )}

              {exportOpen && (
                <ExportDialog
                  plot={plot}
                  view={view}
                  patchView={patch}
                  onSave={(w, h) => void save(w, h)}
                  onClose={() => setExportOpen(false)}
                />
              )}

              {!result && (
                <div className="plot-empty">
                  {error ||
                    "Select populations or paste G25 coordinates to begin."}
                </div>
              )}

              {saveError && (
                <p className="chart-error" role="alert">
                  {saveError}
                </p>
              )}
            </div>
          </main>
        </div>
    </div>
  );
}
