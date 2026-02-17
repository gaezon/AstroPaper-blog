import { expect, test, type Page } from '@playwright/test';

const TEST_POST_PATH = '/posts/hoarder-app-replace-cubox/';
const SECOND_POST_PATH = '/posts/OBS-safe-broadcast-pitfalls/';

async function mockTwikooScript(page: Page, delayMs = 0) {
  let twikooRequestCount = 0;

  await page.route(/twikoo(?:\.min)?\.js(?:\?.*)?$/, async route => {
    twikooRequestCount += 1;

    if (delayMs > 0) {
      await new Promise(resolve => setTimeout(resolve, delayMs));
    }

    await route.fulfill({
      status: 200,
      contentType: 'application/javascript',
      headers: {
        'access-control-allow-origin': '*',
        'cross-origin-resource-policy': 'cross-origin',
      },
      body: `
        window.twikoo = {
          init: function init(config) {
            window.__twikooInitCalls = window.__twikooInitCalls || [];
            window.__twikooInitCalls.push(config);
          }
        };
      `,
    });
  });

  return {
    getRequestCount: () => twikooRequestCount,
  };
}

test.describe('Twikoo lazy-load triggers', () => {
  test('loads only after click interaction', async ({ page }) => {
    const twikooMock = await mockTwikooScript(page, 150);

    await page.goto(TEST_POST_PATH);
    await page.evaluate(() => {
      const roots = document.querySelectorAll<HTMLElement>(
        '[data-comment-root="true"]'
      );
      const comments = roots[roots.length - 1];
      if (comments) comments.dataset.twikooSri = '';
    });

    const commentsContainer = page.locator('#tcomment');
    const loadButton = page.locator('[data-comment-load-trigger]');

    await expect(loadButton).toBeVisible();
    expect(twikooMock.getRequestCount()).toBe(0);

    await loadButton.dispatchEvent('click');

    await expect(commentsContainer).toHaveAttribute('aria-busy', 'true');
    await expect(page.locator('[data-comment-trigger-ui]')).toHaveCount(0);
    await expect(page.locator('link[data-twikoo-style="true"]')).toHaveCount(1);

    await expect.poll(() => twikooMock.getRequestCount()).toBe(1);

  });

  test('loads automatically when scrolling near comments section', async ({ page }) => {
    const twikooMock = await mockTwikooScript(page);

    await page.goto(TEST_POST_PATH);
    await page.evaluate(() => {
      const roots = document.querySelectorAll<HTMLElement>(
        '[data-comment-root="true"]'
      );
      const comments = roots[roots.length - 1];
      if (comments) comments.dataset.twikooSri = '';
    });

    const loadButton = page.locator('[data-comment-load-trigger]');

    await expect(loadButton).toBeVisible();
    expect(twikooMock.getRequestCount()).toBe(0);

    for (let i = 0; i < 18; i++) {
      await page.mouse.wheel(0, 900);
      if (twikooMock.getRequestCount() > 0) {
        break;
      }
      await page.waitForTimeout(50);
    }

    await expect.poll(() => twikooMock.getRequestCount()).toBe(1);
    await expect(page.locator('[data-comment-trigger-ui]')).toHaveCount(0);
    await expect(page.locator('link[data-twikoo-style="true"]')).toHaveCount(1);
  });

  test('auto trigger still works after return and navigating to another post', async ({
    page,
  }) => {
    const twikooMock = await mockTwikooScript(page);

    await page.goto(TEST_POST_PATH);

    await page.locator('#back-button').click();
    await expect(page).toHaveURL('/');

    await page.locator('a[href="/posts/"]').first().click();
    await expect(page).toHaveURL('/posts/');

    await page.locator(`a[href="${SECOND_POST_PATH}"]`).first().click();
    await expect(page).toHaveURL(SECOND_POST_PATH);

    const commentRoot = page.locator('[data-comment-root="true"]');
    await expect(commentRoot).toHaveCount(1);

    await page.evaluate(() => {
      const roots = document.querySelectorAll<HTMLElement>(
        '[data-comment-root="true"]'
      );
      const comments = roots[roots.length - 1];
      if (comments) comments.dataset.twikooSri = '';
    });

    expect(twikooMock.getRequestCount()).toBe(0);

    for (let i = 0; i < 18; i++) {
      await page.mouse.wheel(0, 900);
      if (twikooMock.getRequestCount() > 0) {
        break;
      }
      await page.waitForTimeout(50);
    }

    await expect.poll(() => twikooMock.getRequestCount()).toBe(1);
    await expect(page.locator('[data-comment-trigger-ui]')).toHaveCount(0);
    await expect(page.locator('link[data-twikoo-style="true"]')).toHaveCount(1);
  });

  test('auto trigger works in posts list -> post -> back -> post flow', async ({
    page,
  }) => {
    const twikooMock = await mockTwikooScript(page);

    await page.goto('/posts/');
    await page.locator(`a[href="${TEST_POST_PATH}"]`).first().click();
    await expect(page).toHaveURL(TEST_POST_PATH);

    await page.locator('#back-button').click();
    await expect(page).toHaveURL('/posts/');

    await page.locator(`a[href="${SECOND_POST_PATH}"]`).first().click();
    await expect(page).toHaveURL(SECOND_POST_PATH);

    await page.evaluate(() => {
      const roots = document.querySelectorAll<HTMLElement>(
        '[data-comment-root="true"]'
      );
      const comments = roots[roots.length - 1];
      if (comments) comments.dataset.twikooSri = '';
    });

    expect(twikooMock.getRequestCount()).toBe(0);

    for (let i = 0; i < 18; i++) {
      await page.mouse.wheel(0, 900);
      if (twikooMock.getRequestCount() > 0) {
        break;
      }
      await page.waitForTimeout(50);
    }

    await expect.poll(() => twikooMock.getRequestCount()).toBe(1);
    await expect(page.locator('[data-comment-trigger-ui]')).toHaveCount(0);
    await expect(page.locator('link[data-twikoo-style="true"]')).toHaveCount(1);
  });
});
