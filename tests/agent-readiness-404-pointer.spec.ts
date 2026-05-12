import { test, expect } from "@playwright/test";

test.describe("agent-readiness 404 pointer links (Req 7.7)", () => {
  for (const url of [
    "/nonexistent-page-for-404-test/",
    "/en/nonexistent-page-for-404-test/",
  ]) {
    test(`${url} — has visible links to llms.txt and agent-integration.md`, async ({
      page,
    }) => {
      await page.goto(url, { waitUntil: "domcontentloaded" });
      const llmsLink = page.locator('a[href="/llms.txt"]');
      await expect(llmsLink).toBeVisible();
      const agentLink = page.locator('a[href="/agent-integration.md"]');
      await expect(agentLink).toBeVisible();
    });
  }
});
