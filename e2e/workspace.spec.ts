import { expect, test, type Page } from "@playwright/test";
import { syntheticG25 } from "./fixtures";

const chart = (page: Page) => page.locator(".pca-chart");
const ranges = (page: Page) =>
  chart(page).evaluate((el: any) => ({
    x: [...el._fullLayout.xaxis.range],
    y: [...el._fullLayout.yaxis.range],
  }));
const span = (range: number[]) => range[1] - range[0];
async function load(page: Page) {
  await page.goto("/");
  await page
    .getByRole("button", { name: "Paste coordinates", exact: true })
    .click();
  await page
    .getByLabel("G25 coordinates", { exact: true })
    .fill(syntheticG25());
  await page
    .locator(".toolbar")
    .getByRole("button", { name: "Run PCA", exact: true })
    .click();
  await expect(
    page.getByRole("button", { name: "Zoom in", exact: true }),
  ).toBeEnabled();
  await expect
    .poll(() => chart(page).evaluate((el: any) => el.data?.length))
    .toBe(6);
}

test("data flow, group marker styling, axis selection and invalid input preservation", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await load(page);
  const marks = await chart(page).evaluate((el: any) =>
    el.data.map((trace: any) => ({
      symbol: trace.marker.symbol,
      size: trace.marker.size,
      outline: trace.marker.line.color,
      color: trace.marker.color,
    })),
  );
  expect(new Set(marks.map((m: any) => m.symbol)).size).toBe(6);
  expect(marks.every((m: any) => m.outline !== m.color && m.size === 7.5)).toBe(
    true,
  );
  await page.getByLabel("Horizontal component").selectOption("2");
  await expect
    .poll(() => chart(page).evaluate((el: any) => el.layout.xaxis.title.text))
    .toMatch(/^PC3 /);
  const original = await chart(page).evaluate((el: any) => el.data[0].x);
  await page.locator("[data-data-trigger]").first().click();
  await page.getByLabel("G25 coordinates", { exact: true }).fill("Bad,1,2");
  await page
    .locator(".toolbar")
    .getByRole("button", { name: "Run PCA", exact: true })
    .click();
  await expect(page.getByRole("alert")).toContainText("25 comma-separated");
  expect(await chart(page).evaluate((el: any) => el.data[0].x)).toEqual(
    original,
  );
  expect(errors).toEqual([]);
});

test("wheel and toolbar zoom, pan, reset and all view toggles preserve the correct frame", async ({
  page,
}) => {
  await load(page);
  const before = await ranges(page);
  const box = await chart(page).boundingBox();
  await page.mouse.move(box!.x + box!.width * 0.35, box!.y + box!.height * 0.4);
  await page.mouse.wheel(0, -200);
  await expect
    .poll(async () => span((await ranges(page)).x))
    .toBeLessThan(span(before.x));
  const zoomed = await ranges(page);
  await page.mouse.wheel(0, 200);
  await expect
    .poll(async () => span((await ranges(page)).x))
    .toBeGreaterThan(span(zoomed.x));
  await page.getByRole("button", { name: "Zoom in", exact: true }).click();
  await expect
    .poll(async () => span((await ranges(page)).x))
    .toBeLessThan(span(before.x));
  const stable = await ranges(page);
  const frame = await chart(page).evaluate((el: any) => ({
    w: el._fullLayout.xaxis._length,
    h: el._fullLayout.yaxis._length,
  }));
  for (const name of [
    "Toggle legend",
    "Toggle group labels",
    "Toggle convex hulls",
    "Toggle regression lines",
  ]) {
    await page.getByRole("button", { name, exact: true }).click();
    await expect
      .poll(async () =>
        page
          .getByRole("button", { name, exact: true })
          .getAttribute("aria-pressed"),
      )
      .toBe(name === "Toggle legend" ? "false" : "true");
  }
  await expect
    .poll(() => chart(page).evaluate((el: any) => el.layout.annotations.length))
    .toBe(6);
  await expect
    .poll(() => chart(page).evaluate((el: any) => el.layout.shapes.length))
    .toBe(12);
  expect(await ranges(page)).toEqual(stable);
  expect(
    await chart(page).evaluate((el: any) => ({
      w: el._fullLayout.xaxis._length,
      h: el._fullLayout.yaxis._length,
    })),
  ).toEqual(frame);
  await page.mouse.move(box!.x + box!.width * 0.5, box!.y + box!.height * 0.6);
  await page.mouse.down();
  await page.mouse.move(
    box!.x + box!.width * 0.5 + 60,
    box!.y + box!.height * 0.6 + 30,
    { steps: 6 },
  );
  await page.mouse.up();
  await expect
    .poll(async () => (await ranges(page)).x[0])
    .not.toBe(stable.x[0]);
  await page.getByRole("button", { name: "Reset view", exact: true }).click();
  await expect.poll(async () => (await ranges(page)).x).toEqual(before.x);
});

test("input scaling changes require an explicit rerun and PNG download works", async ({
  page,
}) => {
  await load(page);
  const original = await chart(page).evaluate((el: any) => el.data[0].x);
  await page.getByLabel("Coordinate scaling").selectOption("raw");
  await expect(
    page.getByText("Input changed — Run PCA to update", { exact: false }),
  ).toBeVisible();
  expect(await chart(page).evaluate((el: any) => el.data[0].x)).toEqual(
    original,
  );
  const download = page.waitForEvent("download");
  await page.getByRole("button", { name: "Save PNG", exact: true }).click();
  const file = await download;
  expect(file.suggestedFilename()).toBe("G25_Custom_PCA.png");
  expect(await file.failure()).toBeNull();
});

test("desktop layouts and keyboard data entry remain compact", async ({
  page,
}) => {
  await page.goto("/");
  await page
    .getByRole("button", { name: "Paste coordinates", exact: true })
    .click();
  await expect(
    page.getByLabel("G25 coordinates", { exact: true }),
  ).toBeFocused();
  await page
    .getByLabel("G25 coordinates", { exact: true })
    .fill(syntheticG25());
  await page.keyboard.press("Control+Enter");
  await expect(
    page.getByRole("button", { name: "Zoom in", exact: true }),
  ).toBeEnabled();
  await page.locator("[data-data-trigger]").first().click();
  await page.keyboard.press("Escape");
  await expect(page.locator(".data-entry")).toHaveCount(0);
  for (const width of [1280, 1440, 1600]) {
    await page.setViewportSize({ width, height: 900 });
    await expect
      .poll(() => page.evaluate(() => document.body.scrollWidth))
      .toBe(width);
    const button = await page
      .getByRole("button", { name: "Save PNG", exact: true })
      .boundingBox();
    expect(button!.x + button!.width).toBeLessThanOrEqual(width);
    expect(await page.getByRole("dialog").count()).toBe(0);
  }
  await expect(page.getByRole("button", { name: /Distances/ })).toBeDisabled();
  await expect(page.getByRole("button", { name: /Models/ })).toBeDisabled();
});
