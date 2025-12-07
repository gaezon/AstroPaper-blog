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

// https://astro.build/config
export default defineConfig({
  site: SITE.website,
  integrations: [
    sitemap({
      filter: page => SITE.showArchives || !page.endsWith("/archives"),
    }),
  ],
  // Internationalization routing configuration
  output: "static",
  trailingSlash: "always",
  i18n: {
    defaultLocale: "zh-CN",
    locales: ["zh-CN", "en"],
    routing: {
      prefixDefaultLocale: false, // Chinese default without prefix for clean URLs
    },
  },
  markdown: {
    remarkPlugins: [
      [remarkToc, tocConfig],
      [remarkCollapse, getI18nCollapseConfig()], // Internationalization-aware common configuration
    ],
    rehypePlugins: [
      // Temporarily disable rehype-mermaid
      // [[
      //   rehypeMermaid,
      //   {
      //     strategy: "pre-mermaid",
      //     dark: true,
      //     colorScheme: "light",
      //     mermaidConfig: {
      //       // Low saturation light theme matching site color scheme
      //       theme: "base",
      //       themeVariables: {
      //         primaryColor: "#f5fafc",          // Node background: Very light blue
      //         primaryTextColor: "#282728",      // Text: Consistent with body text
      //         primaryBorderColor: "#7aa4c7",    // Border: Low saturation blue
      //         lineColor: "#7aa4c7",             // Line: Same as border
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
      include: ["mermaid"],
    },
    build: {
      rollupOptions: {
        external: [],
        output: {
          manualChunks: {
            mermaid: ["mermaid"],
          },
        },
      },
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
