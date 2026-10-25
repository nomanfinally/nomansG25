import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { ChartScatter, Ruler, Layers3 } from "lucide-react";
import { useCatalogue } from "./hooks/useCatalogue";
import { DatabasePanel } from "./components/DatabasePanel";
import { datasetFromRows, type CatalogueRow } from "./domain/database";
import type { PcaResult } from "./domain/pca";
import {
  imageSizes,
  initialAddOptions,
  initialPlotView,
  type AddOptions,
  type PlotView,
  axisTitle,
  createEntries,
} from "./domain/figure";
import {
  PcaChart,
  type ChartHandle,
  type ChartAction,
} from "./components/PcaChart";
import gearPaths from "./data/g25-gear.json";

function Menu({
  label,
  children,
  title,
}: {
  label: ReactNode;
  children: ReactNode;
  title?: string;
}) {
  return (
    <details className="source-menu">
      <summary
        className="btn btn-sm btn-outline-secondary dropdown-toggle"
        title={title}
      >
        {label}
      </summary>
      <div className="dropdown-menu">{children}</div>
    </details>
  );
}
function closeMenu(event: React.MouseEvent<HTMLElement>) {
  event.currentTarget.closest("details")?.removeAttribute("open");
}
const addModeNames = {
  aggregated: "Aggregated",
  individual: "Individual",
  single: "As one group",
};

