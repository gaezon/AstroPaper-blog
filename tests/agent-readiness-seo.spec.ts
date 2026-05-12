import { test, expect } from "@playwright/test";

const pages = [
  {
    url: "/posts/Why-did-I-start-blogging/",
    locale: "zh-CN",
    lang: "zh-CN",
    ogLocale: "zh_CN",
  },
  {
    url: "/en/posts/why-i-started-blogging/",
    locale: "en",
    lang: "en",
    ogLocale: "en_US",
  },
];

test.describe("agent-readiness SEO signals (P19)", () => {
  for (const { url, lang, ogLocale } of pages) {
    test(`${url} — html lang, og:locale, hreflang`, async ({ page }) => {
      await page.goto(url, { waitUntil: "domcontentloaded" });

      // html lang
      const htmlLang = await page.getAttribute("html", "lang");
      expect(htmlLang).toBe(lang);

      // og:locale
      const ogLocaleContent = await page.getAttribute(
        'meta[property="og:locale"]',
        "content"
      );
      expect(ogLocaleContent).toBe(ogLocale);

      // hreflang x-default exists
      const xDefault = await page
        .locator('link[rel="alternate"][hreflang="x-default"]')
        .count();
      expect(xDefault).toBeGreaterThanOrEqual(1);
    });
  }

  // Bilingual pages should have og:locale:alternate
  for (const { url } of pages) {
    test(`${url} — has og:locale:alternate`, async ({ page }) => {
      await page.goto(url, { waitUntil: "domcontentloaded" });
      const altCount = await page
        .locator('meta[property="og:locale:alternate"]')
        .count();
      expect(altCount).toBeGreaterThanOrEqual(1);
    });
  }
});
