# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is an AstroPaper blog theme built with Astro, TypeScript, and TailwindCSS. It's a minimal, responsive, accessible, and SEO-friendly blog theme designed for technical content.

This specific instance is used for the blog at blog.gaazeon.com, based on the upstream template repository at https://github.com/satnaing/astro-paper.

## Common Commands

### Development

- `pnpm install` - Install dependencies
- `pnpm run dev` - Start local development server at localhost:4321
- `pnpm run build` - Fast local production build to ./dist/ (includes bilingual mapping generation and build-time Mermaid rendering; skips `astro check`)
- `pnpm run build:strict` - CI-equivalent build with `astro check` + production build + Pagefind index generation
- `pnpm run preview` - Preview the built site locally

### Internationalization

- `pnpm run i18n:scaffold-en` - Create English drafts from Chinese posts
- `pnpm run generate:bilingual-mapping` - Generate automatic bilingual post mappings for comment system

### Code Quality

- `pnpm run format:check` - Check code formatting with Prettier
- `pnpm run format` - Format code with Prettier
- `pnpm run lint` - Lint code with ESLint
- `pnpm run sync` - Generate TypeScript types for Astro modules

### Validation

- `pnpm run validate:meta` - Validate meta descriptions in blog posts

### Testing

- `pnpm run test` - Run Playwright tests
- `npx playwright test tests/[test-file].spec.ts` - Run specific test file

## Architecture Overview

### Core Structure

- `src/content.config.ts` - Defines blog post collection schema
- `src/config.ts` - Site configuration (title, author, etc.)
- `src/data/blog/` - Blog post content in Markdown format
- `src/data/blog/en/` - English blog post content
- `src/pages/` - Route pages (index, posts, search, etc.)
- `src/layouts/` - Page layouts (Layout.astro, PostDetails.astro)
- `src/components/` - Reusable UI components
- `src/utils/` - Utility functions for data processing and helpers
- `src/i18n/` - Internationalization configuration and utilities
- `tests/` - Playwright E2E test suite

### Key Features

1. **Blog System** - Markdown posts with frontmatter metadata
2. **Dark/Light Theme** - Toggle with localStorage persistence
3. **Search** - Pagefind-based static search
4. **Responsive Design** - Mobile-first with TailwindCSS
5. **SEO Optimization** - Meta tags, structured data, sitemap
6. **Privacy Features** - Cookie consent banner with granular controls
7. **Dynamic OG Images** - Auto-generated social media images
8. **Mermaid Diagrams** - Technical diagram rendering with lazy loading and theme switching
9. **Internationalization (i18n)** - Full bilingual support (Chinese/English) with dedicated content collections
10. **Bilingual Comment System** - Automatic post mapping for unified comments across language versions
11. **Comprehensive Testing** - E2E tests for critical functionality

### Content Management

- Chinese posts are stored as Markdown files in `src/data/blog/`
- English posts are stored as Markdown files in `src/data/blog/en/`
- Each post requires frontmatter with title, description, pubDatetime, and tags
- Posts can be marked as featured or draft
- OG images can be custom or auto-generated
- Use `pnpm run i18n:scaffold-en` to create English drafts from Chinese posts
- Use `originalTitle` field to link bilingual posts for unified comments

### Styling

- Uses TailwindCSS v4 with custom configuration
- Global styles in `src/styles/global.css`
- Typography styles in `src/styles/typography.css`
- Theme variables controlled by data-theme attribute

### Deployment

- Build artifacts deployed via GitHub Actions workflows
- `vercel.json` configured to skip Vercel build (uses pre-built artifacts)
- GitHub Actions runs on feature branches for preview deployments

### CI/CD Workflows

- `.github/workflows/ci.yml` - Runs lint, format check, strict build, and tests on PRs
- `.github/workflows/deploy-preview.yml` - Deploys feature branches to Vercel preview

## Important Implementation Details

### Theme System

- Theme toggle managed in `public/toggle-theme.js`
- Uses localStorage for persistence and respects system preference
- CSS variables controlled by data-theme attribute on html element
- Synchronizes Mermaid diagram themes with `theme-changed` event

### Search Functionality

- Powered by Pagefind for static search
- Search index generated during build process
- UI component located in `src/pages/search.astro`

### Privacy Compliance

- Cookie consent banner in `src/components/CookieConsentBanner.astro`
- Granular control over analytics and advertising cookies
- Settings persisted in localStorage

### Performance Features

- View transitions for smooth navigation
- Code block copy buttons
- Heading anchor links for sharing sections
- Scroll progress indicator
- Back to top button
- Mermaid diagram lazy loading with IntersectionObserver

### Internationalization (i18n) System

