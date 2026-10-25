# G25 tools

A desktop G25 Custom PCA viewer built around [G25 Views](https://github.com/vahaduo/g25views)' original interface and interaction model, with outlined markers from [PCA_views](https://github.com/nomanfinally/PCA_views), wheel zoom, a thin tool-navigation rail and a searchable local TSV database.

## Run

Requires Node.js 22.12 or newer.

```sh
npm ci
npm run dev
```

Open the URL printed by Vite. The supported desktop widths start at 1280 pixels. No backend, account, API key, analytics or runtime CDN scripts are required. Data stays in browser memory and clears on reload.

## Use

The right-hand Data panel accepts a database TSV or pasted G25 coordinates. Click **Load database TSV**, select Scaled or Raw for that file, then choose a local file. Import happens in a worker; files stay in browser memory and are not uploaded or bundled with the application.

The Archaeobase table layout is supported directly: `Group ID`, `Genetic ID`, and `G25_coords` (a full named G25 row or 25 comma-separated values). Extra metadata columns are allowed. A TSV with `group_id`, `genetic_id` and `PC1` through `PC25` also works. Empty coordinate cells are skipped and counted; populated invalid rows or duplicate genetic IDs reject the import while retaining the previous database. A successful replacement clears database selections and retains manually added samples.

Search by group ID or genetic ID. Clicking a population adds its selection chip and all of its samples. Expand the population to select or remove individual samples; excluded members stay excluded without losing the population chip. Clicking an individual result, or pressing Enter on an exact genetic ID, selects only that sample. Remove a chip with ×. Overlapping population/sample selections never double-count a sample. Arrow keys navigate results; Escape clears the search.

Paste manual coordinates in the same panel, choose their Scaled/Raw interpretation and click **Add coordinates** (or Ctrl/⌘ + Enter). Each row needs a name and 25 comma-separated finite values. Manual and database sources are normalized separately and can be used together. Manual population chips select the pasted rows. Invalid additions preserve the previous valid selection and plot.

Selection changes automatically refit Custom PCA. At least three samples with two independent directions are needed; smaller or degenerate selections clear the graph with an explanation. The compact top toolbar retains grouping, addition options and X/Y selectors. Run PCA explicitly reapplies the current creation options. Aggregated retains every sample in one trace per group; Individual creates one trace per sample; As one group accepts an optional custom name.

Hover over the chart to reveal the actual Plotly toolbar and original G25 custom icons:

- Native camera, zoom/pan, box/lasso selection, zoom buttons, autoscale and reset axes.
- Legend visibility, group visibility and native legend click/double-click interaction.
- Marker sizes: big → medium → small.
- Point labels: none → full name → group → ID.
- Group labels: movable → static → static with background; drag movable labels directly.
- Label/hull/regression visibility and hull opacity: 0.9 → 0.6 → 0.3.
- Subtitle prompt; cancelling removes the subtitle, as in the original.

Mouse-wheel zoom anchors at the pointer. X/Y selectors choose fitted components. The Save dropdown includes all 18 original image dimensions, through 7680×4320; it downloads PNGs directly without an export dialog. The native camera remains available too.

Group labels, hulls and regression are created by default, matching G25 Views. Gear choices apply to the next Run. View-tool changes preserve zoom; label offsets survive toolbar changes and are retained per component pair. Run refits/replaces the Custom plot and resets its view cycles. Reset plot clears the selection and plot; the loaded database, draft manual text and creation options remain. Clear selection also discards the manual catalogue; manual rows can be pasted again.

## Scope and numerical behavior

**Custom PCA only.** Regional reference PCAs and Celto-Germanic data are not included. The 32 px icon-only rail reserves Distances and Models as disabled future tools. The right Data panel is the only data-entry surface. There is no settings dialog, permanent plot toolbar, ratio switcher or mobile adaptation. The single chart fills the remaining workspace.

See [the complete Custom PCA parity matrix](docs/G25_PARITY.md) for the source-by-source behavior mapping and intentional Custom-only exclusions.

Raw G25 input is converted using the square roots of [G25 Views' eigenvalues](https://github.com/vahaduo/g25views/blob/64226115636b1cb9951e6749ab8fecf2d7bfcc1b/global25-projection.js). Original vectors, normalized 25D vectors and derived PCA scores remain separate. Future distances/models can therefore use the original normalized coordinates.

Custom PCA uses ML.js SVD with centering and no per-column standardization. It keeps full precision and a deterministic component-sign convention. At least three samples with two independent directions of variation are required. Explained variance describes this new fit, not the original G25 spectrum. Two-point hulls become connecting lines; duplicate/collinear points do not invent polygon areas; constant-X groups do not invent regressions. Geometry is descriptive, not a confidence region or ancestry estimate.

## Structure

```text
src/App.tsx                 Compact plot controls, automatic fitting and view state
src/components/DatabasePanel.tsx TSV loading, searchable chips and manual entry
src/hooks/useCatalogue.ts   Import lifecycle and selection state
src/domain/database.ts     Strict TSV parsing, normalization and sample selection
src/components/PcaChart.tsx Native hover modebar, SVG icons, zoom, label offsets, export
src/data/g25-*.json          Reference SVG icon paths
src/domain/g25.ts           Parser and raw/scaled conversion
src/domain/pca.ts           Validated numerical PCA engine
src/domain/figure.ts        Grouping, labels, marker cycles and owned geometry
src/domain/geometry.ts      Hull, regression, centroid, range and zoom math
src/domain/markers.ts       PCA_views-style palette and outlines
src/workers/                Background TSV import and PCA fitting
```

The reference Bootstrap 4.6.1 CSS is installed locally for the same font and control dimensions; no Bootstrap JavaScript or jQuery runtime is used. Plotly is bundled locally and loaded lazily. The chart is SVG scatter; large-data performance is not guaranteed.

## Verify and build

```sh
npm test
npm run build
npm run test:e2e
```

The browser configuration uses `/usr/bin/google-chrome` when present. Set `PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH` for another installation, or install Playwright Chromium with `npx playwright install chromium`.

Tests cover numeric correctness, parsing, grouping, every restored cycle, native hover behavior, legend/geometry ownership, zoom/pan/reset, label dragging, fixed-size PNG output, keyboard input and desktop dimensions. See [validation](docs/VALIDATION.md) for the independent NumPy comparison and limits.

Vite emits `dist/` with relative asset paths for static hosting. Plotly remains the largest lazy chunk and produces Vite's standard chunk-size advisory. Reference clones, studies and test captures are excluded from Git and the build.

## GitHub Pages

Pushes to `main` run the included deployment workflow. In repository Settings → Pages, select GitHub Actions as the publishing source. The workflow can also be run manually. For `nomanfinally/nomansG25`, the expected site path is `https://nomanfinally.github.io/nomansG25/` once deployment completes.
