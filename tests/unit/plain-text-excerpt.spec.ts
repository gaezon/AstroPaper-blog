// Feature: agent-readiness-optimization, Property 11: Plain-text excerpt is ≤ 500 chars and free of markdown markup
import { describe, it, expect, vi } from "vitest";
import fc from "fast-check";

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
// `extractPlainText` function has no runtime dependency on any of these.
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
  extractPlainText,
  MAX_BODY_EXCERPT_CHARS,
} from "../../src/utils/agent-api";

// Word generator restricted to ASCII letters/digits avoids accidentally
// embedding Markdown metacharacters (backticks, asterisks, brackets, etc.)
// inside the "payload" of generated Markdown constructs, so the `oneof`
// composer below produces balanced constructs that the stripper can parse.
const wordArb = fc.stringMatching(/^[a-zA-Z0-9]{1,8}$/);
const wordsArb = fc
  .array(wordArb, { minLength: 1, maxLength: 6 })
  .map(parts => parts.join(" "));

const headingBlockArb = fc
  .tuple(fc.constantFrom("# ", "## ", "### "), wordsArb)
  .map(([marker, words]) => marker + words);

const boldBlockArb = wordArb.map(w => `**${w}**`);
const inlineCodeBlockArb = wordArb.map(w => "`" + w + "`");
const fencedCodeBlockArb = wordArb.map(w => "```js\n" + w + "\n```");
const linkBlockArb = wordArb.map(w => `[${w}](https://example.com)`);
const imageBlockArb = fc.constant("![alt](https://example.com/img.png)");
const paragraphBlockArb = wordsArb;

const markdownBlockArb = fc.oneof(
  headingBlockArb,
  boldBlockArb,
  inlineCodeBlockArb,
  fencedCodeBlockArb,
  linkBlockArb,
  imageBlockArb,
  paragraphBlockArb
);

const markdownBodyArb = fc
  .array(markdownBlockArb, { maxLength: 10 })
  .map(parts => parts.join("\n\n"));

describe("extractPlainText (P11)", () => {
  it("never returns more than limit characters", () => {
    // Validates: Requirements 4.2
    fc.assert(
      fc.property(
        fc.tuple(
          fc.string({ minLength: 0, maxLength: 2000 }),
          fc.integer({ min: 10, max: 500 })
        ),
        ([body, limit]) => {
          const out = extractPlainText(body, limit);
          expect(out.length).toBeLessThanOrEqual(limit);
        }
      ),
      { numRuns: 100 }
    );
  });

  it("default limit equals MAX_BODY_EXCERPT_CHARS", () => {
    // Validates: Requirements 4.2
    expect(MAX_BODY_EXCERPT_CHARS).toBe(500);

    fc.assert(
      fc.property(fc.string({ minLength: 0, maxLength: 2000 }), body => {
        const out = extractPlainText(body);
        expect(out.length).toBeLessThanOrEqual(MAX_BODY_EXCERPT_CHARS);
      }),
      { numRuns: 100 }
    );
  });

  it("no raw Markdown syntax in output when input uses common Markdown constructs", () => {
    // Validates: Requirements 4.2
    fc.assert(
      fc.property(markdownBodyArb, body => {
        const out = extractPlainText(body);

        // No fenced code fence markers survive.
        expect(out.includes("```")).toBe(false);

        // No heading markers at line start (output has already been
        // collapsed to a single line; this guards the leading edge too).
        expect(/^#{1,6}\s/m.test(out)).toBe(false);

        // No image syntax survives intact.
        expect(/!\[[^\]]*\]\([^)]*\)/.test(out)).toBe(false);

        // No link syntax survives intact (the label is preserved but the
        // surrounding brackets/URL are stripped).
        expect(/\[[^\]]*\]\([^)]*\)/.test(out)).toBe(false);

        // No HTML tags survive.
        expect(/<[a-z][^>]*>/i.test(out)).toBe(false);

        // No YAML frontmatter leftovers.
        expect(out.startsWith("---\n")).toBe(false);
      }),
      { numRuns: 100 }
    );
  });

  it("stripping is idempotent", () => {
    // Validates: Requirements 4.2
    fc.assert(
      fc.property(markdownBodyArb, body => {
        const once = extractPlainText(body);
        const twice = extractPlainText(once);
        expect(twice).toBe(once);
      }),
      { numRuns: 100 }
    );
  });

  it("removes fenced code blocks entirely", () => {
    // Validates: Requirements 4.2
    const input =
      "before\n\n```js\nconst x = 1;\nconsole.log(x);\n```\n\nafter";
    const out = extractPlainText(input);
    expect(out).toContain("before");
    expect(out).toContain("after");
    expect(out.includes("const x")).toBe(false);
    expect(out.includes("console.log")).toBe(false);
    expect(out.includes("```")).toBe(false);
  });

  it("collapses whitespace", () => {
    // Validates: Requirements 4.2
    const input = "a   b\n\n\n\n   c\t\td";
    expect(extractPlainText(input)).toBe("a b c d");
  });

  it("truncates on word boundary when content exceeds limit", () => {
    // Validates: Requirements 4.2
    const input = "word ".repeat(200); // 1000 chars
    const out = extractPlainText(input, 100);
    expect(out.length).toBeLessThanOrEqual(100);
    expect(out.endsWith("word")).toBe(true);
  });
});
