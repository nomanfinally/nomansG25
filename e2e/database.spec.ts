import { expect, test, type Page } from "@playwright/test";
import { syntheticDatabase, syntheticG25 } from "./fixtures";
const search = (page: Page) =>
  page.getByLabel("Search populations or genetic IDs");
const plot = (page: Page) => page.locator(".pca-chart");
const pointCount = (page: Page) =>
  plot(page).evaluate(
    (el: any) =>
      el.data?.reduce((n: number, t: any) => n + (t.x?.length ?? 0), 0) ?? 0,
  );
async function importDatabase(
  page: Page,
  text = syntheticDatabase(),
  name = "synthetic.tsv",
) {
  await page.locator('input[type="file"]').setInputFiles({
    name,
    mimeType: "text/tab-separated-values",
    buffer: Buffer.from(text),
  });
  await expect(page.locator(".database-file-status")).toContainText(name);
}
async function population(page: Page, group: string) {
  await search(page).fill(group);
  await page
    .getByRole("button", { name: `Select population ${group}`, exact: true })
    .click();
}
async function sample(page: Page, id: string) {
  await search(page).fill(id);
  await search(page).press("Enter");
}

test("TSV population chips, expandable samples and immediate add/remove refits", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto("/");
  await importDatabase(page);
  await expect(page.locator(".database-file-status")).toContainText(
    "180 samples · 6 groups",
  );
  await expect(page.locator(".database-file-status")).toContainText(
    "1 row without coordinates skipped",
  );
  await population(page, "Synthetic_A");
  await expect.poll(() => pointCount(page)).toBe(30);
  await expect(search(page)).toBeFocused();
  await expect(search(page)).toHaveValue("");
  await population(page, "Synthetic_B");
  await expect.poll(() => pointCount(page)).toBe(60);
  await expect(page.locator(".population-chip")).toHaveCount(2);
  await search(page).fill("Synthetic_A");
  await page
    .getByRole("button", { name: "Expand population Synthetic_A", exact: true })
    .click();
  const group = page.locator(".database-group").first();
  await group
    .getByRole("button", {
      name: "Remove sample Synthetic_A_sample_1 in Synthetic_A",
      exact: true,
    })
    .click();
  await expect.poll(() => pointCount(page)).toBe(59);
  await expect(
    page.locator(".population-chip").filter({ hasText: "Synthetic_A" }),
  ).toContainText("29");
  await group
    .getByRole("button", {
      name: "Select sample Synthetic_A_sample_1 in Synthetic_A",
      exact: true,
    })
    .click();
  await expect.poll(() => pointCount(page)).toBe(60);
  await page
    .getByRole("button", { name: "Remove Synthetic_A", exact: true })
    .click();
  await expect.poll(() => pointCount(page)).toBe(30);
  await page
    .getByRole("button", { name: "Clear selection", exact: true })
    .click();
  await expect.poll(() => pointCount(page)).toBe(0);
  expect(errors).toEqual([]);
});

test("genetic ID Enter adds only that sample and population overlap never double counts", async ({
  page,
}) => {
  await page.goto("/");
  await importDatabase(page);
  await sample(page, "Synthetic_A_sample_1");
  await expect(page.locator(".population-chip.individual")).toHaveCount(1);
  await expect(page.locator(".data-count")).toHaveText("1 selected");
  await expect(page.locator(".selection-status")).toContainText("at least 3");
  await sample(page, "Synthetic_A_sample_2");
  await sample(page, "Synthetic_B_sample_1");
  await expect.poll(() => pointCount(page)).toBe(3);
  await population(page, "Synthetic_A");
  await expect.poll(() => pointCount(page)).toBe(31);
  await expect(page.locator(".population-chip")).toHaveCount(2);
  await expect(page.locator(".population-chip.individual")).toHaveCount(1);
  await sample(page, "Synthetic_A_sample_1");
  await expect.poll(() => pointCount(page)).toBe(30);
  await search(page).fill("not-a-real-pop");
  await expect(
    page.getByText("No group ID or genetic ID matches", { exact: false }),
  ).toBeVisible();
  await search(page).press("Escape");
  await expect(search(page)).toHaveValue("");
});

