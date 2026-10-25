// Deterministic synthetic vectors for validation/screenshots, not biological data.
export function syntheticG25() {
  let seed = 1729;
  const random = () => {
    seed = (seed * 1664525 + 1013904223) >>> 0;
    return seed / 4294967296;
  };
  const centers = [
    [-0.04, 0.03],
    [-0.015, 0.01],
    [0.01, -0.02],
    [0.04, -0.005],
    [0.03, 0.045],
    [-0.035, -0.035],
  ];
  return centers
    .flatMap(([x, y], group) =>
      Array.from({ length: 30 }, (_, i) => {
        const values = [
          x + (random() - 0.5) * 0.024,
          y + (random() - 0.5) * 0.024,
          ...Array.from({ length: 23 }, () => (random() - 0.5) * 0.012),
        ];
        return [
          `Synthetic_${String.fromCharCode(65 + group)}:sample_${i + 1}`,
          ...values.map((value) => value.toFixed(9)),
        ].join(",");
      }),
    )
    .join("\n");
}

export function syntheticDatabase() {
  const rows = syntheticG25()
    .split("\n")
    .map((line) => {
      const [name] = line.split(",");
      const [group, id] = name.split(":");
      return [group, `${group}_${id}`, line].join("\t");
    });
  return [
    "Group ID\tGenetic ID\tG25_coords",
    ...rows,
    "Synthetic_without_coords\tmissing\t",
  ].join("\n");
}
