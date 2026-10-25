import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from "react";
import type { Config, Layout, PlotlyHTMLElement } from "plotly.js";
import { PlotlyCredit } from "./PlotlyCredit";
import type { PcaResult } from "../domain/pca";
import {
  buildFigure,
  escapeHtml,
  type PlotView,
  type AddOptions,
  type LabelOffset,
  type NamedAnnotation,
} from "../domain/figure";
import { paddedRange, wheelPixels, zoomRange } from "../domain/geometry";

type PlotlyApi = typeof import("plotly.js");
type ChartElement = PlotlyHTMLElement & {
  _fullLayout: {
    dragmode: Layout["dragmode"];
    xaxis: { range: number[]; _offset: number; _length: number };
    yaxis: { range: number[]; _offset: number; _length: number };
  };
};
export type ChartAction =
  | "subtitle"
  | "legend"
  | "markerSize"
  | "pointLabels"
  | "labelStyle"
  | "labels"
  | "hulls"
  | "hullOpacity"
  | "regression"
  | "projected";
export interface ChartHandle {
  zoom: (factor: number) => void;
  reset: () => void;
  fit: () => void;
  savePng: (width?: number, height?: number) => Promise<void>;
}
interface Props {
  result: PcaResult | null;
  view: PlotView;
  additions: AddOptions;
  revision: number;
  onAction: (action: ChartAction) => void;
  onHidden: (hidden: number[]) => void;
}

