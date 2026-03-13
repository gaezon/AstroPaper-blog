import type { AstroGlobal } from "astro";
import { getCollection, type CollectionEntry } from "astro:content";
import { getCurrentLocale } from "@/i18n/utils";
import type { BlogLocale } from "@/utils/blog-locale";
import { slugifyStr } from "@/utils/slugify";
import postFilter from "@/utils/postFilter";

type OverrideMap = Record<string, string | undefined>;
type BlogEntry = CollectionEntry<"blog">;
type BlogEnEntry = CollectionEntry<"blog-en">;

export interface TagSwitchConfig {
  switchOverride: OverrideMap;
  alternateURLs: OverrideMap;
  disableAutoAlternates: boolean;
}

interface BilingualTagMaps {
  zhToEn: Map<string, string>;
  enToZh: Map<string, string>;
}

let bilingualTagMapsPromise: Promise<BilingualTagMaps> | undefined;

const tagSlugSetCache = new Map<BlogLocale, Promise<Set<string>>>();

function buildTagPath(
  locale: BlogLocale,
  tagSlug: string,
  restSegments: string[] = [],
  search = "",
  hash = ""
): string {
  const segments =
    locale === "zh-CN" ? ["tags", tagSlug] : [locale, "tags", tagSlug];

  if (restSegments.length > 0) {
    segments.push(...restSegments);
  }

  return `/${segments.join("/")}/${search}${hash}`;
}

function buildTagIndexPath(locale: BlogLocale, search = "", hash = ""): string {
  const segments = locale === "zh-CN" ? ["tags"] : [locale, "tags"];
  return `/${segments.join("/")}/${search}${hash}`;
}

function normalizeSegments(
  pathname: string,
  currentLocale: BlogLocale
): { restSegments: string[]; tagSlug?: string } {
  const trimmed = pathname.replace(/\/+$/, "");
  const segments = trimmed
    .split("/")
    .filter(Boolean)
    .map(segment => {
      try {
        return decodeURIComponent(segment);
      } catch {
        return segment;
      }
    });

  const withoutLocale =
    currentLocale !== "zh-CN" && segments[0] === currentLocale
      ? segments.slice(1)
      : segments;

  if (withoutLocale[0] !== "tags") {
    return { restSegments: [] };
  }

  return {
    tagSlug: withoutLocale[1],
    restSegments: withoutLocale.slice(2),
  };
}

async function buildTagSlugSet(locale: BlogLocale): Promise<Set<string>> {
  const collection = locale === "en" ? "blog-en" : "blog";
  const posts = (await getCollection(collection)).filter(postFilter);
  const slugSet = new Set<string>();

  for (const post of posts) {
    for (const tag of post.data.tags ?? []) {
      const slug = slugifyStr(tag);
      if (slug) {
        slugSet.add(slug);
      }
    }
  }

  return slugSet;
}

function getTagSlugSet(locale: BlogLocale): Promise<Set<string>> {
  const cached = tagSlugSetCache.get(locale);
  if (cached) {
    return cached;
  }

  const promise = buildTagSlugSet(locale);
  tagSlugSetCache.set(locale, promise);
  return promise;
}

function addMappingCandidate(
  counter: Map<string, Map<string, number>>,
  sourceSlug: string,
  targetSlug: string
) {
  if (!sourceSlug || !targetSlug || sourceSlug === targetSlug) {
    return;
  }

  const targetCounts = counter.get(sourceSlug) ?? new Map<string, number>();
  targetCounts.set(targetSlug, (targetCounts.get(targetSlug) ?? 0) + 1);
  counter.set(sourceSlug, targetCounts);
}

function getBestMappings(
  counter: Map<string, Map<string, number>>
): Map<string, string> {
  const resolved = new Map<string, string>();

  for (const [sourceSlug, targetCounts] of counter.entries()) {
    let bestTarget: string | undefined;
    let bestCount = 0;

    for (const [targetSlug, count] of targetCounts.entries()) {
      if (count > bestCount) {
        bestTarget = targetSlug;
        bestCount = count;
      }
    }

    if (bestTarget) {
      resolved.set(sourceSlug, bestTarget);
    }
  }

  return resolved;
}

function getLcsAnchors(source: string[], target: string[]): string[] {
  const dp = Array.from({ length: source.length + 1 }, () =>
    Array<number>(target.length + 1).fill(0)
  );

  for (let i = source.length - 1; i >= 0; i--) {
    for (let j = target.length - 1; j >= 0; j--) {
      dp[i][j] =
        source[i] === target[j]
          ? dp[i + 1][j + 1] + 1
          : Math.max(dp[i + 1][j], dp[i][j + 1]);
    }
  }

  const anchors: string[] = [];
  let i = 0;
  let j = 0;

  while (i < source.length && j < target.length) {
    if (source[i] === target[j]) {
      anchors.push(source[i]);
      i++;
      j++;
      continue;
    }

    if (dp[i + 1][j] >= dp[i][j + 1]) {
      i++;
    } else {
      j++;
    }
  }

  return anchors;
}

