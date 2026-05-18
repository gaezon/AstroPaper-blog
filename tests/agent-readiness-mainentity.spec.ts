import { test, expect } from "@playwright/test";
import { getJsonLdNodes } from "./helpers/json-ld";

const indexablePages = [
  {
    url: "/posts/Why-did-I-start-blogging/",
    canonical: "https://blog.gaazeon.com/posts/Why-did-I-start-blogging/",
  },
  {
    url: "/en/posts/why-i-started-blogging/",
    canonical: "https://blog.gaazeon.com/en/posts/why-i-started-blogging/",
  },
];

test.describe("agent-readiness mainEntityOfPage (P21)", () => {
  for (const { url, canonical } of indexablePages) {
    test(`${url} — JSON-LD mainEntityOfPage matches canonical`, async ({
      page,
    }) => {
      await page.goto(url, { waitUntil: "domcontentloaded" });
      const nodes = await getJsonLdNodes(page);
      const found = nodes.some(node => {
        if (!node.mainEntityOfPage) {
          return false;
        }
        const mepObj = node.mainEntityOfPage as
          | string
          | Record<string, unknown>;
        const mep =
          typeof mepObj === "string" ? mepObj : mepObj["@id"] || mepObj.url;
        return mep === canonical;
      });
      expect(found, `Expected mainEntityOfPage === ${canonical}`).toBe(true);
    });
  }
});
