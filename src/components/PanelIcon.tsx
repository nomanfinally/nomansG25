/** Compact panel glyph shared by the picker and legend controls. */
export function PanelIcon({ side }: { side: "left" | "right" }) {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true">
      <rect
        x="1"
        y="1"
        width="14"
        height="14"
        rx="2"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.3"
      />
      <path
        d="M3 1.5H6V14.5H3Q1.5 14.5 1.5 13V3Q1.5 1.5 3 1.5Z"
        fill="currentColor"
        transform={side === "right" ? "rotate(180 8 8)" : undefined}
      />
    </svg>
  );
}
