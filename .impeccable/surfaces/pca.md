# G25 analysis workspace

Mode: Operate. Code-led desktop app. The latest user request explicitly moves away from the prior G25 Views visual replica toward the user's PCA_views, ArchaeoBase and G25 Manager. Admix_IRE remains the exact search-interaction authority. This supersedes the previous right panel, 47 px source input strip, gear menu, source SVG tools, faint ticks and large marker defaults.

## Direction contract

THESIS: A compact academic G25 workspace whose left source/browsing panels and direct plot tools feel native to the user's existing applications.

OWN-WORLD: PCA_views' 12 px Arial/Helvetica UI, 7 px outlined points, solid palette and varied silhouettes, Lucide icons and compact legend. ArchaeoBase/G25 Manager contribute white/warm-neutral panels, clear scope boundaries, draggable separators and dense metadata tables. Admix_IRE contributes blue/purple chips, an anchored full-width candidate menu and ranked exact/prefix/token/compact/subsequence search. No decorative imagery or settings system.

STORY: Load TSV or paste nearby; search populations/genetic IDs; select chips and fit automatically. Open Advanced search to the left of the picker, refine metadata criteria, enlarge it into a table, and select rows or all matches. Collapse the entire data area to regain chart space. Direct toolbar icons control the plotted view; the legend toggles visibility without changing the fitted cohort.

FIRST VIEWPORT: One 37 px top strip combines tool identity and plot controls. A 32 px dark rail precedes a default 380 px left population picker with a draggable separator. The remaining workspace holds one continuous chart with no PC axis titles or axis/frame lines. The top strip’s extreme-left panel icon toggles the PCA_views-style legend; the adjacent panel icon toggles the left data area. Advanced search expands the left data area into two columns; table mode widens the advanced column, keeping the picker on its right. The area can collapse entirely and restore without losing search/selection state. Desktop1280/1440/1600 px; no mobile deliverable.

FORM: User-pinned existing application systems; no visual-world tournament or image comp. Preserve numerical engine and local-data guarantees. No Run PCA or gear/settings menu; toolbar label/hull/regression toggles act immediately. A small official bundled Plotly mark sits at the chart’s bottom right, separate from the toolbar. Retain source legend single/double-click gestures with added explicit eye buttons.

FINISH: Render and validate data, criteria, expanded table, collapsed/resized panels, toolbar/legend interactions, search, empty/error states and PNG export. Finish review and token-bearing DESIGN.md/sidecar are required. No raster assets ship.

## Reference evidence

PCA_views: src/styles.css, components/PlotTools.tsx, Legend.tsx, MarkerSwatch.tsx; domain/colors.ts and viewState.ts. Its actual default marker size is7px, type12pxArial.

ArchaeoBase: src/app/globals.css, components/Explorer.tsx panel splitter, DataTable.tsx virtualization patterns and FilterBuilder.tsx. G25 Manager: styles.css and academic panel scope guidance. These remain read-only references.

Admix_IRE: src/components/shared/PopulationField.jsx and shared/searchText.cjs. The typed search port retains its prepared-field ranking and matching-sample population promotion. User-requested expandable group members remain available.

## Scope guards

Advanced criteria affect database browsing. Add all targets the complete matching rows, not the visible virtualized page. Missing metadata is explicit; no inferred sex/date/region values. Population exclusions prevent filtered group selection from including non-matching members. Geometry visibility and hidden populations do not refit; selection changes do. Only Custom PCA is implemented.

The latest user corrections further prioritize chart area: a single compact strip replaces separate app/toolbars; panel-style glyphs control data and legend; no PC1/PC2 axis titles, no plot border/axis lines; retain the light G25-style continuous plot and restore the Plotly icon in the bottom-right corner. The metadata property selector uses native semantics with a visible React-rendered label and chevron so selected text paints reliably in both compact/table modes.
