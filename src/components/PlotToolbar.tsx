import {
  Blend,
  Camera,
  CaseSensitive,
  ChevronDown,
  ChevronUp,
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
  MessageSquare,
  Minus,
  PanelLeftClose,
  PanelLeftOpen,
  PanelRightClose,
  PanelRightOpen,
  Pentagon,
  Plus,
  Ruler,
  Scan,
  SlidersHorizontal,
  Square,
  SquareDashedMousePointer,
  Table2,
  Tag,
  Tags,
  TrendingUp,
  Type,
} from "lucide-react";
import { useState, type RefObject } from "react";
import type { ChartAction, ChartHandle } from "./PcaChart";
import {
  hullOpacities,
  type PlotView,
} from "../domain/figure";
import type { PcaResult } from "../domain/pca";

export function PlotToolbar({
  view,
  patch,
  action,
  plot,
  result,
  onClear,
  onSave,
  onOpenExport,
  collapsed,
  onPanel,
  onTable,
}: {
  view: PlotView;
  patch: (patch: Partial<PlotView>) => void;
  action: (action: ChartAction) => void;
  plot: RefObject<ChartHandle | null>;
  result?: PcaResult | null;
  onClear?: () => void;
  onSave?: (w: number, h: number) => void;
  onOpenExport: () => void;
  collapsed: boolean;
  onPanel: () => void;
  onTable: () => void;
}) {
  const [unfolded, setUnfolded] = useState(true);

  const cycle = <T,>(values: readonly T[], current: T) =>
    values[(values.indexOf(current) + 1) % values.length];

  // Cycling handlers exactly matching PCA_views behavior
  const cycleMarkerSize = () => {
    patch({ markerSize: (view.markerSize + 1) % 3 });
  };

  const cyclePointOpacity = () => {
    patch({ pointOpacity: cycle([1, 0.75, 0.5, 0.25, 0], view.pointOpacity) });
  };

  const cycleOutlineOpacity = () => {
    patch({
      outlineOpacity: cycle([1, 0.75, 0.5, 0.25, 0], view.outlineOpacity),
    });
  };

  const cyclePointLabels = () => {
    patch({ pointLabels: (view.pointLabels + 1) % 4 });
  };

  // Single button cycling: off -> callout -> plain -> boxed -> off
  const cyclePopulationLabels = () => {
    if (!view.labels) {
      patch({ labels: true, labelStyle: 0 });
    } else if (view.labelStyle === 0) {
      patch({ labelStyle: 1 });
    } else if (view.labelStyle === 1) {
      patch({ labelStyle: 2 });
    } else {
      patch({ labels: false, labelStyle: 0 });
    }
  };

  // Single button cycling: off -> 90% -> 60% -> 30% -> off
  const cycleHulls = () => {
    if (!view.hulls) {
      patch({ hulls: true, hullOpacity: 0 });
    } else if (view.hullOpacity === 0) {
      patch({ hullOpacity: 1 });
    } else if (view.hullOpacity === 1) {
      patch({ hullOpacity: 2 });
    } else {
      patch({ hulls: false, hullOpacity: 0 });
    }
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
      {/* Side panel toggle button on the left edge */}
      <button
        className={`icon-button floating-edge-toggle panel-toggle-btn ${!collapsed ? "panel-open" : ""}`}
        aria-label="Toggle data panel"
        title={collapsed ? "Open data panel" : "Collapse data panel"}
        aria-pressed={!collapsed}
        onClick={onPanel}
      >
        {collapsed ? <PanelLeftOpen size={16} /> : <PanelLeftClose size={16} />}
      </button>

      {/* Floating plot tools with PCA_views UI, icons & cycling functionality */}
      {unfolded && (
        <div className="plot-toolbar-inner chart-tools" tabIndex={0}>
          {/* 1. Interaction mode */}
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

          {/* 2. Zoom and fit */}
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

          {/* 3. Markers */}
          <div className="tool-group" role="group" aria-label="Markers">
            <button
              className="icon-button"
              aria-label="Cycle marker size"
              title={`Cycle marker size: ${[7, 5, 9][view.markerSize]}px`}
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

          {/* 4. Labels and geometry */}
          <div
            className="tool-group tool-group-pre-break"
            role="group"
            aria-label="Labels and geometry"
          >
            <button
              className={`icon-button ${view.pointLabels > 0 ? "active" : ""}`}
              aria-label="Cycle point labels"
              title={`Cycle point labels: ${["none", "sample", "population", "full"][view.pointLabels]}`}
              aria-pressed={view.pointLabels > 0}
              onClick={cyclePointLabels}
            >
              <CaseSensitive size={16} />
            </button>
            <button
              className={`icon-button ${view.labels ? "active" : ""}`}
              aria-label="Cycle population labels"
              title={`Cycle population labels: ${view.labels ? ["callout", "plain", "boxed"][view.labelStyle] : "off"}`}
              aria-pressed={view.labels}
              onClick={cyclePopulationLabels}
            >
              <Tags size={16} />
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
              aria-label="Cycle hulls"
              title={`Cycle hulls: ${view.hulls ? `${Math.round(hullOpacities[view.hullOpacity] * 100)}%` : "off"}`}
              aria-pressed={view.hulls}
              onClick={cycleHulls}
            >
              <Pentagon size={16} />
            </button>
            <button
              className={`icon-button ${view.regression ? "active" : ""}`}
              aria-label="Toggle regression lines"
              title="Toggle regression lines"
              aria-pressed={view.regression}
              onClick={() => patch({ regression: !view.regression })}
            >
              <TrendingUp size={16} />
            </button>
          </div>

          {/* Clean breakpoint between plot interaction tools and view/export tools when space is constrained */}
          <div className="toolbar-row-break" aria-hidden="true" />

          {/* 5. View and hover */}
          <div className="tool-group" role="group" aria-label="View and hover">
            <button
              className={`icon-button ${view.spikes ? "active" : ""}`}
              aria-label="Crosshairs"
              title="Crosshairs"
              aria-pressed={view.spikes}
              onClick={() => patch({ spikes: !view.spikes })}
            >
              <Crosshair size={16} />
            </button>
            <button
              className={`icon-button ${anyHidden ? "active" : ""}`}
              aria-label="Show or hide all populations"
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

          {/* 6. Titles and settings */}
          <div
            className="tool-group"
            role="group"
            aria-label="Titles and settings"
          >
            <button
              className={`icon-button ${view.title || view.subtitle ? "active" : ""}`}
              aria-label="Edit plot title and subtitle"
              title="Edit plot title and subtitle"
              aria-pressed={Boolean(view.title || view.subtitle)}
              onClick={editTitles}
            >
              <Type size={16} />
            </button>
          </div>

          {/* 7. Data and export */}
          <div className="tool-group" role="group" aria-label="Data and export">
            <button
              className="icon-button"
              aria-label="Sample table"
              title="Open sample table"
              onClick={onTable}
            >
              <Table2 size={16} />
            </button>

            <button
              className="icon-button"
              aria-label="Export"
              title="Export image or data"
              onClick={onOpenExport}
            >
              <Camera size={16} />
            </button>
          </div>

          {/* 8. Toolbar fold control */}
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
      )}

      {/* Floating right actions: toolbar dropdown button (when folded) + legend toggle */}
      <div className="floating-right-actions">
        {!unfolded && (
          <button
            className="floating-edge-toggle toolbar-unfold-btn"
            aria-label="Unfold toolbar"
            title="Unfold toolbar (show tools)"
            onClick={() => setUnfolded(true)}
          >
            <SlidersHorizontal size={14} />
            <span>Tools</span>
            <ChevronDown size={13} />
          </button>
        )}

        {/* Legend toggle button on the right edge */}
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
    </div>
  );
}
