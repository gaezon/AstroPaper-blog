import eslintPluginAstro from "eslint-plugin-astro";
import globals from "globals";
import tseslint from "typescript-eslint";

export default [
  ...tseslint.configs.recommended,
  ...eslintPluginAstro.configs.recommended,
  {
    languageOptions: {
      globals: {
        ...globals.browser,
        ...globals.node,
      },
    },
  },
  { rules: { "no-console": "error" } },
  {
    ignores: [
      "dist/**",
      ".astro",
      "public/**",
      ".vercel/**",
    ],
  },
  {
    files: ["scripts/**/*.ts", "src/utils/generateOgImages.ts", "src/utils/loadGoogleFont.ts"],
    rules: {
      "no-console": "off",
    },
  },
];
