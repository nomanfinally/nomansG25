---
name: G25 tools
description: A compact desktop workspace for inspecting G25 Custom PCA.
colors:
  primary: "#1764ac"
  primary-hover: "#edf5fc"
  active: "#e7f1fa"
  rail: "#24272b"
  rail-active: "#3a4048"
  surface: "#ffffff"
  text: "#30363d"
  muted: "#59636e"
  line: "#d7dce1"
  error: "#a32222"
  hover: "#f2f5f7"
  disabled-text: "#747c85"
  disabled-surface: "#fafbfc"
  rail-text: "#e2e7ee"
  rail-disabled: "#b4bdc9"
  rail-planned: "#adb7c5"
  icon: "#505b66"
  active-icon: "#155b9b"
  active-line: "#c4d9ed"
  field-surface: "#fcfdfe"
  field-line: "#b9c2cc"
  plot-grid: "#eceeef"
  plot-frame: "#6b7075"
  plot-tick: "#555d66"
typography:
  body:
    fontFamily: "Arial, Helvetica, sans-serif"
    fontSize: "12px"
    fontWeight: 400
  headline:
    fontFamily: "Arial, Helvetica, sans-serif"
    fontSize: "18px"
    fontWeight: 500
  panel-title:
    fontFamily: "Arial, Helvetica, sans-serif"
    fontSize: "13px"
    fontWeight: 600
  label:
    fontFamily: "Arial, Helvetica, sans-serif"
    fontSize: "10px"
    fontWeight: 400
  hint:
    fontFamily: "Arial, Helvetica, sans-serif"
    fontSize: "11px"
    fontWeight: 400
    lineHeight: 1.6
  coordinate:
    fontFamily: "Consolas, \"Liberation Mono\", monospace"
    fontSize: "11px"
    fontWeight: 400
    lineHeight: 1.7
  brand:
    fontFamily: "Arial, Helvetica, sans-serif"
    fontSize: "18px"
    fontWeight: 600
    letterSpacing: "-0.4px"
rounded:
  control: "3px"
  panel: "4px"
spacing:
  px-5: "5px"
  px-6: "6px"
  px-7: "7px"
  px-9: "9px"
  px-10: "10px"
  px-12: "12px"
  px-14: "14px"
  px-16: "16px"
components:
  button-primary:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.primary}"
    typography: "{typography.body}"
    rounded: "{rounded.control}"
    padding: "0 10px"
    height: "30px"
  button-primary-hover:
    backgroundColor: "{colors.primary-hover}"
  button-secondary:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.text}"
    typography: "{typography.body}"
    rounded: "{rounded.control}"
    padding: "0 10px"
    height: "30px"
  button-disabled:
    backgroundColor: "{colors.disabled-surface}"
    textColor: "{colors.disabled-text}"
  button-icon:
    backgroundColor: "transparent"
    textColor: "{colors.icon}"
    rounded: "{rounded.control}"
    padding: "0"
    size: "30px"
  button-icon-active:
    backgroundColor: "{colors.active}"
    textColor: "{colors.active-icon}"
  data-trigger:
    backgroundColor: "{colors.surface}"
    rounded: "{rounded.control}"
    padding: "0 9px"
    height: "30px"
  select:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.text}"
    rounded: "{rounded.control}"
    padding: "0 7px"
    height: "30px"
  coordinate-input:
    backgroundColor: "{colors.field-surface}"
    textColor: "{colors.text}"
    typography: "{typography.coordinate}"
    rounded: "{rounded.control}"
    padding: "10px"
    height: "226px"
    width: "100%"
  coordinate-panel:
    backgroundColor: "{colors.surface}"
    rounded: "{rounded.panel}"
    padding: "13px 16px 14px"
    width: "660px"
  rail-current:
    backgroundColor: "{colors.rail-active}"
    textColor: "{colors.surface}"
    typography: "{typography.label}"
    padding: "12px 3px"
    width: "100%"
---
# Design System: G25 tools

## Overview

**Creative North Star: "G25 Views' single-chart workspace"**

G25 tools is a compact desktop analysis interface: one stable white chart, a charcoal tool rail and a narrow toolbar. Its visual authority is the user-pinned G25 Views composition with PCA_views' colored and outlined sample marks. The direction name records that existing commitment.

The chart carries the visual interest. Familiar Arial/Helvetica labels, blue-outline actions, subtle gray rules and small corners keep controls readable and subordinate to data. This is a code-first React, TypeScript, Vite and Plotly interface; no image composition is the design authority.

