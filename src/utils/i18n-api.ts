import type { CollectionEntry } from "astro:content";
import { generateOgImageForSite } from "@/utils/generateOgImages";
import { createOgResponse } from "@/utils/og-response";
import { SITE } from "@/config";
import {
  generateRssFeed,
  getRssDescription,
  getRssTitle,
} from "@/utils/rss-feed";
import { getPath } from "@/utils/getPath";
import type { BlogLocale } from "@/utils/i18n-pages";
import { getBlogPosts } from "@/utils/i18n-pages";

type BlogEntry = CollectionEntry<"blog" | "blog-en">;

export async function createLocalizedRssResponse(locale: BlogLocale) {
  const posts = await getBlogPosts(locale);
  return generateRssFeed({
    title: getRssTitle(locale),
    description: getRssDescription(locale),
    posts,
  });
}

export async function createLocalizedSiteOgResponse(locale: BlogLocale) {
  const image = await generateOgImageForSite(locale);
  return createOgResponse(image);
}

export async function getLocalizedPostOgStaticPaths(locale: BlogLocale) {
  if (!SITE.dynamicOgImage) {
    return [];
  }

  const posts = await getBlogPosts(locale);

  return posts
    .filter(({ data }) => !data.ogImage)
    .map(post => ({
      params: { slug: getPath(post.id, post.filePath, false, post.data.slug) },
      props: post,
    }));
}

export async function createLocalizedPostOgResponse(
  locale: BlogLocale,
  params: Record<string, string | string[] | undefined>,
  props: unknown,
  generateOgImageForPost: (post: BlogEntry) => Promise<Uint8Array | ArrayBuffer>
) {
  const requestedSlug = Array.isArray(params?.slug)
    ? params.slug.join("/")
    : (params?.slug ?? "");

  if (!SITE.dynamicOgImage) {
    return new Response(null, {
      status: 404,
      statusText: "Not found",
    });
  }

  try {
    let entry = props as BlogEntry | undefined;

    if (!entry) {
      const posts = await getBlogPosts(locale);
      entry = posts.find(p => {
        const path = getPath(p.id, p.filePath, false, p.data.slug);
        return !p.data.ogImage && path === requestedSlug;
      });
    }

    if (!entry) {
      return new Response(null, { status: 404, statusText: "Not found" });
    }

    const png = await generateOgImageForPost(entry);
    return createOgResponse(png);
  } catch (error) {
    const errorMessage =
      error instanceof Error ? (error.stack ?? error.message) : String(error);
    process.stderr.write(
      `[OG image route error] locale=${locale} slug=${requestedSlug || "(unknown)"}\n${errorMessage}\n`
    );

    return new Response(null, {
      status: 500,
      statusText: "OG generation error",
    });
  }
}
