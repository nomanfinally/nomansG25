import { expect, test, type Page } from "@playwright/test";
import { readFile } from "node:fs/promises";
import { syntheticG25, syntheticDatabase } from "./fixtures";
const plot = (page: Page) => page.locator(".pca-chart");
const tool = (page: Page, name: string) =>
  page
    .getByRole("toolbar", { name: "Plot tools" })
    .getByRole("button", { name, exact: true });
const count = (page: Page) =>
  plot(page).evaluate(
    (el: any) => el.data?.reduce((n: number, t: any) => n + t.x.length, 0) ?? 0,
  );
const ranges = (page: Page) =>
  plot(page).evaluate((el: any) => ({
    x: [...el._fullLayout.xaxis.range],
    y: [...el._fullLayout.yaxis.range],
  }));
async function load(page: Page) {
  await page.goto("/");
  await page.locator(".manual-source summary").click();
  await page
    .getByLabel("Global25 coordinates", { exact: true })
    .fill(syntheticG25());
  await page
    .getByRole("button", { name: "Add coordinates", exact: true })
    .click();
  await expect.poll(() => count(page)).toBe(180);
}
async function database(page: Page) {
  await page.goto("/");
  await page.locator("input[type=file]").setInputFiles({
    name: "synthetic.tsv",
    mimeType: "text/tab-separated-values",
    buffer: Buffer.from(syntheticDatabase()),
  });
  await expect(page.locator(".database-file-status")).toContainText(
    "180 samples",
  );
}

test("PCA tools use panel toggles, small markers and a continuous chart with Plotly credit", async ({
  page,
}) => {
  await load(page);
  expect(
    await page
      .locator(".plot-toolbar button")
      .first()
      .getAttribute("aria-label"),
  ).toBe("Toggle data panel");
  expect(await plot(page).evaluate((el: any) => el.data[0].marker.size)).toBe(
    7,
  );
  expect(
    await page.locator("body").evaluate((el) => getComputedStyle(el).fontSize),
  ).toBe("12px");
  await expect(
    page.getByRole("button", { name: "Run PCA", exact: true }),
  ).toHaveCount(0);
  await expect(
    page.locator('summary[title="Addition options"],.plotly-logomark,.modebar'),
  ).toHaveCount(0);
  await expect(
    page.getByRole("link", { name: "Plotly", exact: true }),
  ).toBeVisible();
  expect(
    await plot(page).evaluate((el: any) => ({
      xTitle: el.layout.xaxis.title?.text ?? "",
      yTitle: el.layout.yaxis.title?.text ?? "",
      xLine: el.layout.xaxis.showline,
      yLine: el.layout.yaxis.showline,
    })),
  ).toEqual({ xTitle: "", yTitle: "", xLine: true, yLine: true });
  const headerHeight = (await page.locator(".app-header").boundingBox())!
    .height;
  expect(headerHeight).toBeLessThanOrEqual(40);
  expect((await plot(page).boundingBox())!.height).toBe(900 - headerHeight);
  await tool(page, "Toggle data panel").click();
  await expect(page.locator(".database-panel")).not.toBeVisible();
  await tool(page, "Toggle data panel").click();
  await expect(page.locator(".database-panel")).toBeVisible();
  const panel = await page.locator(".database-panel").boundingBox(),
    chart = await plot(page).boundingBox();
  expect(panel!.x).toBe(32);
  expect(chart!.x).toBeGreaterThan(panel!.x + panel!.width);
  await page
    .getByRole("button", { name: "Collapse data panel", exact: true })
    .click();
  await expect(page.locator(".database-panel")).not.toBeVisible();
  await expect
    .poll(() => plot(page).evaluate((el: any) => el._fullLayout.width))
    .toBe(1188);
  await page
    .getByRole("button", { name: "Open data panel", exact: true })
    .click();
  await expect(page.locator(".database-panel")).toBeVisible();
  const resizer = page.getByRole("separator", { name: "Resize data panel" }),
    box = await resizer.boundingBox();
  await page.mouse.move(box!.x + 2, box!.y + 100);
  await page.mouse.down();
  await page.mouse.move(box!.x + 122, box!.y + 100, { steps: 8 });
  await page.mouse.up();
  expect((await page.locator(".data-panel-layout").boundingBox())!.width).toBe(
    500,
  );
  await resizer.focus();
  await page.keyboard.press("ArrowLeft");
  expect((await page.locator(".data-panel-layout").boundingBox())!.width).toBe(
    480,
  );
});

