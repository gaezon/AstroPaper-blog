import { test, expect, type Page } from '@playwright/test';

const LEGAL_LINK_HREFS = [
  'privacy-policy/',
  'cookie-policy/',
  'terms-of-service/',
  'contact/',
] as const;

async function assertLegalLinks(page: Page, localeUrl: string) {
  await page.goto(localeUrl);
  const anchors = page.locator('.legal-links a');
  await expect(anchors).toHaveCount(LEGAL_LINK_HREFS.length);

  for (const hrefEnding of LEGAL_LINK_HREFS) {
    const matchingAnchors = page.locator(`.legal-links a[href$="${hrefEnding}"]`);
    await expect(matchingAnchors).toHaveCount(1);

    const anchor = matchingAnchors.first();
    const href = await anchor.getAttribute('href');
    expect(href, `Missing href ending with ${hrefEnding}`).toBeTruthy();
    expect(href!.endsWith('/')).toBeTruthy();

    const absoluteUrl = new URL(href!, page.url());
    const response = await page.request.get(absoluteUrl.toString());
    expect(response.ok(), `Expected ${absoluteUrl.toString()} to respond with 200`).toBeTruthy();
  }
}

test.describe('footer legal links', () => {
  test('Chinese locale renders trailing slash legal links', async ({ page }) => {
    await assertLegalLinks(page, '/');
  });

  test('English locale renders trailing slash legal links', async ({ page }) => {
    await assertLegalLinks(page, '/en/');
  });
});