test("manual raw coordinates combine with the database; bad inputs preserve the last valid data", async ({
  page,
}) => {
  await page.goto("/");
  await importDatabase(page);
  await population(page, "Synthetic_A");
  await expect.poll(() => pointCount(page)).toBe(30);
  const pasted = syntheticG25()
    .split("\n")
    .slice(60, 63)
    .join("\n")
    .replaceAll("Synthetic_C", "Manual_C");
  await page.locator(".manual-source summary").click();
  await page.getByLabel("Manual coordinate scaling").selectOption("raw");
  await page.getByLabel("Global25 coordinates", { exact: true }).fill(pasted);
  await page
    .getByRole("button", { name: "Add coordinates", exact: true })
    .click();
  await expect.poll(() => pointCount(page)).toBe(33);
  const input = await plot(page).evaluate(
    (el: any) => el.data.find((t: any) => t.name === "Manual_C").x,
  );
  await page
    .getByLabel("Global25 coordinates", { exact: true })
    .fill("Bad,1,2");
  await page
    .getByRole("button", { name: "Add coordinates", exact: true })
    .click();
  await expect(page.getByRole("alert")).toContainText("25 comma-separated");
  expect(await pointCount(page)).toBe(33);
  expect(
    await plot(page).evaluate(
      (el: any) => el.data.find((t: any) => t.name === "Manual_C").x,
    ),
  ).toEqual(input);
  await page.locator('input[type="file"]').setInputFiles({
    name: "broken.tsv",
    mimeType: "text/plain",
    buffer: Buffer.from("bad\theader\n1\t2"),
  });
  await expect(page.locator(".database-source [role=alert]")).toContainText(
    "Expected Group ID",
  );
  await expect(page.locator(".database-file-status")).toContainText(
    "synthetic.tsv",
  );
  expect(await pointCount(page)).toBe(33);
  await importDatabase(page, syntheticDatabase(), "replacement.tsv");
  await expect.poll(() => pointCount(page)).toBe(3);
  await expect(page.locator(".population-chip")).toHaveCount(1);
  await expect(page.locator(".population-chip")).toContainText("Manual_C");
});

test("keyboard results, rapid selection changes and removing below minimum leave no stale plot", async ({
  page,
}) => {
  await page.goto("/");
  await importDatabase(page);
  await search(page).fill("Synthetic_A");
  await search(page).press("ArrowDown");
  await expect(
    page.getByRole("button", {
      name: "Select population Synthetic_A",
      exact: true,
    }),
  ).toBeFocused();
  await page.keyboard.press("Enter");
  await expect.poll(() => pointCount(page)).toBe(30);
  await search(page).fill("Synthetic_A");
  await page
    .getByRole("button", { name: "Expand population Synthetic_A", exact: true })
    .click();
  await expect(
    page.getByRole("button", {
      name: "Collapse population Synthetic_A",
      exact: true,
    }),
  ).toHaveAttribute("aria-expanded", "true");
  await page.keyboard.press("Escape");
  await expect(search(page)).toBeFocused();
  await population(page, "Synthetic_B");
  await page
    .getByRole("button", { name: "Clear selection", exact: true })
    .click();
  await expect.poll(() => pointCount(page)).toBe(0);
  await expect(page.locator(".data-count")).toHaveText("0 selected");
  await sample(page, "Synthetic_A_sample_1");
  await sample(page, "Synthetic_A_sample_2");
  await expect(page.locator(".selection-status")).toContainText("at least 3");
  await expect.poll(() => pointCount(page)).toBe(0);
});

test("Ctrl+click adds population chips without clearing the search query", async ({
  page,
}) => {
  await page.goto("/");
  await importDatabase(page);
  await search(page).fill("Synthetic");

  const popA = page.getByRole("button", {
    name: "Select population Synthetic_A",
    exact: true,
  });
  const popB = page.getByRole("button", {
    name: "Select population Synthetic_B",
    exact: true,
  });

  await expect(popA).toBeVisible();
  await expect(popB).toBeVisible();

  // Ctrl+click on Synthetic_A
  await popA.click({ modifiers: ["ControlOrMeta"] });
  await expect(page.locator(".population-chip")).toHaveCount(1);
  await expect(page.locator(".population-chip").first()).toContainText("Synthetic_A");
  // Query should still be "Synthetic" and input focused
  await expect(search(page)).toHaveValue("Synthetic");
  await expect(search(page)).toBeFocused();

  // Ctrl+click on Synthetic_B from the still-visible results
  await popB.click({ modifiers: ["ControlOrMeta"] });
  await expect(page.locator(".population-chip")).toHaveCount(2);
  await expect(search(page)).toHaveValue("Synthetic");

  // Regular click without modifiers adds population and clears search
  const popC = page.getByRole("button", {
    name: "Select population Synthetic_C",
    exact: true,
  });
  await popC.click();
  await expect(page.locator(".population-chip")).toHaveCount(3);
  await expect(search(page)).toHaveValue("");
});

