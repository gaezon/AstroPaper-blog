import { test, expect, type Locator, type Page } from "@playwright/test";

type Locale = "zh-CN" | "en";
const MAX_PAGINATION_STEPS = 20;

const getPaginationNav = (page: Page) =>
  page.getByRole("navigation", { name: "Pagination" });

const getPreviousPageLink = (page: Page, locale: Locale = "zh-CN") => {
  const label = locale === "en" ? "Previous" : "上一页";
  return getPaginationNav(page).getByRole("link", {
    name: new RegExp(label, "i"),
  });
};

const getNextPageLink = (page: Page, locale: Locale = "zh-CN") => {
  const label = locale === "en" ? "Next" : "下一页";
  return getPaginationNav(page).getByRole("link", {
    name: new RegExp(label, "i"),
  });
};

const goToLastPaginatedListPage = async (
  page: Page,
  getNextLink: (page: Page) => Locator
) => {
  for (let step = 0; step < MAX_PAGINATION_STEPS; step++) {
    const nextPageLink = getNextLink(page);

    if ((await nextPageLink.count()) === 0) {
      return;
    }

    const nextHref = await nextPageLink.first().getAttribute("href");
    if (!nextHref) {
      return;
    }

    const currentUrl = page.url();
    const nextUrl = new URL(nextHref, currentUrl).toString();

    if (nextUrl === currentUrl) {
      throw new Error(
        `Pagination next link did not advance from ${currentUrl}.`
      );
    }

    await Promise.all([page.waitForURL(nextUrl), nextPageLink.first().click()]);
  }

  throw new Error(
    `Exceeded ${MAX_PAGINATION_STEPS} pagination steps before reaching the last page.`
  );
};

test.describe("Pagination and locale routes", () => {
  test("zh posts pagination keeps the localized path shape", async ({
    page,
  }) => {
    await page.goto("/posts/");

    await expect(getPaginationNav(page)).toBeVisible();
    await expect(getPreviousPageLink(page)).toHaveCount(0);

    const nextPageLink = getNextPageLink(page);
    await expect(nextPageLink).toHaveAttribute("href", /\/posts\/2\/$/);
  });

  test("en posts pagination keeps the /en prefix across pages", async ({
    page,
  }) => {
    await page.goto("/en/posts/");

    await expect(getPaginationNav(page)).toBeVisible();
    await expect(getPreviousPageLink(page, "en")).toHaveCount(0);

    const nextPageLink = getNextPageLink(page, "en");
    await expect(nextPageLink).toHaveAttribute("href", /\/en\/posts\/2\/$/);

    const nextHref = await nextPageLink.getAttribute("href");
    expect(nextHref).not.toBeNull();

    await Promise.all([
      page.waitForURL(new URL(nextHref!, page.url()).toString()),
      nextPageLink.click(),
    ]);

    await expect(page).toHaveURL(/\/en\/posts\/2\/$/);
    await expect(getPreviousPageLink(page, "en")).toBeVisible();
  });

  test("last zh posts page hides the next-page link", async ({ page }) => {
    await page.goto("/posts/");
    await goToLastPaginatedListPage(page, currentPage =>
      getNextPageLink(currentPage)
    );

    await expect(page).toHaveURL(/\/posts\/\d+\/$/);
    await expect(getPreviousPageLink(page)).toBeVisible();
    await expect(getNextPageLink(page)).toHaveCount(0);
  });

  test("tag index links preserve locale prefixes", async ({ page }) => {
    await page.goto("/tags/");
    const zhTagLink = page.locator("main li a").first();
    const zhHref = await zhTagLink.getAttribute("href");
    expect(zhHref).toMatch(/^\/tags\/[^/]+\/$/);

    await page.goto("/en/tags/");
    const enTagLink = page.locator("main li a").first();
    const enHref = await enTagLink.getAttribute("href");
    expect(enHref).toMatch(/^\/en\/tags\/[^/]+\/$/);
  });
});
