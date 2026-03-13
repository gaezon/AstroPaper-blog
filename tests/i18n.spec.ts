import { test, expect } from "@playwright/test";

test.describe("i18n regressions", () => {
  test("english blog nav item should stay highlighted", async ({ page }) => {
    await page.goto("/en/posts/");
    const blogLink = page.locator('#nav-menu a[href="/en/posts/"]').first();
    const hasActiveClass = await blogLink.evaluate(el =>
      el.classList.contains("active-nav")
    );
    expect(hasActiveClass).toBeTruthy();
  });

  test("english post back button should link to english home", async ({
    page,
  }) => {
    await page.goto("/en/");
    await page.waitForFunction(
      () => window.sessionStorage.getItem("backUrl") !== null
    );
    const firstPostLink = page.locator("main ul li a").first();
    await firstPostLink.click();
    await page.waitForSelector("#back-button");
    const href = await page.getAttribute("#back-button", "href");
    expect(href && href.startsWith("/en/")).toBeTruthy();
  });

  test("language switcher should preserve search query when switching locales", async ({
    page,
  }) => {
    await page.goto("/en/search/?q=astro");
    const dropdown = page.locator(".language-switcher-dropdown").first();
    await dropdown.locator("button").click();
    const zhLink = dropdown.locator('a[hreflang="zh-CN"]').first();
    const href = await zhLink.getAttribute("href");
    expect(href).toContain("?q=astro");
  });

  test("english tags page should exist", async ({ page }) => {
    const response = await page.goto("/en/tags/");
    expect(response?.status()).toBe(200);
  });

  test("english archives page should exist", async ({ page }) => {
    const response = await page.goto("/en/archives/");
    expect(response?.status()).toBe(200);
  });

  test("translated tag should switch to localized english tag detail page", async ({
    page,
  }) => {
    await page.goto("/tags/cubox替代/");

    const dropdown = page.locator(".language-switcher-dropdown").first();
    await dropdown.locator("button").click();

    const enLink = dropdown.locator('a[hreflang="en"]').first();
    await expect(enLink).toHaveAttribute("href", "/en/tags/cubox-alternative/");

    const alternateHref = await page.evaluate(
      () =>
        document
          .querySelector('link[rel="alternate"][hreflang="en"]')
          ?.getAttribute("href") ?? null
    );

    expect(alternateHref).toContain("/en/tags/cubox-alternative/");
  });

  test("shared tag should keep the localized tag detail page", async ({
    page,
  }) => {
    await page.goto("/tags/selfhost/");

    const dropdown = page.locator(".language-switcher-dropdown").first();
    await dropdown.locator("button").click();

    const enLink = dropdown.locator('a[hreflang="en"]').first();
    await expect(enLink).toHaveAttribute("href", "/en/tags/selfhost/");

    const alternateHref = await page.evaluate(
      () =>
        document
          .querySelector('link[rel="alternate"][hreflang="en"]')
          ?.getAttribute("href") ?? null
    );

    expect(alternateHref).toContain("/en/tags/selfhost/");
  });

  test("zh-only tag should still fall back to english tag index", async ({
    page,
  }) => {
    await page.goto("/tags/astropaper/");

    const dropdown = page.locator(".language-switcher-dropdown").first();
    await dropdown.locator("button").click();

    const enLink = dropdown.locator('a[hreflang="en"]').first();
    await expect(enLink).toHaveAttribute("href", "/en/tags/");

    const alternateHref = await page.evaluate(
      () =>
        document
          .querySelector('link[rel="alternate"][hreflang="en"]')
          ?.getAttribute("href") ?? null
    );

    expect(alternateHref).toBeNull();
  });

  test("translated tag should switch from en to zh tag detail page", async ({
    page,
  }) => {
    await page.goto("/en/tags/cubox-alternative/");

    const dropdown = page.locator(".language-switcher-dropdown").first();
    await dropdown.locator("button").click();

    const zhLink = dropdown.locator('a[hreflang="zh-CN"]').first();
    const href = await zhLink.getAttribute("href");
    expect(href).toMatch(
      /\/tags\/cubox%E6%9B%BF%E4%BB%A3\/|\/tags\/cubox替代\//
    );

    const alternateHref = await page.evaluate(
      () =>
        document
          .querySelector('link[rel="alternate"][hreflang="zh-CN"]')
          ?.getAttribute("href") ?? null
    );

    expect(alternateHref).toMatch(
      /\/tags\/cubox%E6%9B%BF%E4%BB%A3\/|\/tags\/cubox替代\//
    );
  });

  test("translated tag should switch from en automation to zh 自动化", async ({
    page,
  }) => {
    await page.goto("/en/tags/automation/");

    const dropdown = page.locator(".language-switcher-dropdown").first();
    await dropdown.locator("button").click();

    const zhLink = dropdown.locator('a[hreflang="zh-CN"]').first();
    const href = await zhLink.getAttribute("href");
    expect(href).toMatch(
      /\/tags\/%E8%87%AA%E5%8A%A8%E5%8C%96\/|\/tags\/自动化\//
    );

    const alternateHref = await page.evaluate(
      () =>
        document
          .querySelector('link[rel="alternate"][hreflang="zh-CN"]')
          ?.getAttribute("href") ?? null
    );

    expect(alternateHref).toMatch(
      /\/tags\/%E8%87%AA%E5%8A%A8%E5%8C%96\/|\/tags\/自动化\//
    );
  });
});
