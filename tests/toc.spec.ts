import { test, expect, type Page } from "@playwright/test";

const POST_PATH = "/posts/OBS-safe-broadcast-pitfalls/";
const EN_POST_PATH =
  "/en/posts/obs-live-streaming-safe-broadcast-delay-pitfalls/";
const NO_TOC_POST_PATH = "/posts/Why-did-I-start-blogging/";

const waitForToc = async (page: Page) => {
  await page.locator("[data-toc-nav] a").first().waitFor({ state: "attached" });
};

/** Scrolls to the comments, retrying while lazy content changes page height. */
const scrollPastArticle = async (page: Page) => {
  await expect
    .poll(
      () =>
        page.evaluate(() => {
          window.scrollTo({
            top: document.documentElement.scrollHeight,
            behavior: "instant",
          });
          const article = document.getElementById("article");
          return (article?.getBoundingClientRect().bottom ?? 0) <= 0;
        }),
      { timeout: 15000 }
    )
    .toBe(true);
};

const openPopover = async (page: Page) => {
  const fab = page.locator("#post-fab button");
  await expect(fab).toBeVisible();
  await fab.click();
  await expect(page.locator("#toc-popover")).toBeVisible();
};

test.describe("post table of contents", () => {
  test("shows the side TOC on wide screens and hides the floating button", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1280, height: 900 });
    await page.goto(POST_PATH);
    await waitForToc(page);

    await expect(page.locator(".toc-side")).toBeVisible();
    await expect(page.locator("#post-fab")).toBeHidden();
    await expect(
      page.locator(".toc-side [data-toc-nav] a").first()
    ).toHaveAttribute("href", /^#/);
  });

  test("uses the floating TOC below the side breakpoint", async ({ page }) => {
    await page.setViewportSize({ width: 1279, height: 900 });
    await page.goto(POST_PATH);
    await waitForToc(page);

    await expect(page.locator(".toc-side")).toBeHidden();
    await expect(page.locator("#post-fab")).toBeVisible();
    await expect(page.locator("#toc-popover")).toBeHidden();
  });

  test("opens the popover, closes it after navigation, and restores aria state", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto(POST_PATH);
    await waitForToc(page);

    const fab = page.locator("#post-fab button");
    await expect(fab).toHaveAttribute("aria-expanded", "false");
    await openPopover(page);
    await expect(fab).toHaveAttribute("aria-expanded", "true");
    await expect(fab).toHaveAttribute("aria-label", "关闭目录");

    const link = page.locator("#toc-popover [data-toc-nav] a").nth(2);
    const href = await link.getAttribute("href");
    await link.click();

    await expect(page.locator("#toc-popover")).toBeHidden();
    await expect(fab).toHaveAttribute("aria-expanded", "false");
    await expect(fab).toHaveAttribute("aria-label", "打开文章目录");
    await expect
      .poll(() => page.evaluate(() => window.scrollY))
      .toBeGreaterThan(0);
    expect(decodeURIComponent(page.url())).toContain(decodeURIComponent(href!));
  });

  test("follows the reading position and falls back to the last heading", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1280, height: 900 });
    await page.goto(POST_PATH);
    await waitForToc(page);

    const secondHeading = page.locator("#article h2").nth(1);
    const secondId = await secondHeading.getAttribute("id");
    await secondHeading.evaluate(heading => {
      window.scrollTo({
        top: heading.getBoundingClientRect().top + window.scrollY - 80,
        behavior: "instant",
      });
    });

    const activeLink = page.locator(
      `.toc-side [data-toc-nav] a[href="#${secondId}"]`
    );
    await expect(activeLink).toHaveAttribute("aria-current", "true");

    await page.evaluate(() =>
      window.scrollTo({
        top: document.documentElement.scrollHeight,
        behavior: "instant",
      })
    );
    await expect
      .poll(() =>
        page.evaluate(
          () =>
            Math.ceil(window.scrollY + window.innerHeight) >=
            document.documentElement.scrollHeight - 2
        )
      )
      .toBe(true);
    const lastLink = page.locator(".toc-side [data-toc-nav] a").last();
    await expect(lastLink).toHaveAttribute("aria-current", "true");
  });

  test("jumps to the article with the skip link", async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 900 });
    await page.goto(POST_PATH);
    await waitForToc(page);

    const skipLink = page.locator(".toc-skip");
    await skipLink.focus();
    await expect(skipLink).toBeFocused();
    await page.keyboard.press("Enter");

    await expect
      .poll(() => page.evaluate(() => document.activeElement?.id ?? ""))
      .toBe("article");
  });

  test("localizes labels in Chinese and English", async ({ page }) => {
    await page.goto(POST_PATH);
    await waitForToc(page);
    await expect(page.locator(".toc-label").first()).toHaveText("目录");
    await expect(page.locator("#post-fab button")).toHaveAttribute(
      "aria-label",
      "打开文章目录"
    );
    await expect(page.locator(".toc-skip")).toHaveText("跳过目录");

    await page.goto(EN_POST_PATH);
    await waitForToc(page);
    await expect(page.locator(".toc-label").first()).toHaveText(
      "Table of Contents"
    );
    await expect(page.locator("#post-fab button")).toHaveAttribute(
      "aria-label",
      "Open Table of Contents"
    );
    await expect(page.locator(".toc-skip")).toHaveText(
      "Skip table of contents"
    );
  });

  test("scrolls back to the top from the side TOC", async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 900 });
    await page.goto(POST_PATH);
    await waitForToc(page);

    await page.evaluate(() =>
      window.scrollTo({
        top: document.documentElement.scrollHeight,
        behavior: "instant",
      })
    );
    await expect
      .poll(() => page.evaluate(() => window.scrollY))
      .toBeGreaterThan(0);

    await page.locator(".toc-side [data-back-to-top]").click();
    await expect.poll(() => page.evaluate(() => window.scrollY)).toBe(0);
  });

  test("brings back a floating action after the side TOC scrolls away", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1280, height: 900 });
    await page.goto(POST_PATH);
    await waitForToc(page);
    await expect(page.locator("#post-fab")).toBeHidden();

    await scrollPastArticle(page);
    await expect(page.locator("#post-fab")).toBeVisible();
    await expect(page.locator("#post-fab button")).toHaveAttribute(
      "data-has-toc",
      ""
    );

    await openPopover(page);
    await page.locator("#toc-popover [data-back-to-top]").click();
    await expect.poll(() => page.evaluate(() => window.scrollY)).toBe(0);
  });

  test("keeps a back-to-top fallback where the Popover API is unavailable", async ({
    page,
  }) => {
    await page.addInitScript(() => {
      delete (HTMLElement.prototype as unknown as { showPopover?: () => void })
        .showPopover;
    });
    await page.setViewportSize({ width: 1280, height: 900 });
    await page.goto(POST_PATH);
    await waitForToc(page);
    await expect(page.locator("#post-fab")).toBeHidden();

    // Past the 30% back-to-top threshold, but still inside the article.
    await page.evaluate(() =>
      window.scrollTo({
        top: Math.round(document.documentElement.scrollHeight * 0.4),
        behavior: "instant",
      })
    );
    await expect(page.locator(".toc-side")).toBeVisible();
    await expect(page.locator("#post-fab")).toBeHidden();

    await scrollPastArticle(page);
    const fab = page.locator("#post-fab button");
    await expect(page.locator("#post-fab")).toBeVisible();
    await expect(fab).toHaveAttribute("data-no-popover", "");
    await expect(fab).toHaveAttribute("aria-label", "返回顶部");
    await fab.click();
    await expect.poll(() => page.evaluate(() => window.scrollY)).toBe(0);
  });

  test("keeps the back-to-top button for posts without a TOC", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto(NO_TOC_POST_PATH);

    await expect(page.locator(".toc-side")).toHaveCount(0);
    await expect(page.locator("#toc-popover")).toHaveCount(0);
    const fab = page.locator("#post-fab button");
    await expect(fab).toHaveAttribute("aria-label", "返回顶部");
    await expect(page.locator("#post-fab")).toBeHidden();

    await page.evaluate(() =>
      window.scrollTo({
        top: document.documentElement.scrollHeight,
        behavior: "instant",
      })
    );
    await expect(page.locator("#post-fab")).toBeVisible();
    await fab.click();
    await expect.poll(() => page.evaluate(() => window.scrollY)).toBe(0);
  });

  test("re-initializes after a client-side navigation", async ({ page }) => {
    await page.addInitScript(() => {
      window.localStorage.setItem("preferred-locale", "zh-CN");
    });
    await page.setViewportSize({ width: 1280, height: 900 });
    await page.goto("/");
    await page
      .locator('a[href="/posts/OBS-safe-broadcast-pitfalls/"]')
      .first()
      .click();

    await waitForToc(page);
    await expect(page).toHaveURL(new RegExp(`${POST_PATH}$`));
    await expect(page.locator(".toc-side")).toBeVisible();
  });
});
