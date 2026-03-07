# AstroPaper Blog (Gaazeon)

Personal bilingual blog built on AstroPaper, focused on Chinese-first publishing with English companion content for SEO.

## What this repo includes

- Astro + TypeScript + Tailwind CSS blog site
- Chinese (`zh-CN`) and English (`en`) routes
- Build-time bilingual post mapping for unified comments
- Build-time Mermaid rendering in GitHub Actions
- Static search with Pagefind
- Dynamic OpenGraph image generation

## Requirements

- Node.js `24.x`
- pnpm `>=10 <11`
- pnpm-only workflow (no npm/yarn/bun)

## Local Node Setup (Optional)

- Recommended for personal use: manage project Node with `fnm` and use Node `24.x` in this repo.
- Keep a system Node installation for external tools that invoke `node`/`npx` globally (for example, MCP helpers).
- Before running project commands, verify `node -v` is `24.x` in this repository.

## Quick start

```bash
pnpm install
pnpm dev
```

Open `http://localhost:4321`.

## Common commands

| Command                           | Purpose                                                |
| --------------------------------- | ------------------------------------------------------ |
| `pnpm dev`                        | Start local dev server                                 |
| `pnpm build`                      | Fast local build (no `astro check`)                    |
| `pnpm build:strict`               | CI-equivalent build (`astro check` + build + Pagefind) |
| `pnpm preview`                    | Preview production build                               |
| `pnpm lint`                       | Run ESLint                                             |
| `pnpm format`                     | Format files with Prettier                             |
| `pnpm format:check`               | Check formatting                                       |
| `pnpm validate:meta`              | Validate post meta descriptions                        |
| `pnpm i18n:scaffold-en`           | Generate English draft posts                           |
| `pnpm generate:bilingual-mapping` | Regenerate bilingual mapping                           |
| `pnpm og:preview`                 | Preview OG images locally                              |
| `pnpm twikoo:sri:check`           | Verify Twikoo SRI hash                                 |
| `pnpm twikoo:sri:update`          | Update Twikoo SRI hash                                 |
| `pnpm test:unit`                  | Run the repository's Vitest suite                      |
| `pnpm test:sitemap`               | Build + sitemap Playwright checks                      |
| `pnpm exec playwright test`       | Run E2E tests                                          |

- For a targeted Vitest run, use `pnpm exec vitest run tests/unit/<file>.spec.ts`.

## Project structure

```text
src/
  components/         UI components
  data/blog/          Chinese posts
  data/blog/en/       English posts
  i18n/               Locale config and dictionaries
  pages/              Astro routes
  scripts/            Bundled browser runtime modules
  styles/             Global and component styles
  utils/              Shared helpers and generated mapping
scripts/              Build and content automation scripts
tests/                Playwright E2E tests
docs/                 Feature and maintenance docs
```

- Mirrored zh/en routes are kept as thin wrappers where possible and delegate shared rendering/data logic to locale-aware components and helpers under `src/components/` and `src/utils/`.
- Client runtime code that needs TypeScript or bundling should live under `src/scripts/`; the theme runtime keeps a minimal inline first-paint boot in `src/layouts/Layout.astro` and a deferred module in `src/scripts/toggle-theme.ts`.

## Documentation

- Docs index: `docs/README.md`
- Writing guide: `WRITING.md`
- i18n language switcher: `docs/i18n-language-switcher.md`
- Bilingual comment mapping: `docs/bilingual-comment-system.md`
- Mermaid rendering: `docs/mermaid-rendering.md`
- Remark plugins (TOC + collapse): `docs/remark-plugins.md`

## Deployment

- CI and deploy workflows are under `.github/workflows/`.
- Production and preview deployments are prebuilt in GitHub Actions and deployed to Vercel with `--prebuilt`.
