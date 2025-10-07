import { getCollection } from "astro:content";
import { getPath } from "./src/utils/getPath.js";

async function testSlugGeneration() {
  console.log("Testing slug generation...");

  // Test English posts
  const enPosts = await getCollection("blog-en");
  console.log("\n=== English Posts ===");

  for (const post of enPosts) {
    const slug = getPath(post.id, post.filePath, false, post.data.slug);
    console.log(`Title: ${post.data.title}`);
    console.log(`Custom slug: ${post.data.slug || 'none'}`);
    console.log(`Generated slug: ${slug}`);
    console.log(`Expected clean URL: /en/posts/${slug}/`);
    console.log('---');
  }

  // Test Chinese posts
  const cnPosts = await getCollection("blog");
  console.log("\n=== Chinese Posts ===");

  for (const post of cnPosts.slice(0, 3)) { // Test first 3 only
    const slug = getPath(post.id, post.filePath, false, post.data.slug);
    console.log(`Title: ${post.data.title}`);
    console.log(`Custom slug: ${post.data.slug || 'none'}`);
    console.log(`Generated slug: ${slug}`);
    console.log(`Expected clean URL: /posts/${slug}/`);
    console.log('---');
  }
}

testSlugGeneration().catch(console.error);