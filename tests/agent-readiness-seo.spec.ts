import { test, expect } from "@playwright/test";
import { findFirstJsonLdNodeByType, getJsonLdNodes } from "./helpers/json-ld";

const SITE = "https://blog.gaazeon.com";

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

  test("bilingual zh post preserves canonical, alternates, RSS, and translation JSON-LD", async ({
    page,
  }) => {
    await page.goto("/posts/Why-did-I-start-blogging/", {
      waitUntil: "domcontentloaded",
    });

    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
      "href",
      `${SITE}/posts/Why-did-I-start-blogging/`
    );
    await expect(
      page.locator('link[rel="alternate"][hreflang="zh-CN"]')
    ).toHaveAttribute("href", `${SITE}/posts/Why-did-I-start-blogging/`);
    await expect(
      page.locator('link[rel="alternate"][hreflang="en"]')
    ).toHaveAttribute("href", `${SITE}/en/posts/why-i-started-blogging/`);
    await expect(
      page.locator('link[rel="alternate"][hreflang="x-default"]')
    ).toHaveAttribute("href", `${SITE}/posts/Why-did-I-start-blogging/`);
    await expect(
      page.locator('link[rel="alternate"][type="application/rss+xml"]')
    ).toHaveAttribute("href", `${SITE}/rss.xml`);
    await expect(
      page.locator('meta[property="og:locale:alternate"]')
    ).toHaveAttribute("content", "en_US");

    const blogPosting = findFirstJsonLdNodeByType(
      await getJsonLdNodes(page),
      "BlogPosting"
    );
    expect(blogPosting?.sameAs).toEqual([
      `${SITE}/en/posts/why-i-started-blogging/`,
    ]);
    expect(blogPosting?.translationOfWork).toEqual({
      "@type": "CreativeWork",
      "@id": `${SITE}/en/posts/why-i-started-blogging/`,
    });
  });

  test("bilingual en post preserves canonical, alternates, RSS, and translation JSON-LD", async ({
    page,
  }) => {
    await page.goto("/en/posts/why-i-started-blogging/", {
      waitUntil: "domcontentloaded",
    });

    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
      "href",
      `${SITE}/en/posts/why-i-started-blogging/`
    );
    await expect(
      page.locator('link[rel="alternate"][hreflang="zh-CN"]')
    ).toHaveAttribute("href", `${SITE}/posts/Why-did-I-start-blogging/`);
    await expect(
      page.locator('link[rel="alternate"][hreflang="en"]')
    ).toHaveAttribute("href", `${SITE}/en/posts/why-i-started-blogging/`);
    await expect(
      page.locator('link[rel="alternate"][hreflang="x-default"]')
    ).toHaveAttribute("href", `${SITE}/posts/Why-did-I-start-blogging/`);
    await expect(
      page.locator('link[rel="alternate"][type="application/rss+xml"]')
    ).toHaveAttribute("href", `${SITE}/rss.en.xml`);
    await expect(
      page.locator('meta[property="og:locale:alternate"]')
    ).toHaveAttribute("content", "zh_CN");

    const blogPosting = findFirstJsonLdNodeByType(
      await getJsonLdNodes(page),
      "BlogPosting"
    );
    expect(blogPosting?.sameAs).toEqual([
      `${SITE}/posts/Why-did-I-start-blogging/`,
    ]);
    expect(blogPosting?.translationOfWork).toEqual({
      "@type": "CreativeWork",
      "@id": `${SITE}/posts/Why-did-I-start-blogging/`,
    });
  });

  test("single-language posts do not invent target-language SEO alternates", async ({
    page,
  }) => {
    await page.goto("/posts/upgrade-astropaper-git/", {
      waitUntil: "domcontentloaded",
    });

    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
      "href",
      `${SITE}/posts/upgrade-astropaper-git/`
    );
    await expect(
      page.locator('link[rel="alternate"][hreflang="zh-CN"]')
    ).toHaveAttribute("href", `${SITE}/posts/upgrade-astropaper-git/`);
    await expect(
      page.locator('link[rel="alternate"][hreflang="en"]')
    ).toHaveCount(0);
    await expect(
      page.locator('link[rel="alternate"][hreflang="x-default"]')
    ).toHaveAttribute("href", `${SITE}/posts/upgrade-astropaper-git/`);
    await expect(
      page.locator('meta[property="og:locale:alternate"]')
    ).toHaveCount(0);

    const blogPosting = findFirstJsonLdNodeByType(
      await getJsonLdNodes(page),
      "BlogPosting"
    );
    expect(blogPosting?.sameAs).toBeUndefined();
    expect(blogPosting?.translationOfWork).toBeUndefined();
  });
});
