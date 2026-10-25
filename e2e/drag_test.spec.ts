import { expect, test } from "@playwright/test";
import { syntheticDatabase } from "./fixtures";

test("population and group labels have horizontal resistance and straight leader line snapping", async ({
  page,
}) => {
  await page.goto("/");
  await page.locator('input[type="file"]').setInputFiles({
    name: "synthetic.tsv",
    mimeType: "text/tab-separated-values",
    buffer: Buffer.from(syntheticDatabase()),
  });
  await page.getByLabel("Search populations or genetic IDs").fill("Synthetic_A");
  await page.getByRole("button", { name: "Select population Synthetic_A", exact: true }).click();
  await page.waitForTimeout(500);

  // Turn on population labels (callout mode with leader connector)
  await page.getByTitle(/Cycle population labels/).click();
  await page.waitForTimeout(500);

  const getAnnotations = async () =>
    page.evaluate(() => {
      const gd = document.querySelector(".pca-chart") as any;
      return gd.layout.annotations.map((a: any) => ({
        text: a.text,
        ax: a.ax,
        ay: a.ay,
      }));
    });

  const ann = page.locator(".annotation-text-g").first();

  // 1. Dragging vertically with small horizontal tremor (<= 8px) keeps leader line straight (ax = 0)
  let curBox = await ann.boundingBox();
  expect(curBox).not.toBeNull();
  if (curBox) {
    await page.mouse.move(curBox.x + curBox.width / 2, curBox.y + curBox.height / 2);
    await page.mouse.down();
    await page.mouse.move(curBox.x + curBox.width / 2 + 5, curBox.y + curBox.height / 2 - 35, { steps: 5 });
    await page.mouse.up();
    await page.waitForTimeout(200);

    const anns = await getAnnotations();
    expect(anns[0].ax).toBe(0);
    expect(anns[0].ay).toBe(-35);
  }

  // 2. Dragging vertically in opposite direction with negative tremor (dx = -6px <= 8px)
  curBox = await ann.boundingBox();
  if (curBox) {
    await page.mouse.move(curBox.x + curBox.width / 2, curBox.y + curBox.height / 2);
    await page.mouse.down();
    await page.mouse.move(curBox.x + curBox.width / 2 - 6, curBox.y + curBox.height / 2 + 15, { steps: 5 });
    await page.mouse.up();
    await page.waitForTimeout(200);

    const anns = await getAnnotations();
    expect(anns[0].ax).toBe(0);
    expect(anns[0].ay).toBe(-20);
  }

  // 3. Deliberate horizontal drag exceeding resistance threshold (> 8px) deflects leader line
  curBox = await ann.boundingBox();
  if (curBox) {
    await page.mouse.move(curBox.x + curBox.width / 2, curBox.y + curBox.height / 2);
    await page.mouse.down();
    await page.mouse.move(curBox.x + curBox.width / 2 + 16, curBox.y + curBox.height / 2, { steps: 5 });
    await page.mouse.up();
    await page.waitForTimeout(200);

    const anns = await getAnnotations();
    expect(anns[0].ax).toBe(16);
    expect(anns[0].ay).toBe(-20);
  }

  // 4. Dragging back towards centroid within 8px resistance threshold snaps ax back to 0
  curBox = await ann.boundingBox();
  if (curBox) {
    await page.mouse.move(curBox.x + curBox.width / 2, curBox.y + curBox.height / 2);
    await page.mouse.down();
    // Move left by 12px (ending at +4px from center, within 8px threshold)
    await page.mouse.move(curBox.x + curBox.width / 2 - 12, curBox.y + curBox.height / 2, { steps: 5 });
    await page.mouse.up();
    await page.waitForTimeout(200);

    const anns = await getAnnotations();
    expect(anns[0].ax).toBe(0);
    expect(anns[0].ay).toBe(-20);
  }

  // 5. Subsequent vertical drag after snapping still possesses 8px resistance
  curBox = await ann.boundingBox();
  if (curBox) {
    await page.mouse.move(curBox.x + curBox.width / 2, curBox.y + curBox.height / 2);
    await page.mouse.down();
    await page.mouse.move(curBox.x + curBox.width / 2 + 7, curBox.y + curBox.height / 2 - 20, { steps: 5 });
    await page.mouse.up();
    await page.waitForTimeout(200);

    const anns = await getAnnotations();
    expect(anns[0].ax).toBe(0);
    expect(anns[0].ay).toBe(-40);
  }
});
