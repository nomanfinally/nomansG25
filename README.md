# G25 tools

A desktop G25 analysis workspace with Custom PCA, local TSV databases and a population picker. Its controls and legend follow PCA_views, expandable panels follow ArchaeoBase/G25 Manager, and search follows Admix_IRE.

## Run

Node.js 22.12+:

```sh
npm ci
npm run dev
```

Open the Vite URL. Desktop widths of 1280 px and above are supported. No backend, account, API key, analytics or runtime CDN is required. Data remains in browser memory and must be loaded again after a refresh.

## Select source samples

Load a TSV in the left Populations panel. Select Scaled or Raw for that source before loading. Archaeobase's `Group ID`, `Genetic ID` and `G25_coords` columns are supported directly, including a name embedded in the coordinate cell. A TSV with `group_id`, `genetic_id` and `PC1`–`PC25` also works. Other metadata is retained for Advanced search and table viewing. Missing coordinate rows are skipped/count-reported; populated invalid rows or duplicate genetic IDs reject the import atomically.

The search box uses Admix_IRE's prepared-field ranking: exact, prefix, word, reordered terms, compact text and fuzzy subsequences, with accent/separator normalization. Matching individuals can promote their parent population in suggestions. Exact genetic-ID Enter always chooses that individual. Click a population to select its members as a removable chip, or expand it to toggle individual members. Blue chips are populations; purple chips are individual samples. Click a chip label to search it. Arrow keys navigate, Escape clears the query, and Backspace in an empty field removes the last chip.

**Paste coordinates** is immediately below the picker. Paste named G25 rows, choose their own scaling and use Add coordinates or Ctrl/⌘ + Enter. This commits validated rows; no separate Run PCA button is needed. Manual raw and database scaled sources can coexist. The fit updates automatically when selections change. At least three samples varying in two independent directions are required.

## Advanced search and table

Advanced search opens to the left of the population picker, with both parts visible. Add metadata criteria using contains, equals, at least or at most. All criteria must match. Missing values are excluded for an active criterion unless Include missing is checked; its count uses the current text-search scope. Invalid numeric bounds show an error and match no rows.

Expand table view to widen the advanced area, inspect metadata and select individual rows. The table renders a virtualized window, with horizontal scrolling for additional columns. **Add all matches** selects the complete matching set, including rows outside the rendered page. Selecting a population under criteria adds only matching members; overlap never double-counts samples. Changing criteria scopes browsing without removing the plotted cohort.

Drag the vertical divider or focus it and use Left/Right arrows to resize. Collapse the data area with its panel button and restore it from the rail. The chart fills the remaining viewport.

## Explore the plot

One compact 37 px strip combines the app header and plot tools. Panel-style icons toggle the left data area and right legend; the remaining tools use Lucide icons. Its first action shows/hides the legend. Pan, box zoom, box/lasso selection, zoom buttons, fit and reset remain available; wheel zoom anchors at the pointer. Labels, hulls and regression toggle immediately through icons. Size cycles 7 → 5 → 9 px; point labels and group-label styles retain their cycles. X/Y selectors choose fitted components; the chart itself has no PC axis titles or border lines and blends into the surrounding white workspace; grouping controls switch populations, individuals or one combined group. No settings dialog or creation-options menu.

Default markers use PCA_views' solid palette and outlined silhouettes. A deterministic KD-tree nearest-neighbor heuristic selects color/shape combinations to increase visual separation around group centroids in the active component pair. The chart and legend share the assignment. Different local groups are encouraged to differ in both color and silhouette; unlimited groups cannot all have unique styles. Default text is 12 px Arial/Helvetica and points are 7 px.

The PCA_views-style legend supports G25 Views gestures: click toggles visibility; double-click isolates/restores the other groups. Each row also has an explicit eye toggle. Hidden groups and their geometry stay hidden together; hiding never removes source samples or changes the PCA fit. Legend show/hide keeps the chart frame/ranges stable.

The camera menu retains 18 PNG sizes through 7680×4320. Export reproduces the visible marker/geometry/legend state with a native export legend. Subtitle, label styles, hull opacity and draggable group annotations remain available. The Plotly mark sits discreetly at the chart’s bottom-right corner, outside the toolbar.

## Numerical scope

Custom PCA only; regional references, distances and models are not implemented. The latter two remain planned rail entries. No .evec, mobile layout, metadata editing, online database or persistence system.

Raw G25 normalization uses the established G25 eigenvalues. Original/source vectors, normalized 25D vectors and derived PCA scores stay separate. The unchanged ML.js SVD engine centers without column standardization, keeps full precision and fixes arbitrary axis signs deterministically. Two-point hulls are lines; constant-X groups do not invent regression fits. Geometry is descriptive.

## Verify/build

```sh
npm test
npm run test:e2e
npm run build
```

Browser tests use system Chrome when present, otherwise Playwright Chromium (`npx playwright install chromium`). Set `PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH` to override. See [validation](docs/VALIDATION.md).

Vite emits relative static assets in `dist/`. Existing GitHub Actions workflows support Pages deployment from main. Reference clones, private datasets, captures and generated outputs are excluded from the repository/build.
