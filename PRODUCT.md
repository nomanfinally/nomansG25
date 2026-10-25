# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Stack

React + TypeScript + Vite, local Plotly SVG scatter, ML.js PCA, Lucide icons. Desktop only.

## Users

Desktop users exploring named Global25 coordinate datasets. Custom PCA is the first tool in a broader G25 suite; distances and models remain planned.

## Product Purpose

A compact G25 analysis workspace, combining searchable local databases and manual coordinates with an interactive PCA plot.

## Operating Context

G25 coordinates only; no .evec input. Scaled and raw inputs normalize independently. Files remain local and in browser memory. No backend or database persistence is included.

## Capabilities and Constraints

- Latest user direction explicitly replaces G25 Views' visual identity with the user's PCA_views, ArchaeoBase and G25 Manager design language. Retain useful analysis behaviors; use original Lucide tools, 12 px Arial UI, compact academic panels and PCA_views palette/shapes.
- One chart fills the workspace remaining beside a collapsible, pointer/keyboard-resizable left data area. A 32 px dark navigation rail retains PCA, planned distances and planned models.
- Default markers are 7 px, matching PCA_views. A deterministic nearest-neighbor assignment maximizes color/shape separation near group centroids, using the PCA_views palette and silhouettes. This is a visual heuristic, not a guarantee of unique appearance for unlimited groups.
- The population picker must follow Admix_IRE: wrapping blue population chips, purple individual chips, removable/editable labels, a full-width anchored suggestion menu, exact/prefix/token/compact/fuzzy ranking, keyboard navigation and exact genetic-ID priority.
- Manual coordinate entry sits directly beside the chip search. Add coordinates or Ctrl/⌘ + Enter commits valid input; every population/sample selection change automatically refits. No Run PCA button or settings dialog/menu.
- Advanced search is a second column to the LEFT of the population picker. It shares the search scope and can enlarge into a virtualized metadata table while retaining the picker on its right. It is called Advanced search throughout the UI, not Filters.
- Advanced search exposes loaded metadata fields, text/equality/numeric criteria, explicit missing-value inclusion/counts, complete matching-sample counts and Add all matches. Criteria scope browsing, without silently removing plotted samples. Group selection uses matching members only; Add all includes results beyond the visible page and deduplicates selections.
- Archaeobase TSV: Group ID, Genetic ID, G25_coords plus arbitrary retained metadata. Also accept PC1–PC25 columns. Count/skip missing coordinates; atomically reject invalid populated rows and duplicate genetic IDs. Worker-based import, search in memory, virtualized table.
- Compact permanent plot toolbar uses PCA_views Lucide icons. Legend toggle is its extreme-left action. No duplicated native modebar; the Plotly mark is restored as a small bottom-right chart credit, per the user’s latest request. The unified 37 px top strip combines app identity and plot tools. Data/legend use panel-style icons. Axis titles and axis/frame lines are removed to keep the plot continuous like G25 Views. Labels/hulls/regression toggle immediately through toolbar icons; no creation checkboxes. Preserve marker/label-style/point-label/hull-opacity cycles, zoom/pan/selection, component selectors, subtitle and PNG sizes.
- Legend looks like PCA_views with visible per-row eye controls. Preserve G25 Views gestures: click toggles trace visibility; double-click isolates/restores. Hide/show never changes the PCA fit or source selection. Export includes matching legend state.
- Default group labels, hulls and regression visibility are off, following a restrained PCA_views starting view. Marker-size cycle is 7 → 5 → 9 px. Default font is 12 px Arial, Helvetica, sans-serif; plot ticks are readable.
- Aggregated, Individual and One group display modes remain. Source samples stay separate; original and normalized coordinates stay distinct from fitted scores. Fewer than three samples or rank below two clears the chart with feedback.
- Ask before expanding optional capabilities. No regional reference PCAs, mobile adaptation, general settings system, online data service or metadata editing.

## Brand Commitments

PCA_views defines plot controls, type, markers and legend. ArchaeoBase and G25 Manager define compact resizable analysis panels and table structure. Admix_IRE defines population-search strategy and UI. G25 Views remains an interaction reference for legend gestures and some analysis cycles, not the current visual identity.

## Evidence on Hand

Read-only reference projects: /home/user/genomics/04_projects/PCA_views; /home/user/genomics/04_projects/Admix_IRE; /home/user/Desktop/SYNCTHING/genomics_syt/qpAdm/4_projects/ArchaeoBase; /home/user/Desktop/SYNCTHING/genomics_syt/qpAdm/4_projects/G25_Manager.

The user's external Archaeobase TSV has 18,212 coordinate-bearing samples across 4,423 groups; it is tested in place and never bundled. Development fixtures are explicitly synthetic. Earlier source studies and capture evidence remain under ignored study/review directories.

## Product Principles

- Keep chart exploration direct and avoid settings dialogs.
- Separate source selection, database browsing and chart visibility.
- Preserve coordinate precision and numerical correctness.
- Favor compact, familiar scientific-tool controls.
- Keep optional feature decisions explicit.
