import { test, expect } from "@playwright/test";

test.describe("Language Switcher View Transitions", () => {
  test("should function correctly after view transitions", async ({ page }) => {
    // Set viewport to desktop to ensure nav menu is visible
    await page.setViewportSize({ width: 1280, height: 720 });

    // 1. Start at the home page (explicitly English to match Playwright default)
    await page.goto("/en/");

    // Helper to check switcher functionality
    const checkSwitcher = async () => {
      const dropdown = page.locator(".language-switcher-dropdown").first();
      const button = dropdown.locator("[data-dropdown-toggle]");

      // Ensure it's initially closed
      await expect(dropdown).toHaveAttribute("data-open", "false");

      // Click to open
      await button.click();
      await expect(dropdown).toHaveAttribute("data-open", "true");

      // Click to close
      await button.click();
      await expect(dropdown).toHaveAttribute("data-open", "false");
    };

    // Verify on initial load
    await checkSwitcher();

    // 2. Navigate to another page (e.g., /en/posts/) to trigger view transition
    // Use CSS selector with href for robustness
    await page.locator('nav#nav-menu a[href="/en/posts/"]').click();
    await page.waitForURL("**/en/posts/");

    // Verify on second page
    await checkSwitcher();

    // 3. Navigate back to home
    await page.getByLabel("Home").click();
    await page.waitForURL("**/en/");

    // Verify again after navigating back
    await checkSwitcher();
  });

  test("should clean up event listeners correctly", async ({ page }) => {
    // Set viewport to desktop
    await page.setViewportSize({ width: 1280, height: 720 });

    // This test attempts to detect duplicate listeners by checking toggle behavior
    // If listeners are duplicated, a single click might toggle ON then OFF immediately

    await page.goto("/en/");

    // Navigate back and forth a few times to potentially accumulate listeners if cleanup is broken
    for (let i = 0; i < 3; i++) {
      await page.locator('nav#nav-menu a[href="/en/posts/"]').click();
      await page.waitForURL("**/en/posts/");
      await page.getByLabel("Home").click();
      await page.waitForURL("**/en/");
    }

    const dropdown = page.locator(".language-switcher-dropdown").first();
    const button = dropdown.locator("[data-dropdown-toggle]");

    // Ensure it's closed
    await expect(dropdown).toHaveAttribute("data-open", "false");

    // Verify exact number of listeners using CDPSession (Chrome DevTools Protocol)
    // This is more robust than checking toggle behavior
    const client = await page.context().newCDPSession(page);

    // Get the button's objectId
    // 1. Get document root
    const {
      root: { nodeId: documentNodeId },
    } = await client.send("DOM.getDocument");

    // 2. Query for the button
    const { nodeId: buttonNodeId } = await client.send("DOM.querySelector", {
      nodeId: documentNodeId,
      selector: ".language-switcher-dropdown [data-dropdown-toggle]",
    });

    // 3. Resolve node to object to get objectId
    const { object } = await client.send("DOM.resolveNode", {
      nodeId: buttonNodeId,
    });

    if (!object.objectId) {
      throw new Error("Failed to resolve button objectId");
    }

    // 4. Get event listeners
    const { listeners } = await client.send("DOMDebugger.getEventListeners", {
      objectId: object.objectId,
    });

    // Filter for 'click' listeners
    const clickListeners = listeners.filter(
      (l: { type: string }) => l.type === "click"
    );

    // We expect exactly 1 click listener (the toggle handler)
    // Note: Astro or other scripts might attach listeners, but our component attaches exactly one.
    // If accumulation is happening, this number would be > 1 (likely 4 or more after 3 navigations)
    expect(clickListeners.length).toBe(1);

    // Click ONCE to verify functional correctness as well
    await button.click();
    await expect(dropdown).toHaveAttribute("data-open", "true");
  });
});

test.describe("Language Switcher Accessibility", () => {
  test("button accessible name should contain visible language label (zh-CN)", async ({
    page,
  }) => {
    await page.goto("/posts/");

    const button = page
      .locator(".language-switcher-dropdown [data-dropdown-toggle]")
      .first();

    await expect(button).toHaveAccessibleName(/中文.*选择语言/u);
  });

  test("button accessible name should contain visible language label (en)", async ({
    page,
  }) => {
    await page.goto("/en/");

    const button = page
      .locator(".language-switcher-dropdown [data-dropdown-toggle]")
      .first();

    await expect(button).toHaveAccessibleName(/English.*Select Language/);
  });
});

test.describe("Translation Missing Page Localization", () => {
  test("Chinese missing-translation page uses localized primary copy", async ({
    page,
  }) => {
    await page.goto(
      "/translation-not-found/?target=en&path=%2Fposts%2Fhoarder-app-replace-cubox%2F"
    );

    await expect(
      page.getByRole("heading", { name: "暂无英文译文" })
    ).toBeVisible();
    await expect(
      page.getByText(
        "文章「自建 Karakeep（原 Hoarder）剪藏服务取代 Cubox：解决隐私与成本问题」暂无英文译文。"
      )
    ).toBeVisible();
    await expect(
      page.getByRole("button", { name: "返回上一页" })
    ).toBeVisible();
    await expect(
      page.getByRole("link", { name: "阅读中文原文" })
    ).toHaveAttribute("href", "/posts/hoarder-app-replace-cubox/");
    await expect(
      page.getByRole("link", { name: "浏览全部中文文章" })
    ).toHaveAttribute("href", "/posts/");

    await expect(page.getByText("Go Back")).toHaveCount(0);
    await expect(page.getByText("Read in Chinese")).toHaveCount(0);
    await expect(page.getByText("Translation Not Available")).toHaveCount(0);
  });
});

test.describe("Language Switcher Mobile Navigation", () => {
  test.use({
    viewport: { width: 390, height: 844 },
    isMobile: true,
    hasTouch: true,
  });

  test("mobile menu language link should navigate before focusout closes dropdown", async ({
    page,
  }) => {
    await page.addInitScript(() => {
      window.localStorage.setItem("preferred-locale", "zh-CN");
    });
    await page.goto("/");

    await page.getByRole("button", { name: "菜单" }).click();

    const dropdown = page.locator(".lang-switcher-mobile");
    await dropdown.getByRole("button", { name: /中文.*选择语言/u }).click();

    const englishLink = dropdown.getByRole("menuitem", { name: "English" });
    await expect(englishLink).toHaveAttribute("href", "/en/");

    await Promise.all([page.waitForURL("**/en/"), englishLink.tap()]);
  });
});

test.describe("Language Switcher Mobile Click", () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test("navigate with click on mobile viewport", async ({ page }) => {
    await page.goto("/en/");

    await page.locator("#menu-btn").click();

    const dropdown = page.locator(".lang-switcher-mobile");
    await dropdown
      .getByRole("button", { name: /English.*Select Language/u })
      .click();

    const zhLink = dropdown.getByRole("menuitem", { name: "简体中文" });
    await expect(zhLink).toHaveAttribute("href", "/");
    await Promise.all([
      page.waitForURL((url: URL) => url.pathname === "/" && !url.hash),
      zhLink.click(),
    ]);
  });
});
