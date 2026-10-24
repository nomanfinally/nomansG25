# G25 PCA workspace

Mode: Operate. Implementation path: code-first app screen, with no standing workflow preference set.

Visual authority is pinned by the user: G25 Views' minimal toolbar and single plot, PCA_views' crisp colored/outlined markers, plus a narrow vertical dark tool rail. This precisely specified composition does not need a new visual-world workshop or alternative layout round.

The desktop workspace is one white plotting surface beside a 76 px charcoal rail and under a 46 px toolbar. The toolbar combines Data, scaled/raw input, Run PCA, reset/zoom, legend, labels, hulls, regression, X/Y component selects and Save PNG. Inputs and actions use restrained blue-outline/gray controls inspired by G25 Views. Data entry is a lightweight anchored panel with a multiline textarea; it overlays the graph without changing the chart size. There is no settings modal or second control sidebar. A small one-line chart status is part of the plot frame. Future distances/models entries are visibly unavailable, not functioning placeholder analyses.

First viewport: the plot is the primary surface from first load. An understated inline empty state tells the user to paste G25 rows. No hero, cards, illustrations, demo statistics, large branding, gradients, or onboarding tour. Desktop at 1280, 1440 and 1600 widths is the supported surface; the user explicitly excluded mobile adaptation.

Signature interaction: cursor-anchored wheel zoom, with chart ranges preserved when toggling legend or geometry. Stable group colors/shapes, dark outlines, legible hover, and subtle chart geometry make the data carry the visual interest. The graph frame and ranges remain fixed when the legend appears/disappears. Every group remains individual sample points, never averaged away.

Bounds: only approved PCA features. Scaled/raw G25, Custom PCA fit, component selectors, pan/zoom/reset, legend show/hide, group labels/hulls/regression, basic PNG. No regional references, settings dialogs, point editors, palettes/settings browsers, lasso, tables, archive export, distances or models implementation.

Defaults: scaled input, component 1/2, pan, legend on; group labels/hulls/regression off until requested. New input Run refits the PCA; view toggles never refit. Data parse errors retain the previous successful plot. Preserve all 25D source and normalized vectors for future analysis.

Quality bar: fits all toolbar controls at 1280 px, no body scrolling at supported sizes; distinct disabled/pressed/focus/hover states; input and errors readable and keyboard accessible; real numeric PCA independently checked; raw/scaled inputs equivalent within input rounding; PNG matches visible plot and legend state; no source changes in either reference repository.

Honest limits: desktop only; SVG marks prioritize clarity and no large-data performance guarantee is claimed. PCA axes use full precision internally, and fitted-component signs are arbitrary mathematically. Projection onto a separately locked reference fit is outside this initial Custom PCA scope.

## Direction contract

THESIS: G25 Views' single-chart workspace, with PCA_views' better data marks and a small suite navigation rail. Chart exploration leads; a settings application never grows around it.

OWN-WORLD: White plotting ground for desktop scientific inspection, charcoal navigation, Arial/Helvetica labels, small blue-outline actions and gray separators. Colored, outlined geometric marks carry group identity.

STORY: Paste named 25D rows, choose scaled/raw, run Custom PCA, then explore with zoom, axes and the agreed geometry toggles. Input errors keep the last valid plot.

FIRST VIEWPORT: A 76 px dark left rail, one 46 px top toolbar and one chart filling all remaining desktop space. Paste entry overlays that frame. No aspect switcher or permanent data panel. Wheel zoom anchors to the pointer; view toggles preserve ranges and chart dimensions.

FORM: The user precisely specified the reference composition and confirmed its scope in two answer rounds. No concept roll applies to this pinned interface. App screen built code-first.

FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance
