import { expect, test, type Page } from '@playwright/test';

async function getThemeButtonClickListenerCount(page: Page) {
  const client = await page.context().newCDPSession(page);
  const {
    root: { nodeId: documentNodeId },
  } = await client.send('DOM.getDocument');

  const { nodeId: buttonNodeId } = await client.send('DOM.querySelector', {
    nodeId: documentNodeId,
    selector: '#theme-btn',
  });

  if (!buttonNodeId) return 0;

  const { object } = await client.send('DOM.resolveNode', {
    nodeId: buttonNodeId,
  });

  if (!object.objectId) return 0;

  const { listeners } = await client.send('DOMDebugger.getEventListeners', {
    objectId: object.objectId,
  });

  return listeners.filter((listener: { type: string }) => listener.type === 'click')
    .length;
}

test.describe('Theme toggle regressions', () => {
  test('keeps theme state and a single click binding after view transitions', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1280, height: 720 });
    await page.addInitScript(() => {
      try {
        localStorage.removeItem('theme');
      } catch {
        // noop
      }
    });

    await page.goto('/en/');

    const themeBtn = page.locator('#theme-btn');
    const html = page.locator('html');
    const themeColorMeta = page.locator('meta[name="theme-color"]');

    await expect(themeBtn).toBeVisible();
    const initialTheme = await html.getAttribute('data-theme');
    expect(initialTheme === 'light' || initialTheme === 'dark').toBeTruthy();

    const initialThemeColor = await themeColorMeta.getAttribute('content');
    expect(initialThemeColor).toBeTruthy();

    const toggledTheme = initialTheme === 'dark' ? 'light' : 'dark';
    await themeBtn.click();

    await expect(html).toHaveAttribute('data-theme', toggledTheme);
    await expect(themeBtn).toHaveAttribute(
      'aria-label',
      toggledTheme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'
    );

    const toggledThemeColor = await themeColorMeta.getAttribute('content');
    expect(toggledThemeColor).toBeTruthy();
    expect(toggledThemeColor).not.toBe(initialThemeColor);

    await page.locator('nav#nav-menu a[href="/en/posts/"]').click();
    await page.waitForURL('**/en/posts/');

    const postsThemeBtn = page.locator('#theme-btn');
    await expect(postsThemeBtn).toBeVisible();
    await expect(html).toHaveAttribute('data-theme', toggledTheme);

    expect(await getThemeButtonClickListenerCount(page)).toBe(1);

    await postsThemeBtn.click();
    await expect(html).toHaveAttribute('data-theme', initialTheme!);
  });
});
