import { test, expect } from "@playwright/test";

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
      const scripts = await page
        .locator('script[type="application/ld+json"]')
        .allTextContents();
      const found = scripts.some(s => {
        try {
          const data = JSON.parse(s);
          const graph = data["@graph"] || [data];
          return graph.some((node: Record<string, unknown>) => {
            if (node.mainEntityOfPage) {
              const mepObj = node.mainEntityOfPage as
                | string
                | Record<string, unknown>;
              const mep =
                typeof mepObj === "string"
                  ? mepObj
                  : (mepObj as Record<string, unknown>)["@id"] ||
                    (mepObj as Record<string, unknown>).url;
              return mep === canonical;
            }
            return false;
          });
        } catch {
          return false;
        }
      });
      expect(found, `Expected mainEntityOfPage === ${canonical}`).toBe(true);
    });
  }
});
