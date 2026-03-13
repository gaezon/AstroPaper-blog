import { expect, test } from "@playwright/test";

test.describe("localized 404 pages", () => {
  test("default 404 page renders Chinese copy and home link", async ({
    page,
  }) => {
    await page.goto("/404/");

    await expect(page).toHaveTitle("404 页面未找到 | Gaazeon's blog.");
    await expect(page.locator("html")).toHaveAttribute("lang", "zh-CN");
    await expect(page.getByRole("heading", { name: "404" })).toBeVisible();
    await expect(page.getByText("页面未找到")).toBeVisible();
    await expect(page.getByRole("link", { name: "返回首页" })).toHaveAttribute(
      "href",
      "/"
    );
  });

  test("english 404 page renders English copy and home link", async ({
    page,
  }) => {
    await page.goto("/en/404/");

    await expect(page).toHaveTitle("404 Page Not Found | Gaazeon's Blog");
    await expect(page.locator("html")).toHaveAttribute("lang", "en");
    await expect(page.getByRole("heading", { name: "404" })).toBeVisible();
    await expect(page.getByText("Page Not Found")).toBeVisible();
    await expect(
      page.getByRole("link", { name: "Return to Home" })
    ).toHaveAttribute("href", "/en/");
  });

  test("english missing routes keep English back-home behavior in dev", async ({
    page,
  }) => {
    const response = await page.goto("/en/__missing__/");

    expect(response?.status()).toBe(404);
    await expect(page.locator("html")).toHaveAttribute("lang", "en");
    await expect(page).toHaveTitle("404 Page Not Found | Gaazeon's Blog");
    await expect(
      page.getByRole("link", { name: "Return to Home" })
    ).toHaveAttribute("href", "/en/");
  });
});
