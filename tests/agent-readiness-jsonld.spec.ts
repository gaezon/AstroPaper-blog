import { test, expect } from "@playwright/test";
import {
  getJsonLdScriptContents,
  parseJsonLdDocument,
} from "./helpers/json-ld";

const pages = [
  "/",
  "/en/",
  "/posts/Why-did-I-start-blogging/",
  "/en/posts/why-i-started-blogging/",
  "/about/",
  "/en/about/",
  "/tags/",
  "/en/tags/",
  "/nonexistent-page-for-404-test/",
  "/en/nonexistent-page-for-404-test/",
];

test.describe("agent-readiness JSON-LD validity (P7)", () => {
  for (const url of pages) {
    test(`${url} — all JSON-LD blocks parse and round-trip`, async ({
      page,
    }) => {
      await page.goto(url, { waitUntil: "domcontentloaded" });
      const scripts = await getJsonLdScriptContents(page);
      for (const s of scripts) {
        const parsed = parseJsonLdDocument(s); // should not throw
        const roundTripped = JSON.parse(JSON.stringify(parsed));
        expect(roundTripped).toEqual(parsed);
      }
    });
  }
});
