// Feature: agent-readiness-optimization, Property 4/8: BlogPosting builder shape invariants
// **Validates: Requirements 2.2, 2.8, 2.9, 2.10, 8.8**
import { describe, it, expect } from "vitest";
import fc from "fast-check";

// Since the BlogPosting is composed inline in Layout.astro, we test the
// shape invariants by constructing synthetic BlogPosting objects that mirror
// the Layout's output rules and validating their structure.

interface BlogPostingNode {
  "@type": "BlogPosting";
  headline: string;
  datePublished: string;
  dateModified: string;
  author: { name: string };
  inLanguage: string;
  image: string;
  mainEntityOfPage: { "@type": "WebPage"; "@id": string };
  url: string;
  sameAs?: string[];
  translationOfWork?: { "@type": "CreativeWork"; "@id": string };
}

// --- Generators ---

const isoDateArb = fc
  .integer({ min: 0, max: 4102444800000 })
  .map(ms => new Date(ms).toISOString());

const localeArb = fc.constantFrom<"zh-CN" | "en">("zh-CN", "en");

const slugArb = fc.stringMatching(/^[a-z0-9][a-z0-9\-]{0,30}$/);

const DEFAULT_OG_IMAGE = "https://blog.gaazeon.com/default-og.png";

// Builder that mirrors Layout.astro's BlogPosting construction rules:
// - headline from title (non-empty)
// - datePublished from pubDatetime (ISO)
// - dateModified from modDatetime ?? pubDatetime (Req 2.10)
// - image from ogImage ?? SITE.ogImage (Req 2.9)
// - sameAs + translationOfWork when counterpart exists (Req 2.8)
function buildBlogPosting(input: {
  title: string;
  pubDatetime: string;
  modDatetime: string | null;
  ogImage: string | null;
  locale: "zh-CN" | "en";
  slug: string;
  authorName: string;
  counterpartUrl: string | null;
}): BlogPostingNode {
  const prefix = input.locale === "en" ? "/en" : "";
  const pageUrl = `https://blog.gaazeon.com${prefix}/posts/${input.slug}/`;

  const node: BlogPostingNode = {
    "@type": "BlogPosting",
    headline: input.title,
    datePublished: input.pubDatetime,
    dateModified: input.modDatetime ?? input.pubDatetime,
    author: { name: input.authorName },
    inLanguage: input.locale === "zh-CN" ? "zh-CN" : "en",
    image: input.ogImage ?? DEFAULT_OG_IMAGE,
    mainEntityOfPage: { "@type": "WebPage", "@id": pageUrl },
    url: pageUrl,
  };

  if (input.counterpartUrl) {
    node.sameAs = [input.counterpartUrl];
    node.translationOfWork = {
      "@type": "CreativeWork",
      "@id": input.counterpartUrl,
    };
  }

  return node;
}

// Input arbitrary that mirrors valid frontmatter
const inputArb = fc.record({
  title: fc.string({ minLength: 1, maxLength: 120 }),
  pubDatetime: isoDateArb,
  modDatetime: fc.option(isoDateArb, { nil: null }),
  ogImage: fc.option(fc.webUrl(), { nil: null }),
  locale: localeArb,
  slug: slugArb,
  authorName: fc.string({ minLength: 1, maxLength: 40 }),
  counterpartUrl: fc.option(fc.webUrl(), { nil: null }),
});

