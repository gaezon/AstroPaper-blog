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
