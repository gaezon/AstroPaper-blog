import { test, expect, type Page } from "@playwright/test";

type Locale = "zh" | "en";

const localePrefix = (locale: Locale) => (locale === "en" ? "/en" : "");

const getPrevLink = (page: Page, locale: Locale = "zh") => {
  const label = locale === "en" ? "Previous Post" : "上一篇";
  return page.getByRole("link", { name: new RegExp(label, "i") });
};

const getNextLink = (page: Page, locale: Locale = "zh") => {
  const label = locale === "en" ? "Next Post" : "下一篇";
  return page.getByRole("link", { name: new RegExp(label, "i") });
};

/**
 * Walk the paginated post list in display order (newest first) and return
 * every card href. The order matters: post navigation must follow it.
 */
const collectPostHrefs = async (page: Page, locale: Locale = "zh") => {
  await page.goto(`${localePrefix(locale)}/posts/`);

  const hrefs: string[] = [];
  const pagination = page.getByRole("navigation", { name: "Pagination" });
  const nextLabel = locale === "en" ? "Next" : "下一页";

  while (true) {
    const links = page.locator("main ul li a");
    const count = await links.count();
    for (let i = 0; i < count; i += 1) {
      const href = await links.nth(i).getAttribute("href");
      if (href) hrefs.push(href);
    }

    const nextPageLink = pagination.getByRole("link", {
      name: new RegExp(`^${nextLabel}$`, "i"),
    });
    if ((await nextPageLink.count()) === 0) break;

    const nextHref = await nextPageLink.first().getAttribute("href");
    if (!nextHref) break;
    await page.goto(nextHref);
  }

  return hrefs;
};

test.describe("Post Navigation", () => {
  test("newest post links to the older post, without a next link", async ({
    page,
  }) => {
    const hrefs = await collectPostHrefs(page);
    expect(hrefs.length).toBeGreaterThan(1);

    await page.goto(hrefs[0]);

    await expect(getPrevLink(page)).toHaveAttribute("href", hrefs[1]);
    await expect(getNextLink(page)).toHaveCount(0);
  });

  test("middle post links backwards to older and forwards to newer", async ({
    page,
  }) => {
    const hrefs = await collectPostHrefs(page);
    expect(hrefs.length).toBeGreaterThan(2);

    await page.goto(hrefs[1]);

    await expect(getPrevLink(page)).toHaveAttribute("href", hrefs[2]);
    await expect(getNextLink(page)).toHaveAttribute("href", hrefs[0]);
  });

  test("oldest post links to the newer post, without a previous link", async ({
    page,
  }) => {
    const hrefs = await collectPostHrefs(page);
    expect(hrefs.length).toBeGreaterThan(1);

    await page.goto(hrefs[hrefs.length - 1]);

    await expect(getPrevLink(page)).toHaveCount(0);
    await expect(getNextLink(page)).toHaveAttribute(
      "href",
      hrefs[hrefs.length - 2]
    );
  });

  test("English posts follow the same direction", async ({ page }) => {
    const hrefs = await collectPostHrefs(page, "en");
    expect(hrefs.length).toBeGreaterThan(1);

    await page.goto(hrefs[0]);

    await expect(getPrevLink(page, "en")).toHaveAttribute("href", hrefs[1]);
    await expect(getNextLink(page, "en")).toHaveCount(0);
  });
});
