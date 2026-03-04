import { getCollection } from "astro:content";
import {
  generateRssFeed,
  getRssTitle,
  getRssDescription,
} from "@/utils/rss-feed";

export async function GET() {
  const posts = await getCollection("blog-en");
  return generateRssFeed({
    title: getRssTitle("en"),
    description: getRssDescription("en"),
    posts,
  });
}
