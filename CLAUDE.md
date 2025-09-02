# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is an AstroPaper blog theme built with Astro, TypeScript, and TailwindCSS. It's a minimal, responsive, accessible, and SEO-friendly blog theme designed for technical content.

This specific instance is used for the blog at blog.gaazeon.com, based on the upstream template repository at https://github.com/satnaing/astro-paper.

## Common Commands

### Development
- `pnpm install` - Install dependencies
- `pnpm run dev` - Start local development server at localhost:4321
- `pnpm run build` - Build production site to ./dist/
- `pnpm run preview` - Preview the built site locally

### Code Quality
- `pnpm run format:check` - Check code formatting with Prettier
- `pnpm run format` - Format code with Prettier
- `pnpm run lint` - Lint code with ESLint
- `pnpm run sync` - Generate TypeScript types for Astro modules

### Validation
- `pnpm run validate:meta` - Validate meta descriptions in blog posts

## Architecture Overview

### Core Structure
- `src/content.config.ts` - Defines blog post collection schema
- `src/config.ts` - Site configuration (title, author, etc.)
- `src/data/blog/` - Blog post content in Markdown format
- `src/pages/` - Route pages (index, posts, search, etc.)
- `src/layouts/` - Page layouts (Layout.astro, PostDetails.astro)
- `src/components/` - Reusable UI components
- `src/utils/` - Utility functions for data processing and helpers

### Key Features
1. **Blog System** - Markdown posts with frontmatter metadata
2. **Dark/Light Theme** - Toggle with localStorage persistence
3. **Search** - Pagefind-based static search
4. **Responsive Design** - Mobile-first with TailwindCSS
5. **SEO Optimization** - Meta tags, structured data, sitemap
6. **Privacy Features** - Cookie consent banner with granular controls
7. **Dynamic OG Images** - Auto-generated social media images
8. **Mermaid Diagrams** - Technical diagram rendering support

### Content Management
- Posts are stored as Markdown files in `src/data/blog/`
- Each post requires frontmatter with title, description, pubDatetime, and tags
- Posts can be marked as featured or draft
- OG images can be custom or auto-generated

### Styling
- Uses TailwindCSS v4 with custom configuration
- Global styles in `src/styles/global.css`
- Typography styles in `src/styles/typography.css`
- Theme variables controlled by data-theme attribute

### Deployment
- Build process includes Pagefind search index generation
- Mermaid.js library copied to public directory during build
- Site deployed to `dist/` directory
- Docker support via Dockerfile and docker-compose.yml

## Important Implementation Details

### Theme System
- Theme toggle managed in `public/toggle-theme.js`
- Uses localStorage for persistence and respects system preference
- CSS variables controlled by data-theme attribute on html element

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
