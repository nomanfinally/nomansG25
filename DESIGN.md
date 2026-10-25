---
name: G25 tools
description: Compact local G25 analysis in the PCA_views academic workspace.
colors:
  primary: "#0055bf"
  population-surface: "#e4edff"
  population-line: "#adc9ff"
  individual-text: "#653b83"
  individual-surface: "#f2eafa"
  individual-line: "#d0b5e4"
  surface: "#fff"
  text: "#363636"
  line: "#e6e4df"
  muted: "#696969"
  subtle: "#f7f7f5"
  hover: "#f1f1ef"
  active: "#e9e9e9"
  header: "#fbfbfb"
  toolbar: "#fcfcfc"
  field-line: "#d8d5ce"
  focus: "#8a8a8a"
  placeholder: "#72716d"
  selection-surface: "#dceaff"
  selection-text: "#164c8f"
  selected-row: "#eaf3ff"
  rail: "#292b2d"
  rail-current: "#414448"
  rail-icon: "#bdc3ca"
  advanced-surface: "#fafaf8"
  result-heading: "#fafafa"
  result-hover: "#edf4fc"
  legend-line: "#bcbcbc"
  legend-hover: "#f0f0ed"
  legend-hidden: "#82817d"
  error: "#a04444"
  error-surface: "#fff5f5"
  error-line: "#e5c8c8"
  search-focus: "#4891ff"
  search-focus-halo: "#e6f0ff"
  scrollbar: "#c1c0bc"
  separator-active: "#bcbab2"
  table-line: "#eeece7"
  table-hover: "#f1f4f7"
  plot-tick: "#666666"
  plot-grid: "#eeeeee"
  marker-01: "#1f77b4"
  marker-02: "#d62728"
  marker-03: "#2ca02c"
  marker-04: "#9467bd"
  marker-05: "#ff7f0e"
  marker-06: "#17becf"
  marker-07: "#8c564b"
  marker-08: "#e377c2"
  marker-09: "#bcbd22"
  marker-10: "#4d4d4d"
  marker-11: "#0057e7"
  marker-12: "#d11141"
  marker-13: "#00a676"
  marker-14: "#f37735"
  marker-15: "#7b2cbf"
  marker-16: "#00b4d8"
  marker-17: "#6a994e"
  marker-18: "#c1121f"
  marker-19: "#f4a261"
  marker-20: "#264653"
  marker-21: "#ffbe0b"
  marker-22: "#3a86ff"
  marker-23: "#8338ec"
  marker-24: "#fb5607"
  marker-25: "#06d6a0"
  marker-26: "#7209b7"
  marker-27: "#118ab2"
  marker-28: "#ef476f"
  marker-29: "#073b4c"
  marker-30: "#9b2226"
  marker-31: "#ee9b00"
  checkbox-accent: "#333"
  tool-active-text: "#222"
  text-action: "#434341"
  manual-summary: "#55544f"
  result-heading-text: "#62615d"
  result-line: "#ededeb"
  choice-line: "#b3b2ae"
typography:
  body:
    fontFamily: "Arial, Helvetica, sans-serif"
    fontSize: "12px"
    fontWeight: 400
  title:
    fontFamily: "Arial, Helvetica, sans-serif"
    fontSize: "12px"
    fontWeight: 600
  label:
    fontFamily: "Arial, Helvetica, sans-serif"
    fontSize: "11px"
    fontWeight: 600
  chip:
    fontFamily: "Arial, Helvetica, sans-serif"
    fontSize: "11.5px"
    fontWeight: 400
    lineHeight: 1.4
  table:
    fontFamily: "Arial, Helvetica, sans-serif"
    fontSize: "11px"
    fontWeight: 400
  hint:
    fontFamily: "Arial, Helvetica, sans-serif"
    fontSize: "10.5px"
    fontWeight: 400
    lineHeight: 1.5
  count:
    fontFamily: "Arial, Helvetica, sans-serif"
    fontSize: "10px"
    fontWeight: 400
  plot-tick:
    fontFamily: "Arial, Helvetica, sans-serif"
    fontSize: "12px"
    fontWeight: 400
  plot-subtitle:
    fontFamily: "Arial, Helvetica, sans-serif"
    fontSize: "14px"
    fontWeight: 400
  plot-label:
    fontFamily: "Arial, Helvetica, sans-serif"
    fontSize: "11px"
    fontWeight: 400
  plot-point:
    fontFamily: "Arial, Helvetica, sans-serif"
    fontSize: "9px"
    fontWeight: 400
rounded:
  control: "3px"
  legend: "2px"
