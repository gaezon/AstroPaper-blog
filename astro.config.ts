// @ts-nocheck
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
import rehypeMermaid from "rehype-mermaid";

// https://astro.build/config
export default defineConfig({
  site: SITE.website,
  integrations: [
    sitemap({
      filter: page => SITE.showArchives || !page.endsWith("/archives"),
    }),
  ],
  markdown: {
    remarkPlugins: [remarkToc, [remarkCollapse, { test: "Table of contents" }]],
    // @ts-expect-error – Typings mismatch between unified & vite, safe to ignore
    rehypePlugins: [
      // Temporarily disable rehype-mermaid
      // [[
      //   rehypeMermaid,
      //   {
      //     strategy: "pre-mermaid",
      //     dark: true,
      //     colorScheme: "light",
      //     mermaidConfig: {
      //       // 低饱和浅色主题，配合本站配色
      //       theme: "base",
      //       themeVariables: {
      //         primaryColor: "#f5fafc",          // 节点背景: 极浅蓝
      //         primaryTextColor: "#282728",      // 文字: 与正文一致
      //         primaryBorderColor: "#7aa4c7",    // 边框: 低饱和蓝
      //         lineColor: "#7aa4c7",             // 连线: 同边框
      //         secondaryBorderColor: "#cdd6dd",
      //         secondaryColor: "#ffffff",
      //         tertiaryColor: "#eef3f6",
      //         fontFamily: "Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif",
      //       },
      //     },
      //   },
      // ]] as any,
    ],
    syntaxHighlight: {
      excludeLangs: ["mermaid"],
    },
    shikiConfig: {
      // For more themes, visit https://shiki.style/themes
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
      exclude: ["@resvg/resvg-js"],
      include: ["mermaid"]
    },
    build: {
      rollupOptions: {
        external: [],
        output: {
          manualChunks: {
            mermaid: ['mermaid']
          }
        }
      }
    }
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