function alignTagSegments(sourceTags: string[], targetTags: string[]) {
  const anchors = getLcsAnchors(sourceTags, targetTags);
  const pairs: Array<[string, string]> = [];

  let sourceStart = 0;
  let targetStart = 0;

  for (const anchor of [...anchors, undefined]) {
    const sourceEnd =
      anchor === undefined
        ? sourceTags.length
        : sourceTags.indexOf(anchor, sourceStart);
    const targetEnd =
      anchor === undefined
        ? targetTags.length
        : targetTags.indexOf(anchor, targetStart);

    const sourceChunk = sourceTags.slice(sourceStart, sourceEnd);
    const targetChunk = targetTags.slice(targetStart, targetEnd);
    const pairCount = Math.min(sourceChunk.length, targetChunk.length);

    for (let index = 0; index < pairCount; index++) {
      pairs.push([sourceChunk[index], targetChunk[index]]);
    }

    if (anchor === undefined) {
      break;
    }

    sourceStart = sourceEnd + 1;
    targetStart = targetEnd + 1;
  }

  return pairs;
}

function getSlugTags(entry: BlogEntry | BlogEnEntry): string[] {
  return (entry.data.tags ?? []).map(tag => slugifyStr(tag)).filter(Boolean);
}

async function buildBilingualTagMaps(): Promise<BilingualTagMaps> {
  const zhPosts = (await getCollection("blog")).filter(postFilter);
  const enPosts = (await getCollection("blog-en")).filter(postFilter);

  const enByOriginalTitle = new Map<string, BlogEnEntry>();
  for (const post of enPosts) {
    if (post.data.originalTitle) {
      enByOriginalTitle.set(post.data.originalTitle, post);
    }
  }

  const zhToEnCandidates = new Map<string, Map<string, number>>();
  const enToZhCandidates = new Map<string, Map<string, number>>();

  for (const zhPost of zhPosts) {
    const enPost = enByOriginalTitle.get(zhPost.data.title);
    if (!enPost) {
      continue;
    }

    const zhTags = getSlugTags(zhPost);
    const enTags = getSlugTags(enPost);

    for (const [zhSlug, enSlug] of alignTagSegments(zhTags, enTags)) {
      addMappingCandidate(zhToEnCandidates, zhSlug, enSlug);
      addMappingCandidate(enToZhCandidates, enSlug, zhSlug);
    }
  }

  return {
    zhToEn: getBestMappings(zhToEnCandidates),
    enToZh: getBestMappings(enToZhCandidates),
  };
}

async function getMappedTargetSlug(
  currentLocale: BlogLocale,
  tagSlug: string
): Promise<string | undefined> {
  bilingualTagMapsPromise ??= buildBilingualTagMaps();
  const bilingualTagMaps = await bilingualTagMapsPromise;

  return currentLocale === "zh-CN"
    ? bilingualTagMaps.zhToEn.get(tagSlug)
    : bilingualTagMaps.enToZh.get(tagSlug);
}

export async function getTagSwitchOverride(
  Astro: AstroGlobal
): Promise<TagSwitchConfig> {
  const currentLocale = getCurrentLocale(Astro);

  if (currentLocale !== "zh-CN" && currentLocale !== "en") {
    return {
      switchOverride: {},
      alternateURLs: {},
      disableAutoAlternates: false,
    };
  }

  const { pathname, search, hash } = Astro.url;
  const { tagSlug, restSegments } = normalizeSegments(pathname, currentLocale);

  if (!tagSlug) {
    return {
      switchOverride: {},
      alternateURLs: {},
      disableAutoAlternates: false,
    };
  }

  const targetLocale: BlogLocale = currentLocale === "zh-CN" ? "en" : "zh-CN";
  const targetTagSlugs = await getTagSlugSet(targetLocale);
  const switchOverride: OverrideMap = {};
  const alternateURLs: OverrideMap = {};
  const mappedTargetSlug = targetTagSlugs.has(tagSlug)
    ? tagSlug
    : await getMappedTargetSlug(currentLocale, tagSlug);

  if (mappedTargetSlug && targetTagSlugs.has(mappedTargetSlug)) {
    switchOverride[targetLocale] = buildTagPath(
      targetLocale,
      mappedTargetSlug,
      restSegments,
      search,
      hash
    );
    alternateURLs[targetLocale] = buildTagPath(
      targetLocale,
      mappedTargetSlug,
      restSegments
    );
  } else {
    switchOverride[targetLocale] = buildTagIndexPath(
      targetLocale,
      search,
      hash
    );
  }

  return {
    switchOverride,
    alternateURLs,
    disableAutoAlternates: true,
  };
}
