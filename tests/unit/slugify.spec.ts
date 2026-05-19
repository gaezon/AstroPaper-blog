import { describe, it, expect } from "vitest";
import { slugifyStr, slugifyAll } from "../../src/utils/slugify";

describe("slugifyStr", () => {
  describe("ASCII-only strings (uses slugify)", () => {
    it("lowercases and hyphenates basic words", () => {
      expect(slugifyStr("Hello World")).toBe("hello-world");
    });

    it("handles acronyms correctly (upstream fix #606)", () => {
      expect(slugifyStr("E2E Testing")).toBe("e2e-testing");
      expect(slugifyStr("API Design")).toBe("api-design");
      expect(slugifyStr("GraphQL API")).toBe("graphql-api");
    });

    it("handles numbers", () => {
      expect(slugifyStr("Astro v6")).toBe("astro-v6");
      // strict mode strips dots: "Node.js 24" → "nodejs-24"
      expect(slugifyStr("Node.js 24")).toBe("nodejs-24");
    });

    it("strips special characters in strict mode", () => {
      // strict mode strips punctuation so the output is a valid
      // CSS <custom-ident> for viewTransitionName and a clean URL slug
      expect(slugifyStr("Hello, World!")).toBe("hello-world");
      expect(slugifyStr("foo & bar")).toBe("foo-and-bar");
      expect(slugifyStr("v1.0.0 release")).toBe("v100-release");
    });

    it("output contains only ident-safe characters for ASCII inputs", () => {
      // Verifies the character set is clean for viewTransitionName and URL slug
      // usage. Note: strict: true guarantees [a-z0-9-] only; full CSS
      // <custom-ident> validity (e.g. no leading digit) is the caller's
      // responsibility — post/tag titles in practice don't start with digits.
      const safe = /^[a-z0-9_-]*$/;
      expect(slugifyStr("Hello, World!")).toMatch(safe);
      expect(slugifyStr("E2E Testing 2.0")).toMatch(safe);
      expect(slugifyStr("foo & bar (v1)")).toMatch(safe);
    });

    it("collapses multiple spaces/hyphens", () => {
      expect(slugifyStr("foo  bar")).toBe("foo-bar");
    });

    it("handles empty string", () => {
      expect(slugifyStr("")).toBe("");
    });
  });

  describe("non-ASCII strings (uses lodash.kebabcase)", () => {
    it("preserves Chinese characters", () => {
      const result = slugifyStr("自建 hoarder");
      // kebabcase preserves non-ASCII; should contain the Chinese chars
      expect(result).toContain("hoarder");
      expect(result).toMatch(/自建/);
    });

    it("handles pure Chinese tags", () => {
      const result = slugifyStr("前端开发");
      expect(result).toBe("前端开发");
    });

    it("handles mixed Chinese and ASCII", () => {
      const result = slugifyStr("Web 前端");
      // kebabcase path: non-ASCII detected
      expect(typeof result).toBe("string");
      expect(result.length).toBeGreaterThan(0);
    });

    it("handles accented Latin characters (non-ASCII branch)", () => {
      // é is non-ASCII (> 0x7F), so kebabcase branch is used
      const result = slugifyStr("café");
      expect(typeof result).toBe("string");
      expect(result.length).toBeGreaterThan(0);
    });
  });

  describe("edge cases", () => {
    it("handles already-slugified strings", () => {
      expect(slugifyStr("hello-world")).toBe("hello-world");
    });

    it("handles single word", () => {
      expect(slugifyStr("astro")).toBe("astro");
    });
  });
});

describe("slugifyAll", () => {
  it("maps slugifyStr over an array", () => {
    expect(slugifyAll(["Hello World", "API Design"])).toEqual([
      "hello-world",
      "api-design",
    ]);
  });

  it("handles empty array", () => {
    expect(slugifyAll([])).toEqual([]);
  });
});
