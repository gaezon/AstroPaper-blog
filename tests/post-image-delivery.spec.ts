import { expect, test } from '@playwright/test';

const ARTICLE_PATHS = [
  '/posts/hoarder-app-replace-cubox/',
  '/en/posts/self-host-hoarder-replace-cubox/',
];

function expectResponsiveSrcset(srcset: string | null): void {
  expect(srcset).toBeTruthy();

  const entries = (srcset ?? '')
    .split(',')
    .map(item => item.trim())
    .filter(Boolean);

  expect(entries.length).toBeGreaterThan(1);

  for (const entry of entries) {
    expect(entry).toMatch(/\s\d+w$/);
  }
}

for (const path of ARTICLE_PATHS) {
  test(`markdown images use responsive delivery on ${path}`, async ({ page }) => {
    await page.goto(path);

    const images = page.locator('#article img');
    const imageCount = await images.count();

    expect(imageCount).toBeGreaterThan(0);

    let priorityImageCount = 0;

    for (let index = 0; index < imageCount; index += 1) {
      const image = images.nth(index);
      const loading = await image.getAttribute('loading');
      const fetchpriority = await image.getAttribute('fetchpriority');
      const isPriorityImage = loading === 'eager' || fetchpriority === 'high';

      await expect(image).toHaveAttribute('decoding', 'async');
      expectResponsiveSrcset(await image.getAttribute('srcset'));

      if (isPriorityImage) {
        priorityImageCount += 1;
        expect(loading).toBe('eager');
        expect(fetchpriority).toBe('high');
        await expect(image).toHaveAttribute('sizes', /100vw|768px/);
        await expect(image).toHaveAttribute('width', /\d+/);
        await expect(image).toHaveAttribute('height', /\d+/);
      } else {
        expect(loading).toBe('lazy');
        expect(fetchpriority).toBe('auto');
      }
    }

    expect(priorityImageCount).toBe(1);
  });
}
