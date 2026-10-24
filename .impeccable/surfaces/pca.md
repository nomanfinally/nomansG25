# G25 PCA workspace

Mode: Operate. Code-first web application. The user explicitly rejected the prior interpretation and pinned the original G25 Views UI/UX, including tools, icons, sizing and hover behavior. Their latest correction keeps Custom PCA only; regional datasets, base-layer controls and Celto-Germanic are excluded by that correction.

The reference is the local upstream g25views checkout at 6422611. Captured original evidence is under .impeccable/review/parity/reference-*.png and reference-metrics.json. The Bootstrap 4.6.1 stylesheet, reference form classes, 47 px input strip, original gear SVG and applicable custom modebar SVG paths are reused as the authority. The previous shell, permanent icon toolbar, coordinate panel, boxed chart and status footer are replaced.

All Custom PCA behavior is mapped in docs/G25_PARITY.md: grouping modes, main/subgroup creation options, original point-label/marker-size/group-label/hull-opacity cycles, geometry visibility, subtitle and 18 image sizes. Native Plotly supplies hover-only camera/zoom/pan/selection/fit/reset and legend interactions. The original's base-only visibility/hover/color/labels controls have no data layer in Custom PCA and are outside this scoped build.

The additions requested on top of this base are a 32 px dark icon-only rail, wheel zoom, the clearer outlined PCA_views marker appearance (with original marker option), component selectors, desktop-only adaptation and a single viewport-filling plot. Distances and Models remain disabled future tools. No new control panels, dialogs, palettes, regional references, tables or standalone plotting engine.

Defaults match the original Custom plotting flow: Aggregated; scaled coordinates; group labels/hulls/regression created by default; point labels off; big markers; movable group labels; high hull opacity. Run refits and replaces the Custom result, resets plot cycles, and retains entry/generation options. Reset plot clears the plotted result and view state but retains input/options. Invalid input keeps the prior successful plot.

## Direction contract

THESIS: Reproduce G25 Views' Custom PCA workspace, then add only the user's specified improvements. The reference itself, not a fresh aesthetic interpretation, owns the composition.

OWN-WORLD: Bootstrap 4.6.1 system typography and 31 px controls in a 47 px strip; white Plotly graph, faint tick labels and light grid; original SVG hover-tool icons. A 32 px charcoal rail has icons only. Data marks can use PCA_views colors, outlines and shapes.

STORY: Paste named G25 rows in the visible one-line field; choose scaled/raw and grouping; run; explore with the original hover tools and cycles; export through the original size list. No separate input or settings dialog interrupts the chart.

FIRST VIEWPORT: The rail consumes 32 px. One source-sized input row occupies 47 px. The graph fills everything else, with title inside its 52 px top margin and a modebar revealed by hovering the graph. No permanent plot toolbar, hero, data card or footer. Desktop widths 1280/1440/1600 are supported.

FORM: Precisely user-pinned source interface, with reference captures and a source-behavior parity matrix. No concept tournament or image composition applies.

FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance
