import { describe, expect, test } from "vitest";
import { parseG25, G25_EIGENVALUES } from "./g25";
import { calculatePca, fitPca } from "./pca";
import {
  buildFigure,
  initialPlotView,
  initialAddOptions,
  createEntries,
} from "./figure";
import { convexHull, regressionLine, zoomRange } from "./geometry";

const vector = (x: number, y: number) => [x, y, ...Array(23).fill(0)];
const row = (name: string, x: number, y: number) =>
  [name, ...vector(x, y)].join(",");
const rectangle = [
  row("A:one", -2, -1),
  row("A:two", 2, -1),
  row("B:one", -2, 1),
  row("B:two", 2, 1),
].join("\n");

describe("G25 input", () => {
  test("accepts BOM, CRLF, blank lines and scientific notation while retaining row identity", () => {
    const text = `\uFEFF ${row("Group:duplicate", 0.01, -0.02).replace("0.01", "1e-2")}\r\n\r\n${row("Group:duplicate", 0.03, 0.04)}\r\n`;
    const result = parseG25(text, "scaled");
    expect(result.samples).toHaveLength(2);
    expect(result.samples.map((sample) => sample.key)).toEqual([0, 1]);
    expect(result.samples[0].scaled.slice(0, 2)).toEqual([0.01, -0.02]);
    expect(result.groups).toEqual(["Group"]);
    expect(result.samples[0].source).not.toBe(result.samples[0].scaled);
  });
  test.each(["", "NaN", "Infinity", "1x", "1e999"])(
    "rejects invalid coordinate %j without silently substituting zero",
    (invalid) => {
      expect(() =>
        parseG25(
          ["Group:one", invalid, ...Array(24).fill(0)].join(","),
          "scaled",
        ),
      ).toThrow(/coordinate 1/);
    },
  );
  test("requires a name and exactly 25 dimensions, with useful row numbers", () => {
    expect(() => parseG25(row("", 1, 2), "scaled")).toThrow(/name is missing/);
    expect(() => parseG25(`${row("Good", 1, 2)}\nBad,1,2`, "scaled")).toThrow(
      /Line 2.*25/,
    );
    expect(() => parseG25(" \n ", "scaled")).toThrow(/Paste G25/);
  });
});

describe("Custom PCA mathematics", () => {
  test("recovers an analytically known rectangle with 80/20 explained variance and no standardization", () => {
    const result = calculatePca(rectangle, "scaled");
    expect(result.componentCount).toBe(2);
    expect(result.eigenvalues[0]).toBeCloseTo(16 / 3, 12);
    expect(result.eigenvalues[1]).toBeCloseTo(4 / 3, 12);
    expect(result.explainedVariance[0]).toBeCloseTo(0.8, 12);
    expect(result.explainedVariance[1]).toBeCloseTo(0.2, 12);
    result.scores.forEach((scores, i) => {
      expect(Math.abs(scores[0])).toBeCloseTo(
        Math.abs(result.dataset.samples[i].scaled[0]),
        12,
      );
      expect(Math.abs(scores[1])).toBeCloseTo(
        Math.abs(result.dataset.samples[i].scaled[1]),
        12,
      );
    });
  });
  test("preserves source vectors and all pairwise distances under a full-rank PCA rotation", () => {
    const dataset = parseG25(rectangle, "scaled");
    const original = structuredClone(dataset);
    const result = fitPca(dataset);
    expect(dataset).toEqual(original);
    for (let i = 0; i < 4; i++)
      for (let j = i + 1; j < 4; j++) {
        const before = Math.hypot(
          ...dataset.samples[i].scaled.map(
            (value, k) => value - dataset.samples[j].scaled[k],
          ),
        );
        const after = Math.hypot(
          ...result.scores[i].map((value, k) => value - result.scores[j][k]),
        );
        expect(after).toBeCloseTo(before, 12);
      }
  });
  test("raw coordinates and their scaled counterparts give equivalent PCA scores", () => {
    const scaled = parseG25(rectangle, "scaled");
    const rawText = scaled.samples
      .map((sample) =>
        [
          sample.name,
          ...sample.scaled.map(
            (value, j) => value / Math.sqrt(G25_EIGENVALUES[j]),
          ),
        ].join(","),
      )
      .join("\n");
    const raw = calculatePca(rawText, "raw"),
      known = fitPca(scaled);
    raw.scores.forEach((scores, i) =>
      scores.forEach((value, j) =>
        expect(value).toBeCloseTo(known.scores[i][j], 11),
      ),
    );
    expect(raw.dataset.samples[0].source[0]).not.toEqual(
      raw.dataset.samples[0].scaled[0],
    );
  });
  test("matches g25views (Vahaduo) Custom PCA axis orientation and numerical values", () => {
    // 3 samples representing the 3 main genetic poles from the reference image:
    // West/Ancient North Eurasia (Russia_AfontovaGora3_UP)
    // South/Near East (Iran_GanjDareh_N)
    // East/Andamanese (Onge)
    const testData = [
      "Russia_AfontovaGora3_UP:AfontovaGora3,0.106994,-0.003047,0.061848,0.113051,-0.084323,0.038487,-0.00987,0.005307,-0.046836,-0.08638,0.024033,-0.015137,0.027056,-0.042526,0.034609,0.041633,-0.001695,0.007601,-0.007416,0.019134,-0.034315,-0.007543,0.012325,-0.019039,0.008023",
      "Iran_GanjDareh_N:I1945,0.042115,0.065,-0.155751,0.002261,-0.119099,0.034861,0.015746,-0.001846,-0.079969,-0.057587,-0.002598,-0.001049,0.006244,-0.012524,0.033659,0.054362,-0.014342,0.005194,-0.002011,-0.038519,0.00836,0.000495,-0.009737,-0.033258,0.026704",
      "Onge:onge1,-0.018212,-0.243727,-0.141421,0.099161,0.043701,-0.033746,-0.007285,-0.013846,0.090809,0.091301,-0.002598,-0.004496,0.003568,0.010046,-0.028773,-0.021082,0.028162,-0.002154,-0.006159,-0.029889,-0.009608,-0.020032,0.00986,0.003012,-0.005987",
    ].join("\n");
    const result = calculatePca(testData, "scaled");
    // Under g25views algorithm without artificial sign flipping:
    expect(result.scores).toHaveLength(3);
    expect(result.componentCount).toBe(2);
    expect(result.scores[0][0]).toBeCloseTo(0.1412, 3);
    expect(result.scores[1][0]).toBeCloseTo(0.1460, 3);
    expect(result.scores[2][0]).toBeCloseTo(-0.2872, 3);
  });
  test("agrees with the known covariance for more rows than input dimensions", () => {
    const result = calculatePca(Array(8).fill(rectangle).join("\n"), "scaled");
    expect(result.componentCount).toBe(2);
    expect(result.eigenvalues[0]).toBeCloseTo(128 / 31, 11);
    expect(result.eigenvalues[1]).toBeCloseTo(32 / 31, 11);
  });
  test("rejects insufficient, constant and rank-one input", () => {
    expect(() => calculatePca(row("A", 0, 0), "scaled")).toThrow(/3 samples/);
    expect(() =>
      calculatePca(
        Array(3)
          .fill(row("A", 1, 1))
          .join("\n"),
        "scaled",
      ),
    ).toThrow(/identical/);
    expect(() =>
      calculatePca(
        [row("A", -1, -1), row("A", 0, 0), row("A", 1, 1)].join("\n"),
        "scaled",
      ),
    ).toThrow(/one direction/);
  });
});

