import { test, expect } from "@playwright/test";

const pages = [
  "/",
  "/en/",
  "/posts/Why-did-I-start-blogging/",
  "/en/posts/why-i-started-blogging/",
  "/about/",
  "/en/about/",
  "/tags/",
  "/en/tags/",
  "/nonexistent-page-for-404-test/",
  "/en/nonexistent-page-for-404-test/",
];

test.describe("agent-readiness JSON-LD validity (P7)", () => {
  for (const url of pages) {
    test(`${url} — all JSON-LD blocks parse and round-trip`, async ({
      page,
    }) => {
      await page.goto(url, { waitUntil: "domcontentloaded" });
      const scripts = await page
        .locator('script[type="application/ld+json"]')
        .allTextContents();
      for (const s of scripts) {
        const parsed = JSON.parse(s); // should not throw
        const roundTripped = JSON.parse(JSON.stringify(parsed));
        expect(roundTripped).toEqual(parsed);
      }
    });
  }
});
