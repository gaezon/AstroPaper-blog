import { expect, test } from "@playwright/test";

const zhPost = "/posts/OBS-safe-broadcast-pitfalls/";
const enPost = "/en/posts/obs-live-streaming-safe-broadcast-delay-pitfalls/";

function lineHeightRatio(lineHeight: string, fontSize: string) {
  return Number.parseFloat(lineHeight) / Number.parseFloat(fontSize);
}

test.describe("Chinese typography", () => {
  test("applies CJK rules and a readable Chinese article measure", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1280, height: 900 });
    await page.goto(zhPost);

    await expect(page.locator("html")).toHaveAttribute("lang", "zh-CN");

    const typography = await page.evaluate(() => {
      const article = document.querySelector<HTMLElement>("#article");
      const h3 = article?.querySelector("h3");
      const quote = article?.querySelector("blockquote");
      const callout = document.createElement("div");
      callout.className = "callout";
      callout.textContent = "中文提示内容";
      article?.append(callout);

      const html = document.documentElement;
      return {
        articleClass: article?.className ?? "",
        articleMaxWidth: article ? getComputedStyle(article).maxWidth : "",
        bodyFontFamily: getComputedStyle(document.body).fontFamily,
        bodyLineHeight: getComputedStyle(document.body).lineHeight,
        bodyFontSize: getComputedStyle(document.body).fontSize,
        calloutLineHeight: getComputedStyle(callout).lineHeight,
        calloutFontSize: getComputedStyle(callout).fontSize,
        h3FontStyle: h3 ? getComputedStyle(h3).fontStyle : "",
        lineBreak: getComputedStyle(html).lineBreak,
        quoteFontStyle: quote ? getComputedStyle(quote).fontStyle : "",
        quoteMarks: quote ? getComputedStyle(quote).quotes : "",
        textAutospace:
          getComputedStyle(html).getPropertyValue("text-autospace"),
      };
    });

    expect(typography.articleClass).toContain("max-w-[40em]");
    expect(typography.articleMaxWidth).toBe("640px");
    expect(typography.bodyFontFamily).toContain("-apple-system");
    expect(typography.bodyFontFamily).not.toContain("ui-monospace");
    expect(
      lineHeightRatio(typography.bodyLineHeight, typography.bodyFontSize)
    ).toBeCloseTo(1.7, 2);
    expect(
      lineHeightRatio(typography.calloutLineHeight, typography.calloutFontSize)
    ).toBeCloseTo(1.5, 2);
    expect(typography.h3FontStyle).toBe("normal");
    expect(typography.lineBreak).toBe("strict");
    expect(typography.quoteFontStyle).toBe("normal");
    expect(typography.quoteMarks).toBe("none");
    expect(typography.textAutospace).toBe("normal");
  });

  test("keeps English article measure and italic hierarchy independent", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1280, height: 900 });
    await page.goto(enPost);

    await expect(page.locator("html")).toHaveAttribute("lang", "en");

    const typography = await page.evaluate(() => {
      const article = document.querySelector<HTMLElement>("#article");
      const h3 = article?.querySelector("h3");
      const quote = article?.querySelector("blockquote");

      return {
        articleClass: article?.className ?? "",
        bodyFontFamily: getComputedStyle(document.body).fontFamily,
        h3FontStyle: h3 ? getComputedStyle(h3).fontStyle : "",
        quoteFontStyle: quote ? getComputedStyle(quote).fontStyle : "",
      };
    });

    expect(typography.articleClass).toContain("max-w-prose");
    expect(typography.articleClass).not.toContain("max-w-[40em]");
    expect(typography.bodyFontFamily).toContain("-apple-system");
    expect(typography.bodyFontFamily).not.toContain("ui-monospace");
    expect(typography.h3FontStyle).toBe("italic");
    expect(typography.quoteFontStyle).toBe("italic");
  });

  test("uses Chinese and English page descriptions appropriately", async ({
    page,
  }) => {
    await page.goto("/posts/");
    await expect(page.locator(".page-description")).toHaveCSS(
      "font-style",
      "normal"
    );

    await page.goto("/en/posts/");
    await expect(page.locator(".page-description")).toHaveCSS(
      "font-style",
      "italic"
    );
  });

  test("keeps the update label tight to Chinese dates", async ({ page }) => {
    await page.goto("/posts/");
    await expect(page.locator("html")).toHaveAttribute("lang", "zh-CN");
    await expect(page.locator("[data-datetime-text]").first()).toHaveCSS(
      "column-gap",
      "0px"
    );

    await page.goto("/en/posts/");
    await expect(page.locator("html")).toHaveAttribute("lang", "en");
    await expect(page.locator("[data-datetime-text]").first()).toHaveCSS(
      "column-gap",
      "8px"
    );
  });
});
