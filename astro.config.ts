// Compatibility between unified and vite types: avoid disabling validation, use local ignores
import { defineConfig, envField } from "astro/config";
import tailwindcss from "@tailwindcss/vite";
import sitemap from "@astrojs/sitemap";
import remarkToc from "remark-toc";
import remarkCollapse from "remark-collapse";
import {
  transformerNotationDiff,
  transformerNotationHighlight,
  transformerNotationWordHighlight,
} from "@shikijs/transformers";
import { transformerFileName } from "./src/utils/transformers/fileName";
import { SITE } from "./src/config";
import { getI18nCollapseConfig, tocConfig } from "./src/config/remark";
import vercel from "@astrojs/vercel";
import rehypeMermaid from "rehype-mermaid";
import {
  createThemeVariables,
  darkThemeColors,
  lightThemeColors,
} from "./src/utils/mermaidTheme";
import { unifiedCommentPaths } from "./src/utils/generated/bilingualMapping";

// Create a lookup map for bilingual posts
// Key: path without trailing slash
// Value: { zh: string, en: string } paths with trailing slashes
const bilingualPostMap = new Map<string, { zh: string; en: string }>();

if (typeof unifiedCommentPaths === "object") {
  Object.values(unifiedCommentPaths).forEach(({ zhPath, enPath }) => {
    // Store paths without trailing slash for matching
    bilingualPostMap.set(zhPath.replace(/\/$/, ""), { zh: zhPath, en: enPath });
    bilingualPostMap.set(enPath.replace(/\/$/, ""), { zh: zhPath, en: enPath });
  });
}

// https://astro.build/config
// Enable build-time mermaid rendering only in GitHub Actions where Playwright browsers are installed
// Falls back to client-side rendering in other environments (e.g., local dev, Vercel)
const shouldRenderMermaidAtBuildTime = !!process.env.GITHUB_ACTIONS;

type RehypePluginsList = NonNullable<
  NonNullable<Parameters<typeof defineConfig>[0]["markdown"]>["rehypePlugins"]
>;

const mermaidConfig: RehypePluginsList = shouldRenderMermaidAtBuildTime
  ? [
      [
        rehypeMermaid,
        {
          strategy: "img-svg",
          dark: {
            theme: "base",
            themeVariables: createThemeVariables(darkThemeColors),
          },
          colorScheme: "light",
          mermaidConfig: {
            theme: "base",
            themeVariables: createThemeVariables(lightThemeColors),
          },
        },
      ],
    ]
  : [];

export default defineConfig({
  site: SITE.website,
  adapter: vercel(),
  integrations: [
    sitemap({
      filter: page => SITE.showArchives || !page.endsWith("/archives"),
      i18n: {
        defaultLocale: "zh-CN",
        locales: {
          "zh-CN": "zh-CN",
          en: "en",
        },
      },
      serialize(item) {
        try {
          const urlObj = new URL(item.url);
          // Normalize pathname: remove leading/trailing slashes for processing
          // Note: "/" becomes "" and "/en/" becomes "/en"
          const path = urlObj.pathname.replace(/\/$/, "");

          // 1. Try exact match in bilingual map (for posts)
          const mapping = bilingualPostMap.get(path);
          const siteBase = SITE.website.replace(/\/$/, "");

          if (mapping) {
            return {
              ...item,
              links: [
                { lang: "zh-CN", url: siteBase + mapping.zh },
                { lang: "en", url: siteBase + mapping.en },
                { lang: "x-default", url: siteBase + mapping.zh },
              ],
            };
          }

          // 2. Identify if it's a Single Post that failed exact match
          // Pagination/List pages: /posts, /posts/2, /en/posts, /en/posts/2
          const isPagination = /^(\/en)?\/posts(\/\d+)?$/.test(path);
          // Any post-like path: starts with /posts or /en/posts
          const isPostPath =
            path.startsWith("/posts/") || path.startsWith("/en/posts/");

          // If it looks like a post path, but isn't a pagination page, and wasn't found in map
          // -> It's a single language post. Do NOT generate alternates.
          if (isPostPath && !isPagination) {
            return { ...item, links: [] };
          }

          // 3. Filter Tag Detail pages
          // Tag details (e.g. /tags/foo) are usually language-specific and inconsistent
          const isTagDetail = /^(\/en)?\/tags\/[^/]+(\/\d+)?$/.test(path);
          if (isTagDetail) {
            return { ...item, links: [] };
          }

          // 4. Fallback: Structural pages (Home, Tags List, About, Pagination, etc.)

          // Check for English prefix
          const isEnglish = path === "/en" || path.startsWith("/en/");

          // Get the base path without language prefix
          const basePath = isEnglish ? path.replace(/^\/en/, "") : path;

          // Construct final URLs ensuring clean slashes
          // For Chinese (default) and x-default
          const zhUrl = siteBase + (basePath === "" ? "/" : `${basePath}/`);
          // For English
          const enUrl =
            siteBase + `/en${basePath === "" ? "/" : `${basePath}/`}`;

          return {
            ...item,
            links: [
              {
                lang: "zh-CN",
                url: zhUrl,
              },
              {
                lang: "en",
                url: enUrl,
              },
              {
                lang: "x-default",
                url: zhUrl,
              },
            ],
          };
        } catch (error) {
          // eslint-disable-next-line no-console
          console.error("Error serializing sitemap item:", item.url, error);
          return item;
        }
      },
    }),
  ],
  output: "static",
  trailingSlash: "always",
  i18n: {
    defaultLocale: "zh-CN",
    locales: ["zh-CN", "en"],
    routing: {
      prefixDefaultLocale: false,
    },
  },
  markdown: {
    remarkPlugins: [
      [remarkToc, tocConfig],
      [remarkCollapse, getI18nCollapseConfig()],
    ],
    rehypePlugins: [
      // Build-time Mermaid rendering in GitHub Actions; falls back to client-side rendering in other environments
      ...mermaidConfig,
    ],
    syntaxHighlight: {
      excludeLangs: ["mermaid"],
    },
    shikiConfig: {
      themes: { light: "min-light", dark: "night-owl" },
      defaultColor: false,
      wrap: false,
      transformers: [
        transformerFileName({ style: "v2", hideDot: false }),
        transformerNotationHighlight(),
        transformerNotationWordHighlight(),
        transformerNotationDiff({ matchAlgorithm: "v3" }),
      ],
    },
  },
  vite: {
    // eslint-disable-next-line
    // @ts-ignore
    // This will be fixed in Astro 6 with Vite 7 support
    // See: https://github.com/withastro/astro/issues/14030
    plugins: [tailwindcss()],
    optimizeDeps: {
      entries: ["src/**/*.{astro,js,ts,jsx,tsx}"],
      exclude: ["@resvg/resvg-js"],
    },
  },
  image: {
    responsiveStyles: true,
    layout: "constrained",
  },
  env: {
    schema: {
      PUBLIC_GOOGLE_SITE_VERIFICATION: envField.string({
        access: "public",
        context: "client",
        optional: true,
      }),
    },
  },
  experimental: {
    preserveScriptOrder: true,
  },
});
