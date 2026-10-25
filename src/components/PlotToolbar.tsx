import {
  Camera,
  CaseSensitive,
  CircleDashed,
  Eye,
  Hand,
  Home,
  Lasso,
  List,
  Minus,
  Pentagon,
  Plus,
  Scan,
  SquareDashedMousePointer,
  Tags,
  TrendingUp,
  Type,
  MessageSquare,
  Focus,
  RotateCcw,
} from "lucide-react";
import { PanelIcon } from "./PanelIcon";
import type { RefObject } from "react";
import type { ChartAction, ChartHandle } from "./PcaChart";
import {
  axisTitle,
  imageSizes,
  type AddOptions,
  type PlotView,
} from "../domain/figure";
import type { PcaResult } from "../domain/pca";
export function PlotToolbar({
  view,
  patch,
  action,
  plot,
  result,
  options,
  onOptions,
  onClear,
  onSave,
  collapsed,
  onPanel,
}: {
  view: PlotView;
  patch: (patch: Partial<PlotView>) => void;
  action: (action: ChartAction) => void;
  plot: RefObject<ChartHandle | null>;
  result: PcaResult | null;
  options: AddOptions;
  onOptions: (patch: Partial<AddOptions>) => void;
  onClear: () => void;
  onSave: (w: number, h: number) => void;
  collapsed: boolean;
  onPanel: () => void;
}) {
  return (
    <div className="plot-toolbar" role="toolbar" aria-label="Plot tools">
      <button
        className="icon-button"
        aria-label="Toggle legend"
        title="Toggle legend"
        aria-pressed={view.legend}
        onClick={() => action("legend")}
      >
        <PanelIcon side="right" />
      </button>
      <button
        className="icon-button"
        aria-label="Toggle data panel"
        title={collapsed ? "Open data panel" : "Collapse data panel"}
        aria-pressed={!collapsed}
        onClick={onPanel}
      >
        <PanelIcon side="left" />
      </button>
      <div className="tool-group" role="group" aria-label="Interaction mode">
        {(
          [
            { value: "pan", Icon: Hand, label: "Pan mode" },
            { value: "zoom", Icon: Scan, label: "Box zoom mode" },
            {
              value: "select",
              Icon: SquareDashedMousePointer,
              label: "Box select mode",
            },
            { value: "lasso", Icon: Lasso, label: "Lasso select mode" },
          ] as const
        ).map(({ value, Icon, label }) => (
          <button
            key={value}
            className="icon-button"
            aria-label={label}
            title={label}
            aria-pressed={view.dragMode === value}
            onClick={() => patch({ dragMode: value })}
          >
            <Icon size={16} />
          </button>
        ))}
      </div>
      <div className="tool-group" role="group" aria-label="Zoom">
        <button
          className="icon-button"
          aria-label="Zoom in"
          title="Zoom in"
          onClick={() => plot.current?.zoom(0.75)}
        >
          <Plus size={17} />
        </button>
        <button
          className="icon-button"
          aria-label="Zoom out"
          title="Zoom out"
          onClick={() => plot.current?.zoom(1 / 0.75)}
        >
          <Minus size={17} />
        </button>
        <button
          className="icon-button"
          aria-label="Fit visible samples"
          title="Fit visible samples"
          onClick={() => plot.current?.fit()}
        >
          <Focus size={16} />
        </button>
        <button
          className="icon-button"
          aria-label="Reset axes"
          title="Reset axes"
          onClick={() => plot.current?.reset()}
        >
          <Home size={16} />
        </button>
      </div>
      <div className="tool-group" role="group" aria-label="Labels and geometry">
        {(
          [
            ["markerSize", "Cycle marker size", CircleDashed, false],
            [
              "pointLabels",
              "Cycle point labels",
              CaseSensitive,
              view.pointLabels > 0,
            ],
            ["labels", "Toggle group labels", Tags, view.labels],
            ["labelStyle", "Cycle group label style", Type, false],
            ["hulls", "Toggle convex hulls", Pentagon, view.hulls],
            ["hullOpacity", "Cycle hull opacity", CircleDashed, false],
            [
              "regression",
              "Toggle regression lines",
              TrendingUp,
              view.regression,
            ],
            [
              "projected",
              "Toggle population visibility",
              Eye,
              view.hiddenTraces.length > 0,
            ],
            ["subtitle", "Edit subtitle", MessageSquare, !!view.subtitle],
          ] as const
        ).map(([key, label, Icon, active]) => (
          <button
            className="icon-button"
            aria-label={label}
            title={label}
            key={key}
            aria-pressed={active}
            onClick={() => action(key)}
          >
            <Icon size={16} />
          </button>
        ))}
      </div>
      <div className="component-controls">
        {(["x", "y"] as const).map((axis) => (
          <label key={axis}>
            {axis.toUpperCase()}
            <select
              aria-label={
                axis === "x" ? "Horizontal component" : "Vertical component"
              }
              value={view[axis]}
              disabled={!result}
              title={
                result
                  ? axisTitle(result, view[axis])
                  : "Select populations first"
              }
              onChange={(e) => patch({ [axis]: Number(e.target.value) })}
            >
              {Array.from({ length: result?.componentCount ?? 2 }, (_, i) => (
                <option
                  key={i}
                  value={i}
                  disabled={i === view[axis === "x" ? "y" : "x"]}
                >
                  PC{i + 1}
                </option>
              ))}
            </select>
          </label>
        ))}
      </div>
      <details className="export-menu">
        <summary className="icon-button" title="Save PNG" aria-label="Save PNG">
          <Camera size={16} />
        </summary>
        <div className="export-options">
          {imageSizes.map(([w, h]) => (
            <button
              key={`${w}:${h}`}
              onClick={(e) => {
                e.currentTarget.closest("details")?.removeAttribute("open");
                onSave(w, h);
              }}
            >
              {w}×{h} px
            </button>
          ))}
        </div>
      </details>
      <button
        className="icon-button"
        aria-label="Clear plot selection"
        title="Clear plot selection"
        onClick={onClear}
      >
        <RotateCcw size={15} />
      </button>
      <div className="plot-grouping">
        <select
          aria-label="Grouping mode"
          value={options.mode}
          onChange={(e) =>
            onOptions({ mode: e.target.value as AddOptions["mode"] })
          }
        >
          <option value="aggregated">Populations</option>
          <option value="individual">Individuals</option>
          <option value="single">One group</option>
        </select>
        {options.mode === "single" && (
          <>
            <input
              aria-label="Custom group name"
              placeholder="Group name"
              value={options.customName}
              onChange={(e) => onOptions({ customName: e.target.value })}
            />
            <label title="Decorate aggregated subgroups">
              <input
                type="checkbox"
                checked={options.subgroups}
                onChange={(e) => onOptions({ subgroups: e.target.checked })}
              />
              Subgroups
            </label>
          </>
        )}
      </div>
    </div>
  );
}