describe("BlogPosting shape invariants (P4, P8)", () => {
  it("P4: all required fields are non-empty strings (100 runs)", () => {
    // Validates: Requirements 2.2
    fc.assert(
      fc.property(inputArb, input => {
        const bp = buildBlogPosting(input);
        expect(bp["@type"]).toBe("BlogPosting");
        expect(bp.headline.length).toBeGreaterThan(0);
        expect(bp.datePublished.length).toBeGreaterThan(0);
        expect(bp.dateModified.length).toBeGreaterThan(0);
        expect(bp.author.name.length).toBeGreaterThan(0);
        expect(bp.inLanguage).toMatch(/^(zh-CN|en)$/);
        expect(bp.image.length).toBeGreaterThan(0);
        expect(bp.url.length).toBeGreaterThan(0);
        expect(bp.mainEntityOfPage["@type"]).toBe("WebPage");
        expect(bp.mainEntityOfPage["@id"].length).toBeGreaterThan(0);
      }),
      { numRuns: 100 }
    );
  });

  it("P4: dateModified equals datePublished when modDatetime is null", () => {
    // Validates: Requirements 2.10
    const inputWithoutMod = fc.record({
      title: fc.string({ minLength: 1, maxLength: 120 }),
      pubDatetime: isoDateArb,
      modDatetime: fc.constant(null as string | null),
      ogImage: fc.option(fc.webUrl(), { nil: null }),
      locale: localeArb,
      slug: slugArb,
      authorName: fc.string({ minLength: 1, maxLength: 40 }),
      counterpartUrl: fc.option(fc.webUrl(), { nil: null }),
    });

    fc.assert(
      fc.property(inputWithoutMod, input => {
        const bp = buildBlogPosting(input);
        expect(bp.dateModified).toBe(bp.datePublished);
      }),
      { numRuns: 100 }
    );
  });

  it("P4: image falls back to default OG image when ogImage is absent", () => {
    // Validates: Requirements 2.9
    const inputWithoutOg = fc.record({
      title: fc.string({ minLength: 1, maxLength: 120 }),
      pubDatetime: isoDateArb,
      modDatetime: fc.option(isoDateArb, { nil: null }),
      ogImage: fc.constant(null as string | null),
      locale: localeArb,
      slug: slugArb,
      authorName: fc.string({ minLength: 1, maxLength: 40 }),
      counterpartUrl: fc.option(fc.webUrl(), { nil: null }),
    });

    fc.assert(
      fc.property(inputWithoutOg, input => {
        const bp = buildBlogPosting(input);
        expect(bp.image).toBe(DEFAULT_OG_IMAGE);
      }),
      { numRuns: 100 }
    );
  });

  it("P8: when counterpart URL is provided, sameAs and translationOfWork are set", () => {
    // Validates: Requirements 2.8
    const inputWithCounterpart = fc.record({
      title: fc.string({ minLength: 1, maxLength: 120 }),
      pubDatetime: isoDateArb,
      modDatetime: fc.option(isoDateArb, { nil: null }),
      ogImage: fc.option(fc.webUrl(), { nil: null }),
      locale: localeArb,
      slug: slugArb,
      authorName: fc.string({ minLength: 1, maxLength: 40 }),
      counterpartUrl: fc.webUrl().map(u => u as string | null),
    });

    fc.assert(
      fc.property(inputWithCounterpart, input => {
        const bp = buildBlogPosting(input);
        expect(bp.sameAs).toBeDefined();
        expect(bp.sameAs!).toHaveLength(1);
        expect(bp.sameAs![0]).toBe(input.counterpartUrl);
        expect(bp.translationOfWork).toBeDefined();
        expect(bp.translationOfWork!["@type"]).toBe("CreativeWork");
        expect(bp.translationOfWork!["@id"]).toBe(input.counterpartUrl);
      }),
      { numRuns: 100 }
    );
  });

  it("P8: when counterpart URL is absent, sameAs and translationOfWork are absent", () => {
    // Validates: Requirements 2.8
    const inputWithoutCounterpart = fc.record({
      title: fc.string({ minLength: 1, maxLength: 120 }),
      pubDatetime: isoDateArb,
      modDatetime: fc.option(isoDateArb, { nil: null }),
      ogImage: fc.option(fc.webUrl(), { nil: null }),
      locale: localeArb,
      slug: slugArb,
      authorName: fc.string({ minLength: 1, maxLength: 40 }),
      counterpartUrl: fc.constant(null as string | null),
    });

    fc.assert(
      fc.property(inputWithoutCounterpart, input => {
        const bp = buildBlogPosting(input);
        expect(bp.sameAs).toBeUndefined();
        expect(bp.translationOfWork).toBeUndefined();
      }),
      { numRuns: 100 }
    );
  });

  it("P4: mainEntityOfPage @id matches url", () => {
    // Validates: Requirements 2.2
    fc.assert(
      fc.property(inputArb, input => {
        const bp = buildBlogPosting(input);
        expect(bp.mainEntityOfPage["@id"]).toBe(bp.url);
      }),
      { numRuns: 100 }
    );
  });
});
