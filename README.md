# G25 tools

A focused desktop workspace for Global25 coordinates. The first tool is Custom PCA, with a compact toolbar inspired by G25 Views and outlined markers adapted from PCA_views.

## Run

Requires Node.js 22.12 or newer.

```sh
npm ci
npm run dev
```

Open the local URL printed by Vite. The application is intended for desktop windows at least 1280 pixels wide. No server-side processing, account or API key is required. Coordinates stay in browser memory; refreshing clears them.

## Use

1. Click **Paste G25 coordinates…** or **Paste coordinates**.
2. Paste one named sample per line, with exactly 25 comma-separated numeric values.
3. Select **Scaled** or **Raw** to match the pasted coordinates, then **Run PCA**. Ctrl+Enter also runs it from the input field.
4. Use the mouse wheel to zoom at the pointer, drag to pan, or use the zoom buttons. **Reset view** fits the complete PCA again.
5. The toolbar toggles the legend, group labels, convex hulls and regression. X/Y selectors choose components of the fitted PCA. **Save PNG** downloads the current plot at twice its on-screen resolution.

An input row has this structure; replace the ellipsis with the remaining numeric values:

```text
Group:sample_name,PC1,PC2,...,PC25
```

The part before the first colon supplies the group name. Names without a colon form their own group. Duplicate sample names are retained as separate rows. Blank lines, UTF-8 BOM, CRLF and scientific notation are accepted. Empty numeric fields, non-finite values, missing names and the wrong coordinate count produce a line-specific error. This is a G25 reader, not an `.evec` viewer.

Editing the input or changing its scale mode leaves the last successful plot intact until **Run PCA**. Invalid input also preserves that plot. Hiding the legend and changing overlays preserve the chart frame and zoom. Geometry toggles start off; the legend starts on.

## Numerical behavior

Raw input is converted to scaled Global25 coordinates using the square roots of the eigenvalues in the [G25 Views implementation](https://github.com/vahaduo/g25views/blob/64226115636b1cb9951e6749ab8fecf2d7bfcc1b/global25-projection.js). Already scaled input is used directly. Each source vector and normalized 25D vector is retained separately from PCA scores.

Custom PCA uses [ML.js PCA](https://github.com/mljs/pca): center the submitted rows, fit by SVD, and do not standardize columns to unit variance. Every sample has equal weight. Axis percentages describe this new fitted PCA, not the original Global25 eigenvalue spectrum. Internal vectors/scores keep full precision. Signs are made repeatable by orienting each component's largest absolute loading positively; component sign has no effect on distances or explained variance.

At least three samples with variation in two independent directions are required. Only components above a relative numerical-rank tolerance are offered. Running with a new dataset refits the PCA. View toggles never refit it. This version does not fit a separate reference set and project targets onto a locked basis.

Hulls are descriptive group boundaries on the displayed axes. Duplicate/collinear points do not create fake areas; two distinct points get a connecting line. Regression is ordinary least squares of Y on X and is omitted for constant-X groups. These overlays are not confidence regions or ancestry estimates.

## Scope

Included: scaled/raw G25, Custom PCA, group colors and shapes, cursor wheel zoom, pan, zoom/reset buttons, legend visibility, group labels, hulls/regression, component selection and simple PNG.

The left rail reserves **Distances** and **Models** as disabled, visibly planned entries. Those tools are not implemented. There are no regional PCA presets, settings dialogs, per-sample editors, mobile layouts, sample tables, selection tools or archive/export customization panels.

The chart uses Plotly's SVG scatter renderer. Very large datasets and many simultaneous group labels have not been performance-qualified; no large-data claim is made.

## Structure

```text
src/domain/g25.ts       G25 parser, raw/scaled conversion, retained source vectors
src/domain/pca.ts       PCA fitting, numerical validation, scores and variance
src/domain/geometry.ts  Hull, centroid, regression, range and zoom math
src/domain/markers.ts   Group colors, symbol sequence and dark outlines
src/domain/figure.ts    Pure Plotly traces, annotations and geometry
src/workers/            Background parsing/PCA worker
src/components/         Plotly adapter and compact coordinate entry
src/App.tsx             Tool rail, toolbar and local session state
src/styles.css         Desktop layout and visual tokens
```

Plotly is loaded lazily from an installed, pinned package. The worker contains its own math code. No runtime CDN scripts or analytics are used. The immutable source/normalized 25D data model leaves later distance/model tools independent of two-dimensional chart scores.

## Check and build

```sh
npm test
npm run build
npm run test:e2e
```

The browser test configuration uses `/usr/bin/google-chrome` in this workspace. Set the `PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH` environment variable for another Chromium installation; otherwise, if that Linux path is absent, it uses Playwright's installed Chromium (`npx playwright install chromium`).

Unit checks cover strict parsing, an analytically known PCA, raw/scaled equivalence, preserved source data and pairwise geometry, degenerate data and plot behavior. Browser checks cover data entry, axis changes, invalid input preservation, zoom/pan/reset, geometry/legend/frame stability, PNG download, keyboard entry and desktop widths. See the [validation record](docs/VALIDATION.md) for the independent NumPy comparison and validation limits.

The Vite production build emits `dist/`, with relative asset paths suitable for static hosting. Plotly is the largest lazy-loaded dependency and produces Vite's standard large-chunk advisory. Build and test artifacts do not include either reference repository or the study files.

## GitHub Pages

The deployment workflow publishes `dist/` after pushes to `main`. In the repository's **Settings → Pages**, set the publishing source to **GitHub Actions** before the first deployment. The workflow can also be started manually under Actions.

For `nomanfinally/nomansG25`, the expected project URL is `https://nomanfinally.github.io/nomansG25/`. It becomes available after the Pages deployment completes.

## References

- [Vahaduo G25 Views](https://github.com/vahaduo/g25views), reference for the minimal toolbar and G25 scaling convention.
- [PCA_views](https://github.com/nomanfinally/PCA_views), source of adapted palette, geometry and zoom concepts. Its files were left unchanged.
- Local repository studies and browser captures remain in the development workspace and are excluded from Git and the published site.
