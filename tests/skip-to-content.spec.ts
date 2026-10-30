import { test, expect } from "@playwright/test";

test.describe("Skip to content", () => {
  test("moves focus to the main landmark", async ({ page }) => {
    await page.goto("/");

    await page.keyboard.press("Tab");

    const skipLink = page.locator("#skip-to-content");
    await expect(skipLink).toBeFocused();
    await expect
      .poll(async () => (await skipLink.boundingBox())?.y ?? -1)
      .toBeGreaterThanOrEqual(0);

    await page.keyboard.press("Enter");

    const mainContent = page.locator("#main-content");
    await expect(mainContent).toBeFocused();
    await expect(page).toHaveURL(/#main-content$/);
  });

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
