import type { Data, PlotData, Annotations, Shape } from "plotly.js";
import type { PcaResult } from "./pca";
import { centroid, convexHull, regressionLine, type Point } from "./geometry";
import { entryMarkers } from "./markerAssignment";

export interface AddOptions {
  mode: "aggregated" | "individual" | "single";
  customName: string;
  subgroups: boolean;
  labels: boolean;
  hulls: boolean;
  regression: boolean;
}
export const initialAddOptions: AddOptions = {
  mode: "aggregated",
  customName: "",
  subgroups: false,
  labels: true,
  hulls: true,
  regression: true,
};

export interface PlotView {
  x: number;
  y: number;
  legend: boolean;
  labels: boolean;
  hulls: boolean;
  regression: boolean;
  pointLabels: number;
  labelStyle: number;
  markerSize: number;
  hullOpacity: number;
  hiddenTraces: number[];
  subtitle: string;
  dragMode: "pan" | "zoom" | "select" | "lasso";
}
export const initialPlotView: PlotView = {
  x: 0,
  y: 1,
  legend: true,
  labels: false,
  hulls: false,
  regression: false,
  pointLabels: 0,
  labelStyle: 0,
  markerSize: 0,
  hullOpacity: 0,
  hiddenTraces: [],
  subtitle: "",
  dragMode: "pan",
};
export const imageSizes = [
  [800, 400],
  [800, 500],
  [800, 600],
  [1200, 600],
  [1200, 750],
  [1200, 900],
  [1600, 800],
  [1600, 1000],
  [1600, 1200],
  [2000, 1000],
  [2000, 1250],
  [2000, 1500],
  [2400, 1200],
  [2400, 1500],
  [2400, 1800],
  [1920, 1080],
  [3840, 2160],
  [7680, 4320],
] as const;
export const hullOpacities = [0.9, 0.6, 0.3] as const;
export const escapeHtml = (text: string) =>
  text.replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        c
      ]!,
  );
export const axisTitle = (result: PcaResult, index: number) =>
  `PC${index + 1} (${(result.explainedVariance[index] * 100).toFixed(2)}%)`;

export interface Entry {
  name: string;
  indices: number[];
  decorations: { name: string; indices: number[] }[];
}
export function createEntries(result: PcaResult, options: AddOptions): Entry[] {
  const grouped = new Map<string, number[]>();
  result.dataset.samples.forEach((sample, i) => {
    if (!grouped.has(sample.group)) grouped.set(sample.group, []);
    grouped.get(sample.group)!.push(i);
  });
  const groups = [...grouped]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([name, indices]) => ({ name, indices }));
  if (options.mode === "individual")
    return result.dataset.samples.map((sample, i) => ({
      name: sample.name,
      indices: [i],
      decorations: [{ name: sample.name, indices: [i] }],
    }));
  if (options.mode === "single") {
    const name = options.customName.trim() || result.dataset.samples[0].group;
    const indices = result.dataset.samples.map((_, i) => i);
    return [
      {
        name,
        indices,
        decorations: options.subgroups ? groups : [{ name, indices }],
      },
    ];
  }
  return groups.map((group) => ({ ...group, decorations: [group] }));
}

export type NamedAnnotation = Partial<Annotations> & { name: string };
export interface LabelOffset {
  ax: number;
  ay: number;
}