test("toolbar icons immediately toggle geometry and preserve the choice through automatic refits", async ({
  page,
}) => {
  await load(page);
  expect(
    await plot(page).evaluate((el: any) =>
      el.layout.annotations.every((a: any) => !a.visible),
    ),
  ).toBe(true);
  for (const label of [
    "Cycle population labels",
    "Cycle hulls",
    "Toggle regression lines",
  ])
    await tool(page, label).click();
  await expect
    .poll(() =>
      plot(page).evaluate((el: any) =>
        el.layout.annotations.every((a: any) => a.visible),
      ),
    )
    .toBe(true);
  expect(
    await plot(page).evaluate((el: any) =>
      el.layout.shapes.every((s: any) => s.visible),
    ),
  ).toBe(true);
  await page
    .getByRole("button", { name: "Remove Synthetic_F", exact: true })
    .click();
  await expect.poll(() => count(page)).toBe(150);
  await expect(tool(page, "Cycle hulls")).toHaveAttribute(
    "aria-pressed",
    "true",
  );
  await expect
    .poll(() =>
      plot(page).evaluate((el: any) =>
        el.layout.shapes
          .filter((s: any) => s.type === "path")
          .every((s: any) => s.visible),
      ),
    )
    .toBe(true);
});

test("legend click toggles, double click isolates/restores, and the eye hides without deselecting", async ({
  page,
}) => {
  await load(page);
  await tool(page, "Cycle population labels").click();
  const row = page.getByRole("button", {
    name: "Legend Synthetic_A",
    exact: true,
  });
  await row.click();
  await expect
    .poll(() => plot(page).evaluate((el: any) => el.data[0].visible))
    .toBe("legendonly");
  await expect
    .poll(() =>
      plot(page).evaluate((el: any) => el.layout.annotations[0].visible),
    )
    .toBe(false);
  await row.click();
  await expect
    .poll(() => plot(page).evaluate((el: any) => el.data[0].visible))
    .toBe(true);
  await row.dblclick();
  await expect
    .poll(() =>
      plot(page).evaluate(
        (el: any) => el.data.filter((t: any) => t.visible === true).length,
      ),
    )
    .toBe(1);
  await row.dblclick();
  await expect
    .poll(() =>
      plot(page).evaluate(
        (el: any) => el.data.filter((t: any) => t.visible === true).length,
      ),
    )
    .toBe(6);
  await page
    .getByRole("button", { name: "Hide population Synthetic_B", exact: true })
    .click();
  await expect(
    page.getByRole("button", {
      name: "Show population Synthetic_B",
      exact: true,
    }),
  ).toBeVisible();
  await expect(page.locator(".data-count")).toHaveText("180 selected");
  expect(await count(page)).toBe(180);
  await page.getByRole("button", { name: "Show all", exact: true }).click();
  await expect
    .poll(() =>
      plot(page).evaluate((el: any) =>
        el.data.every((t: any) => t.visible === true),
      ),
    )
    .toBe(true);
});

test("wheel, zoom modes, reset and legend visibility preserve the single chart", async ({
  page,
}) => {
  await load(page);
  const original = await ranges(page),
    box = await plot(page).boundingBox();
  await page.mouse.move(box!.x + 200, box!.y + 300);
  await page.mouse.wheel(0, -200);
  await expect
    .poll(async () => {
      const r = await ranges(page);
      return r.x[1] - r.x[0];
    })
    .toBeLessThan(original.x[1] - original.x[0]);
  await tool(page, "Zoom out").click();
  await tool(page, "Box zoom mode").click();
  await expect
    .poll(() => plot(page).evaluate((el: any) => el.layout.dragmode))
    .toBe("zoom");
  const before = await ranges(page);
  await tool(page, "Toggle legend").click();
  await expect(
    page.getByLabel("Population legend", { exact: true }),
  ).not.toBeVisible();
  expect(await ranges(page)).toEqual(before);
  expect(await plot(page).boundingBox()).toEqual({
    ...box!,
    width: box!.width + 220,
  });
  await tool(page, "Toggle legend").click();
  await expect(
    page.getByLabel("Population legend", { exact: true }),
  ).toBeVisible();
  expect(await plot(page).boundingBox()).toEqual(box);
  await tool(page, "Reset axes").click();
  await expect.poll(async () => (await ranges(page)).x).toEqual(original.x);
});

