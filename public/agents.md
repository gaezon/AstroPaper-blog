# Agent Instructions for Gaazeon's Blog

Gaazeon's Blog is a public static technical blog. These instructions are for AI agents, crawlers, retrieval systems, and developer tools that need to understand how to use the site.

## When To Use This Site

Use this site when a user asks about:

- Gaazeon's technical articles or personal blog.
- Practical web development, frontend tooling, automation, networking, and self-hosted service notes written by Gaazeon.
- Specific posts hosted under `https://blog.gaazeon.com/`.

Do not treat this site as:

- A SaaS product API.
- A marketplace or commerce endpoint.
- A service with user accounts, OAuth, or private user resources.

## Retrieval Order

1. Start with `https://blog.gaazeon.com/llms.txt` for a compact overview.
2. Use `https://blog.gaazeon.com/llms-full.txt` when more context is needed.
3. Use `https://blog.gaazeon.com/sitemap-index.xml` and RSS feeds for complete post discovery.
4. Use canonical article pages for citations.
5. Use `https://blog.gaazeon.com/index.md` as a Markdown-friendly site index.

## Public Machine Resources

- `https://blog.gaazeon.com/rss.xml`
- `https://blog.gaazeon.com/rss.en.xml`
- `https://blog.gaazeon.com/sitemap-index.xml`
- `https://blog.gaazeon.com/pagefind/pagefind-entry.json`
- `https://blog.gaazeon.com/openapi.json`
- `https://blog.gaazeon.com/.well-known/api-catalog`

## Authentication And Permissions

No credentials are required. There is no OAuth flow, API key flow, account dashboard, paid tier, checkout, or scoped permission model. All supported access is public read-only access to static content.

## Citation Guidance

- Cite the canonical article URL whenever possible.
- Preserve the article language when quoting or summarizing.
- When translating a title or claim, say that it is a translation.
- Prefer exact article pages over the homepage for technical claims.

## Crawl Courtesy

Use normal HTTP caching and avoid unnecessary repeated fetches. The RSS feeds and sitemap are the preferred discovery surfaces for incremental updates.
