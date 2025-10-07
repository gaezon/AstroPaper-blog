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
      // 国际化相关字段
      locale: z.string().default("zh-CN").optional(),
      originalTitle: z.string().optional(), // 用于翻译文章引用原文标题
      slug: z.string().optional(), // 自定义 slug，用于 SEO 友好的 URL
    }),
});

// 英文博客集合
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
      // 国际化相关字段
      locale: z.string().default("en"),
      originalTitle: z.string().optional(), // 用于翻译文章引用中文原文标题
      slug: z.string().optional(), // 自定义 slug，用于 SEO 友好的 URL
    }),
});

export const collections = {
  blog,
  "blog-en": blogEn, // 英文博客集合
};
