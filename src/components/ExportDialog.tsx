import { useEffect, useMemo, useRef, useState, type RefObject } from "react";
import { Dialog } from "./Dialog";
import type { PlotView, AddOptions } from "../domain/figure";
import { createEntries } from "../domain/figure";
import { entryMarkers } from "../domain/markerAssignment";
import type { ChartHandle } from "./PcaChart";
import type { PcaResult } from "../domain/pca";
import type { CatalogueRow } from "../domain/database";
import {
  defaultImageOptions,
  type ImageOptions,
  type ImagePlacement,
  type ImageLegend,
} from "../domain/imageExport";
import { composePng, type ChartImage } from "./composePng";

export function ExportDialog({
  plot,
  result,
  view,
  options: addOptions,
  selectedRows = [],
  patchView,
  onSave,
  onClose,
}: {
  plot: RefObject<ChartHandle | null>;
  result?: PcaResult | null;
  view: PlotView;
  options?: AddOptions;
  selectedRows?: CatalogueRow[];
  patchView: (patch: Partial<PlotView>) => void;
  onSave?: (w: number, h: number) => void;
  onClose: () => void;
}) {
  const [options, setOptions] = useState<ImageOptions>(() =>
    defaultImageOptions(view.title, view.subtitle),
  );
  const [chart, setChart] = useState<ChartImage | null>(null);
  const [preview, setPreview] = useState("");
  const [placement, setPlacement] = useState<ImagePlacement | null>(null);
  const [busy, setBusy] = useState(true);
  const [htmlBusy, setHtmlBusy] = useState(false);
  const [error, setError] = useState("");

  const capture = useRef<Promise<ChartImage> | null>(null);

  const legend: ImageLegend = useMemo(() => {
    if (!result) return [];
    const currentAddOptions = addOptions ?? {
      mode: "aggregated" as const,
      customName: "",
      subgroups: false,
      labels: true,
      hulls: true,
      regression: true,
    };
    const entries = createEntries(result, currentAddOptions);
    const markers = entryMarkers(result, entries, view);
    return entries.flatMap((entry, i) => {
      if (view.hiddenTraces.includes(i)) return [];
      return [
        {
          name: entry.name,
          appearance: markers[i],
        },
      ];
    });
  }, [result, addOptions, view.x, view.y, view.hiddenTraces]);

  const patch = (change: Partial<ImageOptions>) => {
    setBusy(true);
    const updated = { ...options, ...change };
    setOptions(updated);
    if ("title" in change && change.title !== undefined) {
      patchView({ title: change.title });
    }
    if ("subtitle" in change && change.subtitle !== undefined) {
      patchView({ subtitle: change.subtitle });
    }
    if ("includeLegend" in change && change.includeLegend !== undefined) {
      patchView({ legend: change.includeLegend });
    }
  };

  useEffect(() => {
    let active = true;
    if (plot.current?.captureChartImage) {
      capture.current ??= plot.current.captureChartImage();
      void capture.current
        .then((res) => {
          if (active && res) {
            setChart(res);
          }
        })
        .catch((e) => {
          if (active) {
            setError(String(e.message ?? e));
            setBusy(false);
          }
        });
    } else {
      setBusy(false);
    }
    return () => {
      active = false;
    };
  }, [plot]);

  useEffect(() => {
    if (!chart) return;
    let active = true;
    setBusy(true);
    setError("");
    const timer = setTimeout(() => {
      void composePng(chart, legend, options)
        .then((res) => {
          if (active) {
            setPreview(res.url);
            setPlacement(res.placement);
            setBusy(false);
          }
        })
        .catch((e) => {
          if (active) {
            setError(String(e.message ?? e));
            setBusy(false);
          }
        });
    }, 120);

    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [chart, legend, options]);

  const numberInput = (
    label: string,
    key: keyof ImageOptions,
    min: number,
    max: number,
  ) => (
    <label className="control-row">
      {label}
      <input
        aria-label={label}
        type="number"
        min={min}
        max={max}
        value={Number(options[key])}
        onChange={(e) => {
          if (e.target.value !== "") {
            patch({
              [key]: Math.max(
                min,
                Math.min(max, Math.round(Number(e.target.value))),
              ),
            });
          }
        }}
      />
    </label>
  );

  const weightSelect = (label: string, key: keyof ImageOptions) => (
    <label className="control-row">
      {label}
      <select
        aria-label={label}
        value={String(options[key])}
        onChange={(e) => patch({ [key]: Number(e.target.value) })}
      >
        {[400, 500, 600, 700, 800].map((w) => (
          <option key={w} value={w}>
            {w === 400 ? "Normal" : w === 700 ? "Bold" : w}
          </option>
        ))}
      </select>
    </label>
  );

  const downloadCsv = () => {
    const lines: string[] = [];
    const pcCount = result?.componentCount ?? 25;
    const headers = [
      "Sample",
      "Population",
      ...Array.from({ length: pcCount }, (_, i) => `PC${i + 1}`),
    ];
    lines.push(headers.map((h) => `"${h}"`).join(","));

    if (result && selectedRows.length === result.dataset.samples.length) {
      for (let i = 0; i < selectedRows.length; i++) {
        const row = selectedRows[i];
        const scores = result.scores[i] ?? [];
        const values = [
          row.geneticId,
          row.group,
          ...scores.slice(0, pcCount).map((v) => v.toFixed(6)),
        ];
        lines.push(
          values.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(","),
        );
      }
    } else if (selectedRows.length > 0) {
      for (const row of selectedRows) {
        const values = [
          row.geneticId,
          row.group,
          ...row.sample.scaled.slice(0, pcCount).map((v) => v.toFixed(6)),
        ];
        lines.push(
          values.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(","),
        );
      }
    } else if (result) {
      for (let i = 0; i < result.dataset.samples.length; i++) {
        const sample = result.dataset.samples[i];
        const scores = result.scores[i] ?? [];
        const values = [
          sample.name,
          sample.group,
          ...scores.slice(0, pcCount).map((v) => v.toFixed(6)),
        ];
        lines.push(
          values.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(","),
        );
      }
    }

    const blob = new Blob([lines.join("\r\n")], {
      type: "text/csv;charset=utf-8",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "noman_G25_filtered.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  const downloadPng = () => {
    if (!preview) return;
    const a = document.createElement("a");
    a.href = preview;
    const baseName = (options.title.trim() || "noman_G25_PCA").replace(
      /\s+/g,
      "_",
    );
    a.download = `${baseName}_PC${view.x + 1}_PC${view.y + 1}.png`;
    a.click();
  };

  const exportHtml = async () => {
    setHtmlBusy(true);
    setError("");
    try {
      const plotData = plot.current?.getPlotLayout?.();
      const title = options.title.trim() || "noman’s G25 - Custom PCA";
      const subtitle = options.subtitle.trim();
      const htmlContent = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${title}</title>
  <script src="https://cdn.plot.ly/plotly-basic-2.35.2.min.js"></script>
  <style>
    * { box-sizing: border-box; }
    body { margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; background: #ffffff; color: #222; }
    header { padding: 12px 20px; border-bottom: 1px solid #e0deda; background: #fafafa; display: flex; align-items: baseline; justify-content: space-between; }
    header h1 { margin: 0; font-size: 16px; font-weight: 600; }
    header p { margin: 0; font-size: 12px; color: #666; }
    #chart { width: 100vw; height: calc(100vh - 49px); }
  </style>
</head>
<body>
  <header>
    <h1>${title}</h1>
    ${subtitle ? `<p>${subtitle}</p>` : ""}
  </header>
  <div id="chart"></div>
  <script>
    const data = ${JSON.stringify(plotData?.data ?? [])};
    const layout = ${JSON.stringify({
      ...(plotData?.layout ?? {}),
      autosize: true,
      margin: { l: 50, r: 24, t: 30, b: 35 },
    })};
    Plotly.newPlot("chart", data, layout, { responsive: true, displayModeBar: true, displaylogo: false });
  </script>
</body>
</html>`;
      const blob = new Blob([htmlContent], { type: "text/html;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `noman_G25_PC${view.x + 1}_PC${view.y + 1}_interactive.html`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (e) {
      setError(e instanceof Error ? e.message : "HTML export failed.");
    } finally {
      setHtmlBusy(false);
    }
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
                value={options.title}
                onChange={(e) => patch({ title: e.target.value })}
              />
            </label>
            {numberInput("Title font size", "titleSize", 8, 64)}
            {weightSelect("Title font weight", "titleWeight")}

            <label className="stacked-control">
              Subtitle
              <input
                aria-label="Export subtitle"
                value={options.subtitle}
                onChange={(e) => patch({ subtitle: e.target.value })}
              />
            </label>
            {numberInput("Subtitle font size", "subtitleSize", 8, 48)}
            {weightSelect("Subtitle font weight", "subtitleWeight")}
          </section>

          <section>
            <h3>Legend</h3>
            <label className="control-row">
              Include population legend
              <input
                type="checkbox"
                checked={options.includeLegend}
                onChange={(e) => patch({ includeLegend: e.target.checked })}
              />
            </label>
            <label className="control-row">
              Position
              <select
                aria-label="Export legend position"
                value={options.legendPosition}
                onChange={(e) =>
                  patch({
                    legendPosition: e.target
                      .value as ImageOptions["legendPosition"],
                  })
                }
              >
                {["right", "left", "top", "bottom"].map((p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
              </select>
            </label>
            {numberInput("Export legend columns", "legendColumns", 1, 6)}
            {numberInput("Legend font size", "legendFontSize", 8, 32)}
            {weightSelect("Legend font weight", "legendFontWeight")}
            {numberInput("Legend row spacing", "legendRowGap", 0, 32)}
            {numberInput("Legend column spacing", "legendColumnGap", 0, 64)}
            <label className="control-row">
              Legend box boundary
              <input
                type="checkbox"
                checked={options.legendBorder}
                onChange={(e) => patch({ legendBorder: e.target.checked })}
              />
            </label>
          </section>

          <p className="field-note">
            The chart is captured once at the current zoom and proportions.
            Headings and legend occupy additional space outside it.
          </p>
        </div>

        <div className="export-preview" aria-busy={busy}>
          {preview && (
            <img
              src={preview}
              alt="PNG export preview"
              data-plot-box={JSON.stringify(placement?.plotBox)}
              data-legend-box={JSON.stringify(placement?.legend)}
              data-chart-x={placement?.chart.x}
              data-chart-y={placement?.chart.y}
              data-chart-width={chart?.width}
              data-chart-height={chart?.height}
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
        <div className="export-archive">
          <button
            className="button"
            disabled={htmlBusy}
            onClick={() => void exportHtml()}
          >
            {htmlBusy ? "Preparing HTML…" : "Download interactive HTML"}
          </button>
          <span>
            One offline file · all loaded data, styles, zoom and tools
          </span>
        </div>

        <button
          className="button"
          onClick={() => {
            downloadCsv();
            onClose();
          }}
        >
          Filtered samples · CSV
        </button>

        <button
          className="button primary-export"
          disabled={busy || !preview || !!error}
          onClick={() => {
            downloadPng();
            if (onSave) onSave(chart?.width ?? 1200, chart?.height ?? 800);
            onClose();
          }}
        >
          Download PNG
        </button>
      </footer>
    </Dialog>
  );
}
