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
- Better marker shapes and colors drawing from PCA_views.
- Group labels, convex hulls and regression are confirmed additions.
- One stable chart area, following the simplicity of G25 Views. Exact fixed-pixel versus viewport-filling dimensions have not been specified; the recommendation is one viewport-filling chart with no ratio switcher.
- Controls belong in a compact toolbar. No settings dialog.
- A vertical dark strip on the left is confirmed for navigation between G25 PCA, G25 distances and G25 models. The latter two analyses are future work.
- Desktop adaptation only for now.
- Ask about optional features before expanding scope. Avoid importing PCA_views' entire customization system.
- Compact X/Y component selectors and a simple PNG download are confirmed. No export settings dialog.
- Input entry uses a compact anchored multiline panel opened from the toolbar. The working interface name is G25 tools; a final product name is not settled.

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
