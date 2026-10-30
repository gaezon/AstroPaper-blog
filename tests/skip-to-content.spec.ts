import { test, expect, type Page } from "@playwright/test";

const pages = [
  { path: "/", label: "home" },
  { path: "/translation-not-found/", label: "translation-not-found (zh-CN)" },
  { path: "/en/translation-not-found/", label: "translation-not-found (en)" },
];

const checkSkipLink = async (page: Page, path: string) => {
  await page.goto(path);

  await page.keyboard.press("Tab");

  const skipLink = page.locator("#skip-to-content");
  await expect(skipLink).toBeFocused();
  await expect
    .poll(async () => (await skipLink.boundingBox())?.y ?? -1)
    .toBeGreaterThanOrEqual(0);

  await page.keyboard.press("Enter");

  await expect(page.locator("#main-content")).toBeFocused();
  await expect(page).toHaveURL(/#main-content$/);
};

test.describe("Skip to content", () => {
  for (const { path, label } of pages) {
    test(`moves focus to the main landmark on ${label}`, async ({ page }) => {
      await checkSkipLink(page, path);
    });
  }

  test("still moves focus after a client-side navigation", async ({ page }) => {
    await page.goto("/posts/");
    await page.locator("main ul li a").first().click();
    await expect(page).toHaveURL(/\/posts\/[^/]+\/$/);

    // Reset focus so Tab starts from the first focusable element again.
    await page.evaluate(() => (document.activeElement as HTMLElement)?.blur());

    await page.keyboard.press("Tab");
    await expect(page.locator("#skip-to-content")).toBeFocused();

    await page.keyboard.press("Enter");
    await expect(page.locator("#main-content")).toBeFocused();
  });
});
