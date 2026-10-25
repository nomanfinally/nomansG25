import { useEffect, useMemo, useRef } from "react";
import { Eye, EyeOff, X } from "lucide-react";
import type { PcaResult } from "../domain/pca";
import {
  createEntries,
  type AddOptions,
  type PlotView,
} from "../domain/figure";
import { entryMarkers } from "../domain/markerAssignment";
import { MarkerSwatch } from "./MarkerSwatch";
export function PcaLegend({
  result,
  options,
  view,
  onHidden,
  onClose,
}: {
  result: PcaResult;
  options: AddOptions;
  view: PlotView;
  onHidden: (indices: number[]) => void;
  onClose: () => void;
}) {
  const entries = useMemo(
    () => createEntries(result, options),
    [result, options],
  );
  const markers = useMemo(
    () => entryMarkers(result, entries, view),
    [result, entries, view.x, view.y],
  );
  const pending = useRef<ReturnType<typeof setTimeout> | null>(null);
  const latest = useRef({ view, entries, onHidden });
  latest.current = { view, entries, onHidden };
  useEffect(
    () => () => {
      if (pending.current) clearTimeout(pending.current);
    },
    [],
  );
  useEffect(() => {
    if (pending.current) clearTimeout(pending.current);
  }, [result, options.mode]);
  const toggle = (index: number) => {
    const { view, onHidden } = latest.current;
    onHidden(
      view.hiddenTraces.includes(index)
        ? view.hiddenTraces.filter((i) => i !== index)
        : [...view.hiddenTraces, index],
    );
  };
  const click = (index: number, detail: number) => {
    if (pending.current) clearTimeout(pending.current);
    if (detail >= 2) {
      const { view, entries, onHidden } = latest.current;
      const isolated =
        !view.hiddenTraces.includes(index) &&
        view.hiddenTraces.length === entries.length - 1;
      onHidden(
        isolated ? [] : entries.flatMap((_, i) => (i === index ? [] : [i])),
      );
      pending.current = null;
    } else
      pending.current = setTimeout(() => {
        toggle(index);
        pending.current = null;
      }, 300);
  };
  return (
    <aside className="legend-dock" aria-label="Population legend">
      <header className="legend-header">
        <h2>
          Legend <span>{entries.length}</span>
        </h2>
        <button
          className="legend-close-btn"
          aria-label="Close legend"
          title="Close legend"
          onClick={onClose}
        >
          <X size={14} />
        </button>
      </header>
      <div className="legend-actions">
        <button onClick={() => onHidden([])}>Show all</button>
        <button onClick={() => onHidden(entries.map((_, i) => i))}>
          Hide all
        </button>
      </div>
      <div className="legend-list">
        {entries.map((entry, i) => {
          const hidden = view.hiddenTraces.includes(i),
            marker = markers[i];
          return (
            <div
              className={`legend-row ${hidden ? "is-hidden" : ""}`}
              key={entry.name}
            >
              <button
                className="legend-item"
                aria-label={`Legend ${entry.name}`}
                aria-pressed={!hidden}
                title={`${entry.name} · click to toggle; double-click to isolate`}
                onClick={(event) => click(i, event.detail)}
                onKeyDown={(event) => {
                  if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault();
                    toggle(i);
                  }
                }}
              >
                <MarkerSwatch {...marker} />
                <span className="legend-name">{entry.name}</span>
                <span className="legend-count">{entry.indices.length}</span>
              </button>
              <button
                className="icon-button legend-eye"
                aria-label={`${hidden ? "Show" : "Hide"} population ${entry.name}`}
                title={hidden ? "Show population" : "Hide population"}
                onClick={() => {
                  if (pending.current) clearTimeout(pending.current);
                  toggle(i);
                }}
              >
                {hidden ? <EyeOff size={13} /> : <Eye size={13} />}
              </button>
            </div>
          );
        })}
      </div>
    </aside>
  );
}