spacing:
  panel-x: "10px"
  chip-gap: "4px"
  toolbar-gap: "2px"
  control-x: "8px"
  control-y: "4px"
components:
  button:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.text}"
    typography: "{typography.body}"
    rounded: "{rounded.control}"
    padding: "4px 8px"
    height: "27px"
  tool:
    textColor: "{colors.text}"
    rounded: "{rounded.control}"
    width: "26px"
    height: "26px"
  tool-active:
    backgroundColor: "{colors.active}"
  population-chip:
    backgroundColor: "{colors.population-surface}"
    textColor: "{colors.primary}"
    typography: "{typography.chip}"
    rounded: "{rounded.control}"
    padding: "2px 4px 2px 5px"
  individual-chip:
    backgroundColor: "{colors.individual-surface}"
    textColor: "{colors.individual-text}"
    rounded: "{rounded.control}"
  field:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.text}"
    rounded: "{rounded.control}"
    padding: "5px 7px"
  rail:
    backgroundColor: "{colors.rail}"
    width: "32px"
  legend:
    backgroundColor: "{colors.toolbar}"
    rounded: "{rounded.legend}"
    width: "215px"
---

# Design System: G25 tools

## Overview

**Creative North Star: "The compact academic G25 workspace"**

The approved visual world follows the user's PCA_views, ArchaeoBase and G25 Manager applications. Dense neutral panels support one continuous white graph; familiar direct controls keep attention on samples and geometry. Admix_IRE supplies population search and blue/purple selection language.

PCA_views governs Arial typography, outlined markers, solid categorical colors, Lucide tools and the compact legend. G25 Views remains an interaction reference for legend gestures and analysis cycles. This document supersedes the former replica identity.

**Key Characteristics:**

- One compact tool/identity strip with right-aligned brand.
- Collapsible, resizable left panels beside an uninterrupted chart.
- Neutral chrome, explicit metadata scope and categorical plot color.
- Local data, readable ticks, dense tables and immediate plot controls.

Authority: PRODUCT.md, .impeccable/surfaces/pca.md and the SHIP verdict in .impeccable/review/workspace/final-review.md. Tokens and excerpts derive from src/styles.css, src/App.tsx, DatabasePanel, AdvancedSearch, PlotToolbar, PanelIcon, PcaChart, PcaLegend, PlotlyCredit, src/domain/markers.ts and figure.ts. No raster assets ship.

## Colors

### Primary

Population blue identifies selected populations using pale fill and a thin matching border. Brighter blue and a pale halo identify focused search. These selection accents are independent of plot group identity.

### Secondary

Individual purple identifies selected genetic IDs. Keep its text, pale surface and border together to preserve the population/individual distinction.

### Tertiary

The 31 numbered marker tokens preserve PCA_views' ordered solid palette. Thirteen silhouettes and darker outlines reinforce categorical separation. The KD-tree nearest-centroid heuristic favors different nearby appearances; it does not guarantee unlimited unique color/shape combinations. Golden-angle fallback colors apply beyond the base palette. Outlines multiply RGB channels by 0.58 with a 0.8 px stroke; default opacity is 0.9.

### Neutral

White holds the graph and picker; warm near-whites separate Advanced search and headers. Fine neutral rules establish panel scope. Charcoal grounds the navigation rail. Mid-gray numeric ticks remain readable over light grids. Error feedback uses a pale red surface with muted red text and border.

**The Data Color Rule.** Reserve marker colors for plot identity; use blue and purple selection colors for population and individual scope.

## Typography

All UI and graph text uses Arial, Helvetica, sans-serif. This explicit user-pinned PCA_views font choice is intentional. There is no display font or decorative heading hierarchy.

Body controls and numeric graph ticks use 12 px regular type; panel headings use 12 px at weight 600. Search labels use 11 px at weight 600. Table cells and legend names use 11 px regular. Chips use 11.5 px with 1.4 line height; hints use 10.5 px with 1.5 line height. Counts use 10 px tabular numerals; legend counts use 9 px. Optional plot subtitles use 14 px; group labels use 11 or 9 px and point labels use 9 px.

**The Working Type Rule.** Preserve compact Arial controls and readable numeric ticks; use weight and placement for hierarchy.

## Layout

The desktop flex shell fills 100dvh with a minimum body width of 1100 px. Reviewed widths are 1280, 1440 and 1600 px. A single top strip measures 37 px including its border; tools span the available width and the brand sits at the right. The first action is the right-panel legend glyph; the second is the left-data-panel glyph. Most SVG tools are 16 px; zoom symbols are 17 px. The dark navigation rail is 32 px wide with 35 px tall buttons.

