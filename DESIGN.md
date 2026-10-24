---
name: G25 tools
description: Source-faithful G25 Views Custom PCA for desktop.
colors:
  primary: "#007bff"
  selection: "#cce5ff"
  selection-text: "#004085"
  rail: "#24272b"
  rail-current: "#3a4048"
  rail-icon: "#c8d0db"
  rail-disabled: "#929dac"
  surface: "#fff"
  text: "#212529"
  field-text: "#495057"
  secondary: "#6c757d"
  field-line: "#ced4da"
  field-focus: "#80bdff"
  disabled-surface: "#e9ecef"
  control-line: "#adb5bd"
  select-arrow: "#343a40"
  menu-hover-text: "#16181b"
  menu-line: "rgba(0, 0, 0, 0.15)"
  scrollbar: "#aab2bc"
  error: "#842029"
  error-surface: "#fff5f5"
  error-line: "#f1c2c7"
  invalid: "#dc3545"
  plot-text: "#444"
  plot-tick: "#ddd"
  plot-grid: "rgb(238, 238, 238)"
  modebar-icon: "rgba(68, 68, 68, 0.3)"
  modebar-surface: "rgba(255, 255, 255, 0.5)"
  label-shadow: "rgba(0, 0, 0, 0.2)"
  label-surface: "rgba(255,255,255,0.75)"
  label-static-surface: "rgba(255,255,255,0.66)"
  label-transparent: "rgba(255,255,255,0)"
  label-border: "rgba(255,255,255,1)"
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
  g25-marker-01: "#166f4e"
  g25-marker-02: "#da0017"
  g25-marker-03: "#5619a4"
  g25-marker-04: "#de0077"
  g25-marker-05: "#569918"
  g25-marker-06: "#9824d9"
  g25-marker-07: "#6f6317"
  g25-marker-08: "#535353"
  g25-marker-09: "#2b57a0"
  g25-marker-10: "#bb5805"
  g25-marker-11: "#7e0061"
typography:
  body:
    fontFamily: "-apple-system, BlinkMacSystemFont, \"Segoe UI\", Roboto, \"Helvetica Neue\", Arial, \"Noto Sans\", \"Liberation Sans\", sans-serif, \"Apple Color Emoji\", \"Segoe UI Emoji\", \"Segoe UI Symbol\", \"Noto Color Emoji\""
    fontSize: "1rem"
    fontWeight: 400
    lineHeight: 1.5
  control:
    fontFamily: "-apple-system, BlinkMacSystemFont, \"Segoe UI\", Roboto, \"Helvetica Neue\", Arial, \"Noto Sans\", \"Liberation Sans\", sans-serif, \"Apple Color Emoji\", \"Segoe UI Emoji\", \"Segoe UI Symbol\", \"Noto Color Emoji\""
    fontSize: "0.875rem"
    fontWeight: 400
    lineHeight: 1.5
  marker-choice:
    fontFamily: "-apple-system, BlinkMacSystemFont, \"Segoe UI\", Roboto, \"Helvetica Neue\", Arial, \"Noto Sans\", \"Liberation Sans\", sans-serif, \"Apple Color Emoji\", \"Segoe UI Emoji\", \"Segoe UI Symbol\", \"Noto Color Emoji\""
    fontSize: "0.8rem"
    fontWeight: 400
    lineHeight: 1.5
  axis-label:
    fontFamily: "-apple-system, BlinkMacSystemFont, \"Segoe UI\", Roboto, \"Helvetica Neue\", Arial, \"Noto Sans\", \"Liberation Sans\", sans-serif, \"Apple Color Emoji\", \"Segoe UI Emoji\", \"Segoe UI Symbol\", \"Noto Color Emoji\""
    fontSize: "11px"
    fontWeight: 400
    lineHeight: 1.5
  axis-select:
    fontFamily: "-apple-system, BlinkMacSystemFont, \"Segoe UI\", Roboto, \"Helvetica Neue\", Arial, \"Noto Sans\", \"Liberation Sans\", sans-serif, \"Apple Color Emoji\", \"Segoe UI Emoji\", \"Segoe UI Symbol\", \"Noto Color Emoji\""
    fontSize: "12px"
    fontWeight: 400
    lineHeight: 1.5
  plot-title:
    fontFamily: "\"Open Sans\", verdana, arial, sans-serif"
    fontSize: "17px"
    fontWeight: 400
  plot-subtitle:
    fontFamily: "\"Open Sans\", verdana, arial, sans-serif"
    fontSize: "15px"
    fontWeight: 400
  plot-label:
    fontFamily: "\"Open Sans\", verdana, arial, sans-serif"
    fontSize: "11px"
    fontWeight: 400
  plot-point:
    fontFamily: "\"Open Sans\", verdana, arial, sans-serif"
    fontSize: "9px"
    fontWeight: 400
  clear:
    fontFamily: "-apple-system, BlinkMacSystemFont, \"Segoe UI\", Roboto, \"Helvetica Neue\", Arial, \"Noto Sans\", \"Liberation Sans\", sans-serif, \"Apple Color Emoji\", \"Segoe UI Emoji\", \"Segoe UI Symbol\", \"Noto Color Emoji\""
    fontSize: "1.5rem"
    fontWeight: 700
    lineHeight: 1
