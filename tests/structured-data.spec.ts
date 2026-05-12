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

  test("zh post page BlogPosting.inLanguage should be zh-CN", async ({
    page,
  }) => {
    await page.goto("/posts/Why-did-I-start-blogging/");
    const scripts = await page
      .locator('script[type="application/ld+json"]')
      .allTextContents();
    const blogPosting = scripts.flatMap(s => {
      try {
        const data = JSON.parse(s);
        const graph = data["@graph"] || [data];
        return graph.filter(
          (n: Record<string, unknown>) => n["@type"] === "BlogPosting"
        );
      } catch {
        return [];
      }
    });
    expect(blogPosting.length).toBeGreaterThan(0);
    expect(blogPosting[0].inLanguage).toBe("zh-CN");
  });

  test("en post page BlogPosting.inLanguage should be en", async ({ page }) => {
    await page.goto("/en/posts/why-i-started-blogging/");
    const scripts = await page
      .locator('script[type="application/ld+json"]')
      .allTextContents();
    const blogPosting = scripts.flatMap(s => {
      try {
        const data = JSON.parse(s);
        const graph = data["@graph"] || [data];
        return graph.filter(
          (n: Record<string, unknown>) => n["@type"] === "BlogPosting"
        );
      } catch {
        return [];
      }
    });
    expect(blogPosting.length).toBeGreaterThan(0);
    expect(blogPosting[0].inLanguage).toBe("en");
  });

  test("BlogPosting always includes dateModified", async ({ page }) => {
    await page.goto("/posts/Why-did-I-start-blogging/");
    const scripts = await page
      .locator('script[type="application/ld+json"]')
      .allTextContents();
    const blogPosting = scripts.flatMap(s => {
      try {
        const data = JSON.parse(s);
        const graph = data["@graph"] || [data];
        return graph.filter(
          (n: Record<string, unknown>) => n["@type"] === "BlogPosting"
        );
      } catch {
        return [];
      }
    });
    expect(blogPosting.length).toBeGreaterThan(0);
    expect(blogPosting[0].dateModified).toBeDefined();
    expect(typeof blogPosting[0].dateModified).toBe("string");
    expect(blogPosting[0].dateModified.length).toBeGreaterThan(0);
  });
});

test("about pages should emit Person or Organization JSON-LD consistently across locales", async ({
  page,
}) => {
  // Validates: Requirements 2.4
  const aboutPages = ["/about/", "/en/about/"];
  const types: string[] = [];

  for (const url of aboutPages) {
    await page.goto(url);
    const scripts = await page
      .locator('script[type="application/ld+json"]')
      .allTextContents();
    const personOrOrg = scripts.flatMap(s => {
      try {
        const data = JSON.parse(s);
        const graph = data["@graph"] || [data];
        return graph.filter(
          (n: Record<string, unknown>) =>
            n["@type"] === "Person" || n["@type"] === "Organization"
        );
      } catch {
        return [];
      }
    });
    expect(personOrOrg.length).toBeGreaterThan(0);
    types.push(personOrOrg[0]["@type"]);
  }

  // Both locales should use the same type (Person or Organization)
  expect(types[0]).toBe(types[1]);
});
