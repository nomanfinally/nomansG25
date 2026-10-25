import {
  ArrowLeftRight,
  Blend,
  Camera,
  CaseSensitive,
  ChevronDown,
  ChevronUp,
  SlidersHorizontal,
  Circle,
  CircleDashed,
  Contrast,
  Crosshair,
  Eye,
  EyeOff,
  Focus,
  Grid2X2,
  Hand,
  Home,
  Lasso,
  Maximize,
  Minimize,
  Minus,
  PanelLeftClose,
  PanelLeftOpen,
  PanelRightClose,
  PanelRightOpen,
  Pentagon,
  Plus,
  RotateCcw,
  Ruler,
  Scan,
  Square,
  SquareDashedMousePointer,
  Table2,
  Tag,
  Tags,
  TrendingUp,
  Type,
  MessageSquare,
} from "lucide-react";
import { useState, type RefObject } from "react";
import type { ChartAction, ChartHandle } from "./PcaChart";
import {
  axisTitle,
  hullOpacities,
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
  onOpenExport,
  collapsed,
  onPanel,
  onTable,
  fullscreen,
  onFullscreen,
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
  onOpenExport: () => void;
  collapsed: boolean;
  onPanel: () => void;
  onTable: () => void;
  fullscreen: boolean;
  onFullscreen: () => void;
}) {
  const [unfolded, setUnfolded] = useState(true);

  const cycle = <T,>(values: readonly T[], current: T) =>
    values[(values.indexOf(current) + 1) % values.length];

  const cyclePointOpacity = () => {
    patch({ pointOpacity: cycle([1, 0.75, 0.5, 0.25, 0], view.pointOpacity) });
  };

  const cycleOutlineOpacity = () => {
    patch({
      outlineOpacity: cycle([1, 0.75, 0.5, 0.25, 0], view.outlineOpacity),
    });
  };

  const cycleMarkerSize = () => {
    action("markerSize");
  };

  const cycleGroupLabels = () => {
    action("labels");
  };

  const cycleHulls = () => {
    action("hulls");
  };

  const cycleAspectRatio = () => {
    const ratios = ["full", "1:1", "16:9", "4:3", "3:2"] as const;
    patch({ aspectRatio: cycle(ratios, view.aspectRatio) });
  };

  const editTitles = () => {
    const title = window.prompt(
      "Chart title:",
      view.title || "Global 25 Custom PCA",
    );
    if (title !== null) {
      const subtitle = window.prompt(
        "Chart subtitle (optional):",
        view.subtitle || "",
      );
      if (subtitle !== null) {
        patch({ title: title.trim(), subtitle: subtitle.trim() });
      }
    }
  };

  const anyHidden = view.hiddenTraces.length > 0;

  return (
    <div
      className="floating-toolbar-container plot-toolbar"
      role="toolbar"
      aria-label="Plot tools"
    >
      {/* Non-fading side panel toggle button on the left */}
      <button
        className={`icon-button floating-edge-toggle panel-toggle-btn ${!collapsed ? "panel-open" : ""}`}
        aria-label="Toggle data panel"
        title={collapsed ? "Open data panel" : "Collapse data panel"}
        aria-pressed={!collapsed}
        onClick={onPanel}
      >
        {collapsed ? <PanelLeftOpen size={16} /> : <PanelLeftClose size={16} />}
      </button>

      {/* Floating plot tools with PCA_views UI & icons */}
      {unfolded ? (
        <div
          className="plot-toolbar-inner chart-tools"
          tabIndex={0}
        >
        {/* Interaction mode */}
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
              className={`icon-button ${view.dragMode === value ? "active" : ""}`}
              aria-label={label}
              title={label}
              aria-pressed={view.dragMode === value}
              onClick={() => patch({ dragMode: value })}
            >
              <Icon size={16} />
            </button>
          ))}
        </div>

        {/* Zoom and fit */}
        <div className="tool-group" role="group" aria-label="Zoom and fit">
          <button
            className="icon-button"
            aria-label="Zoom in"
            title="Zoom in"
            onClick={() => plot.current?.zoom(0.75)}
          >
            <Plus size={16} />
          </button>
          <button
            className="icon-button"
            aria-label="Zoom out"
            title="Zoom out"
            onClick={() => plot.current?.zoom(1 / 0.75)}
          >
            <Minus size={16} />
          </button>
          <button
            className="icon-button"
            aria-label="Fit visible samples"
            title="Autoscale to visible samples"
            onClick={() => plot.current?.fit()}
          >
            <Focus size={16} />
          </button>
          <button
            className="icon-button"
            aria-label="Reset axes"
            title="Reset axes to all samples"
            onClick={() => plot.current?.reset()}
          >
            <Home size={16} />
          </button>
        </div>

        {/* Markers */}
        <div className="tool-group" role="group" aria-label="Markers">
          <button
            className="icon-button"
            aria-label="Cycle marker size"
            title={`Cycle marker size (7px → 5px → 9px): currently ${[7, 5, 9][view.markerSize]}px`}
            onClick={cycleMarkerSize}
          >
            <Circle size={15} />
          </button>
          <button
            className="icon-button"
            aria-label="Cycle point opacity"
            title={`Cycle point opacity: ${Math.round(view.pointOpacity * 100)}%`}
            onClick={cyclePointOpacity}
          >
            <Blend size={16} />
          </button>
          <button
            className="icon-button"
            aria-label="Cycle boundary opacity"
            title={`Cycle boundary opacity: ${Math.round(view.outlineOpacity * 100)}%`}
            onClick={cycleOutlineOpacity}
          >
            <CircleDashed size={16} />
          </button>
          <button
            className={`icon-button ${view.grayscale ? "active" : ""}`}
            aria-label="Toggle grayscale"
            title="Toggle grayscale"
            aria-pressed={view.grayscale}
            onClick={() => patch({ grayscale: !view.grayscale })}
          >
            <Contrast size={16} />
          </button>
        </div>

        {/* Labels and geometry */}
        <div className="tool-group" role="group" aria-label="Labels and geometry">
          <button
            className={`icon-button ${view.pointLabels > 0 ? "active" : ""}`}
            aria-label="Cycle point labels"
            title={`Cycle point labels (None → Name → Group → ID): currently ${["none", "sample", "population", "full"][view.pointLabels]}`}
            aria-pressed={view.pointLabels > 0}
            onClick={() => action("pointLabels")}
          >
            <CaseSensitive size={16} />
          </button>
          <button
            className={`icon-button ${view.labels ? "active" : ""}`}
            aria-label="Toggle group labels"
            title={`Toggle group labels (currently ${view.labels ? ["callout", "plain", "boxed"][view.labelStyle] : "off"})`}
            aria-pressed={view.labels}
            onClick={cycleGroupLabels}
          >
            <Tags size={16} />
          </button>
          <button
            className="icon-button"
            aria-label="Cycle group label style"
            title={`Cycle group label style (Callout → Plain → Boxed): currently ${["callout", "plain", "boxed"][view.labelStyle]}`}
            onClick={() => action("labelStyle")}
          >
            <Type size={16} />
          </button>
          <button
            className={`icon-button ${view.labelConnector ? "active" : ""}`}
            aria-label="Toggle label centroid connectors"
            title="Toggle label centroid connectors"
            aria-pressed={view.labelConnector}
            onClick={() => patch({ labelConnector: !view.labelConnector })}
          >
            <Tag size={16} />
          </button>
          <button
            className={`icon-button ${view.hulls ? "active" : ""}`}
            aria-label="Toggle convex hulls"
            title={`Toggle convex hulls: currently ${view.hulls ? `${Math.round(hullOpacities[view.hullOpacity] * 100)}%` : "off"}`}
            aria-pressed={view.hulls}
            onClick={cycleHulls}
          >
            <Pentagon size={16} />
          </button>
          <button
            className="icon-button"
            aria-label="Cycle hull opacity"
            title={`Cycle hull opacity (0.9 → 0.6 → 0.3): currently ${hullOpacities[view.hullOpacity]}`}
            onClick={() => action("hullOpacity")}
          >
            <Blend size={15} />
          </button>
          <button
            className={`icon-button ${view.regression ? "active" : ""}`}
            aria-label="Toggle regression lines"
            title="Toggle regression lines"
            aria-pressed={view.regression}
            onClick={() => action("regression")}
          >
            <TrendingUp size={16} />
          </button>
        </div>

        {/* View and hover */}
        <div className="tool-group" role="group" aria-label="View and hover">
          <button
            className={`icon-button ${view.spikes ? "active" : ""}`}
            aria-label="Toggle crosshairs"
            title="Toggle crosshairs"
            aria-pressed={view.spikes}
            onClick={() => patch({ spikes: !view.spikes })}
          >
            <Crosshair size={16} />
          </button>
          <button
            className={`icon-button ${anyHidden ? "active" : ""}`}
            aria-label="Show or hide all plotted populations"
            title="Show or hide all populations"
            aria-pressed={anyHidden}
            onClick={() => action("projected")}
          >
            {anyHidden ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
          <button
            className={`icon-button ${view.hover !== "off" ? "active" : ""}`}
            aria-label="Toggle hover information"
            title="Toggle hover information"
            aria-pressed={view.hover !== "off"}
            onClick={() =>
              patch({ hover: view.hover === "off" ? "closest" : "off" })
            }
          >
            <MessageSquare size={16} />
          </button>
          <button
            className={`icon-button ${view.grid ? "active" : ""}`}
            aria-label="Toggle grid"
            title="Toggle grid"
            aria-pressed={view.grid}
            onClick={() => patch({ grid: !view.grid })}
          >
            <Grid2X2 size={16} />
          </button>
          <button
            className={`icon-button ${view.equalScale ? "active" : ""}`}
            aria-label="Toggle equal axis scale"
            title="Toggle equal axis scale"
            aria-pressed={view.equalScale}
            onClick={() => patch({ equalScale: !view.equalScale })}
          >
            <Ruler size={16} />
          </button>
          <button
            className={`icon-button ${view.aspectRatio !== "full" ? "active" : ""}`}
            aria-label="Cycle chart ratio"
            title={`Cycle chart ratio: ${view.aspectRatio}`}
            aria-pressed={view.aspectRatio !== "full"}
            onClick={cycleAspectRatio}
          >
            <Square size={16} />
          </button>
        </div>

        {/* Titles and axes */}
        <div className="tool-group" role="group" aria-label="Titles and axes">
          <button
            className={`icon-button ${view.title || view.subtitle ? "active" : ""}`}
            aria-label="Edit plot title and subtitle"
            title="Edit plot title and subtitle"
            onClick={editTitles}
          >
            <Type size={16} />
          </button>

          <div className="component-controls">
            <label className="axis-picker-label">
              <span>X</span>
              <select
                aria-label="Horizontal component"
                value={view.x}
                disabled={!result}
                title={
                  result
                    ? axisTitle(result, view.x)
                    : "Select populations first"
                }
                onChange={(e) => patch({ x: Number(e.target.value) })}
              >
                {Array.from({ length: result?.componentCount ?? 2 }, (_, i) => (
                  <option key={i} value={i} disabled={i === view.y}>
                    PC{i + 1}
                  </option>
                ))}
              </select>
            </label>

            <button
              className="icon-button swap-axes-btn"
              aria-label="Swap axes"
              title="Swap axes"
              disabled={!result}
              onClick={() => patch({ x: view.y, y: view.x })}
            >
              <ArrowLeftRight size={14} />
            </button>

            <label className="axis-picker-label">
              <span>Y</span>
              <select
                aria-label="Vertical component"
                value={view.y}
                disabled={!result}
                title={
                  result
                    ? axisTitle(result, view.y)
                    : "Select populations first"
                }
                onChange={(e) => patch({ y: Number(e.target.value) })}
              >
                {Array.from({ length: result?.componentCount ?? 2 }, (_, i) => (
                  <option key={i} value={i} disabled={i === view.x}>
                    PC{i + 1}
                  </option>
                ))}
              </select>
            </label>
          </div>
        </div>

        {/* Data, export & grouping */}
        <div className="tool-group" role="group" aria-label="Data and export">
          <button
            className="icon-button"
            aria-label="Sample table"
            title="Sample table (full width)"
            onClick={onTable}
          >
            <Table2 size={16} />
          </button>

          <button
            className="icon-button"
            aria-label="Save PNG"
            title="Save PNG (export dialog)"
            onClick={onOpenExport}
          >
            <Camera size={16} />
          </button>

          <button
            className="icon-button"
            aria-label={fullscreen ? "Exit fullscreen" : "Fullscreen"}
            title={fullscreen ? "Exit fullscreen" : "Fullscreen"}
            onClick={onFullscreen}
          >
            {fullscreen ? <Minimize size={16} /> : <Maximize size={16} />}
          </button>

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
              <input
                aria-label="Custom group name"
                placeholder="Group name"
                value={options.customName}
                onChange={(e) => onOptions({ customName: e.target.value })}
              />
            )}
          </div>
        </div>

        {/* Toolbar fold button */}
        <div className="tool-group" role="group" aria-label="Toolbar controls">
          <button
            className="icon-button toolbar-fold-btn"
            aria-label="Fold toolbar"
            title="Fold toolbar (hide tools)"
            onClick={() => setUnfolded(false)}
          >
            <ChevronUp size={15} />
          </button>
        </div>
      </div>
      ) : (
        <button
          className="toolbar-unfold-btn"
          aria-label="Unfold toolbar"
          title="Unfold toolbar (show tools)"
          onClick={() => setUnfolded(true)}
        >
          <SlidersHorizontal size={14} />
          <span>Tools</span>
          <ChevronDown size={13} />
        </button>
      )}

      {/* Non-fading legend toggle button on the right */}
      <button
        className={`icon-button floating-edge-toggle legend-toggle-btn ${view.legend ? "active legend-open" : ""}`}
        aria-label="Toggle legend"
        title="Toggle legend"
        aria-pressed={view.legend}
        onClick={() => action("legend")}
      >
        {view.legend ? (
          <PanelRightClose size={16} />
        ) : (
          <PanelRightOpen size={16} />
        )}
      </button>
    </div>
  );
}
