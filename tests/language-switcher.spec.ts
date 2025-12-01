import { test, expect } from '@playwright/test';

test.describe('Language Switcher View Transitions', () => {
    test('should function correctly after view transitions', async ({ page }) => {
        // Set viewport to desktop to ensure nav menu is visible
        await page.setViewportSize({ width: 1280, height: 720 });

        // 1. Start at the home page (explicitly English to match Playwright default)
        await page.goto('/en/');

        // Helper to check switcher functionality
        const checkSwitcher = async () => {
            const dropdown = page.locator('.language-switcher-dropdown').first();
            const button = dropdown.locator('[data-dropdown-toggle]');

            // Ensure it's initially closed
            await expect(dropdown).toHaveAttribute('data-open', 'false');

            // Click to open
            await button.click();
            await expect(dropdown).toHaveAttribute('data-open', 'true');

            // Click to close
            await button.click();
            await expect(dropdown).toHaveAttribute('data-open', 'false');
        };

        // Verify on initial load
        await checkSwitcher();

        // 2. Navigate to another page (e.g., /en/posts/) to trigger view transition
        // Use CSS selector with href for robustness
        await page.locator('nav#nav-menu a[href="/en/posts/"]').click();
        await page.waitForURL('**/en/posts/');

        // Verify on second page
        await checkSwitcher();

        // 3. Navigate back to home
        await page.getByLabel('Home').click();
        await page.waitForURL('**/en/');

        // Verify again after navigating back
        await checkSwitcher();
    });

    test('should clean up event listeners correctly', async ({ page }) => {
        // Set viewport to desktop
        await page.setViewportSize({ width: 1280, height: 720 });

        // This test attempts to detect duplicate listeners by checking toggle behavior
        // If listeners are duplicated, a single click might toggle ON then OFF immediately

        await page.goto('/en/');

        // Navigate back and forth a few times to potentially accumulate listeners if cleanup is broken
        for (let i = 0; i < 3; i++) {
            await page.locator('nav#nav-menu a[href="/en/posts/"]').click();
            await page.waitForURL('**/en/posts/');
            await page.getByLabel('Home').click();
            await page.waitForURL('**/en/');
        }

        const dropdown = page.locator('.language-switcher-dropdown').first();
        const button = dropdown.locator('[data-dropdown-toggle]');

        // Ensure it's closed
        await expect(dropdown).toHaveAttribute('data-open', 'false');

        // Verify exact number of listeners using CDPSession (Chrome DevTools Protocol)
        // This is more robust than checking toggle behavior
        const client = await page.context().newCDPSession(page);

        // Get the button's objectId
        // 1. Get document root
        const { root: { nodeId: documentNodeId } } = await client.send('DOM.getDocument');

        // 2. Query for the button
        const { nodeId: buttonNodeId } = await client.send('DOM.querySelector', {
            nodeId: documentNodeId,
            selector: '.language-switcher-dropdown [data-dropdown-toggle]'
        });

        // 3. Resolve node to object to get objectId
        const { object } = await client.send('DOM.resolveNode', {
            nodeId: buttonNodeId
        });

        if (!object.objectId) {
            throw new Error('Failed to resolve button objectId');
        }

        // 4. Get event listeners
        const { listeners } = await client.send('DOMDebugger.getEventListeners', {
            objectId: object.objectId
        });

        // Filter for 'click' listeners
        const clickListeners = listeners.filter((l: { type: string }) => l.type === 'click');

        // We expect exactly 1 click listener (the toggle handler)
        // Note: Astro or other scripts might attach listeners, but our component attaches exactly one.
        // If accumulation is happening, this number would be > 1 (likely 4 or more after 3 navigations)
        expect(clickListeners.length).toBe(1);

        // Click ONCE to verify functional correctness as well
        await button.click();
        await expect(dropdown).toHaveAttribute('data-open', 'true');
    });
});
