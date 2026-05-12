// Feature: agent-readiness-optimization, Property 17: translations field mirrors bilingual counterpart set
import { describe, it, expect, vi, beforeEach } from "vitest";
import fc from "fast-check";
import Ajv2020 from "ajv/dist/2020";
import addFormats from "ajv-formats";

// `buildPostDetail(locale, post)` requires a real `CollectionEntry` which
// Vitest cannot produce without the Astro runtime. The task's strategy is to
// unit-test `resolveTranslations` directly (it is pure) and separately
// validate synthetic `PostDetail` objects against the JSON Schema. Together
// these exercise P17 (counterpart resolver behavior + `translations` shape)
// and revisit P11 at the `body` field level.
//
// `resolveTranslations` reads `unifiedCommentPaths` from the generated
// bilingual mapping module. We mount that module through a mutable fixture
// exported by `vi.hoisted` so individual tests can install their own
// synthetic mappings and reset between runs without re-importing the SUT.
const fixtures = vi.hoisted(() => ({
  unifiedCommentPaths: {} as Record<
    string,
    {
      zhPath: string;
      enPath: string;
      unifiedCommentPath: string;
      confidence: number;
      matchType: string;
    }
  >,
}));

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
// the module graph resolves under a plain Node/Vitest environment.
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

vi.mock("@/utils/blog-locale", () => ({
  normalizeBlogLocale: (s: string) => s,
}));

// Expose the mutable fixture to `resolveTranslations` via a getter so tests
// that reassign `fixtures.unifiedCommentPaths` are observed live by the SUT.
vi.mock("@/utils/generated/bilingualMapping", () => ({
  get unifiedCommentPaths() {
    return fixtures.unifiedCommentPaths;
  },
}));

import {
  resolveTranslations,
  MAX_BODY_EXCERPT_CHARS,
  type PostDetail,
} from "../../src/utils/agent-api";
import detailSchema from "../../src/schemas/post-detail.schema.json" with { type: "json" };

// Ajv strict mode is disabled because the detail schema carries a top-level
// `schemaVersion` sibling of `$schema` that is informational (not a JSON
// Schema keyword); strict mode would otherwise emit a warning.
const ajv = new Ajv2020({ strict: false });
addFormats(ajv);
const validate = ajv.compile(detailSchema);

describe("resolveTranslations (P17)", () => {
  beforeEach(() => {
    // Reset the fixture between tests so prior mappings do not leak.
    fixtures.unifiedCommentPaths = {};
  });

  it("returns empty array when mapping is empty", () => {
    // Validates: Requirements 4.9
    expect(
      resolveTranslations("zh-CN", "https://blog.gaazeon.com/posts/foo/")
    ).toEqual([]);
  });

  it("resolves zh → en counterpart", () => {
    // Validates: Requirements 4.8
    fixtures.unifiedCommentPaths = {
      "Some Title": {
        zhPath: "/posts/foo/",
        enPath: "/en/posts/foo-en/",
        unifiedCommentPath: "/comments/foo/",
        confidence: 1,
        matchType: "originalTitle",
      },
    };

    const result = resolveTranslations(
      "zh-CN",
      "https://blog.gaazeon.com/posts/foo/"
    );
    expect(result).toEqual([
      { locale: "en", url: "https://blog.gaazeon.com/en/posts/foo-en/" },
    ]);
  });

  it("resolves en → zh counterpart", () => {
    // Validates: Requirements 4.8
    fixtures.unifiedCommentPaths = {
      "Some Title": {
        zhPath: "/posts/foo/",
        enPath: "/en/posts/foo-en/",
        unifiedCommentPath: "/comments/foo/",
        confidence: 1,
        matchType: "originalTitle",
      },
    };

    const result = resolveTranslations(
      "en",
      "https://blog.gaazeon.com/en/posts/foo-en/"
    );
    expect(result).toEqual([
      { locale: "zh-CN", url: "https://blog.gaazeon.com/posts/foo/" },
    ]);
  });

  it("returns empty array when URL has no counterpart in mapping", () => {
    // Validates: Requirements 4.9
    fixtures.unifiedCommentPaths = {
      "Some Title": {
        zhPath: "/posts/foo/",
        enPath: "/en/posts/foo-en/",
        unifiedCommentPath: "/comments/foo/",
        confidence: 1,
        matchType: "originalTitle",
      },
    };

    const result = resolveTranslations(
      "zh-CN",
      "https://blog.gaazeon.com/posts/other/"
    );
    expect(result).toEqual([]);
  });

  it("counterpart lookup is symmetric", () => {
    // Validates: Requirements 4.8
    // Generate a list of pairs where both zh and en slugs are unique within
    // their respective columns so each zh pathname resolves to exactly one
    // en counterpart and vice versa. Paths with `/posts/` vs `/en/posts/`
    // prefixes are disjoint, so duplicate slugs across locales are safe.
    const slugArb = fc.stringMatching(/^[a-z][a-z0-9-]{0,20}$/);
    const pairsArb = fc
      .uniqueArray(slugArb, { minLength: 1, maxLength: 5 })
      .chain(zhSlugs =>
        fc
          .uniqueArray(slugArb, {
            minLength: zhSlugs.length,
            maxLength: zhSlugs.length,
          })
          .map(enSlugs =>
            zhSlugs.map((slugZh, i) => ({ slugZh, slugEn: enSlugs[i] }))
          )
      );

    fc.assert(
      fc.property(pairsArb, pairs => {
        fixtures.unifiedCommentPaths = Object.fromEntries(
          pairs.map((p, i) => [
            `t${i}`,
            {
              zhPath: `/posts/${p.slugZh}/`,
              enPath: `/en/posts/${p.slugEn}/`,
              unifiedCommentPath: `/comments/${p.slugZh}/`,
              confidence: 1,
              matchType: "originalTitle",
            },
          ])
        );

        for (const p of pairs) {
          const fromZh = resolveTranslations(
            "zh-CN",
            `https://blog.gaazeon.com/posts/${p.slugZh}/`
          );
          const fromEn = resolveTranslations(
            "en",
            `https://blog.gaazeon.com/en/posts/${p.slugEn}/`
          );

          // From the zh URL we must see exactly the en counterpart.
          expect(fromZh).toEqual([
            {
              locale: "en",
              url: `https://blog.gaazeon.com/en/posts/${p.slugEn}/`,
            },
          ]);

          // From the en URL we must see exactly the zh counterpart.
          expect(fromEn).toEqual([
            {
              locale: "zh-CN",
              url: `https://blog.gaazeon.com/posts/${p.slugZh}/`,
            },
          ]);
        }
      }),
      { numRuns: 50 }
    );
  });
});

