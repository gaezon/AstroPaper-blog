import { getCollection } from "astro:content";
import {
  generateRssFeed,
  getRssTitle,
  getRssDescription,
} from "@/utils/rss-feed";

export async function GET() {
  const posts = await getCollection("blog");
  return generateRssFeed({
    title: getRssTitle("zh-CN"),
    description: getRssDescription("zh-CN"),
    posts,
  });
}
