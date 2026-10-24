# Validation

The G25 Views Custom PCA redesign passed 18 unit checks, nine Playwright browser scenarios and production compilation.

Unit checks cover strict G25 parsing, an analytically known PCA with 80/20 explained variance, raw/scaled equivalence, preserved source vectors and pairwise distances, rank-deficient input, group geometry, escaped labels and cursor-anchored zoom mathematics.

Browser checks cover multiline coordinate paste, fitted component selection, invalid input preservation, both marker appearances, all marker/point-label/group-label/hull-opacity cycles, creation options, aggregated/individual/single-group modes, subgroup decorations, native legend interactions, subtitle entry, draggable annotations and persistence. They also exercise wheel/button/box zoom, pan, reset, hover-only modebar visibility, the 32 px rail and 47 px input strip, all 18 export sizes and a real PNG download. Desktop widths of 1280, 1440 and 1600 pixels retain one chart and the same input-strip height.

An independent NumPy SVD comparison used 180 deterministic synthetic samples with 25 dimensions. Maximum eigenvalue error was 4.34e-19; maximum explained-variance error was 2.22e-16; checked pairwise-distance error was 2.78e-17. The fixture is in `e2e/fixtures.ts` and is explicitly synthetic, not biological evidence. The application opens with no dataset.

The final capture batch uses 180 synthetic points in six groups and records no JavaScript runtime errors. The reference G25 Views viewer was captured with the same fixture for comparison. Evidence includes empty, resting, hovered, menu, label, subgroup, validation-error and export states at the supported desktop widths. The downloaded PNG was verified at 800×400 pixels. The original numerical engine is unchanged by this interface redesign.

These checks do not establish a large-data performance guarantee or mobile support. The repository workflows rerun unit checks and production builds for deployment; pull requests also run browser checks.

Run locally:

```sh
npm ci
npm test
npm run build
npx playwright install chromium
npm run test:e2e
```
