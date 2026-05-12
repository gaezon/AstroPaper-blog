// Feature: agent-readiness-optimization, Property 16: /api/posts/{locale}/{slug}.json presence mirrors content collections
import { describe, it, expect } from "vitest";
import { readFileSync, existsSync } from "node:fs";
import { resolve, join } from "node:path";

const API_DIR = resolve(process.cwd(), ".vercel/output/static/api");
const POSTS_JSON_PATH = join(API_DIR, "posts.json");

interface PostSummary {
  slug: string;
  locale: "zh-CN" | "en";
  originalSlug: string;
}

describe.skipIf(!existsSync(API_DIR))(
  "API posts bilingual presence (P16)",
  () => {
    const summaries: PostSummary[] = existsSync(POSTS_JSON_PATH)
      ? JSON.parse(readFileSync(POSTS_JSON_PATH, "utf-8"))
      : [];

    // Group summaries by originalSlug to determine which locales publish each slug
    const slugLocaleMap = new Map<string, Map<string, string>>();
    for (const summary of summaries) {
      if (!slugLocaleMap.has(summary.originalSlug)) {
        slugLocaleMap.set(summary.originalSlug, new Map());
      }
      slugLocaleMap
        .get(summary.originalSlug)!
        .set(summary.locale, summary.slug);
    }

    const LOCALES = ["zh-CN", "en"] as const;

    it("should have at least one post in the summaries", () => {
      expect(summaries.length).toBeGreaterThan(0);
    });

    it("should have at least one originalSlug with entries", () => {
      expect(slugLocaleMap.size).toBeGreaterThan(0);
    });

    // For each unique originalSlug, verify file presence matches summary presence
    for (const [originalSlug, localeSlugMap] of slugLocaleMap) {
      describe(`originalSlug: "${originalSlug}"`, () => {
        for (const locale of LOCALES) {
          if (localeSlugMap.has(locale)) {
            const slug = localeSlugMap.get(locale)!;
            it(`${locale}/${slug}.json exists (locale publishes this slug)`, () => {
              // Validates: Requirements 6.2
              const filePath = join(API_DIR, "posts", locale, `${slug}.json`);
              expect(
                existsSync(filePath),
                `Expected file to exist: posts/${locale}/${slug}.json`
              ).toBe(true);
            });
          } else {
            // No summary entry for this locale — assert no file exists for any
            // slug variant under this locale for this originalSlug.
            // Since the slug in the other locale may differ, we check that no
            // file exists using the slug from the locale that DOES have it.
            it(`${locale}/ has no file for this slug (locale does not publish it)`, () => {
              // Validates: Requirements 6.3
              // Get the slug from the other locale to check no cross-locale stub exists
              const otherLocale = locale === "zh-CN" ? "en" : "zh-CN";
              const otherSlug = localeSlugMap.get(otherLocale);
              if (otherSlug) {
                const filePath = join(
                  API_DIR,
                  "posts",
                  locale,
                  `${otherSlug}.json`
                );
                expect(
                  existsSync(filePath),
                  `File should NOT exist: posts/${locale}/${otherSlug}.json (no stub for absent locale)`
                ).toBe(false);
              }
            });
          }
        }
      });
    }
  }
);
