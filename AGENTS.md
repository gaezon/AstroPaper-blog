# Repository Guidelines

## Purpose

- `README.md` is the primary entry for setup and command usage
- This file focuses on repository conventions, architecture boundaries, testing expectations, and change hygiene

## Project Structure & Module Organization

- `src/pages/` hosts route-level Astro files; co-locate page-specific assets under matching directories
- `src/components/` and `src/layouts/` hold reusable UI fragments; `src/styles/` centralizes global styles and Tailwind utilities
- `src/scripts/` holds Astro-processed browser runtime modules that should be bundled from `src/` instead of copied from `public/`
- Content, metadata, and bilingual mapping live under `src/content.config.ts`, `src/data/`, and `public/`; use `scripts/` helpers for i18n scaffolding and OpenGraph assets
- Automated Playwright specs live in `tests/`; artifacts land in `test-results/`

## Key Shared Modules

- `src/components/LanguageSwitcher/` - language switcher sub-components
- `src/components/HomePage.astro` - shared localized home page renderer
- `src/components/PostListPage.astro` - shared localized posts pagination renderer
- `src/components/ArchivesPage.astro` - shared localized archives renderer
- `src/components/TagsPage.astro` - shared localized tags index renderer
- `src/components/TagPostsPage.astro` - shared localized tag posts renderer
- `src/types/pagination.ts` - shared pagination contracts
- `src/utils/blog-locale.ts` - strict locale helpers and normalization guard
- `src/utils/i18n-pages.ts` - locale-aware page and pagination helpers
- `src/utils/i18n-api.ts` - locale-aware RSS and OG endpoint helpers
- `src/utils/generated/` - auto-generated bilingual mapping files
- `src/utils/agent-discovery.ts` - centralization of read-only MCP tools and API resources
- `src/utils/agent-api.ts` - read-only JSON API builder helpers
- `src/utils/mcp.ts` - read-only MCP helper utilities
- `src/utils/mcp-endpoint.ts` - unified handler for JSON-RPC and MCP requests
- `src/pages/.well-known/mcp.ts` - MCP GET/POST route wrapper
- `src/pages/.well-known/mcp/server-card.json.ts` - static client discovery server card
- `scripts/apply-vercel-routes.ts` - post-build script to patch Vercel prebuilt routes and headers

## Runtime & Tooling Constraints

- Use pnpm only; do not use npm, yarn, or bun
- Use Node.js `24.x` and pnpm `>=10 <11`
- `.node-version` is committed with `24`; if the shell resolves another version, run `fnm use`
- For exact commands, prefer `README.md`

## Coding Style & Naming

- Favor TypeScript across new modules; keep strict typings in shared utils and shared type modules
- Use PascalCase for components/layouts, camelCase for helpers, and kebab-case for slugs and filenames
- Tailwind classes should roughly group by layout -> spacing -> color
- Keep zh/en route wrappers thin; push shared behavior into locale-aware components or helpers

## Internationalization Conventions

- English routes use `/en/`; Chinese routes use no locale prefix
- Use `originalTitle` to link bilingual posts
- Locale-aware features should support both `zh-CN` and `en`
- After changing bilingual content or pairing logic, regenerate mappings and verify localized navigation

## Testing Expectations

- Run the smallest relevant verification for the change, then expand to broader checks when risk is higher
- Update or add Playwright coverage when changing navigation, language switching, TOC, Mermaid, OG generation, pagination, or other cross-page behavior
- Include accessibility and i18n assertions when altering interactive or localized UI
- Prefer targeted Vitest runs for isolated utility changes; use Playwright for end-to-end user flows

## Key Test Areas

- `tests/mermaid-rendering.spec.ts` - Mermaid `<picture>` output and theme behavior
- `tests/language-switcher.spec.ts` - switcher interaction and listener cleanup
- `tests/post-navigation.spec.ts` - article navigation boundaries
- `tests/comment-lazy-load.spec.ts` - comment loading behavior
- `tests/og-text-normalization.spec.ts` - OG image generation
- `tests/toc-animation-optimization.spec.ts` - TOC behavior and animation
- `tests/i18n.spec.ts` - localized routing and locale behavior
- `tests/pagination-locale.spec.ts` - locale prefixes and pagination boundaries
- `tests/unit/mcp-live-endpoint.spec.ts` - validation of read-only MCP JSON-RPC requests
- `tests/unit/mcp-handshake-builder.spec.ts` - validation of MCP protocol handshake capabilities
- `tests/unit/mcp-well-known-json.spec.ts` - validation of /.well-known/mcp and server-card.json
- `tests/unit/mcp-streaming-posture.spec.ts` - validation of server-initiated streaming rejection
- `tests/unit/agent-docs-discovery.spec.ts` - validation of static agent discovery assets
- `tests/unit/api-json-schema.spec.ts` - validation of read-only posts and tags JSON API schema
- `tests/unit/api-json-404.spec.ts` - validation of JSON-formatted 404 recovery envelopes
- `tests/unit/vercel-localized-404-routes.spec.ts` - validation of prebuilt Vercel config post-processing
- `tests/unit/mcp-edge-function-bundle.spec.ts` - validation of esbuild bundle output shape and handler executability for the Vercel MCP Edge Function

## Accessibility & Performance

- All interactive elements must have appropriate ARIA labels
- Mermaid diagrams should expose `role="img"` and descriptive labels
- Theme and language controls should expose current state and intent
- Keep fonts lean, images optimized, and client-side runtime minimal where build-time output is viable

## Deployment Notes

- Build output is produced via Astro static build and Vercel prebuilt artifacts under `.vercel/output/`
- `scripts/apply-vercel-routes.ts` patches `.vercel/output/config.json` after build so Vercel `--prebuilt` serves localized zh/en 404 pages and security response headers correctly
- `scripts/apply-vercel-routes.ts` also generates `.vercel/output/functions/.well-known/mcp.func/index.mjs` by bundling `src/utils/mcp-endpoint.ts` with esbuild (`platform: "node"`, `target: "node24"`); this replaces the former hand-written JS template and keeps the Vercel Edge Function in sync with the local handler as a single source of truth
- Pagefind index generation targets `.vercel/output/static`

## Documentation Maintenance

- Update `README.md` when setup or commands change
- Update `WRITING.md` when author workflow or frontmatter conventions change
- Update this file when repository conventions, testing expectations, or architecture boundaries change
- Keep tool-specific instruction files concise and aligned with these shared facts
