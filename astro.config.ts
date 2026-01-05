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

// https://astro.build/config
// Enable build-time mermaid rendering only in GitHub Actions where Playwright browsers are installed
// Falls back to client-side rendering in other environments (e.g., local dev, Vercel)
const shouldRenderMermaidAtBuildTime = !!process.env.GITHUB_ACTIONS;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const mermaidConfig: any[] = shouldRenderMermaidAtBuildTime
  ? [
      [
        rehypeMermaid,
        {
          strategy: "img-svg",
          dark: {
            theme: "base",
            themeVariables: {
              background: "transparent",
              primaryColor: "#2d3548",
              secondaryColor: "#343f60",
              primaryTextColor: "#eaedf3",
              secondaryTextColor: "#eaedf3",
              primaryBorderColor: "#ff6b01",
              lineColor: "#ff6b01",
              clusterBkg: "#343f60",
              titleColor: "#eaedf3",
              tertiaryColor: "#2d3548",
              noteBkgColor: "#ff8534",
              noteTextColor: "#ffffff",
              fontFamily:
                'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen, Ubuntu, Cantarell, "Open Sans", "Helvetica Neue", sans-serif',
              cScale0: "#2d3548",
              cScale1: "#343f60",
              cScale2: "#2d3548",
              cScale3: "#343f60",
              cScale4: "#2d3548",
              cScale5: "#343f60",
              cScaleLabel0: "#eaedf3",
              cScaleLabel1: "#eaedf3",
              cScaleLabel2: "#eaedf3",
              cScaleLabel3: "#eaedf3",
              cScaleLabel4: "#eaedf3",
              cScaleLabel5: "#eaedf3",
            },
          },
          colorScheme: "light",
          // Mermaid theming configuration for build-time rendering
          mermaidConfig: {
            theme: "base",
            themeVariables: {
              background: "transparent",
              primaryColor: "#e6f4fb",
              secondaryColor: "#f0f7fb",
              primaryTextColor: "#282728",
              secondaryTextColor: "#282728",
              primaryBorderColor: "#006cac",
              lineColor: "#006cac",
              clusterBkg: "#f5fafc",
              titleColor: "#282728",
              tertiaryColor: "#ffffff",
              noteBkgColor: "#0088cc",
              noteTextColor: "#ffffff",
              fontFamily:
                'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen, Ubuntu, Cantarell, "Open Sans", "Helvetica Neue", sans-serif',
              cScale0: "#e6f4fb",
              cScale1: "#f0f7fb",
              cScale2: "#ffffff",
              cScale3: "#e6f4fb",
              cScale4: "#f0f7fb",
              cScale5: "#ffffff",
              cScaleLabel0: "#282728",
              cScaleLabel1: "#282728",
              cScaleLabel2: "#282728",
              cScaleLabel3: "#282728",
              cScaleLabel4: "#282728",
              cScaleLabel5: "#282728",
            },
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
