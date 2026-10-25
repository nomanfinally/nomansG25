import { useEffect, useRef, useState, type RefObject } from "react";
import { Dialog } from "./Dialog";
import { imageSizes, type PlotView } from "../domain/figure";
import type { ChartHandle } from "./PcaChart";

export function ExportDialog({
  plot,
  view,
  patchView,
  onSave,
  onClose,
}: {
  plot: RefObject<ChartHandle | null>;
  view: PlotView;
  patchView: (patch: Partial<PlotView>) => void;
  onSave: (w: number, h: number) => void;
  onClose: () => void;
}) {
  const [title, setTitle] = useState(view.title || "Global 25 Custom PCA");
  const [titleSize, setTitleSize] = useState(18);
  const [titleWeight, setTitleWeight] = useState(700);
  const [subtitle, setSubtitle] = useState(view.subtitle || "");
  const [subtitleSize, setSubtitleSize] = useState(12);
  const [subtitleWeight, setSubtitleWeight] = useState(400);

  const [includeLegend, setIncludeLegend] = useState(view.legend);
  const [legendPosition, setLegendPosition] = useState<"right" | "left" | "top" | "bottom">("right");
  const [legendColumns, setLegendColumns] = useState(1);
  const [legendFontSize, setLegendFontSize] = useState(10);
  const [legendFontWeight, setLegendFontWeight] = useState(400);
  const [legendRowGap, setLegendRowGap] = useState(4);
  const [legendColGap, setLegendColGap] = useState(12);

  const [width, setWidth] = useState(1200);
  const [height, setHeight] = useState(600);
  const [preview, setPreview] = useState("");
  const [busy, setBusy] = useState(true);
  const [error, setError] = useState("");

  const capture = useRef<Promise<string> | null>(null);

  useEffect(() => {
    let active = true;
    setBusy(true);
    setError("");

    const timer = setTimeout(() => {
      capture.current = plot.current?.capturePng?.(800, 400) ?? null;
      if (capture.current) {
        capture.current
          .then((url) => {
            if (active) {
              setPreview(url);
              setBusy(false);
            }
          })
          .catch((e) => {
            if (active) {
              setError(e instanceof Error ? e.message : "Preview capture failed.");
              setBusy(false);
            }
          });
      } else {
        setBusy(false);
      }
    }, 120);

    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [plot]);

  const updateTitle = (val: string) => {
    setTitle(val);
    patchView({ title: val });
  };

  const updateSubtitle = (val: string) => {
    setSubtitle(val);
    patchView({ subtitle: val });
  };

  const updateLegend = (val: boolean) => {
    setIncludeLegend(val);
    patchView({ legend: val });
  };

  return (
    <Dialog title="Export" onClose={onClose}>
      <div className="export-layout">
        <div className="export-controls">
          <section>
            <h3>Heading</h3>
            <label className="stacked-control">
              Title
              <input
                aria-label="Export title"
                value={title}
                onChange={(e) => updateTitle(e.target.value)}
              />
            </label>
            <label className="control-row">
              Title font size
              <input
                aria-label="Title font size"
                type="number"
                min={8}
                max={64}
                value={titleSize}
                onChange={(e) => setTitleSize(Number(e.target.value))}
              />
            </label>
            <label className="control-row">
              Title font weight
              <select
                aria-label="Title font weight"
                value={titleWeight}
                onChange={(e) => setTitleWeight(Number(e.target.value))}
              >
                <option value={400}>Normal (400)</option>
                <option value={500}>Medium (500)</option>
                <option value={600}>Semibold (600)</option>
                <option value={700}>Bold (700)</option>
                <option value={800}>Extra Bold (800)</option>
              </select>
            </label>

            <label className="stacked-control">
              Subtitle
              <input
                aria-label="Export subtitle"
                value={subtitle}
                placeholder="Optional subtitle…"
                onChange={(e) => updateSubtitle(e.target.value)}
              />
            </label>
            <label className="control-row">
              Subtitle font size
              <input
                aria-label="Subtitle font size"
                type="number"
                min={8}
                max={48}
                value={subtitleSize}
                onChange={(e) => setSubtitleSize(Number(e.target.value))}
              />
            </label>
            <label className="control-row">
              Subtitle font weight
              <select
                aria-label="Subtitle font weight"
                value={subtitleWeight}
                onChange={(e) => setSubtitleWeight(Number(e.target.value))}
              >
                <option value={400}>Normal (400)</option>
                <option value={500}>Medium (500)</option>
                <option value={600}>Semibold (600)</option>
                <option value={700}>Bold (700)</option>
              </select>
            </label>
          </section>

          <section>
            <h3>Legend</h3>
            <label className="control-row">
              Include population legend
              <input
                type="checkbox"
                checked={includeLegend}
                onChange={(e) => updateLegend(e.target.checked)}
              />
            </label>
            <label className="control-row">
              Position
              <select
                aria-label="Export legend position"
                value={legendPosition}
                onChange={(e) =>
                  setLegendPosition(e.target.value as typeof legendPosition)
                }
              >
                <option value="right">right</option>
                <option value="left">left</option>
                <option value="top">top</option>
                <option value="bottom">bottom</option>
              </select>
            </label>
            <label className="control-row">
              Export legend columns
              <input
                aria-label="Export legend columns"
                type="number"
                min={1}
                max={6}
                value={legendColumns}
                onChange={(e) => setLegendColumns(Number(e.target.value))}
              />
            </label>
            <label className="control-row">
              Legend font size
              <input
                aria-label="Legend font size"
                type="number"
                min={8}
                max={32}
                value={legendFontSize}
                onChange={(e) => setLegendFontSize(Number(e.target.value))}
              />
            </label>
            <label className="control-row">
              Legend font weight
              <select
                aria-label="Legend font weight"
                value={legendFontWeight}
                onChange={(e) => setLegendFontWeight(Number(e.target.value))}
              >
                <option value={400}>Normal (400)</option>
                <option value={500}>Medium (500)</option>
                <option value={600}>Semibold (600)</option>
                <option value={700}>Bold (700)</option>
              </select>
            </label>
            <label className="control-row">
              Row spacing
              <input
                type="number"
                min={0}
                max={32}
                value={legendRowGap}
                onChange={(e) => setLegendRowGap(Number(e.target.value))}
              />
            </label>
            <label className="control-row">
              Column spacing
              <input
                type="number"
                min={0}
                max={64}
                value={legendColGap}
                onChange={(e) => setLegendColGap(Number(e.target.value))}
              />
            </label>
          </section>

          <section>
            <h3>Resolution Presets</h3>
            <p className="field-note">
              Click any preset to export immediately at that exact dimension:
            </p>
            <div className="export-options">
              {imageSizes.map(([w, h]) => (
                <button
                  key={`${w}:${h}`}
                  className={width === w && height === h ? "active-preset" : ""}
                  onClick={() => {
                    setWidth(w);
                    setHeight(h);
                    onSave(w, h);
                    onClose();
                  }}
                >
                  {w}×{h} px
                </button>
              ))}
            </div>

            <div className="custom-dimensions">
              <label className="control-row">
                Custom width (px)
                <input
                  aria-label="Custom export width"
                  type="number"
                  min={400}
                  max={8000}
                  value={width}
                  onChange={(e) => setWidth(Number(e.target.value))}
                />
              </label>
              <label className="control-row">
                Custom height (px)
                <input
                  aria-label="Custom export height"
                  type="number"
                  min={300}
                  max={6000}
                  value={height}
                  onChange={(e) => setHeight(Number(e.target.value))}
                />
              </label>
            </div>
          </section>
        </div>

        <div className="export-preview" aria-busy={busy}>
          {preview && (
            <img
              src={preview}
              alt="PNG export preview"
            />
          )}
          {busy && (
            <div className="export-progress" role="status">
              Updating preview…
            </div>
          )}
          {error && <p role="alert">{error}</p>}
        </div>
      </div>

      <footer className="export-footer">
        <span className="export-dimension-info">
          Selected size: {width} × {height} px · PNG
        </span>
        <div className="export-actions">
          <button className="button" onClick={onClose}>
            Close
          </button>
          <button
            className="button primary-export"
            disabled={busy}
            onClick={() => {
              onSave(width, height);
              onClose();
            }}
          >
            Download PNG
          </button>
        </div>
      </footer>
    </Dialog>
  );
}
