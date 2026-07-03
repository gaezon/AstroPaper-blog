# AstroPaper Blog (Gaazeon)

[![Astro](https://img.shields.io/badge/Astro-6-FF5D01?logo=astro&logoColor=white)](https://astro.build/)
[![Node.js](https://img.shields.io/badge/Node.js-24.x-5FA04E?logo=node.js&logoColor=white)](https://nodejs.org/)
[![pnpm](https://img.shields.io/badge/pnpm-11.x-F69220?logo=pnpm&logoColor=white)](https://pnpm.io/)
[![Playwright](https://img.shields.io/badge/Playwright-E2E-2EAD33?logo=playwright&logoColor=white)](https://playwright.dev/)
[![Vercel](https://img.shields.io/badge/Deploy-Vercel-000000?logo=vercel&logoColor=white)](https://vercel.com/)

Personal bilingual blog built on AstroPaper, focused on Chinese-first publishing with English companion content for SEO.

## What this repo includes

- Astro 7 + TypeScript + Tailwind CSS blog site
- Chinese (`zh-CN`) and English (`en`) routes
- Build-time bilingual post mapping for unified comments
- Build-time Mermaid rendering in GitHub Actions
- Static search with Pagefind
- Dynamic OpenGraph image generation

## Requirements

- Node.js `24.x`
- pnpm `>=11 <12` (recommended to install via Homebrew and run through this repo's toolchain guard)
- pnpm-only workflow (no npm/yarn/bun)

## Local Node Setup (Optional)

- This repo includes `.node-version` with `24` so `fnm`, `nvm`, and compatible tools can auto-select the supported runtime.
- Recommended for personal use: manage project Node with `fnm` and use Node `24.x` in this repo.
- Keep a system Node installation for external tools that invoke `node`/`npx` globally (for example, MCP helpers).
- Before running project commands, verify `node -v` is `24.x` in this repository.
- If your shell still resolves to another global Node version, run `fnm use` before `pnpm` commands.
- For one-off non-interactive commands, run `fnm exec --using 24 pnpm <command>`.
- Common project entry points run `scripts/check-toolchain.mjs` first and fail fast unless Node.js `24.x` and pnpm `>=11 <12` are active.

## Quick start

```bash
pnpm install
pnpm dev
```

Open `http://localhost:4321`.

## Common commands

| Command                           | Purpose                                                   |
| --------------------------------- | --------------------------------------------------------- |
| `pnpm dev`                        | Start local dev server                                    |
| `pnpm build`                      | Fast local build + Vercel output patch (no `astro check`) |
| `pnpm build:strict`               | CI-equivalent build + Vercel output patch                 |
| `pnpm preview`                    | Preview production build                                  |
| `pnpm lint`                       | Run ESLint                                                |
| `pnpm format`                     | Format files with Prettier                                |
| `pnpm format:check`               | Check formatting                                          |
| `pnpm validate:meta`              | Validate post meta descriptions                           |
| `pnpm i18n:scaffold-en`           | Generate English draft posts                              |
| `pnpm generate:bilingual-mapping` | Regenerate bilingual mapping                              |
| `pnpm og:preview`                 | Preview OG images locally                                 |
| `pnpm twikoo:sri:check`           | Verify Twikoo SRI hash                                    |
| `pnpm twikoo:sri:update`          | Update Twikoo SRI hash                                    |
| `pnpm test:unit`                  | Run the repository's Vitest suite                         |
| `pnpm test:sitemap`               | Build + sitemap Playwright checks                         |
| `pnpm exec playwright test`       | Run E2E tests                                             |

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

- Writing guide: `WRITING.md`
- Agent integration guide: `public/agent-integration.md`
- Agent & developer resources index: `public/docs.md` (Served at `/docs/`)
- Webhook alternatives guide: `public/webhooks.md` (Served at `/webhooks/`)
- Ora / Agent Readiness optimization review: `docs/ora-agent-readiness-optimization.md`
- i18n language switcher: `docs/i18n-language-switcher.md`
- Bilingual comment mapping: `docs/bilingual-comment-system.md`
- Mermaid rendering: `docs/mermaid-rendering.md`
- Remark/Rehype plugins (TOC + collapse + callouts): `docs/remark-plugins.md`

## Deployment

- CI and deploy workflows are under `.github/workflows/`.
- Production and preview deployments are prebuilt in GitHub Actions and deployed to Vercel with `--prebuilt`.
- `pnpm build` and `pnpm build:strict` also patch `.vercel/output/config.json` so Vercel prebuilt deployments serve localized zh/en 404 pages and security response headers.

## Agent-Readiness Verification

Run these commands locally to verify the agent-readiness artifacts are correct before deploying:

```bash
# 1. Build the site (generates static JSON API, MCP function, robots.txt, etc.)
pnpm run build

# 2. Run unit tests (includes schema validation, property tests, artifact presence checks)
pnpm run test:unit

# 3. Run agent-readiness Playwright specs (requires dev server)
pnpm exec playwright test tests/agent-readiness-*.spec.ts

# 4. Run structured data Playwright spec
pnpm exec playwright test tests/structured-data.spec.ts
```

### Post-Deploy Rescan

After deploying to production, trigger an Ora.run rescan to verify the score improvement:

1. Visit `https://ora.run/scan/blog.gaazeon.com?rescan=1`
2. Wait for the scan to complete (typically 4–10 seconds)
3. Record the resulting score and per-layer subscores
4. Target: overall ≥ 80, Discovery ≥ 15/20, UX ≥ 8/10, Agent Integration ≥ 18/20

### Required Artifacts

The canonical list of required build-output paths is maintained in `src/schemas/agent-readiness-artifacts.json`. The `agent-readiness-artifacts.spec.ts` unit test asserts every listed path exists after build.
