# G25 PCA workspace

Mode: Operate. Code-first web application. The user explicitly rejected the prior interpretation and pinned the original G25 Views UI/UX, including tools, icons, sizing and hover behavior. Their latest correction keeps Custom PCA only; regional datasets, base-layer controls and Celto-Germanic are excluded by that correction.

The reference is the local upstream g25views checkout at 6422611. Captured original evidence is under .impeccable/review/parity/reference-*.png and reference-metrics.json. The Bootstrap 4.6.1 stylesheet, reference form classes, 47 px input strip, original gear SVG and applicable custom modebar SVG paths are reused as the authority. The previous dashboard shell, permanent icon toolbar, boxed chart and status footer remain excluded. The later database request supersedes the previous ban on a coordinate panel.

All Custom PCA behavior is mapped in docs/G25_PARITY.md: grouping modes, main/subgroup creation options, original point-label/marker-size/group-label/hull-opacity cycles, geometry visibility, subtitle and 18 image sizes. Native Plotly supplies hover-only camera/zoom/pan/selection/fit/reset and legend interactions. The original's base-only visibility/hover/color/labels controls have no data layer in Custom PCA and are outside this scoped build.

The additions requested on top of this base are a 32 px dark icon-only rail, wheel zoom, the clearer outlined PCA_views marker appearance (with original marker option), component selectors, desktop-only adaptation and a single viewport-filling plot. Distances and Models remain disabled future tools. No settings dialogs, new palettes, regional references, metadata tables or standalone plotting engine. The latest user request explicitly adds a right Data panel as described below.

Defaults match the original Custom plotting flow: Aggregated; scaled coordinates; group labels/hulls/regression created by default; point labels off; big markers; movable group labels; high hull opacity. Selection changes automatically refit Custom PCA. Run also refits and applies creation options. Reset plot clears selection/results and manual catalogue, retains the loaded database/draft text/options. Invalid manual input or failed imports retain existing data/results.

## Direction contract

THESIS: Reproduce G25 Views' Custom PCA workspace, then add only the user's specified improvements. The reference itself, not a fresh aesthetic interpretation, owns the composition.

OWN-WORLD: Bootstrap 4.6.1 system typography and 31 px controls in a 47 px strip; white Plotly graph, faint tick labels and light grid; original SVG hover-tool icons. A 32 px charcoal rail has icons only. Data marks can use PCA_views colors, outlines and shapes.

STORY: Load local TSV or paste named G25 rows in the right Data panel; search group/genetic IDs and select chips; selection automatically refits; choose grouping; explore with the original hover tools and cycles; export through the original size list. Manual entry and database search share the requested right panel; no settings dialog interrupts the chart.

FIRST VIEWPORT: The rail consumes 32 px. A 380 px right Data panel holds loading, search chips, expandable results and manual entry. One source-sized plot-control row occupies 47 px above the graph. The graph fills the remaining area, with title inside its 52 px top margin and a modebar revealed by hovering the graph. No permanent plot toolbar, hero, data card or footer. Desktop widths 1280/1440/1600 are supported.

FORM: Precisely user-pinned source interface, with reference captures and a source-behavior parity matrix. No concept tournament or image composition applies.

FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance

## Database extension authority

The user supplied Admix_IRE chip-search screenshots and its local source, plus an Archaeobase TSV. Retain the existing Bootstrap/Plotly world and adapt the familiar wrapping chips, full-width search and population/sample results inside a 380 px right panel. Load and manual entry remain visible; results scroll in available height. Whole-group selection is one chip; individual selection is one sample chip; expansion reveals toggleable member rows. No drag/presets/bookmarks/metadata table or backend is implied. Input parsing is worker-based; search is in memory. Each selection change refits, without a confirmation dialog.
