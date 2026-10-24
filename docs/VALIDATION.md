# Validation

The initial Custom PCA implementation passed 16 unit checks and four Playwright browser checks. Production compilation and a smoke test of the built site also passed.

Unit checks cover strict G25 parsing, an analytically known PCA with 80/20 explained variance, raw/scaled equivalence, preserved source vectors and pairwise distances, rank-deficient input, group geometry, escaped labels and cursor-anchored zoom mathematics.

Browser checks cover coordinate entry, fitted component selection, invalid input preservation, marker shapes/outlines, zoom in/out, pan, reset, legend/geometry toggles without changing the frame or ranges, PNG download, keyboard entry and desktop widths of 1280, 1440 and 1600 pixels.

An independent NumPy SVD comparison used 180 deterministic synthetic samples with 25 dimensions. Maximum eigenvalue error was 4.34e-19; maximum explained-variance error was 2.22e-16; checked pairwise-distance error was 2.78e-17. The fixture is in `e2e/fixtures.ts` and is explicitly synthetic, not biological evidence. The application opens with no dataset.

The production smoke check verified six traces and 180 points, with no JavaScript runtime errors or external network requests. A downloaded PNG was verified at 2728×1656 pixels. The independent interface review accepted the agreed desktop scope.

These checks do not establish a large-data performance guarantee or mobile support. The repository workflows rerun unit checks and production builds for deployment; pull requests also run browser checks.

Run locally:

```sh
npm ci
npm test
npm run build
npx playwright install chromium
npm run test:e2e
```
