# Historical G25 Views parity reference

The original Custom PCA parity audit below describes the earlier source-replica phase. The user's subsequent design direction explicitly replaces that visual identity with PCA_views, ArchaeoBase/G25 Manager panels and Admix_IRE search. Current authority is PRODUCT.md and the PCA surface brief. Source SVG icons, Bootstrap CSS, the gear menu, Run PCA, original marker appearance and four-way source legend layout are no longer part of the UI. Useful plotting cycles, source normalization, component fitting, native interaction mathematics and PNG sizes remain; the custom legend retains G25 click/double-click semantics with explicit eye controls.


Reference: `vahaduo/g25views`, commit `64226115636b1cb9951e6749ab8fecf2d7bfcc1b`, root viewer. The user's latest scope is **Custom PCA only**. Regional PCA datasets, Celto-Germanic coordinates and controls for a regional base layer are excluded by that scope.

The original application was inspected live and its DOM metrics captured. The input strip is 47 px high, with Bootstrap 4.6.1's system font and 31 px controls. The replacement uses that stylesheet and form sizing directly. Plotly supplies its actual native modebar; the applicable G25 custom buttons reuse the reference SVG paths in `src/data/g25-icons.json`. The gear uses the reference paths in `g25-gear.json`.

| Original Custom PCA behavior | Implementation |
|---|---|
| Single-line coordinate field; multiple named rows; Enter runs | Moved to the requested right Data panel. Multiline manual coordinates use Add coordinates or Ctrl/⌘ + Enter; database chips automatically refit. The top strip now contains only plot controls. |
| Clear input | The manual textarea can be edited or cleared directly; chip × buttons remove selected populations/samples. |
| Scaled / Raw | Compact source-specific selectors in the Data panel; raw uses the original square-root-eigenvalue conversion. Database and manual input can have different scaling. |
| Aggregated | One trace per group prefix, sorted by group; every sample stays a separate point. |
| Individual | One trace per sample in input order, named by its full name. |
| As one group | One trace, optional custom name, defaulting to the first sample's group. |
| Main group / Aggregated subgroups | Labels, hulls and regression can decorate the whole single trace or its original subgroups. |
| Addition options | Original compact gear dropdown with group-label, hull and regression creation switches. All three default on. They apply on Run, as in the original. |
| Custom fit and rerun | Each Run fits the submitted vectors and replaces the Custom plot. It resets view cycles while retaining entry and addition options. |
| Reset plot | Clears plotted result, selection chips, manual catalogue, label offsets and view cycles. Keeps the loaded database, draft manual text, scaling and addition choices. |
| Native hover toolbar | Appears on chart hover, fades away outside the graph, and remains available on keyboard focus. No permanent plot toolbar or status footer. |
| Native plot tools | Camera, box zoom, pan, box/lasso selection, zoom in/out, autoscale and reset axes. The reset action explicitly restores the original fit range even after view-only redraws. |
| Legend interaction | Native click-to-hide and double-click isolation. A dedicated G25-icon show/hide button toggles the complete legend. |
| Marker-size cycle | Big → medium → small → big. Original sizes 10/11 px, subtracting 3/6 px; annotation heads also follow the size mode. |
| Projected point-label cycle | None → full name → group prefix → final ID → none. Nine-pixel point text, full names retained for hover. |
| Group label-style cycle | Movable callout (11 px, white 0.75 background, border and arrow) → static (9 px, transparent) → static with white 0.66 background → movable. |
| Label movement | Native annotation-tail dragging. Label positions survive view-tool changes and are retained per component pair until Reset/Run. |
| Group label visibility | Show/hide the existing labels; hidden traces' labels remain hidden. |
| Hull visibility | Show/hide existing hulls. Two-point groups get connecting lines. Degenerate points do not create a fake polygon. |
| Hull opacity cycle | High 0.9 → medium 0.6 → low 0.3 → high. Original translucent fill/boundary colors. Two-point lines retain their original 0.2 opacity. |
| Regression visibility | Show/hide existing dotted, two-pixel, 0.5-opacity regression lines. Constant-X groups have no invented regression. |
| Projected-group visibility | Hide all plotted traces; show them all again. Native individual hiding and decoration ownership stay consistent. |
| Subtitle | Original icon and native prompt. Accept adds an escaped subtitle; cancel removes it, matching the reference. |
| Save size menu | All original 18 sizes, including 1920×1080, 3840×2160 and 7680×4320, in original order. Direct PNG download, no export dialog. |
| Native camera | The standard Plotly camera remains in the hover toolbar. |
| Hash/title | The sole supported route is `#Custom`; invalid fragments normalize to it. The graph title uses the reference's Global 25 Custom PCA wording. |

The source's base-PCA-only visibility, hover, grayscale and base-label buttons have no base layer to act on in a Custom-only app. Its four-way legend cycle includes two redundant/empty base-layer states; the Custom viewer exposes meaningful show/hide instead. No nonfunctional regional controls are presented. Vahaduo-specific donation/gallery navigation and visitor tracking are not analysis features and are not transplanted into this project.

## Requested additions

- A **32 px dark icon-only rail**, reserving future distances/models without consuming chart width with text.
- Cursor-anchored mouse-wheel zoom, alongside the native zoom tools.
- PCA_views' colors, outlined marks and richer symbol sequence. The original G25 colors and four-symbol sequence remain selectable in the same compact gear menu.
- Compact Custom X/Y component selectors, with explained variance in their tooltips.
- Strict finite-coordinate validation and worker-based calculation; a rejected input retains the prior valid plot.

The chart fills the area below the source-sized input strip and beside the thin rail. The later database request adds one 380 px right Data panel and moves all coordinate entry there. There are no chart-ratio variants, mobile layouts, settings dialogs or permanent plotting toolbars. Native legend placement can change the graph's internal margins, as in G25 Views; the outer chart size and current data ranges remain stable.

PCA mathematics remain full-precision, centered and unstandardized. Like any PCA, component signs are arbitrary; the implementation keeps its established deterministic sign convention. This redesign does not change the validated numeric engine.

## Subsequent database extension

The user requested local TSV loading, Admix_IRE-style selection chips, expandable group members, genetic-ID search and automatic refitting. This intentionally changes the original one-line input workflow. `Group ID`, `Genetic ID` and `G25_coords` are read from the supplied Archaeobase layout; absent coordinates are skipped and counted. Original metadata is not added to the UI. Selection maintains per-population exclusions and deduplicates overlapping choices. Failed imports/manual additions preserve prior data; selections that cannot form a 2D PCA clear the chart with feedback. No server, persisted database or bundled private dataset is introduced.
