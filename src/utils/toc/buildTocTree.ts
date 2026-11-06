import type { MarkdownHeading } from "astro";
import type { TocHeading, TocItem } from "@/utils/toc/types";

const TOC_MIN_DEPTH = 2;
const TOC_MAX_DEPTH = 3;
const EXCLUDED_TOC_TITLE = /^(table of contents|contents|目录|目錄|toc)$/i;

function normalizeTocTitle(rawTitle: string): string {
  return rawTitle
    .replace(/\s*#\s*$/, "")
    .replace(/\s+/g, " ")
    .trim();
}

function isExcludedTocEntry({ slug, text }: TocHeading): boolean {
  const normalizedTitle = text.toLowerCase();
  const normalizedSlug = slug.toLowerCase();

  return (
    normalizedTitle.includes("footnote") ||
    normalizedSlug.includes("footnote") ||
    slug.startsWith("fnref-") ||
    slug.startsWith("fn-") ||
    EXCLUDED_TOC_TITLE.test(text)
  );
}

/**
 * Normalizes Astro's flat heading list into the headings that belong in the
 * TOC. Footnote headings and author-written TOC headings are filtered out.
 */
export function normalizeTocHeadings(
  headings: readonly MarkdownHeading[],
  maxDepth = TOC_MAX_DEPTH
): TocHeading[] {
  return headings
    .filter(
      heading => heading.depth >= TOC_MIN_DEPTH && heading.depth <= maxDepth
    )
    .map(({ depth, slug, text }) => ({
      depth,
      slug,
      text: normalizeTocTitle(text),
    }))
    .filter(heading => heading.text.length > 0 && !isExcludedTocEntry(heading));
}

/**
 * Nests a flat heading list (h2 at the top). A skipped level (h2 → h4) nests
 * under the closest shallower heading, and a post that starts at h3 puts it
 * at the top level, so no heading order can break the build.
 */
export function buildTocTree(
  headings: readonly MarkdownHeading[],
  maxDepth = TOC_MAX_DEPTH
): TocItem[] {
  const root: TocItem[] = [];
  const stack: TocItem[] = [];

  for (const { depth, slug, text } of normalizeTocHeadings(
    headings,
    maxDepth
  )) {
    const item: TocItem = { depth, slug, text, children: [] };

    while (stack.length > 0 && stack[stack.length - 1].depth >= depth) {
      stack.pop();
    }

    (stack[stack.length - 1]?.children ?? root).push(item);
    stack.push(item);
  }

  return root;
}

/** A TOC is worth showing from 2 headings in its depth range. */
export function hasToc(
  headings: readonly MarkdownHeading[],
  maxDepth = TOC_MAX_DEPTH
): boolean {
  return normalizeTocHeadings(headings, maxDepth).length >= 2;
}
