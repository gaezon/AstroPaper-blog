import { defineConfig } from "astro/config";
import tailwindcss from "@tailwindcss/vite";
import sitemap from "@astrojs/sitemap";
import remarkToc from "remark-toc";
import remarkCollapse from "remark-collapse";
import { SITE } from "./src/config";
import { inject } from "@vercel/analytics";

// https://astro.build/config
export default defineConfig({
  site: SITE.website,
  integrations: [
    sitemap({
      filter: page => SITE.showArchives || !page.endsWith("/archives"),
    }),
    {
      name: "vercel-analytics",
      hooks: {
        "astro:config:setup": ({ injectScript }) => {
          injectScript("page", `import { inject } from "@vercel/analytics"; inject();`);
        },
      },
    },
  ],
  markdown: {
    remarkPlugins: [remarkToc, [remarkCollapse, { test: "Table of contents" }]],
    shikiConfig: {
      // For more themes, visit https://shiki.style/themes
      themes: { light: "min-light", dark: "night-owl" },
      wrap: true,
    },
  },
  vite: {
    plugins: [tailwindcss()],
    optimizeDeps: {
      exclude: ["@resvg/resvg-js"],
    },
  },
  image: {
    // 使用新的有效值替换 'responsive'
    // 例如使用 'full-width'
    experimentalLayout: "full-width",
  },
  experimental: {
    responsiveImages: true,
    preserveScriptOrder: true,
  },
});
