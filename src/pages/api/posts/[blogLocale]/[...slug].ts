import type { APIRoute, GetStaticPaths } from "astro";
import type { CollectionEntry } from "astro:content";
import { assertJsonSize, buildPostDetail } from "@/utils/agent-api";
import { normalizeBlogLocale, type BlogLocale } from "@/utils/blog-locale";
import { getBlogPosts } from "@/utils/i18n-pages";
import { getPath } from "@/utils/getPath";
import postFilter from "@/utils/postFilter";

type BlogEntry = CollectionEntry<"blog" | "blog-en">;

export const getStaticPaths: GetStaticPaths = async () => {
  const locales: BlogLocale[] = ["zh-CN", "en"];
  const paths: Array<{
    params: { blogLocale: BlogLocale; slug: string };
    props: { locale: BlogLocale; post: BlogEntry };
  }> = [];

  for (const locale of locales) {
    const posts = (await getBlogPosts(locale)).filter(postFilter);
    for (const post of posts) {
      // Keep the public endpoint contract at /api/posts/{locale}/{slug}.json.
      const slug = `${getPath(post.id, post.filePath, false, post.data.slug)}.json`;
      paths.push({
        params: { blogLocale: locale, slug },
        props: { locale, post },
      });
    }
  }

  return paths;
};

export const GET: APIRoute = async ({ props }) => {
  const { locale, post } = props as { locale: BlogLocale; post: BlogEntry };
  const normalizedLocale = normalizeBlogLocale(locale);
  const detail = await buildPostDetail(normalizedLocale, post);
  const body = JSON.stringify(detail, null, 2);
  // Include locale + slug in the size-guard identifier so failures pinpoint
  // the offending document rather than the route template.
  assertJsonSize(`/api/posts/${normalizedLocale}/${detail.slug}.json`, body);
  return new Response(body, {
    headers: { "Content-Type": "application/json; charset=utf-8" },
  });
};