test("marker, point label and group label cycles and custom components remain available", async ({
  page,
}) => {
  await load(page);
  for (const size of [5, 9, 7]) {
    await tool(page, "Cycle marker size").click();
    await expect
      .poll(() => plot(page).evaluate((el: any) => el.data[0].marker.size))
      .toBe(size);
  }
  for (const mode of [
    "text+markers",
    "text+markers",
    "text+markers",
    "markers",
  ]) {
    await tool(page, "Cycle point labels").click();
    await expect
      .poll(() => plot(page).evaluate((el: any) => el.data[0].mode))
      .toBe(mode);
  }
  await tool(page, "Cycle population labels").click();
  await tool(page, "Cycle population labels").click();
  await expect
    .poll(() =>
      plot(page).evaluate((el: any) => el.layout.annotations[0].showarrow),
    )
    .toBe(false);
  await page.getByLabel("Horizontal component").selectOption("2");
  await expect(page.getByLabel("Horizontal component")).toHaveValue("2");
  await page
    .getByLabel("Grouping mode", { exact: true })
    .selectOption("single");
  await page.getByLabel("Custom group name").fill("Combined");
  await expect
    .poll(() => plot(page).evaluate((el: any) => el.data.length))
    .toBe(1);
});

test("advanced search splits left, widens into a virtualized table and adds all matching samples", async ({
  page,
}) => {
  await database(page);
  await page
    .getByRole("button", { name: "Advanced search", exact: true })
    .click();
  const advanced = page.getByRole("region", {
    name: "Advanced search",
    exact: true,
  });
  await expect(advanced).toBeVisible();
  expect((await advanced.boundingBox())!.x).toBeLessThan(
    (await page.locator(".database-panel").boundingBox())!.x,
  );

  // Attached search box & dropdown verification (G25_Manager style)
  const searchControl = page.locator(".toolbar-search");
  await expect(searchControl).toBeVisible();
  await expect(searchControl.locator(".search-field-attached")).toBeVisible();
  const searchField = page.getByLabel("Search scope property");
  await expect(searchField).toBeVisible();
  await searchField.selectOption("Regions");
  await expect(searchControl.locator(".search-field-label")).toHaveText("Regions");

  const regexInput = page.getByLabel("Search text or regular expression");
  await regexInput.fill("/[unclosed/");
  await expect(searchControl).toHaveClass(/invalid/);
  await expect(page.locator(".regex-error")).toBeVisible();
  await regexInput.press("Escape");
  await expect(regexInput).toHaveValue("");
  await expect(searchControl).not.toHaveClass(/invalid/);

  await page
    .getByRole("button", { name: "Add criterion", exact: true })
    .click();
  await page.getByLabel("Property 1", { exact: true }).selectOption("Regions");
  await page.getByLabel("Operator 1", { exact: true }).selectOption("equals");
  await page.getByLabel("Value 1", { exact: true }).fill("Europe");
  await expect(advanced).toContainText("90 matching samples");
  await page
    .getByRole("button", {
      name: "Add all advanced search matches",
      exact: true,
    })
    .click();
  await expect.poll(() => count(page)).toBe(90);
  const compact = (await page.locator(".data-panel-layout").boundingBox())!
    .width;
  await page
    .getByRole("button", { name: "Expand table view", exact: true })
    .click();
  expect(
    (await page.locator(".data-panel-layout").boundingBox())!.width,
  ).toBeGreaterThan(compact);
  await expect(page.locator(".metadata-table")).toBeVisible();
  expect(
    await page.locator(".metadata-table tbody tr[aria-selected]").count(),
  ).toBeLessThan(60);
  await page
    .getByLabel("Select table sample Synthetic_A_sample_1", { exact: true })
    .uncheck();
  await expect.poll(() => count(page)).toBe(89);

  await page
    .getByRole("button", {
      name: "Add all advanced search matches",
      exact: true,
    })
    .click();
  await expect.poll(() => count(page)).toBe(90);

  // Toggle to Group mode: table adjusts columns and selecting group plots all its individuals
  await page.getByRole("button", { name: "Group", exact: true }).click();
  await expect(page.locator(".metadata-table th").nth(2)).toHaveText("Samples");
  await expect(page.getByLabel("Group metadata table")).toBeVisible();

  // Uncheck Synthetic_A group: all its 30 individuals are unplotted
  const groupCheckbox = page.getByLabel("Select table group Synthetic_A");
  await expect(groupCheckbox).toBeVisible();
  await groupCheckbox.uncheck();
  await expect.poll(() => count(page)).toBe(60);

  // Check Synthetic_A group back: all 30 individuals are plotted
  await groupCheckbox.check();
  await expect.poll(() => count(page)).toBe(90);

  // Toggle back to Individual mode: restores Genetic ID and individual sample rows
  await page.getByRole("button", { name: "Individual", exact: true }).click();
  await expect(page.locator(".metadata-table th").nth(2)).toHaveText("Genetic ID");
  await expect(page.getByLabel("Sample metadata table")).toBeVisible();
  await page
    .getByRole("button", { name: "Add criterion", exact: true })
    .click();
  await page.getByLabel("Property 2", { exact: true }).selectOption("Year CE");
  await page.getByLabel("Operator 2", { exact: true }).selectOption("min");
  await page.getByLabel("Value 2", { exact: true }).fill("0");
  await expect(advanced).toContainText("65 matching samples");
  // Changing search criteria scopes results; it never silently deselects the plotted cohort.
  expect(await count(page)).toBe(90);
  await page
    .getByRole("button", { name: "Close advanced search", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Advanced search", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Add criterion", exact: true })
    .click();
  await expect(page.getByLabel("Property 3", { exact: true })).toHaveCount(1);
  await page
    .getByLabel("Property 3", { exact: true })
    .selectOption("Molecular Sex");
  await page.getByLabel("Operator 3", { exact: true }).selectOption("equals");
  await page.getByLabel("Value 3", { exact: true }).fill("F");
  await expect(page.getByLabel("Value 1", { exact: true })).toHaveValue(
    "Europe",
  );
  await expect(page.getByLabel("Value 2", { exact: true })).toHaveValue("0");
  await page
    .getByRole("button", { name: "Remove criterion 3", exact: true })
    .click();
  await expect(page.getByLabel("Property 1", { exact: true })).toHaveCount(1);
  await expect(page.getByLabel("Property 2", { exact: true })).toHaveCount(1);
});

