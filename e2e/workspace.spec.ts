import { expect, test, type Page } from "@playwright/test";
import { readFile } from "node:fs/promises";
import { syntheticG25 } from "./fixtures";

const chart = (page: Page) => page.locator(".pca-chart");
const tool = (page: Page, name: string) =>
  page.locator(`.modebar-btn[data-title="${name}"]`);
const tools = {
  size: "Toggle projected marker size: big / medium / small",
  points: "Toggle projected labels: none / full name / group name / ID",
  style: "Toggle group labels style: movable / static / static with background",
  labels: "Toggle group labels: show for visible projected groups / hide",
  hulls: "Toggle convex hulls: show for visible projected groups / hide",
  opacity: "Toggle convex hull opacity: high / medium / low",
  regression:
    "Toggle regression lines: show for visible projected groups / hide",
  visibility: "Toggle projected visibility: show / hide",
};
async function hover(page: Page) {
  await chart(page).hover({ position: { x: 450, y: 200 } });
  await expect
    .poll(() =>
      page
        .locator(".modebar-group")
        .first()
        .evaluate((el) => getComputedStyle(el).opacity),
    )
    .toBe("1");
}
async function paste(page: Page, text = syntheticG25()) {
  await page.getByLabel("Global25 coordinates", { exact: true }).fill(text);
}
async function run(page: Page) {
  await page.getByRole("button", { name: "Run PCA", exact: true }).click();
  await expect(
    page.getByRole("button", { name: "Run PCA", exact: true }),
  ).toBeEnabled();
  await expect
    .poll(() => chart(page).evaluate((el: any) => el.data?.length ?? 0))
    .toBeGreaterThan(0);
}
async function load(page: Page) {
  await page.goto("/");
  await paste(page);
  await run(page);
  await hover(page);
}
async function menu(page: Page, title: string) {
  await page.locator(`summary[title="${title}"]`).click();
}
const ranges = (page: Page) =>
  chart(page).evaluate((el: any) => ({
    x: [...el._fullLayout.xaxis.range],
    y: [...el._fullLayout.yaxis.range],
  }));

test("the reference-height input strip, icon-only rail and genuinely hover-only native toolbar", async ({
  page,
}) => {
  await load(page);
  expect(
    await page
      .locator(".source-controls")
      .evaluate((el) => el.getBoundingClientRect().height),
  ).toBe(47);
  expect(
    await page
      .locator(".tool-rail")
      .evaluate((el) => el.getBoundingClientRect().width),
  ).toBe(32);
  expect((await page.locator(".tool-rail").innerText()).trim()).toBe("");
  await page.mouse.move(12, 450);
  await expect
    .poll(() =>
      page
        .locator(".modebar-group")
        .first()
        .evaluate((el) => getComputedStyle(el).opacity),
    )
    .toBe("0");
  await hover(page);
  for (const name of [
    "Zoom",
    "Pan",
    "Zoom in",
    "Zoom out",
    "Autoscale",
    "Reset axes",
    "Add subtitle",
    ...Object.values(tools),
  ])
    await expect(tool(page, name)).toBeVisible();
  expect(await page.getByRole("dialog").count()).toBe(0);
  expect(
    await page.locator(".chart-status,.empty-state,.data-entry").count(),
  ).toBe(0);
  expect(await page.evaluate(() => location.hash)).toBe("#Custom");
});

test("multiline manual entry, strict input errors and preservation of the last valid PCA", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await load(page);
  expect(
    await chart(page).evaluate((el: any) =>
      el.data.reduce((n: number, t: any) => n + t.x.length, 0),
    ),
  ).toBe(180);
  const original = await chart(page).evaluate((el: any) => el.data[0].x);
  await page
    .getByLabel("Global25 coordinates", { exact: true })
    .fill("Bad,1,2");
  await page.getByRole("button", { name: "Run PCA", exact: true }).click();
  await expect(page.getByRole("alert")).toContainText("25 comma-separated");
  expect(await chart(page).evaluate((el: any) => el.data[0].x)).toEqual(
    original,
  );
  expect(errors).toEqual([]);
});