rounded:
  square: "0"
  control: "0.2rem"
  menu: "0.25rem"
spacing:
  strip-padding: "0.5rem"
  control-y: "0.25rem"
  control-x: "0.5rem"
  menu-item-x: "1.5rem"
  axis-gap: "6px"
  axis-label-gap: "3px"
  marker-gap: "4px"
components:
  button-outline-primary:
    backgroundColor: "transparent"
    textColor: "{colors.primary}"
    typography: "{typography.control}"
    rounded: "{rounded.control}"
    padding: "0.25rem 0.5rem"
    height: "31px"
  button-outline-primary-hover:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.surface}"
  menu-trigger:
    backgroundColor: "transparent"
    textColor: "{colors.secondary}"
    typography: "{typography.control}"
    rounded: "{rounded.square}"
    height: "31px"
    padding: "0.25rem 0.5rem"
  menu-trigger-open:
    backgroundColor: "{colors.secondary}"
    textColor: "{colors.surface}"
  coordinate-input:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.field-text}"
    typography: "{typography.control}"
    height: "31px"
    padding: "0.25rem 1.5rem 0.25rem 0.5rem"
  rail:
    backgroundColor: "{colors.rail}"
    width: "32px"
  axis-select:
    textColor: "{colors.field-text}"
    typography: "{typography.axis-select}"
    width: "68px"
    height: "29px"
  input-error:
    backgroundColor: "{colors.error-surface}"
    textColor: "{colors.error}"
    typography: "{typography.axis-select}"
    padding: "4px 8px"
---

# Design System: G25 tools

## Overview

**Creative North Star: "G25 Views' Custom PCA workspace"**

G25 tools follows the user-pinned G25 Views Custom PCA interface: source-sized Bootstrap controls above one white, viewport-filling Plotly chart. This approved replacement preserves the reference's density, SVG hover tools and native chart behavior.

The only visual additions are the thin charcoal icon rail, compact component selectors and PCA_views' outlined marks, with the original marker appearance retained. Data supplies the color; interface structure stays restrained.

**Key Characteristics:**
- 32 px icon-only rail; 47 px input strip; 31 px controls.
- Native hover modebar with original G25 Custom SVG icons.
- White chart, faint ticks, light grid and source margins.
- Bootstrap system typography for controls; native Plotly typography for the graph.

This refresh records the explicitly authorized source-led replacement. Authority: PRODUCT.md, .impeccable/surfaces/pca.md, docs/G25_PARITY.md and the SHIP verdict in .impeccable/review/parity/finish-review.md. Implementation sources: src/main.tsx, src/styles.css, src/App.tsx, src/components/PcaChart.tsx, src/domain/figure.ts and src/domain/markers.ts. No shipping raster assets.

## Colors

Bootstrap 4.6.1 owns blue actions, gray form controls and white surfaces. Frontmatter preserves every literal color in src/styles.css, relevant Bootstrap states and the graph's actual defaults. Plotly grid is its computed rgb(238, 238, 238); tick labels deliberately retain #ddd. The rail uses the live --rail and --rail-current properties.

The numbered marker tokens preserve source array order: 31 PCA_views colors and 11 original G25 colors. They are categorical identities, not UI accents. Beyond 31 outlined groups, markers.ts generates a golden-angle hue color. Outlines multiply each RGB channel by 0.58 and use a 0.8 px stroke. Figure rendering sets opacity 0.8 and sizes 10/11 px minus 3/6 px for the medium/small cycles, overriding the marker helper's standalone size/opacity defaults. Original G25 appearance cycles numeric symbols 0/13/14/15; outlined appearance cycles 13 source symbols.

Hull fills append hexadecimal alpha 30 to the group color, boundaries append 45; opacity cycles 0.9/0.6/0.3. Two-point hull lines use width 2 and opacity 0.2. Regression uses width 2, dotted lines and opacity 0.5. Movable group labels use the documented translucent white, white border and group-colored arrows with alpha aa.

**The Data Color Rule.** Use marker palettes for group identity; keep interface chrome in Bootstrap blue and neutral gray.

