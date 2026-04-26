import { expect, test } from "@playwright/test";

test.describe("Mobile navigation layout", () => {
  test.use({
    viewport: { width: 390, height: 844 },
    isMobile: true,
    hasTouch: true,
  });

  test("keeps the logo anchored and the opened menu centered", async ({
    page,
  }) => {
    await page.addInitScript(() => {
      window.localStorage.setItem("preferred-locale", "zh-CN");
    });
    await page.goto("/");

    const navMenu = page.locator("#nav-menu");
    const menuPanel = page.locator("#menu-panel");
    const menuButton = page.getByRole("button", { name: "菜单" });

    await expect(menuButton).toHaveAttribute("aria-controls", "nav-menu");
    await expect(menuButton).toHaveAttribute("type", "button");
    await menuButton.click();
    await expect(navMenu).toHaveAttribute("aria-hidden", "false");
    await expect(navMenu).toBeVisible();
    await expect(menuPanel).toBeVisible();
    await expect(page.locator("#menu-close")).toHaveAttribute("type", "button");

    const headerBox = await page.locator("#top-nav-wrap").boundingBox();
    const logoBox = await page.getByLabel("首页").boundingBox();
    const overlayBox = await navMenu.boundingBox();
    const menuBox = await menuPanel.boundingBox();

    expect(headerBox).not.toBeNull();
    expect(logoBox).not.toBeNull();
    expect(overlayBox).not.toBeNull();
    expect(menuBox).not.toBeNull();

    const headerCenter = headerBox!.x + headerBox!.width / 2;
    const menuCenter = menuBox!.x + menuBox!.width / 2;

    expect(logoBox!.y - headerBox!.y).toBeLessThanOrEqual(24);
    expect(overlayBox!.x).toBeCloseTo(0, 0);
    expect(overlayBox!.y).toBeCloseTo(0, 0);
    expect(overlayBox!.height).toBeGreaterThan(800);
    expect(Math.abs(menuCenter - headerCenter)).toBeLessThanOrEqual(2);

    await page.keyboard.press("Tab");
    await expect
      .poll(() =>
        page.evaluate(() => {
          const menu = document.querySelector("#nav-menu");
          return Boolean(menu?.contains(document.activeElement));
        })
      )
      .toBe(true);

    await page.keyboard.press("Escape");
    await expect(navMenu).toBeHidden();
    await expect(page.locator("#menu-btn")).toHaveAttribute(
      "aria-expanded",
      "false"
    );
  });

  test("keeps article TOC controls underneath the opened menu overlay", async ({
    page,
  }) => {
    await page.addInitScript(() => {
      window.localStorage.setItem("preferred-locale", "zh-CN");
    });
    await page.goto("/posts/OBS-safe-broadcast-pitfalls/");

    const tocToggle = page.locator("#toc-toggle");
    await expect(tocToggle).toBeVisible();

    const tocBox = await tocToggle.boundingBox();
    expect(tocBox).not.toBeNull();

    await page.getByRole("button", { name: "菜单" }).click();
    await expect(page.locator("#nav-menu")).toBeVisible();

    const backdropFilters = await page.evaluate(() => {
      const readBackdropFilter = (selector: string) => {
        const element = document.querySelector(selector);
        if (!element) return "";
        const style = window.getComputedStyle(element);
        const webkitStyle = style as CSSStyleDeclaration & {
          webkitBackdropFilter?: string;
        };
        return style.backdropFilter || webkitStyle.webkitBackdropFilter || "";
      };

      return {
        nav: readBackdropFilter("#nav-menu").trim().toLowerCase(),
        panel: readBackdropFilter("#menu-panel").trim().toLowerCase(),
        toc: readBackdropFilter("#toc-overlay").trim().toLowerCase(),
      };
    });

    expect(backdropFilters.nav).not.toBe("");
    expect(backdropFilters.toc).not.toBe("");
    expect(backdropFilters.nav).toContain("blur(8px)");
    expect(backdropFilters.nav).toContain("saturate(1.06)");
    expect(backdropFilters.toc).toContain("blur(8px)");
    expect(backdropFilters.toc).toContain("saturate(1.06)");
    expect(backdropFilters.panel).toBe("none");

    const topLayerOwner = await page.evaluate(
      ({ x, y }) => {
        const element = document.elementFromPoint(x, y);
        if (element?.closest("#nav-menu")) return "nav-menu";
        if (element?.closest("#toc-toggle")) return "toc-toggle";
        return element?.id ?? "";
      },
      {
        x: tocBox!.x + tocBox!.width / 2,
        y: tocBox!.y + tocBox!.height / 2,
      }
    );

    expect(topLayerOwner).toBe("nav-menu");
  });
});
