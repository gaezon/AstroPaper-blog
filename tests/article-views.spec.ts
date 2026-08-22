import { expect, test, type Page } from "@playwright/test";

const ZH_PATH = "/posts/hoarder-app-replace-cubox/";
const EN_PATH = "/en/posts/self-host-hoarder-replace-cubox/";
const UNPAIRED_PATH = "/posts/upgrade-astropaper-git/";

async function mockArticleViews(page: Page, status = 200, delay = 0) {
  const requests: string[][] = [];

  await page.route("**/api/article-views?**", async route => {
    const url = new URL(route.request().url());
    requests.push(url.searchParams.getAll("path"));
    if (delay > 0) await new Promise(resolve => setTimeout(resolve, delay));

    await route.fulfill({
      status,
      contentType: "application/json",
      headers: { "access-control-allow-origin": "*" },
      body: JSON.stringify({ views: status === 200 ? 691 : 0 }),
    });
  });

  return requests;
}

async function expectRequest(
  requests: string[][],
  expectedPaths: string[],
  expectedCount = 1
) {
  await expect
    .poll(
      () =>
        requests.filter(
          paths =>
            paths.length === expectedPaths.length &&
            expectedPaths.every((path, index) => paths[index] === path)
        ).length
    )
    .toBeGreaterThanOrEqual(expectedCount);
}

test.describe("combined bilingual article views", () => {
  test("shows one combined count and reuses the canonical path order in both locales", async ({
    page,
  }) => {
    const requests = await mockArticleViews(page);

    await page.goto(ZH_PATH);
    await expect(page.getByText("691次阅读")).toBeVisible();
    await expectRequest(requests, [ZH_PATH, EN_PATH]);

    await page.goto(EN_PATH);
    await expect(page.getByText("691 views")).toBeVisible();
    await expectRequest(requests, [ZH_PATH, EN_PATH], 2);
  });

  test("reserves its space and stays invisible when the endpoint fails", async ({
    page,
  }) => {
    await mockArticleViews(page, 500);

    await page.goto(ZH_PATH);
    await expect(page.locator("[data-article-views]")).toHaveClass(/invisible/);
    await expect(page.getByText("0次阅读")).toHaveCount(0);
  });

  test("shows a stable placeholder while a slow response is loading", async ({
    page,
  }) => {
    await mockArticleViews(page, 200, 1_500);

    await page.goto(ZH_PATH, { waitUntil: "domcontentloaded" });
    const views = page.locator("[data-article-views]");
    const placeholder = views.locator("[data-article-views-placeholder]");

    await expect(views).toBeVisible();
    await expect(placeholder).toBeVisible();
    const loadingBox = await views.boundingBox();

    await expect(page.getByText("691次阅读")).toBeVisible();
    const loadedBox = await views.boundingBox();

    expect(loadingBox).not.toBeNull();
    expect(loadedBox).not.toBeNull();
    expect(
      Math.abs((loadedBox?.width ?? 0) - (loadingBox?.width ?? 0))
    ).toBeLessThan(2);
  });

  test("requests only the current path when no translation exists", async ({
    page,
  }) => {
    const requests = await mockArticleViews(page);

    await page.goto(UNPAIRED_PATH);
    await expect(page.getByText("691次阅读")).toBeVisible();
    await expectRequest(requests, [UNPAIRED_PATH]);
  });

  test("shows view counts in the outer article list", async ({ page }) => {
    const requests = await mockArticleViews(page);

    await page.goto("/posts/");

    const articleCard = page.locator("li").filter({
      has: page.locator(`a[href="${ZH_PATH}"]`),
    });
    await expect(articleCard.getByText("691次阅读")).toBeVisible();
    await expect(
      articleCard.locator("[data-article-views-content] svg")
    ).toHaveCSS("width", "20px");
    await expectRequest(requests, [ZH_PATH, EN_PATH]);
  });

  test("aligns the Chinese view count and label on one baseline", async ({
    page,
  }) => {
    await mockArticleViews(page);

    await page.goto(ZH_PATH);
    await expect(page.getByText("691次阅读")).toBeVisible();

    const text = page.locator("[data-article-views-text]");
    const value = page.locator("[data-article-views-value]");
    const content = page.locator("[data-article-views-content]");
    await expect(text).toHaveCSS("align-items", "baseline");
    await expect(text).toHaveCSS("column-gap", "0px");
    await expect(value).toHaveCSS("text-align", "right");
    await expect(content).toHaveCSS("column-gap", "4px");
  });
});
