# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Stack

Confirmed: a fresh React + TypeScript + Vite application, using Plotly and selectively adapting useful utilities from PCA_views.

## Users

The user and desktop users exploring named Global25 coordinate datasets.

## Product Purpose

A focused G25 analysis tool with Custom PCA implemented first. The product is broader than PCA: G25 distances and G25 models are intended future tools.

## Operating Context

Desktop browser use. G25 coordinates only; no `.evec` import. Both scaled and raw G25 input are confirmed. Reference implementations are `vahaduo/g25views` (local study checkout `g25views/`) and the user's `/home/user/genomics/04_projects/PCA_views`.

## Capabilities and Constraints

- Initial analysis: Custom PCA only. Regional PCA presets are outside the initial scope.
- Mouse-wheel zoom in/out and zoom controls.
- Show/hide legend.
- G25 Views' Custom PCA interface is the exact design and interaction reference. The user rejected the first interpretation and requested the original's sizing, icons, hover toolbar and feature cycles.
- Native Plotly hover modebar with its stock tools and the original G25 Views Custom PCA SVG icons. No permanent plot toolbar or status footer.
- All Custom PCA grouping modes: Aggregated, Individual, As one group; custom group naming; main-group/subgroup decorations; creation checkboxes for labels/hulls/regression.
- Point labels cycle off/full/group/ID; marker sizes cycle big/medium/small; group labels cycle movable/static/static with background; hull opacity cycles 0.9/0.6/0.3. Include projected-group visibility, geometry visibility, native legend interactions, subtitle and the original 18 PNG size choices.
- Improved outlined markers and shapes from PCA_views, with the original G25 Views marker treatment also available in the compact addition-options dropdown.
- One viewport-filling chart, no ratio switcher, no settings dialog. Top input strip matches the original 47 px height.
- A 32 px dark icon-only left rail reserves navigation for G25 PCA, G25 distances and G25 models. The latter two analyses remain future work.
- Desktop adaptation only for now.
- Ask about optional features before expanding scope. Avoid importing PCA_views' entire customization system.
- Compact X/Y component selectors remain. PNG export uses G25 Views' Save dropdown and native camera tool, without an export settings dialog.
- Input entry is the original-style single-line coordinate field, accepting multiline clipboard paste and space-separated rows. No separate data-entry panel. The working interface name is G25 tools; a final product name is not settled.

## Brand Commitments

The user prefers G25 Views' minimal toolbar/interface and PCA_views' marker appearance. This is a G25 analysis suite rather than a product named or scoped only around PCA.

## Evidence on Hand

- `G25VIEWS_STUDY.md`: complete study of the upstream reference at commit `6422611`.
- `PCA_VIEWS_STUDY.md`: local project study and proposed reuse boundaries.
- `study/pca-views/workspace.png` and `settings.png`: screenshots of the user's existing app with its explicitly synthetic built-in example, captured at 1440×900.
- `study/pca-views/function-inventory.json`: function locations in the existing app's production `src` files, excluding tests and declaration files.
- No user-selected G25 example dataset has been supplied for the new app. Synthetic coordinates used for development must be labeled as synthetic.

## Product Principles

- Give the chart most of the desktop workspace.
- Expose the small agreed set of actions directly.
- Keep original G25 coordinates distinct from derived PCA scores so later analyses can use the original data.
- Carry over useful implementation details selectively.
- Keep optional feature decisions explicit.
