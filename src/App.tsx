import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ChartScatter, Ruler, Layers3, PanelLeftOpen } from "lucide-react";
import type { PcaResult } from "./domain/pca";
import {
  initialAddOptions,
  initialPlotView,
  type AddOptions,
  type PlotView,
  createEntries,
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
import { useCatalogue } from "./hooks/useCatalogue";
import { datasetFromRows } from "./domain/database";
import { filterRows, type MetadataFilter } from "./domain/filters";

export default function App() {
  const catalogue = useCatalogue();
  const [options, setOptions] = useState<AddOptions>(initialAddOptions);
  const [result, setResult] = useState<PcaResult | null>(null),
    [view, setView] = useState<PlotView>(initialPlotView);
  const [revision, setRevision] = useState(0),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [saveError, setSaveError] = useState("");
  const [collapsed, setCollapsed] = useState(false),
    [advanced, setAdvanced] = useState(false),
    [table, setTable] = useState(false);
  const [panelWidth, setPanelWidth] = useState(380),
    [windowWidth, setWindowWidth] = useState(window.innerWidth);
  const [query, setQuery] = useState(""),
    [criteria, setCriteria] = useState<MetadataFilter[]>([]);
  const plot = useRef<ChartHandle>(null),
    worker = useRef<Worker | null>(null),
    requestId = useRef(0);
  const resize = useRef<{ x: number; width: number } | null>(null);
  const maxPanel = Math.max(380, windowWidth - 32 - 360);
  const minPanel = advanced ? Math.min(640, maxPanel) : 320;
  const width = Math.max(minPanel, Math.min(panelWidth, maxPanel));
  const available = useMemo(
    () => filterRows(catalogue.rows, "", criteria),
    [catalogue.rows, criteria],
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
    document.title = "G25 tools — Custom PCA";
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
    const selected = catalogue.selected,
      id = ++requestId.current;
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
            setRevision((value) => value + 1);
            setView((current) => {
              const x = current.x < fitted.componentCount ? current.x : 0;
              const y =
                current.y < fitted.componentCount && current.y !== x
                  ? current.y
                  : x === 0
                    ? 1
                    : 0;
              return { ...current, hiddenTraces: [], x, y };
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
  const action = (action: ChartAction) => {
    if (action === "subtitle") {
      const subtitle = window.prompt("Plot subtitle", view.subtitle);
      if (subtitle !== null) patch({ subtitle: subtitle.trim() });
      return;
    }
    setView((current) => {
      switch (action) {
        case "legend":
          return { ...current, legend: !current.legend };
        case "markerSize":
          return { ...current, markerSize: (current.markerSize + 1) % 3 };
        case "pointLabels":
          return { ...current, pointLabels: (current.pointLabels + 1) % 4 };
        case "labelStyle":
          return { ...current, labelStyle: (current.labelStyle + 1) % 3 };
        case "labels":
          return { ...current, labels: !current.labels };
        case "hulls":
          return { ...current, hulls: !current.hulls };
        case "hullOpacity":
          return { ...current, hullOpacity: (current.hullOpacity + 1) % 3 };
        case "regression":
          return { ...current, regression: !current.regression };
        case "projected": {
          const count = result ? createEntries(result, options).length : 0;
          return {
            ...current,
            hiddenTraces:
              current.hiddenTraces.length < count
                ? Array.from({ length: count }, (_, i) => i)
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
    } catch (error) {
      setSaveError(
        error instanceof Error ? error.message : "Could not save the PNG.",
      );
    }
  };
  return (
    <div className="app-shell">
      <header className="app-header">
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
            patch({ hiddenTraces: [] });
          }}
          onClear={() => {
            catalogue.clearSelection();
            setSaveError("");
          }}
          onSave={(w, h) => void save(w, h)}
        />
        <div className="app-brand">
          <ChartScatter size={16} />
          <strong>G25 tools</strong>
        </div>
      </header>
      <div className="app-content">
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
          {collapsed && (
            <button
              className="rail-icon"
              aria-label="Open data panel"
              title="Open data panel"
              onClick={() => setCollapsed(false)}
            >
              <PanelLeftOpen size={18} />
            </button>
          )}
        </nav>
        <div
          className={`data-panel-layout ${advanced ? "advanced-open" : ""}`}
          style={{ width, display: collapsed ? "none" : undefined }}
        >
          {advanced && (
            <AdvancedSearch
              catalogue={catalogue}
              criteria={criteria}
              onCriteria={setCriteria}
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
        <main className="workspace">
          <div className="plot-surface" aria-busy={busy}>
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