export const PcaChart = forwardRef<ChartHandle, Props>(
  function PcaChart(props, ref) {
    const host = useRef<HTMLDivElement>(null),
      api = useRef<PlotlyApi | null>(null);
    const latest = useRef(props);
    latest.current = props;
    const queue = useRef<Promise<unknown>>(Promise.resolve());
    const renderId = useRef(0),
      renderedAxes = useRef("");
    const offsets = useRef(new Map<string, LabelOffset>()),
      offsetRevision = useRef(props.revision);
    const [ready, setReady] = useState(false),
      [error, setError] = useState("");
    if (offsetRevision.current !== props.revision) {
      offsets.current.clear();
      offsetRevision.current = props.revision;
    }
    const figure = useMemo(
      () =>
        props.result
          ? buildFigure(
              props.result,
              props.view,
              props.additions,
              offsets.current,
            )
          : null,
      [props.result, props.view, props.additions, props.revision],
    );
    const resetAxes = () => {
      const element = host.current;
      if (!element || !api.current) return;
      queue.current = queue.current
        .then(async () => {
          const { result, view } = latest.current;
          if (!result) {
            await api.current!.relayout(element, {
              "xaxis.autorange": true,
              "yaxis.autorange": true,
            });
            return;
          }
          await api.current!.relayout(element, {
            "xaxis.range": paddedRange(result.scores.map((row) => row[view.x])),
            "yaxis.range": paddedRange(result.scores.map((row) => row[view.y])),
            "xaxis.autorange": false,
            "yaxis.autorange": false,
          });
        })
        .catch(() =>
          setError(
            "Unable to reset the axes. Try changing the selection again.",
          ),
        );
    };
    const makeConfig = (): Partial<Config> => ({
      displayModeBar: false,
      displaylogo: false,
      scrollZoom: false,
      responsive: false,
      edits: { annotationTail: true },
    });

    useEffect(() => {
      let disposed = false;
      const element = host.current!;
      import("plotly.js-basic-dist-min")
        .then(async (module) => {
          if (disposed) return;
          api.current = module.default;
          await api.current.newPlot(element, [], {}, makeConfig());
          if (disposed) {
            api.current.purge(element);
            return;
          }
          const chart = element as unknown as ChartElement;
          chart.on("plotly_relayout", (event) => {
            if (!Object.keys(event).some((k) => k.startsWith("annotations[")))
              return;
            for (const annotation of (chart.layout.annotations ??
              []) as NamedAnnotation[]) {
              if (
                annotation.name &&
                typeof annotation.ax === "number" &&
                typeof annotation.ay === "number"
              )
                offsets.current.set(
                  `${latest.current.view.x}:${latest.current.view.y}:${annotation.name}`,
                  { ax: annotation.ax, ay: annotation.ay },
                );
            }
          });
          chart.on("plotly_restyle", (event) => {
            const update = event[0];
            if (!update || !("visible" in update)) return;
            const hidden = chart.data.flatMap((trace, i) =>
              "visible" in trace &&
              (trace.visible === "legendonly" || trace.visible === false)
                ? [i]
                : [],
            );
            latest.current.onHidden(hidden);
          });
          setReady(true);
        })
        .catch(() => {
          if (!disposed)
            setError(
              "The chart could not start. Reload the page and try again.",
            );
        });

      let frame = 0,
        delta = 0,
        anchor = { x: 0.5, y: 0.5 };
      const wheel = (event: WheelEvent) => {
        if (!latest.current.result || !api.current || !event.deltaY) return;
        if (
          event.target instanceof Element &&
          event.target.closest(".legend,.modebar")
        )
          return;
        const chart = element as unknown as ChartElement,
          full = chart._fullLayout;
        if (!full) return;
        const box = element.getBoundingClientRect();
        const x =
          (event.clientX - box.left - full.xaxis._offset) / full.xaxis._length;
        const y =
          1 -
          (event.clientY - box.top - full.yaxis._offset) / full.yaxis._length;
        if (x < 0 || x > 1 || y < 0 || y > 1) return;
        event.preventDefault();
        event.stopPropagation();
        anchor = { x, y };
        delta += wheelPixels(event.deltaY, event.deltaMode, full.yaxis._length);
        if (frame) return;
        frame = requestAnimationFrame(() => {
          frame = 0;
          const factor = Math.exp(Math.max(-2, Math.min(2, delta * 0.0015))),
            position = anchor;
          delta = 0;
          queue.current = queue.current
            .then(async () => {
              if (disposed || !element.isConnected) return;
              const current = chart._fullLayout;
              await api.current!.relayout(element, {
                "xaxis.range": zoomRange(
                  current.xaxis.range,
                  factor,
                  position.x,
                ),
                "yaxis.range": zoomRange(
                  current.yaxis.range,
                  factor,
                  position.y,
                ),
                "xaxis.autorange": false,
                "yaxis.autorange": false,
              });
            })
            .catch(() => {
              if (!disposed)
                setError("Unable to zoom. Use Reset axes in the plot toolbar.");
            });
        });
      };
      element.addEventListener("wheel", wheel, { passive: false });
      let resizeFrame = 0;
      const observer = new ResizeObserver(() => {
        cancelAnimationFrame(resizeFrame);
        resizeFrame = requestAnimationFrame(() => {
          queue.current = queue.current
            .then(async () => {
              if (
                !disposed &&
                api.current &&
                element.isConnected &&
                element.classList.contains("js-plotly-plot")
              )
                await api.current.Plots.resize(element);
            })
            .catch(() => {
              if (!disposed)
                setError("The chart could not resize. Reload the page.");
            });
        });
      });
      observer.observe(element);
      return () => {
        disposed = true;
        observer.disconnect();
        element.removeEventListener("wheel", wheel);
        cancelAnimationFrame(frame);
        cancelAnimationFrame(resizeFrame);
        void queue.current.finally(() => api.current?.purge(element));
      };
    }, []);

    useEffect(() => {
      if (!ready || !api.current || !host.current) return;
      const { result, view, revision } = props,
        axesKey = `${revision}:${view.x}:${view.y}`;
      const axis = {
        zeroline: false,
        spikemode: "across" as const,
        spikedash: "dot" as const,
        spikethickness: 1,
        spikesnap: "data" as const,
        showspikes: false,
        tickfont: { color: "#666666", size: 12 },
        gridcolor: "#eeeeee",
        showline: false,
        linecolor: "#999999",
      };
      const layout: Partial<Layout> = {
        xaxis: { ...axis },
        yaxis: { ...axis },
        hovermode: "closest",
        dragmode: view.dragMode,
        font: {
          family: "Arial, Helvetica, sans-serif",
          size: 12,
          color: "#363636",
        },
        margin: { l: 46, r: 18, t: view.subtitle ? 42 : 20, b: 26 },
        title: {
          text: view.subtitle ? escapeHtml(view.subtitle) : "",
          font: { size: 14 },
        },
        showlegend: false,
        legend: {
          itemclick: "toggle",
          itemdoubleclick: "toggleothers",
          font: { size: 12 },
        },
        annotations: figure?.annotations ?? [],
        shapes: figure?.shapes ?? [],
        uirevision: axesKey,
      };
      const element = host.current,
        id = ++renderId.current;
      queue.current = queue.current
        .then(async () => {
          if (!element.isConnected || id !== renderId.current) return;
          const chart = element as unknown as ChartElement,
            same = renderedAxes.current === axesKey,
            previous = chart._fullLayout;
          for (const key of ["xaxis", "yaxis"] as const) {
            const index = key === "xaxis" ? view.x : view.y;
            layout[key] = {
              ...layout[key],
              ...(result
                ? {
                    autorange: false,
                    range:
                      same && previous?.[key]?.range
                        ? [...previous[key].range]
                        : paddedRange(result.scores.map((row) => row[index])),
                  }
                : { autorange: true }),
            };
          }

          const annotations = (figure?.annotations ?? []).map((annotation) => ({
            ...annotation,
            ...offsets.current.get(`${view.x}:${view.y}:${annotation.name}`),
          }));
          layout.annotations = annotations;
          const traces = (figure?.traces ?? []).map((trace, i) => ({
            ...trace,
            ...(same && chart.data[i] && "selectedpoints" in chart.data[i]
              ? {
                  selectedpoints: (
                    chart.data[i] as { selectedpoints?: number[] }
                  ).selectedpoints,
                }
              : {}),
          }));
          await api.current!.react(element, traces, layout, makeConfig());
          renderedAxes.current = axesKey;
          setError("");
        })
        .catch(() =>
          setError(
            "The chart could not render. Try changing the selection again.",
          ),
        );
    }, [ready, figure, props.result, props.view, props.revision]);

    useImperativeHandle(
      ref,
      () => ({
        reset: resetAxes,
        fit() {
          const element = host.current;
          if (!element || !api.current) return;
          queue.current = queue.current
            .then(async () => {
              await api.current!.relayout(element, {
                "xaxis.autorange": true,
                "yaxis.autorange": true,
              });
            })
            .catch(() => setError("Unable to fit the axes."));
        },
        zoom(factor) {
          const element = host.current;
          if (!element || !api.current) return;
          queue.current = queue.current
            .then(async () => {
              const full = (element as unknown as ChartElement)._fullLayout;
              await api.current!.relayout(element, {
                "xaxis.range": zoomRange(full.xaxis.range, factor, 0.5),
                "yaxis.range": zoomRange(full.yaxis.range, factor, 0.5),
                "xaxis.autorange": false,
                "yaxis.autorange": false,
              });
            })
            .catch(() => setError("Unable to zoom."));
        },
        async savePng(width, height) {
          await queue.current;
          if (!api.current || !host.current || !ready)
            throw new Error("The chart is still loading. Try again.");
          const options = {
            format: "png" as const,
            width: width ?? host.current.clientWidth,
            height: height ?? host.current.clientHeight,
            filename:
              "G25 Custom PCA" +
              (latest.current.view.subtitle
                ? " " + latest.current.view.subtitle
                : ""),
          };
          const exportHost = document.createElement("div");
          exportHost.style.cssText = "position:fixed;left:-10000px;top:0;";
          document.body.appendChild(exportHost);
          try {
            await api.current.newPlot(
              exportHost,
              (host.current as unknown as ChartElement).data,
              {
                ...(host.current as unknown as ChartElement).layout,
                width: options.width,
                height: options.height,
                showlegend: latest.current.view.legend,
                margin: { l: 46, r: 18, t: 30, b: 26 },
              },
              { displayModeBar: false, displaylogo: false },
            );
            await api.current.downloadImage(exportHost, options);
          } finally {
            api.current.purge(exportHost);
            exportHost.remove();
          }
        },
      }),
      [ready],
    );
    return (
      <>
        <div
          className="pca-chart"
          ref={host}
          aria-label="Custom Global25 PCA plot"
        />
        <PlotlyCredit />
        {error && (
          <p className="chart-error" role="alert">
            {error}
          </p>
        )}
      </>
    );
  },
);
