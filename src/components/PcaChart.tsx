import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from "react";
import type { Config, Layout, PlotlyHTMLElement } from "plotly.js";
import type { PcaResult } from "../domain/pca";
import { axisTitle, buildFigure, type PlotView } from "../domain/figure";
import { paddedRange, wheelPixels, zoomRange } from "../domain/geometry";

type PlotlyApi = typeof import("plotly.js");
type ChartElement = PlotlyHTMLElement & {
  _fullLayout: {
    xaxis: { range: number[]; _offset: number; _length: number };
    yaxis: { range: number[]; _offset: number; _length: number };
  };
};
export interface ChartHandle {
  zoom: (factor: number) => void;
  reset: () => void;
  savePng: () => Promise<void>;
}
interface Props {
  result: PcaResult | null;
  view: PlotView;
  revision: number;
  onReady: (ready: boolean) => void;
}

const config: Partial<Config> = {
  displayModeBar: false,
  scrollZoom: false,
  responsive: false,
  doubleClick: "reset",
  showTips: false,
  displaylogo: false,
};

export const PcaChart = forwardRef<ChartHandle, Props>(
  function PcaChart(props, ref) {
    const host = useRef<HTMLDivElement>(null);
    const api = useRef<PlotlyApi | null>(null);
    const latest = useRef(props);
    latest.current = props;
    const queue = useRef<Promise<unknown>>(Promise.resolve());
    const renderedAxes = useRef("");
    const renderId = useRef(0);
    const [ready, setReady] = useState(false);
    const [error, setError] = useState("");
    const figure = useMemo(
      () => (props.result ? buildFigure(props.result, props.view) : null),
      [props.result, props.view],
    );

    const reportError = (message: string) => setError(message);
    useEffect(() => {
      let disposed = false;
      const element = host.current!;
      import("plotly.js-basic-dist-min")
        .then(async (module) => {
          if (disposed) return;
          api.current = module.default;
          await api.current.newPlot(element, [], {}, config);
          if (disposed) {
            api.current.purge(element);
            return;
          }
          setReady(true);
        })
        .catch(() => {
          if (!disposed)
            reportError(
              "The chart could not start. Reload the page and try again.",
            );
        });

      // One owner for wheel zoom. Zoom, render and resize share a queue so rapid
      // wheel input cannot be overwritten by a stale toolbar redraw.
      let frame = 0,
        delta = 0;
      let anchor = { x: 0.5, y: 0.5 };
      const wheel = (event: WheelEvent) => {
        if (!latest.current.result || !api.current || !event.deltaY) return;
        const chart = element as unknown as ChartElement;
        const full = chart._fullLayout;
        if (!full) return;
        const box = element.getBoundingClientRect();
        const x =
          (event.clientX - box.left - full.xaxis._offset) / full.xaxis._length;
        const y =
          1 -
          (event.clientY - box.top - full.yaxis._offset) / full.yaxis._length;
        if (x < 0 || x > 1 || y < 0 || y > 1) return;
        // Scrolling a long legend must scroll its entries, never zoom the plot.
        if (event.target instanceof Element && event.target.closest(".legend"))
          return;
        event.preventDefault();
        event.stopPropagation();
        anchor = { x, y };
        delta += wheelPixels(event.deltaY, event.deltaMode, full.yaxis._length);
        if (frame) return;
        frame = requestAnimationFrame(() => {
          frame = 0;
          const factor = Math.exp(Math.max(-2, Math.min(2, delta * 0.0015)));
          const position = anchor;
          delta = 0;
          queue.current = queue.current
            .then(async () => {
              if (disposed || !element.isConnected) return;
              const axes = chart._fullLayout;
              await api.current!.relayout(element, {
                "xaxis.range": zoomRange(axes.xaxis.range, factor, position.x),
                "yaxis.range": zoomRange(axes.yaxis.range, factor, position.y),
                "xaxis.autorange": false,
                "yaxis.autorange": false,
              });
            })
            .catch(() => {
              if (!disposed) reportError("Unable to zoom. Try Reset view.");
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
                reportError(
                  "The chart could not resize. Try reloading the page.",
                );
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
      props.onReady(ready && !error);
    }, [ready, error, props.onReady]);

    useEffect(() => {
      if (!ready || !api.current || !host.current) return;
      const { result, view, revision } = props;
      const axesKey = `${revision}:${view.x}:${view.y}`;
      const axis = {
        zeroline: false,
        showgrid: !!result,
        gridcolor: "#eceeef",
        gridwidth: 1,
        showline: true,
        mirror: true,
        linecolor: "#6b7075",
        linewidth: 1,
        ticks: "outside" as const,
        ticklen: 4,
        tickcolor: "#8a9096",
        tickfont: { size: 11, color: "#555d66" },
        showticklabels: !!result,
        automargin: false,
        autorange: false,
      };
      // Plotly supports autoexpand; the upstream @types omit it on Margin.
      const margin = { l: 74, r: 28, t: 32, b: 58, autoexpand: false };
      const layout: Partial<Layout> = {
        autosize: true,
        margin,
        paper_bgcolor: "#ffffff",
        plot_bgcolor: "#ffffff",
        font: {
          family: "Arial, Helvetica, sans-serif",
          size: 12,
          color: "#30363d",
        },
        dragmode: "pan",
        hovermode: result ? "closest" : false,
        hoverlabel: {
          bgcolor: "#ffffff",
          bordercolor: "#b8c0c8",
          font: { size: 12, color: "#30363d" },
        },
        showlegend: !!result && view.legend,
        legend: {
          x: 0.99,
          y: 0.99,
          xanchor: "right",
          yanchor: "top",
          bgcolor: "rgba(255,255,255,.94)",
          borderwidth: 0,
          font: { size: 11, color: "#30363d" },
          itemclick: false,
          itemdoubleclick: false,
          traceorder: "normal",
        },
        xaxis: {
          ...axis,
          title: {
            text: result ? axisTitle(result, view.x) : "",
            standoff: 13,
            font: { size: 12 },
          },
        },
        yaxis: {
          ...axis,
          title: {
            text: result ? axisTitle(result, view.y) : "",
            standoff: 12,
            font: { size: 12 },
          },
        },
        annotations: figure?.annotations ?? [],
        shapes: figure?.shapes ?? [],
        uirevision: axesKey,
      };
      const element = host.current;
      const id = ++renderId.current;
      queue.current = queue.current
        .then(async () => {
          if (!element.isConnected || id !== renderId.current) return;
          const previous = (element as unknown as ChartElement)._fullLayout;
          for (const key of ["xaxis", "yaxis"] as const) {
            const index = key === "xaxis" ? view.x : view.y;
            layout[key] = {
              ...layout[key],
              range:
                renderedAxes.current === axesKey && previous?.[key]?.range
                  ? [...previous[key].range]
                  : result
                    ? paddedRange(result.scores.map((row) => row[index]))
                    : [-1, 1],
            };
          }
          await api.current!.react(
            element,
            figure?.traces ?? [],
            layout,
            config,
          );
          renderedAxes.current = axesKey;
          setError("");
        })
        .catch(() =>
          reportError("The chart could not render. Try running PCA again."),
        );
    }, [ready, figure, props.result, props.view, props.revision]);

    useImperativeHandle(
      ref,
      () => ({
        zoom(factor) {
          const element = host.current;
          if (!element || !api.current || !latest.current.result) return;
          queue.current = queue.current
            .then(async () => {
              const full = (element as unknown as ChartElement)._fullLayout;
              await api.current!.relayout(element, {
                "xaxis.range": zoomRange(full.xaxis.range, factor),
                "yaxis.range": zoomRange(full.yaxis.range, factor),
                "xaxis.autorange": false,
                "yaxis.autorange": false,
              });
            })
            .catch(() => reportError("Unable to zoom. Try Reset view."));
        },
        reset() {
          const element = host.current;
          if (!element || !api.current) return;
          queue.current = queue.current
            .then(async () => {
              const { result, view } = latest.current;
              if (!result) return;
              await api.current!.relayout(element, {
                "xaxis.range": paddedRange(
                  result.scores.map((row) => row[view.x]),
                ),
                "yaxis.range": paddedRange(
                  result.scores.map((row) => row[view.y]),
                ),
                "xaxis.autorange": false,
                "yaxis.autorange": false,
              });
            })
            .catch(() =>
              reportError("Unable to reset the chart. Try running PCA again."),
            );
        },
        async savePng() {
          await queue.current;
          if (!api.current || !host.current || !latest.current.result)
            throw new Error(
              "The chart is still loading. Try again in a moment.",
            );
          const options = {
            format: "png" as const,
            width: host.current.clientWidth,
            height: host.current.clientHeight,
            scale: 2,
            filename: "G25_Custom_PCA",
          };
          await api.current.downloadImage(host.current, options);
        },
      }),
      [],
    );

    return (
      <>
        <div
          className="pca-chart"
          ref={host}
          aria-label={
            props.result
              ? `Custom PCA of ${props.result.dataset.samples.length} samples, PC${props.view.x + 1} versus PC${props.view.y + 1}`
              : "Empty PCA chart"
          }
        />
        {error && (
          <div className="chart-error" role="alert">
            {error}
          </div>
        )}
      </>
    );
  },
);
