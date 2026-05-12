import type { CollectionEntry } from "astro:content";
import { SITE } from "@/config";
import { normalizeBlogLocale, type BlogLocale } from "@/utils/blog-locale";
import { unifiedCommentPaths } from "@/utils/generated/bilingualMapping";
import { getBlogPosts } from "@/utils/i18n-pages";
import { getPath } from "@/utils/getPath";
import getSortedPosts from "@/utils/getSortedPosts";
import getUniqueTags from "@/utils/getUniqueTags";
import postFilter from "@/utils/postFilter";
import { slugifyStr } from "@/utils/slugify";

/**
 * Agent-facing API builders and shared utilities.
 *
 * These helpers power the prerendered JSON endpoints under `/api/` and are
 * deliberately side-effect free so they can be invoked from endpoints,
 * scripts, and tests without requiring an Astro page context.
 */

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface PostSummary {
  /** URL-safe slug as used in the route (last path segment). */
  slug: string;
  /** Non-empty title from frontmatter. */
  title: string;
  /** Description from frontmatter. May be empty but never `undefined`. */
  description: string;
  /** ISO 8601 publish datetime. */
  pubDatetime: string;
  /** ISO 8601 modification datetime, or `null` when absent. */
  modDatetime: string | null;
  /** Original (non-slugified) tag names. */
  tags: string[];
  /** Blog locale of the entry. */
  locale: BlogLocale;
  /** Absolute URL with trailing slash. */
  url: string;
  /** Non-empty slug (identical to `slug`; stable key independent of future URL reshaping). */
  originalSlug: string;
}

export interface PostDetail extends PostSummary {
  author: string;
  featured: boolean;
  draft: false;
  /** Plain-text excerpt, <= `MAX_BODY_EXCERPT_CHARS`. */
  body: string;
  /** Absolute canonical URL for the post. */
  canonicalURL: string;
  /** Zero or one counterpart entry pointing at the other-locale version. */
  translations: Array<{ locale: BlogLocale; url: string }>;
}

export interface TagsIndex {
  [tag: string]: {
    counts: { "zh-CN": number; en: number };
    urls: { "zh-CN": string; en: string };
  };
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

export const MAX_JSON_SIZE_BYTES = 2 * 1024 * 1024;
export const MAX_BODY_EXCERPT_CHARS = 500;

type BlogEntry = CollectionEntry<"blog" | "blog-en">;

// ---------------------------------------------------------------------------
// JSON size guard
// ---------------------------------------------------------------------------

/**
 * Fail the build when an emitted JSON document exceeds the 2 MiB budget.
 * Called by endpoint handlers after `JSON.stringify`.
 */
export function assertJsonSize(path: string, serialized: string): void {
  const bytes = Buffer.byteLength(serialized, "utf8");
  if (bytes > MAX_JSON_SIZE_BYTES) {
    throw new Error(
      `Emitted JSON exceeds 2 MiB budget: ${path} (${bytes} bytes)`
    );
  }
}

// ---------------------------------------------------------------------------
// Plain-text excerpt
// ---------------------------------------------------------------------------

const FRONTMATTER_RE = /^(?:---|\+\+\+)\n[\s\S]*?\n(?:---|\+\+\+)\n?/;
const FENCED_CODE_RE = /```[\s\S]*?```/g;
const INLINE_CODE_RE = /`([^`]*)`/g;
const IMAGE_RE = /!\[[^\]]*\]\([^)]*\)/g;
const LINK_RE = /\[([^\]]*)\]\([^)]*\)/g;
const HTML_TAG_RE = /<\/?[a-z][^>]*>/gi;
const LEADING_MARKERS_RE = /^[#>*_`\-+]+\s*/gm;
const LEADING_ORDERED_LIST_RE = /^\s*\d+\.\s*/gm;
const WHITESPACE_RUN_RE = /\s+/g;

/**
 * Convert a Markdown body to a compact plain-text excerpt, truncated at a
 * word boundary so the result is never longer than `limit` characters.
 */
export function extractPlainText(
  markdownBody: string,
  limit: number = MAX_BODY_EXCERPT_CHARS
): string {
  if (!markdownBody) return "";

  let text = markdownBody;

  // 1. Strip leading YAML or TOML frontmatter.
  text = text.replace(FRONTMATTER_RE, "");

  // 2. Remove fenced code blocks entirely (including contents).
  text = text.replace(FENCED_CODE_RE, " ");

  // 3. Replace inline code with its inner text.
  text = text.replace(INLINE_CODE_RE, "$1");

  // 4. Drop Markdown images outright.
  text = text.replace(IMAGE_RE, " ");

  // 5. Replace Markdown links with just the label.
  text = text.replace(LINK_RE, "$1");

  // 6. Remove conservative HTML tags.
  text = text.replace(HTML_TAG_RE, " ");

  // 7. Strip leading Markdown markers on each line (headings, emphasis,
  //    blockquote, unordered list markers).
  text = text.replace(LEADING_MARKERS_RE, "");

  // 8. Strip ordered-list markers like `1. ` at the start of a line.
  text = text.replace(LEADING_ORDERED_LIST_RE, "");

  // 9. Collapse any run of whitespace to a single space, then trim.
  text = text.replace(WHITESPACE_RUN_RE, " ").trim();

  if (text.length <= limit) {
    return text;
  }

  // 10. Truncate on a word boundary, falling back to a hard cut.
  const windowText = text.slice(0, limit);
  const lastSpace = windowText.lastIndexOf(" ");
  if (lastSpace > 0) {
    return windowText.slice(0, lastSpace).trimEnd();
  }
  return windowText;
}

