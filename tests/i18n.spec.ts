import { test, expect } from '@playwright/test';

test.describe('i18n regressions', () => {
  test('english blog nav item should stay highlighted', async ({ page }) => {
    await page.goto('/en/posts/');
    const blogLink = page.locator('#nav-menu a[href="/en/posts/"]').first();
    const hasActiveClass = await blogLink.evaluate(el => el.classList.contains('active-nav'));
    expect(hasActiveClass).toBeTruthy();
  });

  test('english post back button should link to english home', async ({ page }) => {
    await page.goto('/en/');
    await page.waitForFunction(() => window.sessionStorage.getItem('backUrl') !== null);
    const firstPostLink = page.locator('main ul li a').first();
    await firstPostLink.click();
    await page.waitForSelector('#back-button');
    const href = await page.getAttribute('#back-button', 'href');
    expect(href && href.startsWith('/en/')).toBeTruthy();
  });

  test('language switcher should preserve search query when switching locales', async ({ page }) => {
    await page.goto('/en/search/?q=astro');
    const dropdown = page.locator('.language-switcher-dropdown').first();
    await dropdown.locator('button').click();
    const zhLink = dropdown.locator('a[hreflang="zh-CN"]').first();
    const href = await zhLink.getAttribute('href');
    expect(href).toContain('?q=astro');
  });

  test('english tags page should exist', async ({ page }) => {
    const response = await page.goto('/en/tags/');
    expect(response?.status()).toBe(200);
  });

  test('english archives page should exist', async ({ page }) => {
    const response = await page.goto('/en/archives/');
    expect(response?.status()).toBe(200);
  });
});