test("Admix search ranks fuzzy/accent matches, anchors its menu, and exact genetic ID selects one", async ({
  page,
}) => {
  await database(page);
  const search = page.getByLabel("Search populations or genetic IDs");
  await search.fill("synthetic a");
  await expect(page.locator(".group-select").first()).toContainText(
    "Synthetic_A",
  );
  const menu = page.locator(".database-results"),
    field = page.locator(".population-token-box");
  expect((await menu.boundingBox())!.width).toBe(
    (await field.boundingBox())!.width,
  );
  await search.fill("Synthetic_A_sample_7");
  await search.press("Enter");
  await expect(page.locator(".population-chip.individual")).toHaveCount(1);
  await expect(page.locator(".data-count")).toHaveText("1 selected");
  await search.press("Backspace");
  await expect(page.locator(".population-chip")).toHaveCount(0);
  await search.fill("Synthetic");
  await page
    .locator(".search-scope-actions")
    .getByRole("button", { name: "Add all matches", exact: true })
    .click();
  await expect.poll(() => count(page)).toBe(180);
});

test("PNG export exactly matches PCA_views options, live preview, CSV, and PNG download", async ({
  page,
}) => {
  await load(page);

  // Verify PCA main chart border
  const plotBorder = await plot(page).evaluate((el: any) => ({
    xShowLine: el._fullLayout.xaxis.showline,
    xMirror: el._fullLayout.xaxis.mirror,
    xLineColor: el._fullLayout.xaxis.linecolor,
    yShowLine: el._fullLayout.yaxis.showline,
    yMirror: el._fullLayout.yaxis.mirror,
  }));
  expect(plotBorder.xShowLine).toBe(true);
  expect(plotBorder.xMirror).toBe(true);
  expect(plotBorder.xLineColor).toBe("#444444");
  expect(plotBorder.yShowLine).toBe(true);
  expect(plotBorder.yMirror).toBe(true);

  // Open Export dialog
  await page.getByLabel("Export", { exact: true }).click();
  const dialog = page.locator(".export-dialog");
  await expect(dialog).toBeVisible();

  // Verify PCA_views Heading defaults
  await expect(dialog.getByLabel("Export title")).toHaveValue("");
  await expect(dialog.getByLabel("Title font size", { exact: true })).toHaveValue("22");
  await expect(dialog.getByLabel("Title font weight", { exact: true })).toHaveValue("600");
  await expect(dialog.getByLabel("Export subtitle")).toHaveValue("");
  await expect(dialog.getByLabel("Subtitle font size")).toHaveValue("15");
  await expect(dialog.getByLabel("Subtitle font weight")).toHaveValue("400");

  // Verify PCA_views Legend defaults
  await expect(dialog.getByLabel("Include population legend")).toBeChecked();
  await expect(dialog.getByLabel("Export legend position")).toHaveValue("right");
  await expect(dialog.getByLabel("Export legend columns")).toHaveValue("1");
  await expect(dialog.getByLabel("Legend font size")).toHaveValue("12");
  await expect(dialog.getByLabel("Legend font weight")).toHaveValue("400");
  await expect(dialog.getByLabel("Legend row spacing")).toHaveValue("5");
  await expect(dialog.getByLabel("Legend column spacing")).toHaveValue("20");
  await expect(dialog.getByLabel("Legend box boundary")).not.toBeChecked();

  // Verify PCA_views note
  await expect(
    dialog.getByText("The chart is captured once at the current zoom and proportions."),
  ).toBeVisible();

  // Verify live preview renders
  await expect(dialog.locator(".export-preview img")).toBeVisible({ timeout: 10000 });

  // Verify footer controls
  await expect(
    dialog.getByRole("button", { name: "Download interactive HTML" }),
  ).toBeVisible();
  await expect(
    dialog.getByText("One offline file · all loaded data, styles, zoom and tools"),
  ).toBeVisible();
  await expect(
    dialog.getByRole("button", { name: "Filtered samples · CSV" }),
  ).toBeVisible();

  // Test CSV download
  const pendingCsv = page.waitForEvent("download");
  await dialog.getByRole("button", { name: "Filtered samples · CSV" }).click();
  const csvDownload = await pendingCsv;
  expect(csvDownload.suggestedFilename()).toContain(".csv");
  const csvContent = (await readFile((await csvDownload.path())!)).toString("utf-8");
  expect(csvContent).toContain("Sample");
  expect(csvContent).toContain("Population");
  expect(csvContent).toContain("PC1");

  // Re-open Export dialog for PNG test
  await page.getByLabel("Export", { exact: true }).click();
  await expect(dialog).toBeVisible();
  await expect(dialog.locator(".export-preview img")).toBeVisible({ timeout: 10000 });

  // Test PNG download
  const pendingPng = page.waitForEvent("download");
  await dialog.getByRole("button", { name: "Download PNG" }).click();
  const pngDownload = await pendingPng;
  expect(pngDownload.suggestedFilename()).toContain(".png");
  const bytes = await readFile((await pngDownload.path())!);
  expect(bytes.subarray(0, 8).toString("hex")).toBe("89504e470d0a1a0a");
});

