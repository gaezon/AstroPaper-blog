import { defineCollection, type SchemaContext } from "astro:content";
import { z } from "astro/zod";
import { glob } from "astro/loaders";
import { SITE } from "@/config";

export const BLOG_PATH = "src/data/blog";

function createBlogSchema(localeDefault: string) {
  return ({ image }: SchemaContext) =>
    z.object({
      author: z.string().default(SITE.author),
      pubDatetime: z.date(),
      modDatetime: z.date().optional().nullable(),
      title: z.string(),
      featured: z.boolean().optional(),
      draft: z.boolean().optional(),
      tags: z.array(z.string()).default(["others"]),
      ogImage: image().or(z.string()).optional(),
      description: z.string(),
      canonicalURL: z.string().optional(),
      hideEditPost: z.boolean().optional(),
      timezone: z.string().optional(),
      locale: z.string().default(localeDefault),
      originalTitle: z.string().optional(),
      slug: z.string().optional(),
    });
}

const blog = defineCollection({
  loader: glob({ pattern: ["**/[^_]*.md", "!en/**"], base: `./${BLOG_PATH}` }),
  schema: createBlogSchema("zh-CN"),
});

const blogEn = defineCollection({
  loader: glob({ pattern: "**/[^_]*.md", base: `./${BLOG_PATH}/en` }),
  schema: createBlogSchema("en"),
});

export const collections = {
  blog,
  "blog-en": blogEn,
};