test("all marker sizes, point label contents and group label styles cycle exactly", async ({
  page,
}) => {
  await load(page);
  const size = () => chart(page).evaluate((el: any) => el.data[0].marker.size);
  expect(await size()).toBe(10);
  for (const expected of [7, 4, 10]) {
    await tool(page, tools.size).click();
    await expect.poll(size).toBe(expected);
  }
  for (const [mode, text] of [
    ["text+markers", "Synthetic_A:sample_1"],
    ["text+markers", "Synthetic_A"],
    ["text+markers", "sample_1"],
    ["markers", "Synthetic_A:sample_1"],
  ]) {
    await tool(page, tools.points).click();
    await expect
      .poll(() =>
        chart(page).evaluate((el: any) => [
          el.data[0].mode,
          el.data[0].text[0],
        ]),
      )
      .toEqual([mode, text]);
  }
  const annotation = () =>
    chart(page).evaluate((el: any) => ({
      arrow: el.layout.annotations[0].showarrow,
      font: el.layout.annotations[0].font.size,
      bg: el.layout.annotations[0].bgcolor,
    }));
  for (const expected of [
    { arrow: false, font: 9, bg: "rgba(255,255,255,0)" },
    { arrow: false, font: 9, bg: "rgba(255,255,255,0.66)" },
    { arrow: true, font: 11, bg: "rgba(255,255,255,0.75)" },
  ]) {
    await tool(page, tools.style).click();
    await expect.poll(annotation).toEqual(expected);
  }
});

test("hull opacity, geometry visibility and per-trace legend hiding work together", async ({
  page,
}) => {
  await load(page);
  const opacity = () =>
    chart(page).evaluate(
      (el: any) => el.layout.shapes.find((s: any) => s.type === "path").opacity,
    );
  expect(await opacity()).toBe(0.9);
  for (const value of [0.6, 0.3, 0.9]) {
    await tool(page, tools.opacity).click();
    await expect.poll(opacity).toBe(value);
  }
  for (const [name, kind] of [
    [tools.labels, "labels"],
    [tools.hulls, "hull"],
    [tools.regression, "regression"],
  ]) {
    await tool(page, name).click();
    await expect
      .poll(() =>
        chart(page).evaluate(
          (el: any, kind) =>
            kind === "labels"
              ? el.layout.annotations.every((a: any) => a.visible === false)
              : el.layout.shapes
                  .filter((s: any) => s.name.startsWith(kind + ":"))
                  .every((s: any) => s.visible === false),
          kind,
        ),
      )
      .toBe(true);
    await tool(page, name).click();
  }
  await page.locator(".legend .traces").first().click();
  await expect
    .poll(() => chart(page).evaluate((el: any) => el.data[0].visible))
    .toBe("legendonly");
  await expect
    .poll(() =>
      chart(page).evaluate((el: any) => el.layout.annotations[0].visible),
    )
    .toBe(false);
  await tool(page, tools.visibility).click();
  await expect
    .poll(() =>
      chart(page).evaluate((el: any) =>
        el.data.every((t: any) => t.visible === "legendonly"),
      ),
    )
    .toBe(true);
  await tool(page, tools.visibility).click();
  await expect
    .poll(() =>
      chart(page).evaluate((el: any) =>
        el.data.every((t: any) => t.visible === true),
      ),
    )
    .toBe(true);
});