// ---------------------------------------------------------------------------
// Translations resolver
// ---------------------------------------------------------------------------

/**
 * Resolve the bilingual counterpart for a given post, if one exists.
 * Returns `[]` when no mapping entry pairs this URL with another locale.
 */
export function resolveTranslations(
  _locale: BlogLocale,
  canonicalPostUrl: string
): Array<{ locale: BlogLocale; url: string }> {
  let pathname: string;
  try {
    pathname = new URL(canonicalPostUrl).pathname;
  } catch {
    return [];
  }

  for (const entry of Object.values(unifiedCommentPaths)) {
    if (entry.zhPath === pathname) {
      return [{ locale: "en", url: toAbsoluteSiteUrl(entry.enPath) }];
    }
    if (entry.enPath === pathname) {
      return [{ locale: "zh-CN", url: toAbsoluteSiteUrl(entry.zhPath) }];
    }
  }

  return [];
}

// ---------------------------------------------------------------------------
// Summary / detail / tags builders
// ---------------------------------------------------------------------------

export async function buildAllPostSummaries(): Promise<PostSummary[]> {
  const [zhPosts, enPosts] = await Promise.all([
    getBlogPosts("zh-CN"),
    getBlogPosts("en"),
  ]);

  // `getSortedPosts` both filters (drafts + scheduled margin) and sorts
  // by `modDatetime ?? pubDatetime` descending, which matches the ordering
  // used everywhere else on the site.
  const sorted = getSortedPosts([...zhPosts, ...enPosts]);

  return sorted.map(buildPostSummaryFromEntry);
}

export async function buildPostDetail(
  locale: BlogLocale,
  post: BlogEntry
): Promise<PostDetail> {
  if (post.data.draft) {
    throw new Error(
      `agent-api: buildPostDetail called on draft post at ${post.filePath ?? post.id} — drafts must be filtered out at the collection level`
    );
  }

  const summary = buildPostSummaryFromEntry(post);
  const normalizedLocale = normalizeBlogLocale(locale);

  const canonicalURL = post.data.canonicalURL
    ? post.data.canonicalURL
    : summary.url;

  const body = extractPlainText(post.body ?? "", MAX_BODY_EXCERPT_CHARS);

  return {
    ...summary,
    author: post.data.author,
    featured: post.data.featured ?? false,
    draft: false,
    body,
    canonicalURL,
    translations: resolveTranslations(normalizedLocale, summary.url),
  };
}

export async function buildTagsIndex(): Promise<TagsIndex> {
  const [zhPostsRaw, enPostsRaw] = await Promise.all([
    getBlogPosts("zh-CN"),
    getBlogPosts("en"),
  ]);

  const zhPosts = zhPostsRaw.filter(postFilter);
  const enPosts = enPostsRaw.filter(postFilter);

  const uniqueTags = getUniqueTags([...zhPosts, ...enPosts]);

  const index: TagsIndex = {};
  for (const { tag, tagName } of uniqueTags) {
    const zhCount = countPostsWithTag(zhPosts, tag);
    const enCount = countPostsWithTag(enPosts, tag);

    index[tagName] = {
      counts: {
        "zh-CN": zhCount,
        en: enCount,
      },
      urls: {
        "zh-CN": toAbsoluteSiteUrl(`/tags/${tag}/`),
        en: toAbsoluteSiteUrl(`/en/tags/${tag}/`),
      },
    };
  }

  return index;
}

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

function buildPostSummaryFromEntry(post: BlogEntry): PostSummary {
  const routePath = getPath(post.id, post.filePath, true, post.data.slug);
  const url = toAbsoluteSiteUrl(routePath);
  const slug = extractLastSegment(routePath);

  return {
    slug,
    title: post.data.title,
    description: post.data.description,
    pubDatetime: new Date(post.data.pubDatetime).toISOString(),
    modDatetime: post.data.modDatetime
      ? new Date(post.data.modDatetime).toISOString()
      : null,
    tags: [...post.data.tags],
    locale: normalizeBlogLocale(post.data.locale),
    url,
    originalSlug: slug,
  };
}

function toAbsoluteSiteUrl(path: string): string {
  // `SITE.website` is guaranteed to end with `/`, so stripping the leading
  // slash on `path` yields the expected absolute URL when composed via the
  // WHATWG URL constructor.
  const relative = path.replace(/^\//, "");
  return new URL(relative, SITE.website).href;
}

function extractLastSegment(path: string): string {
  const trimmed = path.replace(/\/+$/, "");
  const parts = trimmed.split("/");
  return parts[parts.length - 1] ?? "";
}

function countPostsWithTag(posts: BlogEntry[], slugifiedTag: string): number {
  let count = 0;
  for (const post of posts) {
    const postTags = post.data.tags.map(t => slugifyStr(t));
    if (postTags.includes(slugifiedTag)) {
      count++;
    }
  }
  return count;
}
