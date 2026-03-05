import { test, expect, type Page } from "@playwright/test";

const TEST_POST_PATH = "/posts/OBS-safe-broadcast-pitfalls/";
const waitForTocReady = async (page: Page) => {
  await page.locator("#toc-nav a").first().waitFor();
};

const clickWhenActionable = async (locator: ReturnType<Page["locator"]>) => {
  await expect(locator).toBeVisible();
  await expect(locator).toBeEnabled();
  await locator.click();
};

const clickViaDispatch = async (locator: ReturnType<Page["locator"]>) => {
  await expect(locator).toBeVisible();
  await expect(locator).toBeEnabled();
  await locator.dispatchEvent("click");
};

test.describe("TOC Animation Optimizations", () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to a post with TOC
    await page.goto(TEST_POST_PATH);
    await page.waitForLoadState("load");
    await waitForTocReady(page);
  });

  test("should set aria-hidden immediately on collapse", async ({ page }) => {
    // Check desktop view
    await page.setViewportSize({ width: 1280, height: 800 });

    const aside = page.locator("#toc-sidebar");
    const collapseBtn = page.locator("#toc-collapse");

    // Verify initial state
    await expect(aside).toHaveAttribute("aria-hidden", "false");

    // Click collapse and immediately check aria-hidden
    await clickWhenActionable(collapseBtn);

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

    await clickWhenActionable(collapseBtn);

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
    await clickWhenActionable(collapseBtn);
    await expect(aside).toHaveCSS("display", "none");

    // Start showing
    await openBtn.waitFor({ state: "visible" });
    await clickViaDispatch(openBtn);

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
    await clickWhenActionable(collapseBtn);

    // Focus should move to open button
    await expect(openBtn).toBeFocused();
  });

  test("should skip animation with prefers-reduced-motion", async ({
    page,
  }) => {
    // Enable reduced motion
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto(TEST_POST_PATH);
    await page.waitForLoadState("load");
    await waitForTocReady(page);

    await page.setViewportSize({ width: 1280, height: 800 });

    const aside = page.locator("#toc-sidebar");
    const collapseBtn = page.locator("#toc-collapse");

    const startTime = Date.now();
    await clickWhenActionable(collapseBtn);

    // With reduced motion, animation should complete almost instantly
    await expect(aside).toHaveCSS("display", "none", { timeout: 100 });
    const elapsed = Date.now() - startTime;

    // Should take less than 200ms (no 260ms animation)
    // Increased threshold to account for CI environment variability
    expect(elapsed).toBeLessThan(200);
  });

  test("should handle rapid clicks gracefully", async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });

    const aside = page.locator("#toc-sidebar");
    const collapseBtn = page.locator("#toc-collapse");
    const openBtn = page.locator("#toc-open-desktop");

    // Rapidly click collapse multiple times
    await clickWhenActionable(collapseBtn);
    await collapseBtn.dispatchEvent("click");
    await collapseBtn.dispatchEvent("click");

    // Should still end in collapsed state
    await expect(aside).toHaveCSS("display", "none");

    // Now rapidly click open
    await clickViaDispatch(openBtn);
    await openBtn.dispatchEvent("click");
    await openBtn.dispatchEvent("click");

    // Should still end in open state
    await expect(aside).not.toHaveCSS("display", "none");
  });

  test("should clean up animation state after transition", async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });

    const aside = page.locator("#toc-sidebar");
    const collapseBtn = page.locator("#toc-collapse");

    await clickWhenActionable(collapseBtn);
    await expect(aside).toHaveCSS("display", "none");

    // Check that animation state is cleaned up
    await expect.poll(() => aside.getAttribute("data-animating")).toBeNull();
    await expect
      .poll(() => aside.evaluate(el => getComputedStyle(el).willChange))
      .toBe("auto");
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

  test.describe("scroll behavior (after refactor)", () => {
    test("should scroll to heading when TOC link is clicked", async ({
      page,
    }) => {
      await page.setViewportSize({ width: 1280, height: 800 });

      // Get first TOC link
      const firstLink = page.locator("#toc-nav a").first();
      const href = await firstLink.getAttribute("href");

      // Click TOC link
      await firstLink.click();

      // Verify the target heading is visible
      const targetId = href?.replace("#", "");
      const targetHeading = page.locator(`#${targetId}`);
      await expect(targetHeading).toBeInViewport();

      // Verify scroll happened
      await expect
        .poll(() => page.evaluate(() => window.pageYOffset))
        .toBeGreaterThan(0);
    });

    test("should update active state when scrolling", async ({ page }) => {
      await page.setViewportSize({ width: 1280, height: 800 });

      // Get the ID of the first heading that is linked in TOC
      const firstLink = page.locator("#toc-nav a").first();
      const href = await firstLink.getAttribute("href");
      const targetId = href?.replace("#", "");

      // Scroll to the heading + small offset to ensure it intersects
      await page.evaluate(id => {
        const el = document.getElementById(id!);
        if (el) {
          el.scrollIntoView();
          window.dispatchEvent(new Event("scroll"));
        }
      }, targetId);

      await page.waitForFunction(
        linkHref => {
          const link = document.querySelector(`#toc-nav a[href="${linkHref}"]`);
          return Boolean(link?.classList.contains("active"));
        },
        href,
        { timeout: 5000 }
      );

      // Check that the corresponding link is active
      const activeLink = page.locator(`#toc-nav a[href="${href}"]`);
      await expect(activeLink).toHaveClass(/active/);
    });

    test("should sync active state between desktop and mobile TOC", async ({
      page,
    }) => {
      await page.setViewportSize({ width: 1280, height: 800 });

      // Click a desktop TOC link
      const firstLink = page.locator("#toc-nav a").first();
      await firstLink.click();

      // Check that both desktop and mobile TOC have active state
      const desktopActive = page.locator("#toc-nav a.active").first();
      const mobileActive = page.locator("#toc-nav-mobile a.active").first();

      await expect(desktopActive).toHaveCount(1);
      await expect(mobileActive).toHaveCount(1);

      // They should point to the same href
      const desktopHref = await desktopActive.getAttribute("href");
      const mobileHref = await mobileActive.getAttribute("href");
      expect(desktopHref).toBe(mobileHref);
    });

    test("should close mobile drawer after clicking TOC link", async ({
      page,
    }) => {
      await page.setViewportSize({ width: 390, height: 844 }); // Mobile viewport

      // Open mobile TOC drawer
      const toggle = page.locator("#toc-toggle");
      await toggle.click();
      const overlay = page.locator("#toc-overlay");
      await expect(overlay).toHaveClass(/opacity-100/);

      // Click first mobile TOC link
      const mobileLink = page.locator("#toc-nav-mobile a").first();
      await mobileLink.click();

      // Verify drawer is closed (overlay is hidden)
      await expect(overlay).toHaveClass(/opacity-0/);
    });

    test("should avoid overlap with back-to-top button on mobile", async ({
      page,
    }) => {
      await page.setViewportSize({ width: 390, height: 844 }); // Mobile viewport

      const toggle = page.locator("#toc-toggle");

      // Check that toggle has bottom style set (to avoid overlap)
      const bottomStyle = await toggle.evaluate(el => el.style.bottom);

      // On mobile, toggle should have explicit bottom position
      // Either 112px (when back-to-top could be visible) or 24px (default)
      expect(bottomStyle).not.toBe("");
      expect(parseFloat(bottomStyle)).toBeGreaterThan(0);
    });
  });
});
