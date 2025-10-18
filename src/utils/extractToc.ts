export interface TocItem {
  id: string;
  title: string;
  level: number;
  children?: TocItem[];
}

/**
 * Extract TOC structure from article content
 * Runs on the client; extracts heading elements from the DOM
 */
export function extractTocFromDOM(): TocItem[] {
  const article = document.getElementById("article");
  if (!article) return [];

  const headings = article.querySelectorAll("h2, h3, h4, h5, h6");
  const tocItems: TocItem[] = [];

  headings.forEach(heading => {
    const id = heading.id;
    // Clean title text: remove trailing auto-anchor '#' and normalize whitespace
    const rawTitle = heading.textContent || "";
    const title = rawTitle
      .replace(/\s*#\s*$/, "") // Remove trailing '#'
      .replace(/\s+/g, " ") // Normalize whitespace
      .trim();
    const level = parseInt(heading.tagName.substring(1));

    // Exclude Footnotes and other special headings
    if (
      id &&
      title &&
      !title.toLowerCase().includes("footnote") &&
      !id.toLowerCase().includes("footnote") &&
      !id.startsWith("fnref-") &&
      !id.startsWith("fn-") &&
      // Exclude auto-generated TOC heading (remark-toc)
      title.toLowerCase() !== "table of contents"
    ) {
      tocItems.push({
        id,
        title,
        level,
      });
    }
  });

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
  // We could use a regex or an HTML parser to extract headings
  // To simplify, we primarily rely on the client implementation
  const headingRegex = /<h([2-6])[^>]*id="([^"]*)"[^>]*>(.*?)<\/h[2-6]>/gi;
  const tocItems: TocItem[] = [];
  let match;

  while ((match = headingRegex.exec(content)) !== null) {
    const level = parseInt(match[1]);
    const id = match[2];
    const title = match[3].replace(/<[^>]*>/g, "").trim(); // Remove HTML tags

    if (id && title) {
      tocItems.push({
        id,
        title,
        level,
      });
    }
  }

  return buildTocHierarchy(tocItems);
}