describe("plot semantics", () => {
  test("groups points without replacing them with averages; creates matching geometry only when enabled", () => {
    const result = calculatePca(rectangle, "scaled");
    const basic = buildFigure(result, initialPlotView, {
      ...initialAddOptions,
      labels: false,
      hulls: false,
      regression: false,
    });
    expect(basic.traces).toHaveLength(2);
    expect(
      basic.traces.map(
        (trace) => Array.from((trace as { x: number[] }).x).length,
      ),
    ).toEqual([2, 2]);
    expect(basic.annotations).toEqual([]);
    expect(basic.shapes).toEqual([]);
    const decorated = buildFigure(result, {
      ...initialPlotView,
      labels: true,
      hulls: true,
      regression: true,
    });
    expect(decorated.annotations).toHaveLength(2);
    expect(decorated.shapes).toHaveLength(4);
  });
  test("escapes user text for Plotly markup", () => {
    const result = calculatePca(
      rectangle.replaceAll("A:", "<b>A:</b>"),
      "scaled",
    );
    const figure = buildFigure(result, { ...initialPlotView, labels: true });
    expect(figure.traces.some((trace) => trace.name?.includes("<b>"))).toBe(
      false,
    );
    expect(
      figure.annotations.some((annotation) =>
        annotation.text?.includes("&lt;b&gt;"),
      ),
    ).toBe(true);
  });
  test("all original grouping modes retain samples and support subgroup decorations", () => {
    const result = calculatePca(rectangle, "scaled");
    const individual = createEntries(result, {
      ...initialAddOptions,
      mode: "individual",
    });
    expect(individual.map((entry) => entry.indices.length)).toEqual([
      1, 1, 1, 1,
    ]);
    expect(individual.map((entry) => entry.name)).toEqual([
      "A:one",
      "A:two",
      "B:one",
      "B:two",
    ]);
    const single = createEntries(result, {
      ...initialAddOptions,
      mode: "single",
      customName: "One group",
      subgroups: true,
    });
    expect(single).toHaveLength(1);
    expect(single[0].name).toBe("One group");
    expect(single[0].indices).toEqual([0, 1, 2, 3]);
    expect(single[0].decorations.map((group) => group.name)).toEqual([
      "A",
      "B",
    ]);
  });
  test("hiding a trace also hides its owned annotations and shapes", () => {
    const result = calculatePca(rectangle, "scaled");
    const figure = buildFigure(result, {
      ...initialPlotView,
      labels: true,
      hulls: true,
      regression: true,
      hiddenTraces: [0],
    });
    expect(figure.traces[0]).toHaveProperty("visible", "legendonly");
    expect(figure.annotations[0].visible).toBe(false);
    expect(
      figure.shapes
        .filter((shape) => shape.name?.endsWith(":0:0"))
        .every((shape) => shape.visible === false),
    ).toBe(true);
    expect(figure.annotations[1].visible).toBe(true);
  });
  test("degenerate hulls and vertical regression do not invent a fitted area/line", () => {
    expect(
      convexHull([
        [0, 0],
        [1, 1],
        [2, 2],
        [1, 1],
      ]),
    ).toEqual([]);
    expect(
      regressionLine([
        [1, 1],
        [1, 2],
        [1, 3],
      ]),
    ).toBeNull();
  });
  test("cursor zoom is reversible and retains its data anchor", () => {
    const before = [-8, 12];
    const after = zoomRange(before, 0.75, 0.2);
    expect(after[0] + (after[1] - after[0]) * 0.2).toBeCloseTo(-4, 12);
    const restored = zoomRange(after, 1 / 0.75, 0.2);
    restored.forEach((value, i) => expect(value).toBeCloseTo(before[i], 12));
    expect(zoomRange([0, 1e-13], 0.5)).toEqual([0, 1e-13]);
  });
});