The default left picker is 380 px wide plus a 5 px pointer/keyboard separator. Advanced search opens to the picker's left: compact total width is 720 px with the picker fixed at 300 px. Table mode widens the advanced portion. Maximum panel width is window width minus 392 px, retaining about 355 px of chart beside the separator. Collapsing data restores the full remaining graph; restoration retains selection and criteria.

Panel headings are 36 px tall with 10 px horizontal insets. The wrapping chip field ranges from 72 to 210 px tall. Its anchored full-width suggestion menu scrolls independently. Manual paste follows directly below search. Advanced criteria scroll within at most 42% of their column. The metadata table fills the remainder with sticky headers and virtualized 28 px rows.

Plot margins are left 46, right 18, top 20 (42 with subtitle), bottom 26 px. Light grids and numeric ticks remain; PC axis titles, zero lines and axis/frame lines are absent. The legend docks top-right, 14 px from the right and 12 px from the top, at 215 px wide and at most 36% of the chart. Maximum height is chart height minus 62 px. The official bundled Plotly mark is a 16 px SVG in a 20 px link, 6 px from the right and 5 px from the bottom.

## Elevation & Depth

The workspace is flat: borders, tone and adjacency communicate structure. The anchored search menu alone uses a restrained shadow (0 5px 16px rgba(0, 0, 0, 0.1)); the focused chip field uses a 2 px pale-blue halo. Keyboard focus uses a 2 px gray outline with 1 px offset. Buttons change surface immediately; no decorative animation or card layering is established.

## Shapes

Controls, chip fields and chips use 3 px corners. Legend and selection checks use 2 px corners. Icons are compact line drawings, with filled panel segments distinguishing data and legend toggles. Marks use the 13 PCA_views silhouettes; default marker size is 7 px with a 7 → 5 → 9 px cycle. The plot stays white and unframed.

## Components

- **Direct toolbar:** neutral icon buttons with gray pressed state. Panel glyphs lead; pan, zoom, selection, fit, labels, hulls, regression and appearance cycles follow. Labels, hulls and regression start off. Component selectors, grouping and PNG export remain direct controls. Tooltips and accessible names identify actions.
- **Navigation rail:** charcoal and icon-only; the active icon is white on a lighter charcoal block. Planned distances/models remain disabled.
- **Picker and chips:** wrapping blue populations/purple individuals, separate edit/remove actions and anchored suggestions. Exact genetic IDs have priority, then exact/prefix/token/compact/fuzzy ranking. Arrow keys navigate, Enter selects and Escape returns to search. Group expansion and selection are separate actions. Selection automatically refits.
- **Manual entry:** nearby Paste coordinates disclosure with textarea, independent scaling, Add coordinates and Ctrl/⌘ + Enter. Inline errors retain the last valid data and chart.
- **Advanced search:** AND criteria expose operators, values, explicit missing inclusion/counts and complete match counts. Add all matches targets the complete result set and deduplicates. Criteria scope browsing without removing plotted samples. Property selection keeps native semantics under a transparent select, with a visible React label and Lucide chevron. Controls are keyed by view identity for stable paint. Reopening preserves criteria; new IDs use maximum current ID plus one.
- **Metadata table:** sticky warm-neutral header, 28 px virtualized rows, clipped cells and pale selection/hover surfaces. The picker remains on the right when expanded.
- **Legend:** thin-border PCA_views panel with shared swatches, counts, explicit eyes and truncated names with full tooltips. Single click toggles visibility; double click isolates/restores. Neither gesture refits the cohort. Export respects legend state.
- **Chart and credit:** local Plotly SVG scatter with direct controls and a separate official bottom-right logo link. Hidden populations preserve fitted coordinates. The native modebar is disabled. Labels, hulls, regression and point labels remain optional toggles/cycles.

The sidecar contains five source-derived, self-contained HTML/CSS snippets for panel tools, coordinate entry/action, population/individual chips, navigation rail and legend. Preview classes are scoped, SVGs inline, and hover/focus states included.

## Do's and Don'ts

- Do preserve the compact strip, collapsible left data area and continuous chart.
- Do preserve population/individual selection colors and matching plot/legend marks.
- Do keep metadata browsing separate from plotted cohort and visibility state.
- Do keep keyboard focus, readable numeric ticks and source counts explicit.
- Don't restore Bootstrap styling, source SVG toolbar icons, a separate input strip or the prior right-panel composition.
- Don't add Run PCA, Settings/gear menus, a duplicate native modebar, PC axis titles or frame lines.
- Don't add mobile layouts, decorative imagery or optional capabilities without user direction.
