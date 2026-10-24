export type Scaling = "scaled" | "raw";

export interface G25Sample {
  key: number;
  name: string;
  group: string;
  source: number[];
  scaled: number[];
}

export interface G25Dataset {
  samples: G25Sample[];
  groups: string[];
  scaling: Scaling;
}

// The same Global25 eigenvalues used for raw -> scaled conversion in g25views.
export const G25_EIGENVALUES = [
  129.557, 103.13, 14.222, 10.433, 9.471, 7.778, 5.523, 5.325, 4.183, 3.321,
  2.637, 2.246, 2.21, 1.894, 1.842, 1.758, 1.7, 1.605, 1.58, 1.564, 1.557,
  1.529, 1.519, 1.452, 1.434,
] as const;

const numeric = /^[+-]?(?:\d+\.?\d*|\.\d+)(?:[eE][+-]?\d+)?$/;

export function parseG25(text: string, scaling: Scaling): G25Dataset {
  const samples: G25Sample[] = [];
  const cells = text
    .replace(/^\uFEFF/, "")
    .replace(/join@/g, "")
    .split(",");
  // Match G25 Views' space-separated multi-row paste in a one-line input.
  for (let i = 25; i < cells.length; i += 25)
    cells[i] = cells[i].replace(/[ \t]+(?=\S)/g, "\n");
  const lines = cells.join(",").split(/\r\n?|\n/);
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    const fields = line.split(",").map((field) => field.trim());
    if (fields.length !== 26) {
      throw new Error(
        `Line ${i + 1}: expected a name and 25 comma-separated coordinates; found ${fields.length - 1} coordinates.`,
      );
    }
    const name = fields[0];
    if (!name) throw new Error(`Line ${i + 1}: the sample name is missing.`);
    const source = fields.slice(1).map((value, j) => {
      if (!numeric.test(value) || !Number.isFinite(Number(value))) {
        throw new Error(
          `Line ${i + 1}, coordinate ${j + 1}: enter a finite number${value === "" ? "; this field is empty" : ""}.`,
        );
      }
      return Number(value);
    });
    const group = name.split(":")[0].trim() || name;
    const scaled = source.map((value, j) =>
      scaling === "raw" ? value * Math.sqrt(G25_EIGENVALUES[j]) : value,
    );
    if (!scaled.every(Number.isFinite))
      throw new Error(
        `Line ${i + 1}: coordinates exceed the numeric range. Check the values.`,
      );
    samples.push({ key: samples.length, name, group, source, scaled });
  }
  if (!samples.length)
    throw new Error(
      "Paste G25 coordinates first. Each row needs a name followed by 25 comma-separated values.",
    );
  return {
    samples,
    scaling,
    groups: [...new Set(samples.map((sample) => sample.group))].sort((a, b) =>
      a.localeCompare(b),
    ),
  };
}