test("desktop resize waits for Plotly and keeps chart and panels within the viewport", async ({
  page,
}) => {
  await load(page);
  for (const width of [1280, 1440, 1600]) {
    await page.setViewportSize({ width, height: 900 });
    await expect
      .poll(() => plot(page).evaluate((el: any) => el._fullLayout.width))
      .toBe(width - 32 - 380 - 5 - 220);
    expect(await page.evaluate(() => document.body.scrollWidth)).toBe(width);
  }
  await page
    .getByRole("button", { name: "Advanced search", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Expand table view", exact: true })
    .click();
  await page.setViewportSize({ width: 1280, height: 900 });
  await expect
    .poll(() => plot(page).evaluate((el: any) => el._fullLayout.width))
    .toBe(135);
  expect(await page.evaluate(() => document.body.scrollWidth)).toBe(1280);
});

test("toolbar unfolds and folds cleanly without scrollbars, and export dialog operates with PCA_views options", async ({
  page,
}) => {
  await load(page);

  // Check toolbar has no overflow scrollbar
  const overflowX = await page
    .locator(".plot-toolbar-inner")
    .evaluate((el) => getComputedStyle(el).overflowX);
  expect(overflowX).not.toBe("scroll");
  expect(overflowX).not.toBe("auto");

  // Fold toolbar
  await page.getByRole("button", { name: "Fold toolbar", exact: true }).click();
  await expect(page.locator(".plot-toolbar-inner")).not.toBeVisible();
  const unfoldBtn = page.getByRole("button", { name: "Unfold toolbar", exact: true });
  await expect(unfoldBtn).toBeVisible();

  // Unfold toolbar back
  await unfoldBtn.click();
  await expect(page.locator(".plot-toolbar-inner")).toBeVisible();

  // Open Export dialog
  await page.getByLabel("Export", { exact: true }).click();
  const dialog = page.locator(".export-dialog");
  await expect(dialog).toBeVisible();
  await expect(dialog.getByLabel("Export title")).toBeVisible();
  await expect(dialog.getByLabel("Export subtitle")).toBeVisible();
  await expect(dialog.getByLabel("Include population legend")).toBeVisible();
  await expect(dialog.getByLabel("Export legend position")).toHaveValue("right");
  await expect(dialog.getByLabel("Legend box boundary")).not.toBeChecked();

  // Close Export dialog
  await page.getByRole("button", { name: "Close Export", exact: true }).click();
  await expect(dialog).not.toBeVisible();
});

