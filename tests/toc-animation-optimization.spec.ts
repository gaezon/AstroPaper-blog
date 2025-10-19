import { test, expect } from "@playwright/test";

test.describe("TOC Animation Optimizations", () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to a post with TOC
    await page.goto("/posts/markdown-style-guide/");
    await page.waitForLoadState("networkidle");
  });

  test("should set aria-hidden immediately on collapse", async ({ page }) => {
    // Check desktop view
    await page.setViewportSize({ width: 1280, height: 800 });

    const aside = page.locator("#toc-sidebar");
    const collapseBtn = page.locator("#toc-collapse");

    // Verify initial state
    await expect(aside).toHaveAttribute("aria-hidden", "false");

    // Click collapse and immediately check aria-hidden
    await collapseBtn.click();

    // aria-hidden should be set immediately (within 10ms)
    await expect(aside).toHaveAttribute("aria-hidden", "true", {
      timeout: 10,
    });
  });

  test("should disable pointer-events immediately on collapse", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1280, height: 800 });

    const aside = page.locator("#toc-sidebar");
    const collapseBtn = page.locator("#toc-collapse");

    await collapseBtn.click();

    // pointer-events should be disabled immediately
    const pointerEvents = await aside.evaluate(
      el => getComputedStyle(el).pointerEvents
    );
    expect(pointerEvents).toBe("none");
  });

  test("should keep inert during show animation", async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });

    const aside = page.locator("#toc-sidebar");
    const collapseBtn = page.locator("#toc-collapse");
    const openBtn = page.locator("#toc-open-desktop");

    // First collapse
    await collapseBtn.click();
    await page.waitForTimeout(300); // Wait for animation to complete

    // Start showing
    await openBtn.click();

    // During animation, inert should still be present
    const hasInert = await aside.evaluate(el => el.hasAttribute("inert"));
    expect(hasInert).toBe(true);
  });

  test("should move focus to open button when collapsed with focus inside", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1280, height: 800 });

    const aside = page.locator("#toc-sidebar");
    const collapseBtn = page.locator("#toc-collapse");
    const openBtn = page.locator("#toc-open-desktop");
    const firstLink = aside.locator("a").first();

    // Focus a link inside TOC
    await firstLink.focus();
    await expect(firstLink).toBeFocused();

    // Collapse
    await collapseBtn.click();
    await page.waitForTimeout(300);

    // Focus should move to open button
    await expect(openBtn).toBeFocused();
  });

  test("should skip animation with prefers-reduced-motion", async ({
    page,
  }) => {
    // Enable reduced motion
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto("/posts/markdown-style-guide/");
    await page.waitForLoadState("networkidle");

    await page.setViewportSize({ width: 1280, height: 800 });

    const aside = page.locator("#toc-sidebar");
    const collapseBtn = page.locator("#toc-collapse");

    const startTime = Date.now();
    await collapseBtn.click();

    // With reduced motion, animation should complete almost instantly
    await expect(aside).toHaveCSS("display", "none", { timeout: 50 });
    const elapsed = Date.now() - startTime;

    // Should take less than 100ms (no 260ms animation)
    expect(elapsed).toBeLessThan(100);
  });

  test("should handle rapid clicks gracefully", async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });

    const aside = page.locator("#toc-sidebar");
    const collapseBtn = page.locator("#toc-collapse");
    const openBtn = page.locator("#toc-open-desktop");

    // Rapidly click collapse multiple times
    await collapseBtn.click();
    await collapseBtn.click();
    await collapseBtn.click();

    // Should still end in collapsed state
    await page.waitForTimeout(400);
    await expect(aside).toHaveCSS("display", "none");

    // Now rapidly click open
    await openBtn.click();
    await openBtn.click();
    await openBtn.click();

    // Should still end in open state
    await page.waitForTimeout(400);
    await expect(aside).not.toHaveCSS("display", "none");
  });

  test("should clean up animation state after transition", async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });

    const aside = page.locator("#toc-sidebar");
    const collapseBtn = page.locator("#toc-collapse");

    await collapseBtn.click();
    await page.waitForTimeout(400);

    // Check that animation state is cleaned up
    const animating = await aside.getAttribute("data-animating");
    expect(animating).toBeNull();

    const willChange = await aside.evaluate(
      el => getComputedStyle(el).willChange
    );
    expect(willChange).toBe("auto");
  });

  test("should respect CSS custom properties for duration", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1280, height: 800 });

    const aside = page.locator("#toc-sidebar");

    // Check that CSS variables are defined
    const duration = await aside.evaluate(el =>
      getComputedStyle(el).getPropertyValue("--toc-transition-duration")
    );

    expect(duration.trim()).toBe("260ms");

    const easing = await aside.evaluate(el =>
      getComputedStyle(el).getPropertyValue("--toc-transition-easing")
    );

    expect(easing.trim()).toBe("cubic-bezier(0.4, 0, 0.2, 1)");
  });
});
