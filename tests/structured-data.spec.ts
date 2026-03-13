import { test, expect } from "@playwright/test";

test.describe("structured data", () => {
  test("non-post pages should not emit BlogPosting JSON-LD", async ({
    page,
  }) => {
    await page.goto("/search/");

    const structuredDataScripts = await page
      .locator('script[type="application/ld+json"]')
      .evaluateAll(elements =>
        elements.map(element => element.textContent?.trim() ?? "")
      );

    expect(
      structuredDataScripts.some(content => content.includes('"BlogPosting"'))
    ).toBeFalsy();
    expect(
      structuredDataScripts.some(content => content.includes("undefined"))
    ).toBeFalsy();
  });

  test("post pages should keep valid BlogPosting JSON-LD", async ({ page }) => {
    await page.goto("/posts/Why-did-I-start-blogging/");

    const structuredDataScripts = await page
      .locator('script[type="application/ld+json"]')
      .evaluateAll(elements =>
        elements.map(element => element.textContent?.trim() ?? "")
      );

    expect(
      structuredDataScripts.some(
        content =>
          content.includes('"@type":"BlogPosting"') &&
          content.includes('"datePublished"') &&
          !content.includes("undefined")
      )
    ).toBeTruthy();
  });
});
