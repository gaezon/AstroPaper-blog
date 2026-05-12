// Feature: agent-readiness-optimization, Property 25: Invalid source content aborts the build with a descriptive error
import { describe, it, expect, vi } from "vitest";
import fc from "fast-check";

// `src/utils/agent-api.ts` pulls in a number of Astro-runtime modules that
// Vitest cannot resolve on its own (the `@/*` TypeScript path alias is not
// wired through the plain Vitest runner). Stub each of them so the module
// graph loads under Node/Vitest. For `@/utils/blog-locale` we forward to the
// real implementation via `vi.importActual` so this suite exercises the true
// `normalizeBlogLocale` throwing path both directly and through
// `buildPostDetail`'s internal usage. `vi.mock` calls are hoisted above
// imports.
vi.mock("@/config", () => ({
  SITE: { website: "https://blog.gaazeon.com/" },
}));

vi.mock("@/utils/blog-locale", async () =>
  vi.importActual<typeof import("../../src/utils/blog-locale")>(
    "../../src/utils/blog-locale"
  )
);

vi.mock("astro:content", () => ({
  getCollection: vi.fn(),
}));

vi.mock("@/utils/i18n-pages", () => ({
  getBlogPosts: vi.fn(),
  getBlogCollectionName: vi.fn(),
}));

vi.mock("@/utils/getPath", () => ({
  // Return a deterministic route path that mirrors the real locale layout.
  getPath: (
    id: string,
    _filePath: string | undefined,
    includeBase: boolean,
    customSlug?: string
  ) => {
    const slug = customSlug ?? id;
    return includeBase ? `/posts/${slug}/` : slug;
  },
}));

vi.mock("@/utils/getSortedPosts", () => ({
  default: (posts: unknown[]) => posts,
}));

vi.mock("@/utils/getUniqueTags", () => ({
  default: () => [],
}));

vi.mock("@/utils/postFilter", () => ({
  default: () => true,
}));

vi.mock("@/utils/slugify", () => ({
  slugifyStr: (s: string) => s.toLowerCase().replace(/\s+/g, "-"),
}));

vi.mock("@/utils/generated/bilingualMapping", () => ({
  unifiedCommentPaths: {},
}));

import {
  buildPostDetail,
  assertJsonSize,
  MAX_JSON_SIZE_BYTES,
} from "../../src/utils/agent-api";
import { normalizeBlogLocale, isBlogLocale } from "../../src/utils/blog-locale";

// ---------------------------------------------------------------------------
// Synthetic CollectionEntry factory
// ---------------------------------------------------------------------------

type FakeEntry = Parameters<typeof buildPostDetail>[1];

function fakeEntry(
  overrides: Record<string, unknown> = {},
  filePath = "src/data/blog/fake.md"
): FakeEntry {
  const entry = {
    id: "fake",
    filePath,
    body: "some body text",
    data: {
      author: "Test Author",
      pubDatetime: new Date("2025-01-01T00:00:00.000Z"),
      modDatetime: null,
      title: "Fake Title",
      tags: ["test"],
      description: "desc",
      locale: "zh-CN",
      ...overrides,
    },
  } as unknown as FakeEntry;
  return entry;
}

// ---------------------------------------------------------------------------
// A. buildPostDetail draft validation
// ---------------------------------------------------------------------------

describe("buildPostDetail draft validation (P25)", () => {
  it("throws when post is draft, naming the offending file path and the 'draft' rule", async () => {
    // Validates: Requirements 10.4
    await expect(
      buildPostDetail(
        "zh-CN",
        fakeEntry({ draft: true }, "src/data/blog/draft.md")
      )
    ).rejects.toThrow(/draft/);

    await expect(
      buildPostDetail(
        "zh-CN",
        fakeEntry({ draft: true }, "src/data/blog/draft.md")
      )
    ).rejects.toThrow(/src\/data\/blog\/draft\.md/);
  });

  it("draft error identifies the offending source file path across many inputs", async () => {
    // Validates: Requirements 10.4
    const filePathArb = fc.stringMatching(
      /^src\/data\/blog\/(?:en\/)?[a-z0-9][a-z0-9\-_]{0,40}\.md$/
    );

    await fc.assert(
      fc.asyncProperty(filePathArb, async filePath => {
        let thrown: Error | undefined;
        try {
          await buildPostDetail("zh-CN", fakeEntry({ draft: true }, filePath));
        } catch (e) {
          thrown = e as Error;
        }
        expect(thrown, "expected buildPostDetail to throw").toBeDefined();
        const msg = (thrown as Error).message;
        // Rule identifier: mentions "draft".
        expect(msg).toContain("draft");
        // Offending source file path appears verbatim.
        expect(msg).toContain(filePath);
      }),
      { numRuns: 50 }
    );
  });
});

// ---------------------------------------------------------------------------
// B. normalizeBlogLocale validation
// ---------------------------------------------------------------------------

describe("normalizeBlogLocale validation (P25)", () => {
  it("accepts zh-CN and en", () => {
    // Validates: Requirements 10.4
    expect(normalizeBlogLocale("zh-CN")).toBe("zh-CN");
    expect(normalizeBlogLocale("en")).toBe("en");
  });

  it("throws on any other locale string", () => {
    // Validates: Requirements 10.4
    fc.assert(
      fc.property(
        fc.string().filter(s => s !== "zh-CN" && s !== "en"),
        s => {
          expect(() => normalizeBlogLocale(s)).toThrow(
            /Unsupported blog locale/
          );
        }
      ),
      { numRuns: 100 }
    );
  });

  it("error message names the offending locale and the supported values", () => {
    // Validates: Requirements 10.4
    fc.assert(
      fc.property(
        fc
          .string({ minLength: 1, maxLength: 20 })
          .filter(s => !isBlogLocale(s)),
        s => {
          let thrown: Error | undefined;
          try {
            normalizeBlogLocale(s);
          } catch (e) {
            thrown = e as Error;
          }
          expect(thrown, "expected normalizeBlogLocale to throw").toBeDefined();
          const msg = (thrown as Error).message;
          // Offending value appears verbatim.
          expect(msg).toContain(s);
          // Rule identifier: enumerates the supported locales.
          expect(msg).toContain("zh-CN");
          expect(msg).toContain("en");
        }
      ),
      { numRuns: 100 }
    );
  });

  it("rejects the string literal 'zh' without silently aliasing to zh-CN", () => {
    // Validates: Requirements 10.4
    expect(() => normalizeBlogLocale("zh")).toThrow(
      /Unsupported blog locale: zh/
    );
  });
});

// ---------------------------------------------------------------------------
// C. assertJsonSize validation
// ---------------------------------------------------------------------------

describe("assertJsonSize validation (P25)", () => {
  it("error message names the offending path and the byte count", () => {
    // Validates: Requirements 10.4
    const oversize = "x".repeat(MAX_JSON_SIZE_BYTES + 1);
    expect(() => assertJsonSize("/api/posts.json", oversize)).toThrow(
      /\/api\/posts\.json.*\d+ bytes/
    );
  });

  it("error message mentions the '2 MiB budget' rule identifier", () => {
    // Validates: Requirements 10.4
    const oversize = "x".repeat(MAX_JSON_SIZE_BYTES + 1);
    expect(() => assertJsonSize("/api/posts.json", oversize)).toThrow(
      /2 MiB budget/
    );
  });
});
