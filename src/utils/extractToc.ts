import type { MarkdownHeading } from "astro";

export interface TocItem {
  id: string;
  title: string;
  level: number;
  children?: TocItem[];
}

const TOC_MIN_DEPTH = 2;
const TOC_MAX_DEPTH = 2;
const TOC_DOM_HEADING_SELECTOR = "h2";
const TOC_CONTENT_HEADING_PATTERN = '<h2[^>]*id="([^"]*)"[^>]*>(.*?)<\\/h2>';

function isSupportedTocDepth(level: number): boolean {
  return level >= TOC_MIN_DEPTH && level <= TOC_MAX_DEPTH;
}

function normalizeTocTitle(rawTitle: string): string {
  return rawTitle
    .replace(/\s*#\s*$/, "")
    .replace(/\s+/g, " ")
    .trim();
}

function isExcludedTocEntry(id: string, title: string): boolean {
  const normalizedTitle = title.toLowerCase();
  const normalizedId = id.toLowerCase();

  return (
    normalizedTitle.includes("footnote") ||
    normalizedId.includes("footnote") ||
    id.startsWith("fnref-") ||
    id.startsWith("fn-") ||
    /^(table of contents|contents|目录|目錄)$/.test(normalizedTitle)
  );
}

function createTocItem(
  id: string | undefined,
  rawTitle: string | undefined,
  level: number
): TocItem | null {
  const title = normalizeTocTitle(rawTitle || "");

  if (
    !id ||
    !title ||
    !isSupportedTocDepth(level) ||
    isExcludedTocEntry(id, title)
  ) {
    return null;
  }

  return {
    id,
    title,
    level,
  };
}

/**
 * Extract TOC structure from article content
 * Runs on the client; extracts heading elements from the DOM
 */
export function extractTocFromDOM(): TocItem[] {
  const article = document.getElementById("article");
  if (!article) return [];

  const headings = article.querySelectorAll(TOC_DOM_HEADING_SELECTOR);
  const tocItems: TocItem[] = [];

  headings.forEach(heading => {
    const item = createTocItem(
      heading.id,
      heading.textContent || "",
      parseInt(heading.tagName.substring(1))
    );

    if (item) {
      tocItems.push(item);
    }
  });

  return buildTocHierarchy(tocItems);
}

export function extractTocFromHeadings(headings: MarkdownHeading[]): TocItem[] {
  const tocItems = headings
    .map(heading => createTocItem(heading.slug, heading.text, heading.depth))
    .filter((item): item is TocItem => item !== null);

  return buildTocHierarchy(tocItems);
}

/**
 * Build a hierarchical TOC from a flat headings list
 */
function buildTocHierarchy(items: TocItem[]): TocItem[] {
  const result: TocItem[] = [];
  const stack: TocItem[] = [];

  for (const item of items) {
    // Remove items deeper than the current level
    while (stack.length > 0 && stack[stack.length - 1].level >= item.level) {
      stack.pop();
    }

    if (stack.length === 0) {
      // Top-level item
      result.push(item);
    } else {
      // Child item
      const parent = stack[stack.length - 1];
      if (!parent.children) {
        parent.children = [];
      }
      parent.children.push(item);
    }

    stack.push(item);
  }

  return result;
}

/**
 * Extract TOC from Astro-rendered content (server-side)
 * Since remark-toc already handles headings, we primarily rely on client extraction
 */
export function extractTocFromContent(content: string): TocItem[] {
  const tocItems: TocItem[] = [];
  const headingRegex = new RegExp(TOC_CONTENT_HEADING_PATTERN, "gi");
  let match;

  while ((match = headingRegex.exec(content)) !== null) {
    const item = createTocItem(match[1], match[2].replace(/<[^>]*>/g, ""), 2);

    if (item) {
      tocItems.push(item);
    }
  }

  return buildTocHierarchy(tocItems);
}
