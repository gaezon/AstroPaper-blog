import type { GetStaticPaths } from "astro";
import { getRelativeLocaleUrl } from "astro:i18n";
import { getCollection } from "astro:content";
import { SITE } from "@/config";
import getPostsByTag from "@/utils/getPostsByTag";
import getSortedPosts from "@/utils/getSortedPosts";
import getUniqueTags from "@/utils/getUniqueTags";
import { ensureTrailingSlash } from "@/utils/url";

export type BlogLocale = "zh-CN" | "en";
export type BlogCollectionName = "blog" | "blog-en";

export function normalizeBlogLocale(locale: string): BlogLocale {
  return locale === "en" ? "en" : "zh-CN";
}

export function getBlogCollectionName(locale: BlogLocale): BlogCollectionName {
  return locale === "en" ? "blog-en" : "blog";
}

export async function getBlogPosts(locale: BlogLocale) {
  return getCollection(
    getBlogCollectionName(locale),
    ({ data }) => !data.draft
  );
}

export async function getPaginatedPostPaths(
  locale: BlogLocale,
  paginate: Parameters<GetStaticPaths>[0]["paginate"]
) {
  const posts = await getBlogPosts(locale);
  return paginate(getSortedPosts(posts), { pageSize: SITE.postPerPage });
}

export async function getPaginatedTagPaths(
  locale: BlogLocale,
  paginate: Parameters<GetStaticPaths>[0]["paginate"]
) {
  const posts = await getBlogPosts(locale);
  const tags = getUniqueTags(posts);

  return tags.flatMap(({ tag, tagName }) => {
    const tagPosts = getPostsByTag(posts, tag);

    return paginate(tagPosts, {
      params: { tag },
      props: { tagName },
      pageSize: SITE.postPerPage,
    });
  });
}

export function getLocalizedPath(locale: BlogLocale, path = ""): string {
  const normalizedPath = path.replace(/^\/+|\/+$/g, "");
  return ensureTrailingSlash(getRelativeLocaleUrl(locale, normalizedPath));
}

export function getLocalizedRssPath(locale: BlogLocale): string {
  return locale === "en" ? "/rss.en.xml" : "/rss.xml";
}

export function getLocalizedSiteTitle(locale: BlogLocale): string {
  return locale === "en" ? SITE.titleEn || SITE.title : SITE.title;
}

export function getLocalizedSiteDescription(locale: BlogLocale): string {
  return locale === "en" ? SITE.descEn || SITE.desc : SITE.desc;
}
