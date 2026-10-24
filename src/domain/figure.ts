import type { Data, Annotations, Shape } from "plotly.js";
import type { PcaResult } from "./pca";
import { centroid, convexHull, regressionLine, type Point } from "./geometry";
import { groupMarker } from "./markers";

export interface PlotView {
  x: number;
  y: number;
  legend: boolean;
  labels: boolean;
  hulls: boolean;
  regression: boolean;
}

export const initialPlotView: PlotView = {
  x: 0,
  y: 1,
  legend: true,
  labels: false,
  hulls: false,
  regression: false,
};
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

export function buildFigure(result: PcaResult, view: PlotView) {
  const traces: Data[] = [],
    annotations: Partial<Annotations>[] = [],
    shapes: Partial<Shape>[] = [];
  const groups = new Map<string, { points: Point[]; names: string[] }>();
  result.dataset.samples.forEach((sample, i) => {
    if (!groups.has(sample.group))
      groups.set(sample.group, { points: [], names: [] });
    const group = groups.get(sample.group)!;
    group.points.push([result.scores[i][view.x], result.scores[i][view.y]]);
    group.names.push(escapeHtml(sample.name));
  });
  result.dataset.groups.forEach((name, i) => {
    const { points, names } = groups.get(name)!;
    const marker = groupMarker(i);
    traces.push({
      type: "scatter",
      mode: "markers",
      name: escapeHtml(name),
      x: points.map((p) => p[0]),
      y: points.map((p) => p[1]),
      hovertext: names,
      hovertemplate: "%{hovertext}<extra></extra>",
      marker,
    });
    if (view.labels) {
      const [x, y] = centroid(points);
      annotations.push({
        text: escapeHtml(name),
        x,
        y,
        xref: "x",
        yref: "y",
        showarrow: false,
        yshift: 13,
        font: { size: 11, color: marker.line.color },
        bgcolor: "rgba(255,255,255,.86)",
        borderpad: 2,
      });
    }
    if (view.hulls) {
      const hull = convexHull(points);
      if (hull.length)
        shapes.push({
          name: `hull:${name}`,
          type: "path",
          path: `M ${hull.map((p) => p.join(",")).join(" L ")} Z`,
          fillcolor: marker.color,
          opacity: 0.13,
          line: { color: marker.color, width: 1 },
          layer: "below",
          xref: "x",
          yref: "y",
        });
      else if (
        points.length === 2 &&
        (points[0][0] !== points[1][0] || points[0][1] !== points[1][1])
      ) {
        shapes.push({
          name: `hull:${name}`,
          type: "line",
          x0: points[0][0],
          y0: points[0][1],
          x1: points[1][0],
          y1: points[1][1],
          line: { color: marker.color, width: 1.5 },
          opacity: 0.35,
          layer: "below",
        });
      }
    }
    if (view.regression && !(view.hulls && points.length === 2)) {
      const line = regressionLine(points);
      if (line)
        shapes.push({
          name: `regression:${name}`,
          type: "line",
          x0: line[0][0],
          y0: line[0][1],
          x1: line[1][0],
          y1: line[1][1],
          line: { color: marker.color, width: 1.5, dash: "dot" },
          opacity: 0.75,
          layer: "below",
        });
    }
  });
  return { traces, annotations, shapes };
}