**Key Characteristics:**
- One dominant, stable white chart on desktop.
- Compact controls with visible pressed, disabled and keyboard-focus states.
- Individual sample marks with group color, shape and dark outline.
- Anchored coordinate entry with the last valid result retained on input errors.

## Colors

The primary accent is restrained action blue; charcoal navigation and white plotting ground establish the structure. Frontmatter values are normative, extracted from `src/styles.css` and `src/components/PcaChart.tsx`.

### Primary

- **Action Blue** (`primary`): Run PCA text and outline, focus outlines, active data trigger and caret.
- **Pale Blue Hover** (`primary-hover`): primary-action hover fill.
- **Pale Blue Selection** (`active`, `active-icon`, `active-line`): pressed toolbar fill, icon and border.

### Neutral

- **White Surface** (`surface`): toolbar, plot, empty state and entry panel.
- **Charcoal Rail** (`rail`, `rail-active`): suite navigation and current analysis.
- **Graphite Text**, **Muted Slate**, **Light Rule** (`text`, `muted`, `line`): interface text, supporting status and boundaries.
- **Rail Text** (`rail-text`, `rail-disabled`, `rail-planned`): navigation labels and planned tools.
- **Field Ground** (`field-surface`, `field-line`): coordinate input background and boundary.
- **Plot Grays** (`plot-grid`, `plot-frame`, `plot-tick`): grid, perimeter and tick labels.
- **Control Neutrals** (`hover`, `disabled-text`, `disabled-surface`, `icon`): control feedback and subdued glyphs.

**Error Red** (`error`) marks invalid-field borders and error copy. Group colors are data encodings: `src/domain/markers.ts` owns 31 ordered colors, deterministic fallback colors and 13 cycling shapes. Preserve that assignment logic. Sidecar tonal strips are generated panel metadata, not additional shipping colors.

**The Data First Rule.** Sample marks carry group identity. Keep grid, hull fills, regression and interface chrome visually subordinate to them.

## Typography

**Interface Font:** Arial, Helvetica, sans-serif. This familiar stack is intentional, inherited from the approved references and permitted by Impeccable's Operate guidance. **Coordinate Font:** Consolas, "Liberation Mono", monospace.

- **Body**: compact interface controls and Plotly defaults.
- **Headline**: restrained empty-chart title, without display typography.
- **Panel title**: coordinate-entry heading.
- **Label**: axis captions, rail labels and status; status numerals are tabular.
- **Hint**: entry instructions. Chart ticks and legend also use compact type, without the paragraph line-height rule.
- **Coordinate**: preserved whitespace and row leading in the textarea.
- **Brand**: compact G25 rail wordmark. The Planned qualifier is smaller (9px), not a general text role.

Role measurements are in frontmatter. Unspecified line heights retain browser or Plotly defaults. No external font dependency is used.

## Layout

The viewport-height shell (`100dvh`, minimum height 420px) has a left rail (76px), toolbar (46px) and status strip (26px). All remaining space belongs to the chart. The body has a minimum width (1100px) and hidden overflow. Desktop widths of 1280, 1440 and 1600 pixels establish the reviewed fit. No mobile breakpoint or layout is implemented.

The toolbar stays in one non-wrapping row with small gaps (5px), padding (7px 10px) and controls (30px high). Its data trigger flexes from a minimum width (200px) toward a preferred width (270px) and truncates long summaries. The status strip uses horizontal padding (16px).

Coordinate entry overlays the plot (660px wide), 10px to the right of the rail and 6px below the toolbar; it never resizes the chart. Its textarea starts at 226px high, has a minimum height (110px), a viewport-based maximum and vertical resizing. Plotly margins are fixed (left 74px, right 28px, top 32px, bottom 58px), with auto-expansion disabled. The legend sits inside the top-right plot area. The empty-state message sits near the chart center (43% from the top), without a card border or shadow.

**The Stable Chart Rule.** Keep the plotting frame and ranges unchanged for legend, label, hull and regression toggles. A new fit or component change can establish new ranges.

## Elevation & Depth

The rail, toolbar and chart are flat; color, fine rules and spacing separate them. Only the anchored coordinate panel has a shadow (`0 7px 22px rgba(28, 38, 49, 0.14)`). There is no general card-elevation system.

Keyboard focus uses a blue outline (2px), offset by 2px; rail focus uses a lighter blue inset outline. Button background and border transitions take 120ms with `ease-out`, only under `prefers-reduced-motion: no-preference`. No spatial or decorative motion is implemented.