export function buildFigure(
  result: PcaResult,
  view: PlotView,
  options: AddOptions = initialAddOptions,
  offsets = new Map<string, LabelOffset>(),
) {
  const traces: Data[] = [],
    annotations: NamedAnnotation[] = [],
    shapes: Partial<Shape>[] = [];
  const entries = createEntries(result, options);
  const markers = entryMarkers(result, entries, view);
  entries.forEach((entry, i) => {
    const improved = markers[i];
    const marker = {
      ...improved,
      size: [7, 5, 9][view.markerSize],
      opacity: 1,
    };
    const points: Point[] = entry.indices.map((index) => [
      result.scores[index][view.x],
      result.scores[index][view.y],
    ]);
    const names = entry.indices.map(
      (index) => result.dataset.samples[index].name,
    );
    const hidden = view.hiddenTraces.includes(i);
    traces.push({
      type: "scatter",
      mode: view.pointLabels ? "text+markers" : "markers",
      name: escapeHtml(entry.name),
      visible: hidden ? "legendonly" : true,
      x: points.map((p) => p[0]),
      y: points.map((p) => p[1]),
      text: names.map((name) =>
        escapeHtml(
          view.pointLabels === 2
            ? name.split(":")[0]
            : view.pointLabels === 3
              ? name.split(":").pop()!
              : name,
        ),
      ),
      hovertext: names.map(escapeHtml),
      hoverinfo: "text+name" as PlotData["hoverinfo"],
      textposition: "top center",
      textfont: { size: 9, color: marker.color },
      marker,
    });
    entry.decorations.forEach((decoration, j) => {
      const coordinates: Point[] = decoration.indices.map((index) => [
        result.scores[index][view.x],
        result.scores[index][view.y],
      ]);
      if (options.labels) {
        const name = `${i}:${j}`,
          [x, y] = centroid(coordinates);
        annotations.push({
          name,
          x,
          y,
          xref: "x",
          yref: "y",
          text: escapeHtml(decoration.name),
          textangle: "0",
          ax: offsets.get(name)?.ax ?? 0,
          ay: offsets.get(name)?.ay ?? (coordinates.length > 1 ? 0 : -27),
          showarrow: view.labelStyle === 0,
          font: { color: marker.color, size: view.labelStyle === 0 ? 11 : 9 },
          arrowcolor: marker.color + "aa",
          arrowside: "end+start" as Annotations["arrowside"],
          arrowsize: 1,
          startarrowsize: 1,
          arrowwidth: 1,
          arrowhead: view.markerSize === 2 ? 0 : 6,
          startarrowhead: 0,
          standoff: 0,
          startstandoff: 0,
          borderpad: 0,
          bordercolor: "rgba(255,255,255,1)",
          borderwidth: view.labelStyle === 0 ? 1 : 0,
          bgcolor:
            view.labelStyle === 0
              ? "rgba(255,255,255,0.75)"
              : view.labelStyle === 1
                ? "rgba(255,255,255,0)"
                : "rgba(255,255,255,0.66)",
          visible: view.labels && !hidden,
        });
      }
      if (options.hulls && coordinates.length > 1) {
        if (coordinates.length === 2) {
          shapes.push({
            name: `hull:${i}:${j}`,
            type: "line",
            x0: coordinates[0][0],
            y0: coordinates[0][1],
            x1: coordinates[1][0],
            y1: coordinates[1][1],
            xref: "x",
            yref: "y",
            line: { color: marker.color, width: 2 },
            opacity: 0.2,
            visible: view.hulls && !hidden,
          });
        } else {
          const hull = convexHull(coordinates);
          if (hull.length)
            shapes.push({
              name: `hull:${i}:${j}`,
              type: "path",
              path: `M ${hull.map((p) => p.join(",")).join(" L ")} Z`,
              fillcolor: marker.color + "30",
              line: { color: marker.color + "45", width: 1 },
              opacity: hullOpacities[view.hullOpacity],
              visible: view.hulls && !hidden,
            });
        }
      }
      if (options.regression && coordinates.length > 1) {
        const line = regressionLine(coordinates);
        if (line)
          shapes.push({
            name: `regression:${i}:${j}`,
            type: "line",
            x0: line[0][0],
            y0: line[0][1],
            x1: line[1][0],
            y1: line[1][1],
            xref: "x",
            yref: "y",
            line: { color: marker.color, width: 2, dash: "dot" },
            opacity: 0.5,
            visible: view.regression && !hidden,
          });
      }
    });
  });
  return { traces, annotations, shapes, entries };
}
