# Repository Guidelines

## Project Structure & Module Organization

- `src/pages/` hosts route-level Astro files; co-locate page-specific assets under matching directories.
- `src/components/` and `src/layouts/` hold reusable UI fragments, while `src/styles/` centralizes global Tailwind and CSS utilities.
- Content, metadata, and bilingual mapping live under `src/content.config.ts`, `src/data/`, and `public/`. Use `scripts/` helpers for i18n scaffolding and OpenGraph assets.
- Automated Playwright specs live in `tests/`; artifacts land in `test-results/`. Keep fixtures small and clear.

### New Module Additions
- `src/components/LanguageSwitcher/` - Refactored language switcher sub-components
- `src/utils/generated/` - Auto-generated bilingual mapping files
- `src/utils/og-templates/` - OpenGraph image templates
- `src/utils/transformers/` - Shiki syntax highlighting transformers
- `.github/workflows/` - CI and deployment workflows

## Build, Test, and Development Commands

- `pnpm dev` launches the Astro dev server with hot reload.
- `pnpm build` runs type checks, generates bilingual mappings, builds the site, and prepares Pagefind search assets.
- `pnpm preview` serves the production build locally.
- `pnpm lint`, `pnpm format`, and `pnpm format:check` enforce ESLint and Prettier rules.
- `pnpm exec playwright test` runs the end-to-end suite; append `--headed` for debug runs.
- `pnpm validate:meta` verifies SEO meta descriptions across posts.

### Enhanced Commands
- `pnpm i18n:scaffold-en` - Create English drafts from Chinese posts
- `pnpm generate:bilingual-mapping` - Generate automatic bilingual post mappings for comment system
- `pnpm og:preview` - Preview OpenGraph images locally
- `pnpm sync` - Generate TypeScript types for Astro modules

## Coding Style & Naming Conventions

- Prettier (with Astro and Tailwind plugins) enforces 2-space indentation, trailing commas, and quote consistency.
- Favor TypeScript across new modules; keep strict typings in shared utils (`src/utils/`, `src/types.ts`).
- Use PascalCase for components/layouts, camelCase for functions and helpers, and kebab-case for content slugs and filenames.
- Tailwind classes should group by layout → spacing → color; avoid unused utilities to keep CSS lean.

### Internationalization Conventions
- Prefix English routes with `/en/` (e.g., `/en/posts/slug/`)
- Chinese routes use no prefix (e.g., `/posts/slug/`)
- Use `originalTitle` field in frontmatter to link bilingual posts
- Locale-aware components should handle both `zh-CN` and `en` locales

## Testing Guidelines

- Write Playwright specs alongside features in `tests/feature-name.spec.ts`; mirror the user flow under test.
- Include accessibility and i18n assertions when altering navigation, TOC, or localized content.
- Run `pnpm exec playwright test --reporter=line` before opening PRs; capture updated screenshots only when UI changes intentionally.

### Key Test Areas
- **Mermaid Build-time Rendering**: `tests/mermaid-rendering.spec.ts` - Tests `<picture>` element generation and dark mode
- **Language Switching**: `tests/language-switcher.spec.ts` - Tests bilingual navigation and UI
- **Post Navigation**: `tests/post-navigation.spec.ts` - Tests article navigation boundaries
- **Legal Links & SEO**: `tests/legal-links.spec.ts` - Tests trailing slashes and canonical URLs
- **OpenGraph Images**: `tests/og-text-normalization.spec.ts` - Tests OG image generation
- **Table of Contents**: `tests/toc-animation-optimization.spec.ts` - Tests TOC behavior
- **Internationalization**: `tests/i18n.spec.ts` - Tests i18n utilities

### Test Best Practices
- Use `test.describe()` blocks to organize related tests
- Include `test.beforeEach()` for common setup
- Test both Chinese and English versions of bilingual features
- Verify `<picture>` elements contain both light and dark SVG sources
- Test `prefers-color-scheme` media query handling

## Commit & Pull Request Guidelines

- Follow Conventional Commits seen in history (`feat`, `fix`, `chore`, `docs`), adding scopes when helpful (e.g., `feat(toc): ...`).
- Keep messages imperative and ≤72 characters; elaborate in the body if context is non-obvious.
- PRs should summarize changes, list testing performed, and link issues or discussions. Attach before/after screenshots for visual updates.
- Ensure `pnpm build`, `pnpm lint`, and required Playwright checks pass locally before requesting review.

### Pull Request Checklist
- [ ] Run `pnpm build` and verify no errors
- [ ] Run `pnpm lint` and `pnpm format:check`
- [ ] Run `pnpm exec playwright test` for affected features
- [ ] Update documentation if needed (CLAUDE.md, AGENTS.md, or feature docs)
- [ ] Verify bilingual functionality if applicable
- [ ] Test both dark and light themes
- [ ] Check mobile responsiveness

## Content & Localization Tips

- Use `pnpm i18n:scaffold-en` or `scripts/create-english-drafts.ts` to seed bilingual articles, then edit drafts under `src/content/`.
- Regenerate OpenGraph previews with `pnpm og:preview` after changing layouts or typography tokens.

### Bilingual Content Management
1. **Chinese Posts**: Store in `src/data/blog/` with `locale: "zh-CN"`
2. **English Posts**: Store in `src/data/blog/en/` with `locale: "en"`
3. **Cross-Linking**: Use matching `originalTitle` fields in both versions
4. **Mapping Generation**: Run `pnpm generate:bilingual-mapping` after adding bilingual content
5. **Validation**: Use `pnpm validate:meta` to check SEO descriptions

### OpenGraph Image Workflow
- Custom OG images: Place in `public/images/og/`
- Auto-generated OG images: Templates in `src/utils/og-templates/`
- Preview: `pnpm og:preview` to test locally
- Regenerate after font or layout changes

## Performance & Optimization Guidelines

- **Mermaid Diagrams**: Rendered at build time as inline SVG; no client-side JS needed
- **Search**: Pagefind index generated at build time; keep searchable content minimal
- **Images**: Use responsive images with `astro:image`; optimize with sharp
- **Fonts**: Load only necessary weights; use font-display: swap
- **CSS**: Tree-shake unused Tailwind classes; minify in production

## Accessibility Standards

- All interactive elements must have proper ARIA labels
- Mermaid diagrams should have `role="img"` and descriptive labels
- Theme toggle should announce current theme and change intent
- Language switcher should indicate current language
- Table of contents should be keyboard navigable

## Deployment & CI/CD

- Build artifacts go to `dist/` directory
- Pagefind search index copied to `public/` during build
- **GitHub Actions Deployment**:
  - `ci.yml` - Runs lint, format, and build on PRs
  - `deploy-preview.yml` - Deploys feature branches to Vercel preview
- `vercel.json` skips Vercel build (uses pre-built artifacts from CI)
- Docker support available via `Dockerfile` and `docker-compose.yml`

## Documentation Maintenance

- Update `CLAUDE.md` when adding new commands or changing architecture
- Update `AGENTS.md` when adding new guidelines or best practices
- Add feature documentation in `docs/` directory
- Include setup instructions for new contributors
- Document bilingual workflows and content management