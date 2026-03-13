import { test, expect } from "@playwright/test";

test.describe("404 SEO", () => {
  for (const pathname of ["/__missing__/", "/en/__missing__/"]) {
    test(`404 page should avoid misleading SEO tags for ${pathname}`, async ({
      page,
    }) => {
      const response = await page.goto(pathname);

      expect(response?.status()).toBe(404);

      await expect(
        page.locator('meta[name="robots"][content="noindex,follow"]')
      ).toHaveCount(1);

      await expect(page.locator('link[rel="canonical"]')).toHaveCount(0);
      await expect(page.locator('link[rel="alternate"][hreflang]')).toHaveCount(
        0
      );
      await expect(page.locator('meta[property="og:url"]')).toHaveCount(0);
      await expect(page.locator('meta[property="twitter:url"]')).toHaveCount(0);

      const structuredDataScripts = await page
        .locator('script[type="application/ld+json"]')
        .evaluateAll(elements =>
          elements.map(element => element.textContent?.trim() ?? "")
        );

      expect(
        structuredDataScripts.some(content => content.includes('"BlogPosting"'))
      ).toBeFalsy();
    });
  }
});
