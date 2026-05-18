import { test, expect, type Page } from "@playwright/test";
import {
  getJsonLdNodes,
  getJsonLdScriptContents,
  hasJsonLdType,
} from "./helpers/json-ld";

const getBlogPostingNodes = async (url: string, page: Page) => {
  await page.goto(url);
  const nodes = await getJsonLdNodes(page);
  return nodes.filter(node => hasJsonLdType(node, "BlogPosting"));
};

const expectNoUndefinedInJsonLd = async (page: Page) => {
  const scripts = await getJsonLdScriptContents(page);
  expect(scripts.some(content => content.includes("undefined"))).toBe(false);
};

test.describe("structured data", () => {
  test("non-post pages should not emit BlogPosting JSON-LD", async ({
    page,
  }) => {
    await page.goto("/search/");

    const nodes = await getJsonLdNodes(page);

    expect(nodes.some(node => hasJsonLdType(node, "BlogPosting"))).toBe(false);
    await expectNoUndefinedInJsonLd(page);
  });

  test("post pages should keep valid BlogPosting JSON-LD", async ({ page }) => {
    const blogPosting = await getBlogPostingNodes(
      "/posts/Why-did-I-start-blogging/",
      page
    );
    await expectNoUndefinedInJsonLd(page);
    expect(
      blogPosting.some(node => typeof node.datePublished === "string")
    ).toBe(true);
  });

  test("zh post page BlogPosting.inLanguage should be zh-CN", async ({
    page,
  }) => {
    const blogPosting = await getBlogPostingNodes(
      "/posts/Why-did-I-start-blogging/",
      page
    );
    expect(blogPosting.length).toBeGreaterThan(0);
    expect(blogPosting[0].inLanguage).toBe("zh-CN");
  });

  test("en post page BlogPosting.inLanguage should be en", async ({ page }) => {
    const blogPosting = await getBlogPostingNodes(
      "/en/posts/why-i-started-blogging/",
      page
    );
    expect(blogPosting.length).toBeGreaterThan(0);
    expect(blogPosting[0].inLanguage).toBe("en");
  });

  test("BlogPosting always includes dateModified", async ({ page }) => {
    const blogPosting = await getBlogPostingNodes(
      "/posts/Why-did-I-start-blogging/",
      page
    );
    expect(blogPosting.length).toBeGreaterThan(0);
    const dateModified = blogPosting[0].dateModified;
    expect(dateModified).toBeDefined();
    expect(typeof dateModified).toBe("string");
    if (typeof dateModified !== "string") {
      throw new Error("Expected BlogPosting.dateModified to be a string.");
    }
    expect(dateModified.length).toBeGreaterThan(0);
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
    const personOrOrg = (await getJsonLdNodes(page)).filter(
      node =>
        hasJsonLdType(node, "Person") || hasJsonLdType(node, "Organization")
    );
    expect(personOrOrg.length).toBeGreaterThan(0);
    const type = personOrOrg[0]["@type"];
    expect(typeof type).toBe("string");
    types.push(type as string);
  }

  // Both locales should use the same type (Person or Organization)
  expect(types[0]).toBe(types[1]);
});
