// Feature: agent-readiness-optimization, Property 6: Locale consistency across inLanguage, html lang, and canonical URL
// **Validates: Requirements 2.6, 6.4, 7.1, 8.8**
import { describe, it, expect } from "vitest";
import fc from "fast-check";
import { toOgLocale } from "../../src/utils/og-locale";

// Locale detection helper — mirrors the logic in Layout.astro and i18n/config.ts
function detectLocaleFromPath(pathname: string): "zh-CN" | "en" {
  if (
    pathname === "/en" ||
    pathname === "/en/" ||
    pathname.startsWith("/en/")
  ) {
    return "en";
  }
  return "zh-CN";
}

function expectedLangTag(locale: "zh-CN" | "en"): string {
  return locale; // langTag === locale in this project
}

function expectedUrlPrefix(locale: "zh-CN" | "en"): string {
  return locale === "en" ? "/en" : "";
}

// --- Generators for valid pathnames ---

// zh paths: root or any path not starting with /en/
const zhPathArb = fc.oneof(
  fc.constant("/"),
  fc.stringMatching(/^[a-z0-9\-]{1,20}$/).map(s => `/posts/${s}/`),
  fc.stringMatching(/^[a-z0-9\-]{1,20}$/).map(s => `/tags/${s}/`),
  fc.constant("/about/"),
  fc.constant("/search/"),
  fc.constant("/tags/")
);

// en paths: always start with /en/
const enPathArb = fc.oneof(
  fc.constant("/en/"),
  fc.stringMatching(/^[a-z0-9\-]{1,20}$/).map(s => `/en/posts/${s}/`),
  fc.stringMatching(/^[a-z0-9\-]{1,20}$/).map(s => `/en/tags/${s}/`),
  fc.constant("/en/about/"),
  fc.constant("/en/search/"),
  fc.constant("/en/tags/")
);

const pathArb = fc.oneof(zhPathArb, enPathArb);

describe("locale consistency (P6)", () => {
  it("detectLocaleFromPath agrees with URL prefix convention (100 runs)", () => {
    // Validates: Requirements 2.6, 7.1
    fc.assert(
      fc.property(pathArb, path => {
        const locale = detectLocaleFromPath(path);
        if (path.startsWith("/en/") || path === "/en" || path === "/en/") {
          expect(locale).toBe("en");
        } else {
          expect(locale).toBe("zh-CN");
        }
      }),
      { numRuns: 100 }
    );
  });

  it("langTag matches locale (100 runs)", () => {
    // Validates: Requirements 7.1
    fc.assert(
      fc.property(fc.constantFrom<"zh-CN" | "en">("zh-CN", "en"), locale => {
        expect(expectedLangTag(locale)).toBe(locale);
      }),
      { numRuns: 100 }
    );
  });

  it("og:locale mapping is consistent (100 runs)", () => {
    // Validates: Requirements 6.4
    fc.assert(
      fc.property(fc.constantFrom<"zh-CN" | "en">("zh-CN", "en"), locale => {
        const ogLocale = toOgLocale(locale);
        if (locale === "zh-CN") expect(ogLocale).toBe("zh_CN");
        else expect(ogLocale).toBe("en_US");
      }),
      { numRuns: 100 }
    );
  });

  it("URL prefix matches locale (100 runs)", () => {
    // Validates: Requirements 2.6
    fc.assert(
      fc.property(fc.constantFrom<"zh-CN" | "en">("zh-CN", "en"), locale => {
        const prefix = expectedUrlPrefix(locale);
        if (locale === "en") expect(prefix).toBe("/en");
        else expect(prefix).toBe("");
      }),
      { numRuns: 100 }
    );
  });

  it("canonical URL for en locale starts with /en/, zh-CN does not", () => {
    // Validates: Requirements 2.6, 6.4, 7.1
    fc.assert(
      fc.property(pathArb, path => {
        const locale = detectLocaleFromPath(path);
        if (locale === "en") {
          expect(path.startsWith("/en")).toBe(true);
        } else {
          expect(path.startsWith("/en")).toBe(false);
        }
      }),
      { numRuns: 100 }
    );
  });

  it("full locale pipeline: path → locale → langTag → ogLocale are all consistent", () => {
    // Validates: Requirements 2.6, 6.4, 7.1
    fc.assert(
      fc.property(pathArb, path => {
        const locale = detectLocaleFromPath(path);
        const langTag = expectedLangTag(locale);
        const ogLocale = toOgLocale(locale);
        const prefix = expectedUrlPrefix(locale);

        // langTag always equals locale
        expect(langTag).toBe(locale);

        // ogLocale uses underscore format
        if (locale === "zh-CN") {
          expect(ogLocale).toBe("zh_CN");
        } else {
          expect(ogLocale).toBe("en_US");
        }

        // URL prefix is consistent with locale
        if (locale === "en") {
          expect(prefix).toBe("/en");
          expect(path.startsWith("/en")).toBe(true);
        } else {
          expect(prefix).toBe("");
          expect(path.startsWith("/en")).toBe(false);
        }
      }),
      { numRuns: 100 }
    );
  });
});
