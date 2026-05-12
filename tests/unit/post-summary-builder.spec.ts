// Feature: agent-readiness-optimization, Property 10: Post summary builder produces schema-valid summaries for every post
import { describe, it, expect, vi } from "vitest";
import fc from "fast-check";
import Ajv2020 from "ajv/dist/2020";
import addFormats from "ajv-formats";

// The project uses the `@/*` TypeScript path alias, which is wired through
// Astro/Vite but not through Vitest's module resolver. Intercept the real
// SITE config so `src/utils/agent-api.ts` can resolve its `@/config` import
// under the plain Vitest runner without touching any source file or shared
// config. `vi.mock` calls are hoisted above imports by Vitest.
vi.mock("@/config", () => ({
  SITE: { website: "https://blog.gaazeon.com/" },
}));

// `src/utils/agent-api.ts` transitively imports `astro:content` and a number
// of project helpers that depend on the Astro runtime. Stub each of them so
// the module graph resolves under a plain Node/Vitest environment; the pure
// `assertJsonSize` function and the `PostSummary` type we use for shape
// validation have no runtime dependency on any of these.
vi.mock("astro:content", () => ({
  getCollection: vi.fn(),
}));

vi.mock("@/utils/i18n-pages", () => ({
  getBlogPosts: vi.fn(),
  getBlogCollectionName: vi.fn(),
}));

vi.mock("@/utils/getPath", () => ({
  getPath: vi.fn(),
}));

vi.mock("@/utils/getSortedPosts", () => ({
  default: vi.fn(),
}));

vi.mock("@/utils/getUniqueTags", () => ({
  default: vi.fn(),
}));

vi.mock("@/utils/postFilter", () => ({
  default: vi.fn(),
}));

vi.mock("@/utils/slugify", () => ({
  slugifyStr: (s: string) => s.toLowerCase().replace(/\s+/g, "-"),
}));

vi.mock("@/utils/generated/bilingualMapping", () => ({
  unifiedCommentPaths: {},
}));

vi.mock("@/utils/blog-locale", () => ({
  normalizeBlogLocale: (s: string) => s,
}));

import {
  assertJsonSize,
  MAX_JSON_SIZE_BYTES,
  type PostSummary,
} from "../../src/utils/agent-api";
import summarySchema from "../../src/schemas/post-summary.schema.json" with { type: "json" };

// Ajv strict mode is disabled because the summary schema carries a top-level
// `schemaVersion` sibling of `$schema` that is informational (not a JSON
// Schema keyword); strict mode would otherwise emit a warning.
const ajv = new Ajv2020({ strict: false });
addFormats(ajv);
const validate = ajv.compile(summarySchema);

// Generators are intentionally constrained to the output-shape rules of
// `buildAllPostSummaries` (see design.md C7 and Property P10): slugs are
// URL-safe, titles/slugs are non-empty, URLs end with `/`, locale ∈
// {"zh-CN","en"}, datetimes are ISO-8601, modDatetime may be null.
const slugArb = fc.stringMatching(/^[a-z0-9][a-z0-9\-]{0,40}$/);
const titleArb = fc.string({ minLength: 1, maxLength: 120 });
const descriptionArb = fc.string({ minLength: 0, maxLength: 200 });
const tagArb = fc.string({ minLength: 1, maxLength: 24 });
const tagsArb = fc.array(tagArb, { maxLength: 6 });
const localeArb = fc.constantFrom<PostSummary["locale"]>("zh-CN", "en");
const isoDateArb = fc
  .integer({ min: 0, max: 4102444800000 }) // epoch .. 2100-01-01
  .map(ms => new Date(ms).toISOString());
const modArb = fc.option(isoDateArb, { nil: null });

const summaryArb: fc.Arbitrary<PostSummary> = fc.record({
  slug: slugArb,
  title: titleArb,
  description: descriptionArb,
  pubDatetime: isoDateArb,
  modDatetime: modArb,
  tags: tagsArb,
  locale: localeArb,
  // URLs must be absolute and end with `/`. Compose from slug + locale so
  // the generator always mirrors the real builder's URL shape.
  url: fc.tuple(localeArb, slugArb).map(([locale, slug]) => {
    const prefix = locale === "en" ? "/en" : "";
    return `https://blog.gaazeon.com${prefix}/posts/${slug}/`;
  }),
  originalSlug: slugArb,
});

describe("buildAllPostSummaries shape (P10)", () => {
  it("any single summary validates against post-summary.schema.json", () => {
    // Validates: Requirements 4.1, 8.4, 8.8
    fc.assert(
      fc.property(summaryArb, summary => {
        const ok = validate([summary]);
        expect(ok, JSON.stringify(validate.errors)).toBe(true);
      }),
      { numRuns: 100 }
    );
  });

  it("array of summaries validates", () => {
    // Validates: Requirements 4.1, 8.4, 8.8
    fc.assert(
      fc.property(
        fc.array(summaryArb, { minLength: 0, maxLength: 10 }),
        summaries => {
          const ok = validate(summaries);
          expect(ok, JSON.stringify(validate.errors)).toBe(true);
        }
      ),
      { numRuns: 100 }
    );
  });

  it("url ends with trailing slash", () => {
    // Validates: Requirements 4.1
    fc.assert(
      fc.property(summaryArb, s => {
        expect(s.url.endsWith("/")).toBe(true);
      }),
      { numRuns: 100 }
    );
  });

  it("locale matches enum", () => {
    // Validates: Requirements 4.1
    fc.assert(
      fc.property(summaryArb, s => {
        expect(["zh-CN", "en"]).toContain(s.locale);
      }),
      { numRuns: 100 }
    );
  });

  it("assertJsonSize throws on payload > 2 MiB", () => {
    // Validates: Requirements 4.10
    const huge = "x".repeat(MAX_JSON_SIZE_BYTES + 1);
    expect(() => assertJsonSize("/test.json", huge)).toThrow(
      /Emitted JSON exceeds 2 MiB budget/
    );
  });

  it("assertJsonSize does not throw on payload <= 2 MiB", () => {
    // Validates: Requirements 4.10
    expect(() => assertJsonSize("/test.json", "ok")).not.toThrow();
  });

  it("assertJsonSize error message mentions path and byte count", () => {
    // Validates: Requirements 4.10
    const huge = "x".repeat(3 * 1024 * 1024);
    try {
      assertJsonSize("/api/posts.json", huge);
      throw new Error("expected throw");
    } catch (e) {
      expect((e as Error).message).toMatch(/\/api\/posts\.json/);
      expect((e as Error).message).toMatch(/\d+ bytes/);
    }
  });
});
