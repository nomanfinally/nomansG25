// Solid palette and outlined-marker treatment adapted from the user's PCA_views.
const colors = [
  "#1f77b4",
  "#d62728",
  "#2ca02c",
  "#9467bd",
  "#ff7f0e",
  "#17becf",
  "#8c564b",
  "#e377c2",
  "#bcbd22",
  "#4d4d4d",
  "#0057e7",
  "#d11141",
  "#00a676",
  "#f37735",
  "#7b2cbf",
  "#00b4d8",
  "#6a994e",
  "#c1121f",
  "#f4a261",
  "#264653",
  "#ffbe0b",
  "#3a86ff",
  "#8338ec",
  "#fb5607",
  "#06d6a0",
  "#7209b7",
  "#118ab2",
  "#ef476f",
  "#073b4c",
  "#9b2226",
  "#ee9b00",
];
const symbols = [
  "circle",
  "square",
  "triangle-up",
  "diamond",
  "triangle-down",
  "cross",
  "x",
  "triangle-left",
  "triangle-right",
  "hexagon",
  "pentagon",
  "star",
  "octagon",
];

function fallbackColor(index: number) {
  const hue = ((index * 137.508) % 360) / 30;
  const channel = (offset: number) => {
    const k = (offset + hue) % 12;
    return Math.round(
      255 * (0.52 - 0.55 * 0.48 * Math.max(-1, Math.min(k - 3, 9 - k, 1))),
    )
      .toString(16)
      .padStart(2, "0");
  };
  return `#${channel(0)}${channel(8)}${channel(4)}`;
}

export function groupMarker(index: number) {
  const color = colors[index] ?? fallbackColor(index);
  const outline =
    "#" +
    [1, 3, 5]
      .map((i) =>
        Math.round(parseInt(color.slice(i, i + 2), 16) * 0.58)
          .toString(16)
          .padStart(2, "0"),
      )
      .join("");
  return {
    color,
    symbol: symbols[index % symbols.length],
    size: 7.5,
    opacity: 0.9,
    line: { color: outline, width: 0.8 },
  };
}