## Shapes

Controls use small corners (`rounded.control`), with a slightly softer entry panel (`rounded.panel`). Rail items are square and full width. Controls and fields use fine single-pixel boundaries. Compact inline SVG icons follow a consistent outline style. There are no pills or decorative card silhouettes.

## Components

### Buttons

Run PCA is a white, blue-outlined primary action; Save PNG is neutral. Both share the compact height, padding and typography in frontmatter. Hover changes fill; focus adds the shared outline. Busy actions change text to Calculating… or Saving… and disable. Export errors appear in the status strip.

Icon tools have square targets (30px) and outlined SVGs (16px, stroke 1.65). Pressed toggles have pale-blue fill, visible border and stronger blue glyph; `aria-pressed` reports their state. Tooltips and accessible labels identify each action. Disabled icons have transparent backgrounds and subdued glyphs.

### Inputs / Fields

Scaling and components use native selects with shared focus treatment. Axis captions are small and muted; an axis cannot select the component already used by its partner.

The data trigger uses a document icon, truncating summary and chevron. Its expanded state has blue text and border. The coordinate editor uses a light field ground and monospace rows. Invalid input turns the boundary red and shows an associated alert. Opening focuses the textarea; Escape, outside pointer or close dismisses the panel and restores opener focus. Ctrl/Cmd+Enter runs PCA. The panel has no modal backdrop.

### Navigation

The charcoal rail shows current G25 PCA and disabled Distances and Models items. Icons, compact labels and Planned qualifiers stack vertically. The current item uses lighter charcoal and white text; disabled items retain the rail ground and muted labels. They do not navigate. No mobile variant exists.

### PCA chart and geometry

Individual SVG sample marks use size 7.5, opacity 0.9 and outline width 0.8. Outline RGB channels are the fill channels multiplied by 0.58. Shape assignment cycles through circle, square, triangles, diamond, cross, x, hexagon, pentagon, star and octagon; group assignment remains stable across view toggles.

The chart uses fine gridlines, a thin darker perimeter and outward ticks. Axis titles show the component and explained variance. Hover labels show sample names on white with a subtle border. The legend has a nearly opaque white ground and compact text; item clicking is disabled, while the toolbar toggles the whole legend.

Group labels use their darker group color on translucent white backing. Hulls sit beneath points with light fill (opacity 0.13) and a fine same-color border; two distinct points receive a subordinate line. Dotted same-color regression lines (width 1.5, opacity 0.75) also sit beneath points. Legend defaults on; labels, hulls and regression default off.

Pan is the default; wheel zoom anchors to the cursor. Toolbar zoom and reset remain direct controls. A successful new fit returns axes to PC1/PC2. Parse errors retain the last valid plot; pending edits receive status copy until Run PCA. Save PNG exports only the visible chart at twice its current pixel dimensions, including the current legend and geometry.

### Evidence and assets

The independent verdict in `.impeccable/review/finish-review.md` is Ship. Reviewed captures cover empty, populated, geometry, legend-hidden, input/error and supported desktop widths. The implementation handoff reports a passing build, 16 unit tests, four Playwright tests, independent NumPy comparison and a production smoke check of 180 points/six traces without runtime errors or external requests (`study/production-smoke.json`). PNG was verified at 2728 × 1656. This documentation pass did not repeat those checks; the finish review was screenshot-and-source based.

No raster asset ships. The favicon is geometric SVG, controls use SVG icons and plots are generated marks. Review screenshots are evidence, not interface imagery. Synthetic review groups are labeled; the app opens without data.

## Do's and Don'ts

### Do:

- Do preserve chart dimensions and ranges when toggling the legend or geometry.
- Do use both group colors and marker shapes with dark outlines.
- Do retain the last successful chart on input errors and associate error copy with the field.
- Do label disabled future tools Planned.
- Do keep Arial/Helvetica interface text and monospace coordinate input.

### Don't:

- Don't add settings dialogs, permanent control sidebars, mobile adaptations, regional presets or point editors to this approved surface.
- Don't average away individual sample points when drawing group geometry.
- Don't introduce filled primary actions, decorative cards, gradients, illustration or a hero into this chart workspace.
- Don't treat synthetic review fixtures as shipping data or imply a large-data performance guarantee.

Desktop only. Arbitrary long names, large group counts and very large datasets are outside the visual evidence; SVG marks have no large-data performance guarantee. Separately locked reference projection and future distance/model analyses are outside this initial Custom PCA implementation.