## Typography

The UI inherits Bootstrap's full system stack in frontmatter, with a 1rem body and 1.5 line height. Buttons, input, menus and addition switches use 0.875rem (14 px at the default root). Marker choice uses 0.8rem (12.8 px). Axis labels are 11 px and their selects are 12 px; error copy is 12 px / 1.5. The inline clear glyph inherits Bootstrap's 1.5rem, weight 700, line height 1.

Plotly separately supplies its native "Open Sans", verdana, arial, sans-serif stack: 12 px graph text, explicit 17 px title, optional 15 px subtitle, 11 px movable group labels and 9 px static/point labels. The interface has no display heading or monospace coordinate-input treatment.

## Layout

A flex shell fills 100dvh; body minimum width is 1040 px and overflow is hidden. Supported reviewed widths are 1280, 1440 and 1600 px, with no mobile breakpoint. The rail is 32 px wide with 5 px top padding and 32×36 px icon buttons; icons are 18 px. Future distances/models are disabled and identified by accessible names/tooltips, without visible text.

The single source input row has 8 px padding and 31 px controls, totaling 47 px. The coordinate input grows and keeps a 10em minimum; the optional custom-name input is 10em without growth. X/Y selects are 68×29 px, inside a 6 px-padded group with 6 px gaps and 3 px label gaps. The chart fills all remaining space. Its explicit margins are left 50, right 20, top 52, bottom 18 px; native legend placement may expand internal margins.

Dropdowns anchor to the strip. Addition options align right, have 265 px minimum width and remain a compact menu. Other menus scroll within calc(100dvh - 58px). Error feedback overlays at top 47 px / left 8 px so it does not resize the plot. The native modebar sits right 1rem with translate(0, -0.8rem), appears on graph hover and remains visible with keyboard focus.

**The Source Fidelity Rule.** Preserve the pinned Custom PCA composition, control sizing and native hover toolbar.

## Elevation & Depth

Flat surfaces use borders, source colors and native plot geometry. There are no card shadows or modal layers. Dropdown borders use Bootstrap's translucent black; input/button focus uses Bootstrap blue shadows plus the explicit 2 px keyboard outline with 1 px offset. Rail focus moves the offset inward to -2 px. Plot annotations retain text-shadow: 1px 1px rgba(0, 0, 0, 0.2). Exact focus/shadow and 150 ms Bootstrap transition values live in the sidecar; reduced-motion behavior follows the imported Bootstrap stylesheet.

## Shapes

Small controls use Bootstrap's 0.2rem corners; dropdown surfaces use 0.25rem. Joined input-group edges are square; menu summaries explicitly have radius 0. Plotly markers, hulls and dotted regression lines carry data geometry. The interface does not use decorative cards or pills.

## Components

- **Outline actions:** Reset plot and Run PCA use btn-outline-primary; hover/active fills blue with white text, and disabled/busy states follow Bootstrap.
- **Coordinate field:** one visible single-line system-font input; multiline paste normalizes into space-separated rows. The inline × clears entry. Invalid state uses Bootstrap's red border and error feedback while retaining the valid plot.
- **Dropdowns:** native details/summary plus Bootstrap styling. Save retains all 18 source export sizes; Scaled/Raw, grouping and gear options remain in the same strip. Escape/outside click close menus; keyboard focus is visible.
- **Rail:** source Lucide SVG paths at 18 px, active gray background, white active icon and muted disabled icons. It stays icon-only.
- **Component selectors:** compact X/Y controls; unavailable/duplicate components are disabled and the tooltip reports explained variance.
- **Chart:** native Plotly camera/zoom/pan/selection/fit/reset plus ten applicable original G25 SVG actions. Point-label, marker-size, label-style and hull-opacity cycles remain source-defined; annotations are movable. Wheel zoom anchors to the cursor. No imitation static toolbar substitutes for the native modebar.

The sidecar contains five self-contained HTML/CSS excerpts of the actual action, input, dropdown, rail and X/Y controls. Classes are scoped only for preview; Bootstrap declarations are included so no external runtime or CSS bundle is needed.

## Do's and Don'ts

- Do retain the 32 px rail, 47 px strip and viewport-filling chart at supported desktop widths.
- Do preserve the original SVG tools, compact dropdowns and native chart interactions.
- Do keep individual points, outlined group marks and the selectable original G25 appearance.
- Do keep the last valid plot visible when coordinate validation fails.

- Don't reintroduce the rejected dashboard shell, separate coordinate panel, permanent plot toolbar or footer.
- Don't add settings dialogs, regional PCA features or mobile layouts to this approved surface.
- Don't replace Bootstrap system typography or source-pinned faint ticks with the previous design tokens.