// Generators mirror the output-shape rules of `buildPostDetail` (see design.md
// C7 and Properties P11 / P17): slugs URL-safe and non-empty; URLs absolute
// with trailing slash; locale ∈ {"zh-CN","en"}; datetimes ISO-8601;
// modDatetime may be null; body ≤ 500 chars; draft always false; translations
// array 0 or 1 entries (current scope = at most one bilingual counterpart).
const slugArb = fc.stringMatching(/^[a-z0-9][a-z0-9\-]{0,40}$/);
const titleArb = fc.string({ minLength: 1, maxLength: 120 });
const descriptionArb = fc.string({ minLength: 0, maxLength: 200 });
const tagArb = fc.string({ minLength: 1, maxLength: 24 });
const tagsArb = fc.array(tagArb, { maxLength: 6 });
const localeArb = fc.constantFrom<PostDetail["locale"]>("zh-CN", "en");
const isoDateArb = fc
  .integer({ min: 0, max: 4102444800000 }) // epoch .. 2100-01-01
  .map(ms => new Date(ms).toISOString());
const modArb = fc.option(isoDateArb, { nil: null });
const authorArb = fc.string({ minLength: 1, maxLength: 40 });
// Body is bounded at MAX_BODY_EXCERPT_CHARS (500) so the detail document
// always satisfies the schema's `maxLength: 500` for the `body` field.
const bodyArb = fc.string({ minLength: 0, maxLength: MAX_BODY_EXCERPT_CHARS });

const urlArb = fc
  .tuple(localeArb, slugArb)
  .map(
    ([l, s]) => `https://blog.gaazeon.com${l === "en" ? "/en" : ""}/posts/${s}/`
  );

const translationEntryArb = fc.tuple(localeArb, slugArb).map(([l, s]) => ({
  locale: l,
  url: `https://blog.gaazeon.com${l === "en" ? "/en" : ""}/posts/${s}/`,
}));

const detailArb: fc.Arbitrary<PostDetail> = fc.record({
  slug: slugArb,
  title: titleArb,
  description: descriptionArb,
  pubDatetime: isoDateArb,
  modDatetime: modArb,
  tags: tagsArb,
  locale: localeArb,
  url: urlArb,
  originalSlug: slugArb,
  author: authorArb,
  featured: fc.boolean(),
  draft: fc.constant(false as const),
  body: bodyArb,
  canonicalURL: urlArb,
  translations: fc.array(translationEntryArb, { maxLength: 1 }),
});

describe("PostDetail shape (P11, P17)", () => {
  it("detail document validates against post-detail.schema.json", () => {
    // Validates: Requirements 4.2, 4.8, 4.9, 8.4, 8.8
    fc.assert(
      fc.property(detailArb, detail => {
        const ok = validate(detail);
        expect(ok, JSON.stringify(validate.errors)).toBe(true);
      }),
      { numRuns: 100 }
    );
  });

  it("body never exceeds MAX_BODY_EXCERPT_CHARS", () => {
    // Validates: Requirements 4.2
    fc.assert(
      fc.property(detailArb, detail => {
        expect(detail.body.length).toBeLessThanOrEqual(MAX_BODY_EXCERPT_CHARS);
      }),
      { numRuns: 100 }
    );
  });

  it("draft is always false", () => {
    // Validates: Requirements 4.2
    fc.assert(
      fc.property(detailArb, detail => {
        expect(detail.draft).toBe(false);
      }),
      { numRuns: 100 }
    );
  });

  it("translations array has length 0 or 1", () => {
    // Validates: Requirements 4.8, 4.9
    fc.assert(
      fc.property(detailArb, detail => {
        expect(detail.translations.length).toBeLessThanOrEqual(1);
        expect(detail.translations.length).toBeGreaterThanOrEqual(0);
      }),
      { numRuns: 100 }
    );
  });
});