test("wheel/buttons, pan/box zoom, legend toggle and reset axes retain the single canvas", async ({
  page,
}) => {
  await load(page);
  const before = await ranges(page),
    box = await chart(page).boundingBox();
  await page.mouse.move(box!.x + box!.width * 0.4, box!.y + box!.height * 0.45);
  await page.mouse.wheel(0, -200);
  await expect
    .poll(async () => {
      const r = await ranges(page);
      return r.x[1] - r.x[0];
    })
    .toBeLessThan(before.x[1] - before.x[0]);
  const zoomed = await ranges(page);
  await page.mouse.wheel(0, 200);
  await expect
    .poll(async () => {
      const r = await ranges(page);
      return r.x[1] - r.x[0];
    })
    .toBeGreaterThan(zoomed.x[1] - zoomed.x[0]);
  await tool(page, "Zoom in").click();
  const stable = await ranges(page);
  await tool(page, "Toggle legend: show / hide").click();
  await expect
    .poll(() => chart(page).evaluate((el: any) => el.layout.showlegend))
    .toBe(false);
  expect(await chart(page).boundingBox()).toEqual(box);
  expect(await ranges(page)).toEqual(stable);
  await tool(page, "Zoom out").click();
  await tool(page, "Pan").click();
  await page.mouse.move(box!.x + 400, box!.y + 400);
  await page.mouse.down();
  await page.mouse.move(box!.x + 460, box!.y + 430, { steps: 5 });
  await page.mouse.up();
  await expect
    .poll(async () => (await ranges(page)).x[0])
    .not.toBe(stable.x[0]);
  await tool(page, "Zoom").click();
  await expect
    .poll(() => chart(page).evaluate((el: any) => el.layout.dragmode))
    .toBe("zoom");
  await page.mouse.move(box!.x + 300, box!.y + 300);
  await page.mouse.down();
  await page.mouse.move(box!.x + 600, box!.y + 500, { steps: 5 });
  await page.mouse.up();
  await tool(page, "Reset axes").click();
  await expect.poll(async () => (await ranges(page)).x).toEqual(before.x);
  await page.getByRole("button", { name: "Reset plot", exact: true }).click();
  await expect
    .poll(() => chart(page).evaluate((el: any) => el.data.length))
    .toBe(0);
  await expect(page.locator(".population-chip")).toHaveCount(0);
});

test("grouping modes, custom names, subgroup overlays and creation settings", async ({
  page,
}) => {
  await page.goto("/");
  const rows = syntheticG25().split("\n");
  await paste(
    page,
    [...rows.slice(0, 3), ...rows.slice(30, 33), ...rows.slice(60, 63)].join(
      "\n",
    ),
  );
  await menu(page, "Grouping mode");
  await page.getByRole("button", { name: "Individual", exact: true }).click();
  await run(page);
  await expect
    .poll(() => chart(page).evaluate((el: any) => el.data.length))
    .toBe(9);
  await menu(page, "Grouping mode");
  await page.getByRole("button", { name: "As one group", exact: true }).click();
  await page.getByLabel("Custom group name").fill("Combined");
  await menu(page, "Addition options");
  await page.locator('label[for="subgroups"]').click();
  await expect(
    page.getByLabel("Aggregated subgroups", { exact: true }),
  ).toBeChecked();
  await page.locator('label[for="add-regression"]').click();
  await page.getByRole("button", { name: "Run PCA", exact: true }).click();
  await expect
    .poll(() => chart(page).evaluate((el: any) => el.data.length))
    .toBe(1);
  expect(await chart(page).evaluate((el: any) => el.data[0].name)).toBe(
    "Combined",
  );
  expect(
    await chart(page).evaluate((el: any) => el.layout.annotations.length),
  ).toBe(3);
  expect(await chart(page).evaluate((el: any) => el.layout.shapes.length)).toBe(
    3,
  );
  await menu(page, "Addition options");
  await page.locator('label[for="add-labels"]').click();
  await page.locator('label[for="add-hulls"]').click();
  await page.getByRole("button", { name: "Run PCA", exact: true }).click();
  await expect
    .poll(() =>
      chart(page).evaluate((el: any) => [
        el.layout.annotations.length,
        el.layout.shapes.length,
      ]),
    )
    .toEqual([0, 0]);
});

