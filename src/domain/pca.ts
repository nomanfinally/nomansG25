import { PCA } from "ml-pca";
import { parseG25, type G25Dataset, type Scaling } from "./g25";

export interface PcaResult {
  dataset: G25Dataset;
  scores: number[][];
  loadings: number[][];
  eigenvalues: number[];
  explainedVariance: number[];
  componentCount: number;
}

export function fitPca(dataset: G25Dataset): PcaResult {
  if (dataset.samples.length < 3)
    throw new Error(
      "A two-dimensional PCA needs at least 3 samples. Add more G25 rows.",
    );
  const rows = dataset.samples.map((sample) => sample.scaled);
  // Guard overflow and all-identical input before calling the numerical library.
  const means = Array.from({ length: 25 }, (_, j) =>
    rows.reduce((sum, row) => sum + row[j] / rows.length, 0),
  );
  const variation = rows.reduce(
    (sum, row) =>
      sum + row.reduce((s, value, j) => s + (value - means[j]) ** 2, 0),
    0,
  );
  if (!Number.isFinite(variation))
    throw new Error(
      "Coordinates exceed the numeric range. Check the pasted values.",
    );
  if (!(variation > 0))
    throw new Error(
      "These samples have identical coordinates. Add samples with different G25 coordinates.",
    );

  const pca = new PCA(rows, { center: true, scale: false });
  const allEigenvalues = pca
    .getEigenvalues()
    .map((value) => Math.max(0, value));
  const total = allEigenvalues.reduce((sum, value) => sum + value, 0);
  if (!(total > 0) || !Number.isFinite(total))
    throw new Error(
      "A PCA could not be calculated from these coordinates. Check the input values.",
    );
  const rank = allEigenvalues.filter(
    (value) => value > allEigenvalues[0] * 1e-12,
  ).length;
  const componentCount = Math.min(25, rows.length - 1, rank);
  if (componentCount < 2)
    throw new Error(
      "These samples vary along only one direction. Add more varied samples for a two-dimensional PCA.",
    );
  const scores = pca.predict(rows, { nComponents: componentCount }).to2DArray();
  const loadings = pca
    .getEigenvectors()
    .to2DArray()
    .map((row) => row.slice(0, componentCount));
  // Fix otherwise arbitrary axis signs for repeatable runs (largest loading positive).
  for (let j = 0; j < componentCount; j++) {
    let largest = 0;
    for (let i = 1; i < 25; i++)
      if (Math.abs(loadings[i][j]) > Math.abs(loadings[largest][j]))
        largest = i;
    if (loadings[largest][j] < 0) {
      for (const row of loadings) row[j] *= -1;
      for (const row of scores) row[j] *= -1;
    }
  }
  if (!scores.every((row) => row.every(Number.isFinite)))
    throw new Error(
      "The PCA produced invalid coordinates. Check the input values.",
    );
  const eigenvalues = allEigenvalues.slice(0, componentCount);
  return {
    dataset,
    scores,
    loadings,
    eigenvalues,
    componentCount,
    explainedVariance: eigenvalues.map((value) => value / total),
  };
}

export function calculatePca(text: string, scaling: Scaling) {
  return fitPca(parseG25(text, scaling));
}
