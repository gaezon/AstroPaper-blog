# AstroPaper Blog (Gaazeon)

[![Astro](https://img.shields.io/badge/Astro-7-FF5D01?logo=astro&logoColor=white)](https://astro.build/)
[![Node.js](https://img.shields.io/badge/Node.js-24.x-5FA04E?logo=node.js&logoColor=white)](https://nodejs.org/)
[![pnpm](https://img.shields.io/badge/pnpm-11.x-F69220?logo=pnpm&logoColor=white)](https://pnpm.io/)
[![Playwright](https://img.shields.io/badge/Playwright-E2E-2EAD33?logo=playwright&logoColor=white)](https://playwright.dev/)
[![Vercel](https://img.shields.io/badge/Deploy-Vercel-000000?logo=vercel&logoColor=white)](https://vercel.com/)

Personal bilingual blog built on AstroPaper, focused on Chinese-first publishing with English companion content for SEO.

## What this repo includes

- Astro 7 + TypeScript + Tailwind CSS blog site
- Chinese (`zh-CN`) and English (`en`) routes
- Build-time bilingual post mapping for unified comments
- Build-time Mermaid rendering in GitHub Actions, with a client-side fallback renderer outside CI for WYSIWYG local preview
- Static search with Pagefind
- Dynamic OpenGraph image generation

## Requirements

- Node.js `24.x`
- pnpm `>=11 <12` ([installation guide](https://pnpm.io/installation))
- pnpm-only workflow (no npm/yarn/bun)

## Toolchain Setup

- Node.js `24.x` and pnpm `>=11 <12` are required by `package.json` and checked by `scripts/check-toolchain.mjs` on common project entry points.
- `.node-version` records the required Node major version. With fnm, run `fnm use` from the repository.
- For a one-off non-interactive command, run `fnm exec --using 24 pnpm <command>`.

## Quick start

```bash
pnpm install
pnpm dev
```

Open `http://localhost:4321`.

## Common commands

| Command                           | Purpose                                             |
| --------------------------------- | --------------------------------------------------- |
| `pnpm dev`                        | Start local dev server                              |
| `pnpm build`                      | Build and patch Vercel output (no `astro check`)    |
| `pnpm build:strict`               | Same pipeline plus `astro check`; used by CI/deploy |
| `pnpm preview`                    | Preview production build                            |
| `pnpm lint`                       | Run ESLint                                          |
| `pnpm format`                     | Format files with Prettier                          |
| `pnpm format:check`               | Check formatting                                    |
| `pnpm validate:meta`              | Validate post meta descriptions                     |
| `pnpm i18n:scaffold-en`           | Generate English draft posts                        |
| `pnpm generate:bilingual-mapping` | Regenerate bilingual mapping                        |
| `pnpm og:preview`                 | Preview OG images locally                           |
| `pnpm twikoo:sri:check`           | Verify Twikoo SRI hash                              |
| `pnpm twikoo:sri:update`          | Update Twikoo SRI hash                              |
| `pnpm test:unit`                  | Run the repository's Vitest suite                   |
| `pnpm test:sitemap`               | Build + sitemap Playwright checks                   |
| `pnpm exec playwright test`       | Run E2E tests                                       |

- For a targeted Vitest run, use `pnpm exec vitest run tests/unit/<file>.spec.ts`.
- Both build commands refresh image sizes and bilingual mappings, then create the Pagefind index.

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

- Writing guide: `WRITING.md`
- Contributing guide: `CONTRIBUTING.md`
- Security policy: `SECURITY.md`
- i18n language switcher: `docs/i18n-language-switcher.md`
- Bilingual comment mapping: `docs/bilingual-comment-system.md`
- Mermaid rendering: `docs/mermaid-rendering.md`
- Remark/Rehype plugins (TOC + collapse + callouts): `docs/remark-plugins.md`

## License

This repository uses separate license notices for source code and published content:

- Unless otherwise noted, the source code in this repository is licensed under the MIT License. The original AstroPaper copyright and license notice are preserved in [`LICENSE`](./LICENSE).
- Blog posts, translations, and other original site content are licensed under [CC BY-NC-SA 4.0](https://creativecommons.org/licenses/by-nc-sa/4.0/), unless a post or asset states otherwise.
- Third-party code, fonts, images, and other assets remain under their respective licenses.

The root MIT license applies to the software and does not supersede these content-specific notices.

## Deployment

- GitHub Actions owns Preview and Production Deployments through the Vercel CLI because this project is intentionally disconnected from Vercel Git Integration.
- Pull request CI owns linting, formatting, type-checking, and browser tests.
- `.github/workflows/deploy-preview.yml` runs for trusted same-repository pull requests; fork pull requests remain CI-only because GitHub does not expose Vercel secrets to them.
- `.github/workflows/deploy-production.yml` runs for pushes to protected `main`; both workflows also retain `workflow_dispatch` for manual recovery.
- The deployment workflows run the repository's `pnpm build:strict` → `vercel deploy --prebuilt` flow, so the project-scoped Vercel token only uploads the generated `.vercel/output/` artifacts.
- Keep `main` protected by the required PR CI check named `build` (the CI job id in `.github/workflows/ci.yml`) before relying on the lean production build.
- `pnpm build` and `pnpm build:strict` also patch `.vercel/output/config.json` so Vercel prebuilt deployments serve localized zh/en 404 pages and security response headers.
