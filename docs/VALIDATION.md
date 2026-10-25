# Validation

The current workspace passes 39 unit checks, 13 Playwright browser scenarios and production compilation. The browser suite covers both the original database-selection requirements and the latest left-panel/direct-toolbar redesign.

Unit checks cover strict coordinate and TSV parsing, raw/scaled conversion, metadata retention, missing-value inclusion and numeric criteria, complete/deduplicated bulk selection, population exclusions, Admix_IRE search ranking, deterministic local marker separation, known PCA geometry, rank-deficient input, escaped labels, group geometry and cursor-anchored zoom mathematics. A 60-group fixture checks distinct color/shape pairs and repeatable assignment. A separate direct comparison with Admix_IRE's original search module produced identical scores for 40 reference cases.

Browser scenarios exercise local TSV import, manual raw/scaled additions, population and individual chips, expandable group members, exact genetic-ID Enter, keyboard navigation, invalid-input preservation, database replacement, stale-fit cancellation and minimum sample feedback. Workspace checks cover left-panel collapse/restore, pointer and keyboard resizing, two-column Advanced search, table expansion and virtualization, complete Add all selection, metadata/date criteria, direct geometry toggles, marker/label cycles, native plot interaction modes and wheel zoom, component/grouping controls, legend click/double-click/eye semantics, hidden-geometry ownership, plot resizing at 1280/1440/1600 px and all 18 export sizes with a real 800×400 PNG.

Final captures under the ignored `.impeccable/review/workspace/` directory cover empty/populated charts, the Admix-style search menu, expanded population members, hidden legend populations, all supported desktop widths, collapsed/resized panels, Advanced search, table mode, manual validation errors and PNG output. Browser runtime errors were empty. The table capture was taken after Plotly layout and native form-control painting settled.

The user's Archaeobase TSV was tested in place without copying it into the project. It has 21,936 rows: 18,212 coordinate-bearing samples in 4,423 groups, plus 3,724 rows without coordinates. The production build loaded the file in approximately 3.1 seconds in this environment, fitted a selected population, retained 26 metadata columns and returned 1,159 matches for a country criterion. Only 40 result rows were mounted in the table. Runtime errors and external network requests were both zero. Timing is an observation, not a performance guarantee.

The numerical PCA engine is unchanged. Earlier independent NumPy SVD validation used 180 deterministic synthetic samples in 25 dimensions: maximum eigenvalue error 4.34e-19, explained-variance error 2.22e-16 and checked pairwise-distance error 2.78e-17. Development fixtures are explicitly synthetic; the app opens without a dataset.

Run locally:

```sh
npm ci
npm test
npx playwright install chromium
npm run test:e2e
npm run build
```

No mobile support or unlimited-data performance guarantee is implied. Visual marker assignment encourages local contrast using the finite PCA_views palette and shape set; it cannot guarantee unique or equally distinguishable styles for arbitrary numbers of groups or every color-vision condition.
