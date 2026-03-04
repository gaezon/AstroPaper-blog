import rss from "@astrojs/rss";
import type { CollectionEntry } from "astro:content";
import { getPath } from "@/utils/getPath";
import getSortedPosts from "@/utils/getSortedPosts";
import { SITE } from "@/config";

interface RssFeedOptions {
  title: string;
  description: string;
  posts: CollectionEntry<"blog" | "blog-en">[];
}

export async function generateRssFeed(options: RssFeedOptions) {
  const { title, description, posts } = options;
  const latestPosts = getSortedPosts(posts).slice(0, 10);

  return rss({
    title,
    description,
    site: SITE.website,
    items: latestPosts.map(({ data, id, filePath }) => ({
      link: getPath(id, filePath, true, data.slug),
      title: data.title,
      description: data.description,
      pubDate: new Date(data.modDatetime ?? data.pubDatetime),
    })),
  });
}

export function getRssTitle(locale: string): string {
  return locale === "en"
    ? `${SITE.titleEn || SITE.title} (English)`
    : SITE.title;
}

export function getRssDescription(locale: string): string {
  return locale === "en" ? SITE.descEn || SITE.desc : SITE.desc;
}
