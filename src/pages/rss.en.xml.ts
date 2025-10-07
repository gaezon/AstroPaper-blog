import rss from "@astrojs/rss";
import { getCollection } from "astro:content";
import { getPath } from "@/utils/getPath";
import getSortedPosts from "@/utils/getSortedPosts";
import { SITE } from "@/config";

export async function GET() {
  const posts = await getCollection("blog-en");
  const latestPosts = getSortedPosts(posts).slice(0, 10);

  return rss({
    title: `${SITE.title} (English)`,
    description: SITE.desc,
    site: SITE.website,
    items: latestPosts.map(({ data, id, filePath }) => ({
      link: getPath(id, filePath, true, data.slug),
      title: data.title,
      description: data.description,
      pubDate: new Date(data.modDatetime ?? data.pubDatetime),
    })),
  });
}
