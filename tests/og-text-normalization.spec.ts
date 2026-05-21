import { test, expect } from "@playwright/test";
import postOgImage, {
  createPostTitle,
  TITLE_PADDING_BOTTOM,
} from "../src/utils/og-templates/post.js";
import {
  createFooter,
  createPostFooter,
  DESCENDER_SAFE_LINE_HEIGHT,
  DESCENDER_SAFE_PADDING_BOTTOM,
} from "../src/utils/og-templates/shared.js";

interface VDomNode {
  type?: string;
  props?: {
    children?: unknown;
    style?: {
      lineHeight?: string | number;
      paddingBottom?: string;
    };
  };
}

// Helper to recursively find VDOM nodes matching a feature-based predicate
function findNodes(
  node: unknown,
  predicate: (n: VDomNode) => boolean
): VDomNode[] {
  if (!node || typeof node !== "object") return [];
  const results: VDomNode[] = [];
  const vdomNode = node as VDomNode;
  if (predicate(vdomNode)) {
    results.push(vdomNode);
  }
  if (vdomNode.props && vdomNode.props.children) {
    const children = vdomNode.props.children;
    const childrenArray = Array.isArray(children) ? children : [children];
    for (const child of childrenArray) {
      results.push(...findNodes(child, predicate));
    }
  }
  return results;
}

test.describe("OG text normalization", () => {
  const baseData = {
    author: "Gaazeon",
    locale: "en",
  } as const;

  test("replaces non-breaking hyphen with standard hyphen", async () => {
    const titleWithNonBreakingHyphen = "OBS\u2011live streaming pitfalls";

    const svg = await postOgImage({
      data: {
        ...baseData,
        title: titleWithNonBreakingHyphen,
      },
    });

    expect(svg).not.toContain("\u2011");
    expect(svg).toMatch(/OBS-live streaming pitfalls/);
  });

  test("does not render fallback squares for normalized hyphen", async () => {
    const svg = await postOgImage({
      data: {
        ...baseData,
        title: "OBS\u2011live streaming pitfalls",
      },
    });

    expect(svg).not.toContain("□");
  });

  test("strips variation selectors and preserves ASCII hyphen", async () => {
    const titleWithVariationSelector = "New\uFE0F Post - Update";

    const svg = await postOgImage({
      data: {
        ...baseData,
        title: titleWithVariationSelector,
      },
    });

    expect(svg).not.toContain("\uFE0F");
    expect(svg).toMatch(/New Post - Update/);
  });

  test("asserts defensive typography styling is correctly applied to templates", () => {
    // 1. Assert safe typography parameters are within safe bounds
    expect(DESCENDER_SAFE_LINE_HEIGHT).toBeGreaterThan(1.15);

    const safePaddingVal = parseInt(DESCENDER_SAFE_PADDING_BOTTOM, 10);
    expect(safePaddingVal).toBeGreaterThanOrEqual(4);

    const titlePaddingVal = parseInt(TITLE_PADDING_BOTTOM, 10);
    expect(titlePaddingVal).toBeGreaterThanOrEqual(10);

    // 2. Assert createPostTitle (from post.js) applies safe lineHeight and paddingBottom
    const postTitle = createPostTitle("Test Title", "en", 58);
    expect(postTitle.props?.style?.lineHeight).toBe(DESCENDER_SAFE_LINE_HEIGHT);
    expect(postTitle.props?.style?.paddingBottom).toBe(TITLE_PADDING_BOTTOM);

    // 3. Assert createFooter applies safe lineHeight and paddingBottom to prevent clipping
    const footer = createFooter("AstroPaper");
    expect(footer.props?.style?.lineHeight).toBe(DESCENDER_SAFE_LINE_HEIGHT);

    // Find footer brand span by looking for a span that contains "AstroPaper" as children/element
    const footerSpans = findNodes(
      footer,
      n =>
        n.type === "span" &&
        Array.isArray(n.props?.children) &&
        (n.props?.children as unknown[]).includes("AstroPaper")
    );
    expect(footerSpans.length).toBe(1);
    expect(footerSpans[0].props?.style?.lineHeight).toBe(
      DESCENDER_SAFE_LINE_HEIGHT
    );
    expect(footerSpans[0].props?.style?.paddingBottom).toBe(
      DESCENDER_SAFE_PADDING_BOTTOM
    );

    // 4. Assert createPostFooter applies safe lineHeight and paddingBottom to prevent clipping
    const authorText = "Gaazeon";
    const siteNameText = "AstroPaper";
    const postFooter = createPostFooter(authorText, siteNameText);
    expect(postFooter.props?.style?.lineHeight).toBe(
      DESCENDER_SAFE_LINE_HEIGHT
    );

    // Find author text span robustly by searching for a span whose children is the authorText
    const authorSpans = findNodes(
      postFooter,
      n => n.type === "span" && n.props?.children === authorText
    );
    expect(authorSpans.length).toBe(1);
    expect(authorSpans[0].props?.style?.lineHeight).toBe(
      DESCENDER_SAFE_LINE_HEIGHT
    );
    expect(authorSpans[0].props?.style?.paddingBottom).toBe(
      DESCENDER_SAFE_PADDING_BOTTOM
    );

    // Find site name span robustly by searching for a span whose children includes the siteNameText
    const siteSpans = findNodes(
      postFooter,
      n =>
        n.type === "span" &&
        Array.isArray(n.props?.children) &&
        (n.props?.children as unknown[]).includes(siteNameText)
    );
    expect(siteSpans.length).toBe(1);
    expect(siteSpans[0].props?.style?.lineHeight).toBe(
      DESCENDER_SAFE_LINE_HEIGHT
    );
    expect(siteSpans[0].props?.style?.paddingBottom).toBe(
      DESCENDER_SAFE_PADDING_BOTTOM
    );
  });
});
