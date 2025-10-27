import type { AstroGlobal } from "astro";
import { getCollection, type CollectionEntry } from "astro:content";
import { getCurrentLocale } from "@/i18n/utils";
import { slugifyAll, slugifyStr } from "@/utils/slugify";
import postFilter from "@/utils/postFilter";

type BlogEntry = CollectionEntry<"blog">;
type BlogEnEntry = CollectionEntry<"blog-en">;

type OverrideMap = Record<string, string | undefined>;

interface ResolveOptions {
  sourceTaggedPosts: Array<BlogEntry | BlogEnEntry>;
  matchPair: (
    source: BlogEntry | BlogEnEntry
  ) => BlogEntry | BlogEnEntry | undefined;
}

/**
 * Derive the most likely counterpart tag slug in the target locale.
 */
function resolveCounterpartSlug({
  sourceTaggedPosts,
  matchPair,
}: ResolveOptions): string | undefined {
  const counterTagCounts = new Map<string, number>();

  for (const sourcePost of sourceTaggedPosts) {
    const targetPost = matchPair(sourcePost);
    if (!targetPost) continue;

    for (const tag of targetPost.data.tags ?? []) {
      const slug = slugifyStr(tag);
      if (!slug) continue;
      counterTagCounts.set(slug, (counterTagCounts.get(slug) ?? 0) + 1);
    }
  }

  if (counterTagCounts.size === 0) return undefined;

  let bestSlug: string | undefined;
  let bestCount = 0;

  for (const [slug, count] of counterTagCounts.entries()) {
    if (count > bestCount) {
      bestSlug = slug;
      bestCount = count;
    }
  }

  return bestSlug;
}

function buildTargetUrl(
  targetLocale: string,
  tagSlug: string,
  restSegments: string[],
  search: string,
  hash: string
): string {
  const segments =
    targetLocale === "zh-CN"
      ? ["tags", tagSlug]
      : [targetLocale, "tags", tagSlug];

  if (restSegments.length > 0) {
    segments.push(...restSegments);
  }

  const pathname = `/${segments.join("/")}/`.replace(/\/+/g, "/");
  return `${pathname}${search ?? ""}${hash ?? ""}`;
}

function normalizeSegments(
  pathname: string,
  currentLocale: string
): { restSegments: string[]; tagSlug?: string } {
  const trimmed = pathname.replace(/\/+$/, "");
  const segments = trimmed.split("/").filter(Boolean);

  const withoutLocale =
    currentLocale !== "zh-CN" && segments[0] === currentLocale
      ? segments.slice(1)
      : segments;

  if (withoutLocale[0] !== "tags") {
    return { restSegments: [] };
  }

  const tagSlug = withoutLocale[1];
  const restSegments = withoutLocale.slice(2);
  return { restSegments, tagSlug };
}

/**
 * Compute language switch overrides for tag archive pages where localized slugs differ.
 */
export async function getTagSwitchOverride(
  Astro: AstroGlobal
): Promise<OverrideMap> {
  const override: OverrideMap = {};
  const currentLocale = getCurrentLocale(Astro);
  const { search, hash, pathname } = Astro.url;

  const { tagSlug, restSegments } = normalizeSegments(pathname, currentLocale);

  if (!tagSlug) return override;

  if (currentLocale === "zh-CN") {
    const zhPosts = (await getCollection("blog")).filter(postFilter);
    const taggedZhPosts = zhPosts.filter(post =>
      slugifyAll(post.data.tags).includes(tagSlug)
    );

    if (taggedZhPosts.length === 0) return override;

    const enPosts = (await getCollection("blog-en")).filter(postFilter);
    const enByOriginalTitle = new Map<string, BlogEnEntry>();
    for (const entry of enPosts) {
      if (entry.data.originalTitle) {
        enByOriginalTitle.set(entry.data.originalTitle, entry);
      }
    }

    const targetSlug = resolveCounterpartSlug({
      sourceTaggedPosts: taggedZhPosts,
      matchPair: sourcePost => enByOriginalTitle.get(sourcePost.data.title),
    });

    if (!targetSlug) return override;

    override["en"] = buildTargetUrl(
      "en",
      targetSlug,
      restSegments,
      search,
      hash
    );
    return override;
  }

  if (currentLocale === "en") {
    const enPosts = (await getCollection("blog-en")).filter(postFilter);
    const taggedEnPosts = enPosts.filter(post =>
      slugifyAll(post.data.tags).includes(tagSlug)
    );

    if (taggedEnPosts.length === 0) return override;

    const zhPosts = (await getCollection("blog")).filter(postFilter);
    const zhByTitle = new Map<string, BlogEntry>();
    for (const entry of zhPosts) {
      zhByTitle.set(entry.data.title, entry);
    }

    const targetSlug = resolveCounterpartSlug({
      sourceTaggedPosts: taggedEnPosts,
      matchPair: sourcePost => {
        const originalTitle = sourcePost.data.originalTitle;
        if (!originalTitle) return undefined;
        return zhByTitle.get(originalTitle);
      },
    });

    if (!targetSlug) return override;

    override["zh-CN"] = buildTargetUrl(
      "zh-CN",
      targetSlug,
      restSegments,
      search,
      hash
    );
    return override;
  }

  return override;
}