- **Bilingual Support**: Full Chinese/English bilingual support with dedicated content collections
- **Locale Configuration**: `src/i18n/config.ts` defines supported locales (zh-CN, en) and their profiles
- **Translation Management**:
  - Chinese: `src/i18n/locales/zh-CN.ts`
  - English: `src/i18n/locales/en.ts`
- **Tag Mapping**: `src/i18n/tagMap.ts` provides Chinese-to-English tag translation
- **Content Collections**:
  - `blog` collection: Chinese posts (excludes `/en` subdirectory)
  - `blogEn` collection: English posts (only from `/en` subdirectory)
- **Language Switching**: `src/components/LanguageSwitcher.astro` with dropdown UI
- **Translation Utilities**: `src/i18n/utils.ts` provides:
  - `t()` function for translations with parameter substitution
  - `getLocaleSwitchUrl()` for cross-language linking
  - `formatDate()` and `getRelativeTime()` for localized dates
  - Translation not found page for missing translations
- **Route Structure**:
  - Chinese: `/posts/slug/` (default, no prefix)
  - English: `/en/posts/slug/` (with `/en/` prefix)
- **RSS Feeds**: Separate feeds for each language (`/rss.xml` for Chinese, `/rss.en.xml` for English)

### Bilingual Comment System

- **Automatic Mapping**: `scripts/auto-discover-bilingual.ts` scans posts and generates mappings
- **Matching Strategies**:
  1. Exact match via `originalTitle` field (confidence: 1.0)
  2. Similarity match via slug and title similarity (confidence: ≥0.6)
- **Output**: `src/utils/generated/bilingualMapping.ts` with:
  - `dynamicSlugMapping`: English slug → Chinese slug mappings
  - `unifiedCommentPaths`: Unified comment path information
  - `mappingMetadata`: Generation statistics
- **Usage**: Run `pnpm run generate:bilingual-mapping` or included in `pnpm run build`
- **Best Practice**: Set matching `originalTitle` fields in Chinese/English post frontmatter

### Mermaid Diagram System

- **Build-time Rendering**: `rehype-mermaid` plugin renders diagrams as inline SVG at build time
- **Strategy**: `img-svg` with `dark: true` for responsive dark mode support
- **Dark Mode**: Uses `<picture>` element with `prefers-color-scheme` media query
- **Zero Client-side JavaScript**: No Mermaid JS library loaded in browser
- **Configuration**: Theme variables defined in `astro.config.ts` under `rehypeMermaid`
- **Testing**: E2E tests in `tests/mermaid-rendering.spec.ts` verify `<picture>` elements

### Testing Strategy

- **Playwright E2E Tests**: Located in `tests/` directory
- **Key Test Areas**:
  - Mermaid diagram rendering and theme switching
  - Language switcher functionality
  - Post navigation
  - Legal links and SEO
  - OG image generation
  - Table of contents animation optimization
  - Internationalization
- **Test Commands**:
  - `pnpm run test` - Run all tests
  - `npx playwright test tests/[test-file].spec.ts` - Run specific test
- **CI Integration**: Tests run in GitHub Actions workflows

### Build Process Enhancements

1. **Build-time Mermaid Rendering**: `rehype-mermaid` converts Mermaid code blocks to inline SVG
2. **Playwright Browsers**: Installed during CI for Mermaid rendering
3. **Bilingual Mapping Generation**: Automatic mapping generation included in build
4. **Pagefind Index Generation**: Search index created after Astro build
5. **Type Checking**: `astro check` validates TypeScript types (executed in `pnpm run build:strict`)

## Documentation

- `docs/bilingual-comment-system.md` - Bilingual comment system guide
- `docs/copilot-review-final-assessment.md` - Copilot code review assessments
- `docs/i18n-language-switcher.md` - Language switcher implementation
- `docs/og-photo-space-encoding-issue.md` - OG image encoding issues
- `docs/remark-plugins.md` - Remark plugin configurations
- `docs/toc-optimization-report.md` - Table of contents optimization
- `docs/seo-optimization/` - SEO optimization documentation

## Maintenance Notes

### Content Updates

- Ensure `originalTitle` fields match for bilingual posts
- Run `pnpm run generate:bilingual-mapping` after adding new bilingual content
- Use `pnpm run validate:meta` to validate meta descriptions

### Code Quality

- Run `pnpm run lint` and `pnpm run format:check` before committing
- Pre-commit hooks enforce code formatting via Husky and lint-staged

### Testing

- Add tests for new features in `tests/` directory
- Run `pnpm run test` to ensure no regressions
- Test bilingual functionality with both Chinese and English posts

### Performance

- Mermaid diagrams are lazy-loaded to improve initial page load
- Theme switching events are debounced to prevent excessive re-renders
- Search index is generated at build time for optimal performance
