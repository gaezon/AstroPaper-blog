import { test, expect } from "@playwright/test";

const pages = [
  "/",
  "/en/",
  "/posts/Why-did-I-start-blogging/",
  "/en/posts/why-i-started-blogging/",
  "/nonexistent-page-for-404-test/",
  "/en/nonexistent-page-for-404-test/",
];

test.describe("agent-readiness main landmark (P20)", () => {
  for (const url of pages) {
    test(`${url} — exactly one <main> element`, async ({ page }) => {
      await page.goto(url, { waitUntil: "domcontentloaded" });
      const mainCount = await page.locator("main").count();
      expect(mainCount).toBe(1);
    });
  }
});
