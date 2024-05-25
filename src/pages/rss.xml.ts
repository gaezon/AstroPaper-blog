import rss from "@astrojs/rss";
import { getCollection } from "astro:content";
import getSortedPosts from "@utils/getSortedPosts";
import { SITE } from "@config";

// 引入 marked 依赖，通过 npm install marked 安装
import { marked } from "marked";

export async function GET() {
  const posts = await getCollection("blog");
  const sortedPosts = getSortedPosts(posts);

  // 只获取最新的10篇文章
  const latestPosts = sortedPosts.slice(0, 10);

  return rss({
    title: SITE.title,
    description: SITE.desc,
    site: SITE.website,
    items: latestPosts.map(({ data, slug, body }) => {
      // 移除 "## Table of Contents" 部分
      const cleanedBody = body.replace(
        /## Table of Contents\s*([\s\S]*?)(?=\n## |\n# |$)/g,
        ""
      );
      return {
        link: `posts/${slug}/`,
        title: data.title,
        description: data.description,
        pubDate: new Date(data.modDatetime ?? data.pubDatetime),
        content: marked(cleanedBody),
      };
    }),
  });
}