test("source marker option, raw/scaled selector, component selectors and subtitle", async ({
  page,
}) => {
  await load(page);
  await menu(page, "Addition options");
  await page
    .getByLabel("Marker appearance", { exact: true })
    .selectOption("g25");
  await run(page);
  await expect
    .poll(() => chart(page).evaluate((el: any) => el.data[0].marker.color))
    .toBe("#166f4e");
  expect(
    await chart(page).evaluate((el: any) => el.data[0].marker.symbol),
  ).toBe(0);
  await page.getByLabel("Horizontal component").selectOption("2");
  await expect
    .poll(() => chart(page).evaluate((el: any) => el.data[0].x))
    .not.toEqual(await chart(page).evaluate((el: any) => el.data[0].y));
  await hover(page);
  page.once("dialog", (dialog) => dialog.accept("My custom PCA"));
  await tool(page, "Add subtitle").click();
  await expect
    .poll(() => chart(page).evaluate((el: any) => el.layout.title.text))
    .toContain("My custom PCA");
  page.once("dialog", (dialog) => dialog.dismiss());
  await tool(page, "Add subtitle").click();
  await expect
    .poll(() => chart(page).evaluate((el: any) => el.layout.title.text))
    .toBe("Global 25 Custom PCA");
  await page.getByLabel("Manual coordinate scaling").selectOption("raw");
  await expect(page.getByLabel("Manual coordinate scaling")).toHaveValue("raw");
});

test("all 18 original image dimensions and a real 800 by 400 PNG download", async ({
  page,
}) => {
  await load(page);
  await page
    .locator("summary")
    .filter({ hasText: /^Save$/ })
    .click();
  const images = page.locator(".source-menu[open] .dropdown-item");
  await expect(images).toHaveCount(18);
  await expect(
    page.getByRole("button", { name: "7680×4320 px", exact: true }),
  ).toBeVisible();
  const download = page.waitForEvent("download");
  await page.getByRole("button", { name: "800×400 px", exact: true }).click();
  const file = await download;
  const path = await file.path();
  const bytes = await readFile(path!);
  expect(bytes.subarray(0, 8).toString("hex")).toBe("89504e470d0a1a0a");
  expect([bytes.readUInt32BE(16), bytes.readUInt32BE(20)]).toEqual([800, 400]);
});

test("annotation dragging survives toolbar changes and desktop layouts keep the chart maximized", async ({
  page,
}) => {
  await load(page);
  const label = page.locator(".annotation-text").first(),
    box = await label.boundingBox();
  await page.mouse.move(box!.x + box!.width / 2, box!.y + box!.height / 2);
  await page.mouse.down();
  await page.mouse.move(
    box!.x + box!.width / 2 + 55,
    box!.y + box!.height / 2 - 25,
    { steps: 8 },
  );
  await page.mouse.up();
  await expect
    .poll(() =>
      chart(page).evaluate((el: any) => Math.abs(el.layout.annotations[0].ax)),
    )
    .toBeGreaterThan(10);
  const offset = await chart(page).evaluate((el: any) => [
    el.layout.annotations[0].ax,
    el.layout.annotations[0].ay,
  ]);
  await tool(page, tools.size).click();
  await expect
    .poll(() =>
      chart(page).evaluate((el: any) => [
        el.layout.annotations[0].ax,
        el.layout.annotations[0].ay,
      ]),
    )
    .toEqual(offset);
  for (const width of [1280, 1440, 1600]) {
    await page.setViewportSize({ width, height: 900 });
    await expect
      .poll(() =>
        page
          .locator(".source-controls")
          .evaluate((el) => el.getBoundingClientRect().height),
      )
      .toBe(47);
    await expect
      .poll(() => page.evaluate(() => document.body.scrollWidth))
      .toBe(width);
    const bounds = await chart(page).boundingBox();
    expect(bounds!.width).toBe(width - 32 - 380);
    await expect
      .poll(() => chart(page).evaluate((el: any) => el._fullLayout.width))
      .toBe(width - 32 - 380);
    expect(bounds!.height).toBe(853);
  }
  await expect(
    page.getByRole("button", { name: "G25 distances — planned", exact: true }),
  ).toBeDisabled();
});
