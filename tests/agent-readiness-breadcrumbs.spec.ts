import { test, expect } from "@playwright/test";
import { findFirstJsonLdNodeByType, getJsonLdNodes } from "./helpers/json-ld";

const pages = [
  { url: "/posts/Why-did-I-start-blogging/", expectedItems: 3 },
  { url: "/en/posts/why-i-started-blogging/", expectedItems: 3 },
  { url: "/tags/", expectedItems: 2 },
  { url: "/en/tags/", expectedItems: 2 },
];

test.describe("agent-readiness breadcrumbs (P5)", () => {
  for (const { url, expectedItems } of pages) {
    test(`${url} — BreadcrumbList with ${expectedItems} items`, async ({
      page,
    }) => {
      await page.goto(url, { waitUntil: "domcontentloaded" });
      const nodes = await getJsonLdNodes(page);
      const breadcrumbList =
        findFirstJsonLdNodeByType(nodes, "BreadcrumbList") ?? null;
      expect(
        breadcrumbList,
        "BreadcrumbList should exist in JSON-LD"
      ).not.toBeNull();
      const bcList = breadcrumbList as Record<string, unknown>;
      const items = bcList.itemListElement as Array<Record<string, unknown>>;
      expect(items.length).toBe(expectedItems);
      // Positions are contiguous 1..n
      const positions = items.map((el: Record<string, unknown>) => el.position);
      expect(positions).toEqual(
        Array.from({ length: expectedItems }, (_, i) => i + 1)
      );
    });
  }
});
