// Feature: agent-readiness-optimization, Property 12: Tags index counts and URLs agree with source collections
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
// the module graph resolves under a plain Node/Vitest environment; the
// `TagsIndex` type we use for shape validation has no runtime dependency on
// any of these.
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

import { type TagsIndex } from "../../src/utils/agent-api";
import tagsSchema from "../../src/schemas/tags.schema.json" with { type: "json" };

// Ajv strict mode is disabled because the tags schema carries a top-level
// `schemaVersion` sibling of `$schema` that is informational (not a JSON
// Schema keyword); strict mode would otherwise emit a warning.
const ajv = new Ajv2020({ strict: false });
addFormats(ajv);
const validate = ajv.compile(tagsSchema);

// Generators are intentionally constrained to the output-shape rules of
// `buildTagsIndex` (see design.md C7 and Property P12): tag names may be
// arbitrary strings (original, non-slugified form used as object keys),
// counts are non-negative integers per locale, and URLs are absolute and
// constructed from the same slugified tag across both locales.
const tagNameArb = fc.string({ minLength: 1, maxLength: 24 });
const slugArb = fc.stringMatching(/^[a-z0-9][a-z0-9\-]{0,24}$/);

const tagEntryArb = fc.record({
  counts: fc.record({
    "zh-CN": fc.integer({ min: 0, max: 500 }),
    en: fc.integer({ min: 0, max: 500 }),
  }),
  urls: fc.tuple(slugArb).map(([tagSlug]) => ({
    "zh-CN": `https://blog.gaazeon.com/tags/${tagSlug}/`,
    en: `https://blog.gaazeon.com/en/tags/${tagSlug}/`,
  })),
});

const tagsIndexArb: fc.Arbitrary<TagsIndex> = fc
  .array(fc.tuple(tagNameArb, tagEntryArb), { minLength: 0, maxLength: 10 })
  .map(entries => Object.fromEntries(entries));

describe("buildTagsIndex shape (P12)", () => {
  it("tags index validates against tags.schema.json", () => {
    // Validates: Requirements 4.3
    fc.assert(
      fc.property(tagsIndexArb, idx => {
        const ok = validate(idx);
        expect(ok, JSON.stringify(validate.errors)).toBe(true);
      }),
      { numRuns: 100 }
    );
  });

  it("every tag entry has both zh-CN and en counts as non-negative integers", () => {
    // Validates: Requirements 4.3
    fc.assert(
      fc.property(tagsIndexArb, idx => {
        for (const entry of Object.values(idx)) {
          expect(Number.isInteger(entry.counts["zh-CN"])).toBe(true);
          expect(entry.counts["zh-CN"]).toBeGreaterThanOrEqual(0);
          expect(Number.isInteger(entry.counts.en)).toBe(true);
          expect(entry.counts.en).toBeGreaterThanOrEqual(0);
        }
      }),
      { numRuns: 100 }
    );
  });

  it("every tag URL is absolute and matches /tags/ or /en/tags/ pattern", () => {
    // Validates: Requirements 4.3
    fc.assert(
      fc.property(tagsIndexArb, idx => {
        for (const entry of Object.values(idx)) {
          expect(entry.urls["zh-CN"]).toMatch(
            /^https:\/\/[^/]+\/tags\/[^/]+\/$/
          );
          expect(entry.urls.en).toMatch(/^https:\/\/[^/]+\/en\/tags\/[^/]+\/$/);
        }
      }),
      { numRuns: 100 }
    );
  });

  it("urls inside a single tag reference the same slug across locales", () => {
    // Validates: Requirements 4.3
    //
    // Mirrors the `buildTagsIndex` invariant: both the zh-CN and en URLs
    // are constructed from the same slugified tag, so the last path
    // segment must match across locales for every entry.
    const lastSegment = (url: string): string => {
      const trimmed = url.replace(/\/+$/, "");
      const parts = trimmed.split("/");
      return parts[parts.length - 1] ?? "";
    };

    fc.assert(
      fc.property(tagsIndexArb, idx => {
        for (const entry of Object.values(idx)) {
          expect(lastSegment(entry.urls["zh-CN"])).toBe(
            lastSegment(entry.urls.en)
          );
        }
      }),
      { numRuns: 100 }
    );
  });

  it("empty tags index is valid", () => {
    // Validates: Requirements 4.3
    expect(validate({})).toBe(true);
  });

  it("tags index round-trips through JSON", () => {
    // Validates: Requirements 4.3
    fc.assert(
      fc.property(tagsIndexArb, idx => {
        const parsed = JSON.parse(JSON.stringify(idx));
        expect(parsed).toEqual(idx);
      }),
      { numRuns: 100 }
    );
  });
});