export default function App() {
  const catalogue = useCatalogue();
  const selected = catalogue.selected;
  const [options, setOptions] = useState<AddOptions>(initialAddOptions),
    [applied, setApplied] = useState<AddOptions>(initialAddOptions);
  const [result, setResult] = useState<PcaResult | null>(null),
    [view, setView] = useState<PlotView>(initialPlotView);
  const [revision, setRevision] = useState(0),
    [busy, setBusy] = useState(false);
  const [error, setError] = useState(""),
    [saveError, setSaveError] = useState("");
  const plot = useRef<ChartHandle>(null),
    worker = useRef<Worker | null>(null),
    requestId = useRef(0);
  useEffect(() => () => worker.current?.terminate(), []);
  useEffect(() => {
    document.title = "G25 tools — Custom PCA";
    const normalizeHash = () => {
      if (window.location.hash !== "#Custom")
        window.history.replaceState(
          null,
          "",
          window.location.pathname + window.location.search + "#Custom",
        );
    };
    normalizeHash();
    window.addEventListener("hashchange", normalizeHash);
    const outside = (event: PointerEvent) => {
      document
        .querySelectorAll<HTMLDetailsElement>("details.source-menu[open]")
        .forEach((menu) => {
          if (!menu.contains(event.target as Node)) menu.open = false;
        });
    };
    const escape = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      document
        .querySelectorAll<HTMLDetailsElement>("details.source-menu[open]")
        .forEach((menu) => {
          menu.open = false;
          menu.querySelector<HTMLElement>("summary")?.focus();
        });
    };
    document.addEventListener("pointerdown", outside);
    document.addEventListener("keydown", escape);
    return () => {
      window.removeEventListener("hashchange", normalizeHash);
      document.removeEventListener("pointerdown", outside);
      document.removeEventListener("keydown", escape);
    };
  }, []);

  const reset = () => {
    requestId.current++;
    worker.current?.terminate();
    worker.current = null;
    setBusy(false);
    setError("");
    setSaveError("");
    setResult(null);
    catalogue.clearSelection();
    setView({ ...initialPlotView, hiddenTraces: [] });
    setRevision((value) => value + 1);
  };
  const fitSelection = (rows: CatalogueRow[]) => {
    worker.current?.terminate();
    worker.current = null;
    const id = ++requestId.current;
    setError("");
    setSaveError("");
    if (rows.length < 3) {
      setBusy(false);
      setResult(null);
      setView({ ...initialPlotView, hiddenTraces: [] });
      setRevision((value) => value + 1);
      return;
    }
    setBusy(true);
    const runOptions = { ...options };
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
          setResult(event.data.result);
          setApplied(runOptions);
          setView({ ...initialPlotView, hiddenTraces: [] });
          setRevision((value) => value + 1);
        } else {
          setResult(null);
          setError(
            event.data.error ??
              "The selected samples could not form a two-dimensional PCA.",
          );
        }
        setBusy(false);
        next.terminate();
        worker.current = null;
      };
      next.onerror = () => {
        if (id !== requestId.current) return;
        setResult(null);
        setError("The PCA could not start. Reload the page and try again.");
        setBusy(false);
        next.terminate();
        worker.current = null;
      };
      next.postMessage({ dataset: datasetFromRows(rows) });
    } catch {
      setBusy(false);
      setResult(null);
      setError("The PCA could not start. Reload the page and try again.");
    }
  };
  useEffect(() => {
    // Cancel stale fits immediately; debounce rapid chip/sample changes.
    requestId.current++;
    worker.current?.terminate();
    worker.current = null;
    setBusy(selected.length >= 3);
    const timer = window.setTimeout(() => fitSelection(selected), 100);
    return () => window.clearTimeout(timer);
    // Creation options apply on the next selection change or explicit Run.
  }, [selected]);
  const run = () => {
    if (catalogue.text.trim()) catalogue.addManual();
    else fitSelection(selected);
  };
  const action = useCallback(
    (action: ChartAction) => {
      if (action === "subtitle") {
        const subtitle = window.prompt("Please enter subtitle");
        setView((current) => ({
          ...current,
          subtitle: subtitle?.trim() ?? "",
        }));
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
            const count = result ? createEntries(result, applied).length : 0;
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
    },
    [result, applied],
  );
  const hidden = useCallback(
    (hiddenTraces: number[]) =>
      setView((current) => {
        if (
          hiddenTraces.length === current.hiddenTraces.length &&
          hiddenTraces.every((n, i) => n === current.hiddenTraces[i])
        )
          return current;
        return { ...current, hiddenTraces };
      }),
    [],
  );
  const save = async (width: number, height: number) => {
    setSaveError("");
    try {
      await plot.current?.savePng(width, height);
    } catch (error) {
      setSaveError(
        error instanceof Error
          ? error.message
          : "The PNG could not be saved. Try again.",
      );
    }
  };
  const patch = (change: Partial<AddOptions>) =>
    setOptions((current) => ({ ...current, ...change }));

  return (
    <div className="app-shell">
      <nav className="tool-rail" aria-label="G25 tools">
        <button
          className="rail-icon current"
          aria-label="G25 PCA"
          aria-current="page"
          title="G25 PCA"
        >
          <ChartScatter size={18} strokeWidth={1.5} />
        </button>
        <button
          className="rail-icon"
          aria-label="G25 distances — planned"
          title="G25 distances — planned"
          disabled
        >
          <Ruler size={18} strokeWidth={1.5} />
        </button>
        <button
          className="rail-icon"
          aria-label="G25 models — planned"
          title="G25 models — planned"
          disabled
        >
          <Layers3 size={18} strokeWidth={1.5} />
        </button>
      </nav>
      <main className="workspace">
        <form
          className="input-group input-group-sm p-2 source-controls"
          aria-label="G25 plot controls"
          onSubmit={(event) => {
            event.preventDefault();
            run();
          }}
        >
          <div className="input-group-prepend">
            <button
              className="btn btn-outline-primary"
              type="button"
              onClick={reset}
            >
              Reset plot
            </button>
            <Menu label="Save">
              {imageSizes.map(([width, height]) => (
                <button
                  key={`${width}:${height}`}
                  className="dropdown-item btn-sm"
                  type="button"
                  onClick={(event) => {
                    closeMenu(event);
                    void save(width, height);
                  }}
                >
                  {width}×{height} px
                </button>
              ))}
            </Menu>
          </div>
          <div className="source-controls-spacer" />
          <div className="input-group-append">
            <Menu label={addModeNames[options.mode]} title="Grouping mode">
              {(["aggregated", "individual", "single"] as const).map(
                (value) => (
                  <button
                    className="dropdown-item btn-sm"
                    type="button"
                    key={value}
                    onClick={(event) => {
                      patch({ mode: value });
                      closeMenu(event);
                    }}
                  >
                    {addModeNames[value]}
                  </button>
                ),
              )}
            </Menu>
          </div>
          {options.mode === "single" && (
            <input
              className="form-control custom-name"
              aria-label="Custom group name"
              placeholder="Type custom name"
              value={options.customName}
              spellCheck={false}
              onChange={(event) => patch({ customName: event.target.value })}
            />
          )}
          <div className="input-group-append">
            <Menu
              title="Addition options"
              label={
                <svg
                  width="1em"
                  height="1em"
                  viewBox="0 0 16 16"
                  fill="currentColor"
                  aria-label="Addition options"
                >
                  {gearPaths.map((d, i) => (
                    <path key={i} fillRule="evenodd" d={d} />
                  ))}
                </svg>
              }
            >
              <div className="addition-options py-2 px-3">
                {(["labels", "hulls", "regression"] as const).map((key, i) => (
                  <div
                    className="custom-control form-control-sm custom-switch"
                    key={key}
                  >
                    <input
                      type="checkbox"
                      className="custom-control-input"
                      id={`add-${key}`}
                      checked={options[key]}
                      onChange={(event) =>
                        patch({ [key]: event.target.checked })
                      }
                    />
                    <label
                      className="custom-control-label"
                      htmlFor={`add-${key}`}
                    >
                      {
                        [
                          "Add group labels",
                          "Add convex hulls",
                          "Add regression lines",
                        ][i]
                      }
                    </label>
                  </div>
                ))}
                {options.mode === "single" && (
                  <fieldset className="subgroup-options">
                    <legend className="dropdown-header">Add to:</legend>
                    {[false, true].map((value) => (
                      <div
                        className="custom-control custom-radio form-control-sm ml-2"
                        key={String(value)}
                      >
                        <input
                          type="radio"
                          className="custom-control-input"
                          name="decorate-group"
                          id={value ? "subgroups" : "main-group"}
                          checked={options.subgroups === value}
                          onChange={() => patch({ subgroups: value })}
                        />
                        <label
                          className="custom-control-label"
                          htmlFor={value ? "subgroups" : "main-group"}
                        >
                          {value ? "Aggregated subgroups" : "Main group"}
                        </label>
                      </div>
                    ))}
                  </fieldset>
                )}
                <label className="marker-choice" htmlFor="marker-appearance">
                  Markers
                  <select
                    id="marker-appearance"
                    aria-label="Marker appearance"
                    className="custom-select custom-select-sm"
                    value={options.appearance}
                    onChange={(event) =>
                      patch({
                        appearance: event.target
                          .value as AddOptions["appearance"],
                      })
                    }
                  >
                    <option value="outlined">
                      PCA Views outlines & shapes
                    </option>
                    <option value="g25">Original G25 Views</option>
                  </select>
                </label>
              </div>
            </Menu>
            <div
              className="component-controls"
              aria-label="Custom PCA components"
            >
              {(["x", "y"] as const).map((axis) => (
                <label key={axis}>
                  <span>{axis.toUpperCase()}</span>
                  <select
                    aria-label={
                      axis === "x"
                        ? "Horizontal component"
                        : "Vertical component"
                    }
                    title={
                      result
                        ? axisTitle(result, view[axis])
                        : `PC${view[axis] + 1}`
                    }
                    className="custom-select custom-select-sm"
                    value={view[axis]}
                    disabled={!result || busy}
                    onChange={(event) =>
                      setView((current) => ({
                        ...current,
                        [axis]: Number(event.target.value),
                      }))
                    }
                  >
                    {Array.from(
                      { length: result?.componentCount ?? 2 },
                      (_, i) => (
                        <option
                          value={i}
                          key={i}
                          disabled={i === view[axis === "x" ? "y" : "x"]}
                        >{`PC${i + 1}`}</option>
                      ),
                    )}
                  </select>
                </label>
              ))}
            </div>
            <button
              className="btn btn-outline-primary"
              type="submit"
              disabled={busy}
            >
              {busy ? "Running…" : "Run PCA"}
            </button>
          </div>
        </form>
        <div className="plot-surface" aria-busy={busy}>
          <PcaChart
            ref={plot}
            result={result}
            view={view}
            additions={applied}
            revision={revision}
            onAction={action}
            onHidden={hidden}
          />
        </div>
        {saveError && (
          <p className="input-feedback" id="coordinate-error" role="alert">
            {saveError}
          </p>
        )}
      </main>
      <DatabasePanel catalogue={catalogue} busy={busy} error={error} />
    </div>
  );
}
