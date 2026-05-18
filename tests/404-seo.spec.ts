import { test, expect } from "@playwright/test";
import { getJsonLdNodes, hasJsonLdType } from "./helpers/json-ld";

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

      const nodes = await getJsonLdNodes(page);
      expect(nodes.some(node => hasJsonLdType(node, "BlogPosting"))).toBe(
        false
      );
    });
  }
});
