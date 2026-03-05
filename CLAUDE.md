# CLAUDE.md

This file provides concise, repository-specific guidance for coding agents.

## Project Overview

- Personal bilingual blog for `blog.gaazeon.com`
- Built on AstroPaper with Astro + TypeScript + Tailwind CSS
- Chinese-first content, English companion content for SEO

## Package and Runtime Requirements

- Node.js: `24.x`
- pnpm: `>=10 <11`
- Package manager: pnpm only

## Common Commands

### Development

- `pnpm dev` - Start local dev server
- `pnpm build` - Fast build (no `astro check`)
- `pnpm build:strict` - CI-equivalent build (`astro check` + build + Pagefind)
- `pnpm preview` - Preview production output

### Quality and Validation

- `pnpm lint` - Run ESLint
- `pnpm format` - Format all files
- `pnpm format:check` - Check formatting
- `pnpm validate:meta` - Validate SEO meta description quality
- `pnpm twikoo:sri:check` - Verify Twikoo SRI hash

### Testing

- `pnpm test:unit` - Run Vitest unit tests
- `pnpm test:sitemap` - Build + sitemap Playwright checks
- `pnpm exec playwright test` - Run all Playwright E2E tests
- `pnpm exec playwright test tests/<file>.spec.ts` - Run one Playwright spec

### Content and i18n

- `pnpm i18n:scaffold-en` - Generate English draft posts from Chinese posts
- `pnpm generate:bilingual-mapping` - Regenerate bilingual mapping used by comments/sitemap alternates
- `pnpm og:preview` - Preview OG image rendering

## Architecture Notes

### Core directories

- `src/data/blog/` - Chinese posts
- `src/data/blog/en/` - English posts
- `src/pages/` - Route pages
- `src/components/` - UI components
- `src/i18n/` - Locale config and dictionaries
- `src/utils/generated/` - Auto-generated bilingual mapping (do not edit manually)
- `scripts/` - Content/build automation scripts
- `tests/` - Playwright specs

### i18n behavior

- Chinese routes have no locale prefix (`/posts/...`)
- English routes use `/en/` prefix (`/en/posts/...`)
- Language relationship uses `originalTitle` in frontmatter

### Language switcher

- Main component: `src/components/LanguageSwitcher.astro`
- Current implementation: dropdown variant only (`src/components/LanguageSwitcher/Dropdown.astro`)
- Client behavior and event cleanup: `src/components/LanguageSwitcher/client.ts`
- Uses `data-astro-reload` on language links to ensure reliable re-binding after navigation

### Mermaid rendering

- Configured in `astro.config.ts`
- Build-time Mermaid rendering (`rehype-mermaid`) is enabled in GitHub Actions (`GITHUB_ACTIONS`)
- Outside CI, Mermaid code blocks are kept as-is

### Bilingual comment mapping

- Generation script: `scripts/auto-discover-bilingual.ts`
- Output file: `src/utils/generated/bilingualMapping.ts`
- Regenerate after adding/changing bilingual posts

## Documentation Index

- `README.md` - Project overview and commands
- `WRITING.md` - Author workflow and frontmatter conventions
- `docs/i18n-language-switcher.md` - Language switcher details
- `docs/bilingual-comment-system.md` - Bilingual mapping internals
- `docs/mermaid-rendering.md` - Mermaid rendering behavior
- `docs/remark-plugins.md` - TOC/collapse plugin setup
