import { defineCollection, z } from "astro:content";
import { glob } from "astro/loaders";
import { SITE } from "@/config";

export const BLOG_PATH = "src/data/blog";

const blog = defineCollection({
  // Exclude English subfolder from Chinese collection to avoid mixing
  loader: glob({ pattern: ["**/[^_]*.md", "!en/**"], base: `./${BLOG_PATH}` }),
  schema: ({ image }) =>
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
      // I18n-related fields
      locale: z.string().default("zh-CN").optional(),
      originalTitle: z.string().optional(), // For translated articles: cite original title
      slug: z.string().optional(), // Custom slug for SEO-friendly URL
    }),
});

// English blog collection
const blogEn = defineCollection({
  loader: glob({ pattern: "**/[^_]*.md", base: `./${BLOG_PATH}/en` }),
  schema: ({ image }) =>
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
      // I18n-related fields
      locale: z.string().default("en"),
      originalTitle: z.string().optional(), // For translations referencing a Chinese original title
      slug: z.string().optional(), // Custom slug for SEO-friendly URL
    }),
});

export const collections = {
  blog,
  "blog-en": blogEn, // English blog collection
};
