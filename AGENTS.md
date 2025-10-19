# Repository Guidelines

## Project Structure & Module Organization
- `src/pages/` hosts route-level Astro files; co-locate page-specific assets under matching directories.
- `src/components/` and `src/layouts/` hold reusable UI fragments, while `src/styles/` centralizes global Tailwind and CSS utilities.
- Content, metadata, and bilingual mapping live under `src/content.config.ts`, `src/data/`, and `public/`. Use `scripts/` helpers for i18n scaffolding and OpenGraph assets.
- Automated Playwright specs live in `tests/`; artifacts land in `test-results/`. Keep fixtures small and clear.

## Build, Test, and Development Commands
- `pnpm dev` launches the Astro dev server with hot reload.
- `pnpm build` runs type checks, generates bilingual mappings, builds the site, and prepares Pagefind search assets.
- `pnpm preview` serves the production build locally.
- `pnpm lint`, `pnpm format`, and `pnpm format:check` enforce ESLint and Prettier rules.
- `pnpm exec playwright test` runs the end-to-end suite; append `--headed` for debug runs.
- `pnpm validate:meta` verifies SEO meta descriptions across posts.

## Coding Style & Naming Conventions
- Prettier (with Astro and Tailwind plugins) enforces 2-space indentation, trailing commas, and quote consistency.
- Favor TypeScript across new modules; keep strict typings in shared utils (`src/utils/`, `src/types.ts`).
- Use PascalCase for components/layouts, camelCase for functions and helpers, and kebab-case for content slugs and filenames.
- Tailwind classes should group by layout → spacing → color; avoid unused utilities to keep CSS lean.

## Testing Guidelines
- Write Playwright specs alongside features in `tests/feature-name.spec.ts`; mirror the user flow under test.
- Include accessibility and i18n assertions when altering navigation, TOC, or localized content.
- Run `pnpm exec playwright test --reporter=line` before opening PRs; capture updated screenshots only when UI changes intentionally.

## Commit & Pull Request Guidelines
- Follow Conventional Commits seen in history (`feat`, `fix`, `chore`, `docs`), adding scopes when helpful (e.g., `feat(toc): ...`).
- Keep messages imperative and ≤72 characters; elaborate in the body if context is non-obvious.
- PRs should summarize changes, list testing performed, and link issues or discussions. Attach before/after screenshots for visual updates.
- Ensure `pnpm build`, `pnpm lint`, and required Playwright checks pass locally before requesting review.

## Content & Localization Tips
- Use `pnpm i18n:scaffold-en` or `scripts/create-english-drafts.ts` to seed bilingual articles, then edit drafts under `src/content/`.
- Regenerate OpenGraph previews with `pnpm og:preview` after changing layouts or typography tokens.
