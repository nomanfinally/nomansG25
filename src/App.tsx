import { useCallback, useEffect, useRef, useState } from "react";
import {
  ChartScatter,
  Ruler,
  Layers3,
  FileText,
  ChevronDown,
  Plus,
  Minus,
  RotateCcw,
  List,
  Tags,
  Pentagon,
  TrendingUp,
  Download,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { Scaling } from "./domain/g25";
import type { PcaResult } from "./domain/pca";
import { initialPlotView, type PlotView } from "./domain/figure";
import { PcaChart, type ChartHandle } from "./components/PcaChart";
import { DataEntry } from "./components/DataEntry";

function ToolButton({
  label,
  icon: Icon,
  pressed,
  disabled,
  onClick,
}: {
  label: string;
  icon: LucideIcon;
  pressed?: boolean;
  disabled?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      className={`icon-button${pressed ? " is-active" : ""}`}
      title={label}
      aria-label={label}
      aria-pressed={pressed}
      disabled={disabled}
      onClick={onClick}
    >
      <Icon size={16} strokeWidth={1.65} />
    </button>
  );
}

export default function App() {
  const [text, setText] = useState("");
  const [scaling, setScaling] = useState<Scaling>("scaled");
  const [dataOpen, setDataOpen] = useState(false);
  const [result, setResult] = useState<PcaResult | null>(null);
  const [view, setView] = useState<PlotView>(initialPlotView);
  const [revision, setRevision] = useState(0);
  const [busy, setBusy] = useState(false);
  const [ready, setReady] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [exportError, setExportError] = useState("");
  const [lastInput, setLastInput] = useState({
    text: "",
    scaling: "scaled" as Scaling,
  });
  const plot = useRef<ChartHandle>(null);
  const worker = useRef<Worker | null>(null);
  useEffect(() => () => worker.current?.terminate(), []);
  const onReady = useCallback((value: boolean) => setReady(value), []);
  const dirty =
    !!result &&
    (text.trim() !== lastInput.text || scaling !== lastInput.scaling);

  const run = () => {
    if (busy) return;
    setError("");
    setExportError("");
    if (!text.trim()) {
      setError(
        "Paste G25 coordinates first. Each row needs a name and 25 comma-separated values.",
      );
      setDataOpen(true);
      return;
    }
    worker.current?.terminate();
    setBusy(true);
    const input = { text: text.trim(), scaling };
    try {
      const next = new Worker(
        new URL("./workers/pca.worker.ts", import.meta.url),
        { type: "module" },
      );
      worker.current = next;
      next.onmessage = (
        event: MessageEvent<{ result?: PcaResult; error?: string }>,
      ) => {
        if (event.data.result) {
          setResult(event.data.result);
          setRevision((value) => value + 1);
          setView((current) => ({ ...current, x: 0, y: 1 }));
          setLastInput(input);
          setDataOpen(false);
        } else {
          setError(
            event.data.error ??
              "The PCA could not be calculated. Check the input and try again.",
          );
          setDataOpen(true);
        }
        setBusy(false);
        next.terminate();
        worker.current = null;
      };
      next.onerror = () => {
        setError("The PCA could not start. Reload the page and try again.");
        setDataOpen(true);
        setBusy(false);
        next.terminate();
        worker.current = null;
      };
      next.postMessage(input);
    } catch {
      setError("The PCA could not start. Reload the page and try again.");
      setBusy(false);
      setDataOpen(true);
    }
  };

  const toggle = (key: "legend" | "labels" | "hulls" | "regression") =>
    setView((current) => ({ ...current, [key]: !current[key] }));
  const enabled = !!result && ready && !busy;
  const save = async () => {
    setSaving(true);
    setExportError("");
    try {
      await plot.current?.savePng();
    } catch (error) {
      setExportError(
        error instanceof Error
          ? error.message
          : "The PNG could not be saved. Try again.",
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="app-shell">
      <aside className="tool-rail">
        <div className="rail-brand" aria-label="G25 tools">
          G25
        </div>
        <nav aria-label="G25 tools">
          <button
            className="rail-item is-current"
            aria-current="page"
            title="G25 PCA"
          >
            <ChartScatter size={21} strokeWidth={1.5} />
            <span>G25 PCA</span>
          </button>
          <button
            className="rail-item"
            disabled
            title="G25 distances — planned"
          >
            <Ruler size={21} strokeWidth={1.5} />
            <span>Distances</span>
            <small>Planned</small>
          </button>
          <button className="rail-item" disabled title="G25 models — planned">
            <Layers3 size={21} strokeWidth={1.5} />
            <span>Models</span>
            <small>Planned</small>
          </button>
        </nav>
      </aside>
      <main className="workspace">
        <header className="toolbar" aria-label="PCA toolbar">
          <button
            className={`data-trigger${dataOpen ? " is-active" : ""}`}
            data-data-trigger
            aria-controls="coordinate-panel"
            aria-expanded={dataOpen}
            onClick={() => setDataOpen(!dataOpen)}
            title="Paste or edit G25 coordinates"
          >
            <FileText size={15} />
            <span>
              {result
                ? `${result.dataset.samples.length.toLocaleString()} G25 samples${dirty ? " · edited" : ""}`
                : "Paste G25 coordinates…"}
            </span>
            <ChevronDown size={13} />
          </button>
          <select
            aria-label="Coordinate scaling"
            value={scaling}
            onChange={(event) => {
              setScaling(event.target.value as Scaling);
              setError("");
            }}
            disabled={busy}
          >
            <option value="scaled">Scaled</option>
            <option value="raw">Raw</option>
          </select>
          <button className="button run-button" onClick={run} disabled={busy}>
            {busy ? "Calculating…" : "Run PCA"}
          </button>
          <div className="tool-divider" />
          <ToolButton
            label="Reset view"
            icon={RotateCcw}
            disabled={!enabled}
            onClick={() => plot.current?.reset()}
          />
          <ToolButton
            label="Zoom in"
            icon={Plus}
            disabled={!enabled}
            onClick={() => plot.current?.zoom(0.75)}
          />
          <ToolButton
            label="Zoom out"
            icon={Minus}
            disabled={!enabled}
            onClick={() => plot.current?.zoom(1 / 0.75)}
          />
          <div className="tool-divider" />
          <ToolButton
            label="Toggle legend"
            icon={List}
            pressed={view.legend}
            disabled={!enabled}
            onClick={() => toggle("legend")}
          />
          <ToolButton
            label="Toggle group labels"
            icon={Tags}
            pressed={view.labels}
            disabled={!enabled}
            onClick={() => toggle("labels")}
          />
          <ToolButton
            label="Toggle convex hulls"
            icon={Pentagon}
            pressed={view.hulls}
            disabled={!enabled}
            onClick={() => toggle("hulls")}
          />
          <ToolButton
            label="Toggle regression lines"
            icon={TrendingUp}
            pressed={view.regression}
            disabled={!enabled}
            onClick={() => toggle("regression")}
          />
          <div className="toolbar-spacer" />
          <div className="axis-controls">
            {(["x", "y"] as const).map((axis) => (
              <label key={axis}>
                <span>{axis.toUpperCase()}</span>
                <select
                  aria-label={
                    axis === "x" ? "Horizontal component" : "Vertical component"
                  }
                  value={view[axis]}
                  disabled={!enabled}
                  onChange={(event) =>
                    setView((current) => ({
                      ...current,
                      [axis]: Number(event.target.value),
                    }))
                  }
                >
                  {Array.from(
                    { length: result?.componentCount ?? 2 },
                    (_, index) => (
                      <option
                        key={index}
                        value={index}
                        disabled={index === view[axis === "x" ? "y" : "x"]}
                      >
                        PC{index + 1}
                      </option>
                    ),
                  )}
                </select>
              </label>
            ))}
          </div>
          <div className="tool-divider" />
          <button
            className="button save-button"
            disabled={!enabled || saving}
            onClick={() => void save()}
          >
            <Download size={14} />
            {saving ? "Saving…" : "Save PNG"}
          </button>
        </header>
        <div className="plot-surface" aria-busy={busy}>
          <PcaChart
            result={result}
            view={view}
            revision={revision}
            ref={plot}
            onReady={onReady}
          />
          {!result && (
            <div className="empty-state">
              <h1>G25 PCA</h1>
              <p>Paste G25 coordinates to run a custom PCA.</p>
              <button
                className="button"
                data-data-trigger
                onClick={() => setDataOpen(true)}
              >
                Paste coordinates
              </button>
            </div>
          )}
          {busy && (
            <div className="calculation-status" role="status">
              Calculating custom PCA…
            </div>
          )}
        </div>
        <footer className="chart-status" aria-live="polite">
          <span>
            {result
              ? `Custom PCA · ${result.dataset.samples.length.toLocaleString()} samples · ${result.dataset.groups.length.toLocaleString()} groups`
              : "Custom PCA · G25 coordinates only"}
            {dirty && (
              <span className="pending-note">
                {" "}
                · Input changed — Run PCA to update
              </span>
            )}
          </span>
          <span>
            {exportError ? (
              <span className="export-error" role="alert">
                {exportError}
              </span>
            ) : result ? (
              `${result.dataset.scaling === "raw" ? "Raw input → scaled G25" : "Scaled G25"} · Wheel to zoom · Drag to pan`
            ) : (
              "Processed in your browser"
            )}
          </span>
        </footer>
      </main>
      {dataOpen && (
        <DataEntry
          value={text}
          onChange={(value) => {
            setText(value);
            setError("");
          }}
          onRun={run}
          onClose={() => setDataOpen(false)}
          error={error}
          busy={busy}
        />
      )}
    </div>
  );
}
