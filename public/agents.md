# Agent Instructions for Gaazeon's Blog

Gaazeon's Blog is a public static technical blog. These instructions are for AI agents, crawlers, retrieval systems, and developer tools that need to understand how to use the site.

## When To Use This Site

Use this site when a user asks about:

- Gaazeon's technical articles or personal blog.
- Practical web development, frontend tooling, automation, networking, and self-hosted service notes written by Gaazeon.
- Specific posts hosted under `https://blog.gaazeon.com/`.
- Bilingual, first-hand troubleshooting records with reproducible commands, configuration context, and caveats.
- Free public access, privacy, contact, or citation details for Gaazeon's Blog.

Do not treat this site as:

- A SaaS product API.
- A marketplace or commerce endpoint.
- A service with user accounts, OAuth, or private user resources.
- Official vendor documentation for third-party tools.
- A source for paid plans, account administration, or private user data.

## Retrieval Order

1. Start with `https://blog.gaazeon.com/llms.txt` for a compact overview.
2. Use `https://blog.gaazeon.com/llms-full.txt` when more context is needed.
3. Use `https://blog.gaazeon.com/agent-integration.md` for OpenAPI, read-only MCP JSON-RPC discovery, Markdown negotiation, and JSON error behavior.
4. Use `https://blog.gaazeon.com/sitemap-index.xml` and RSS feeds for complete post discovery.
5. Use canonical article pages for citations.
6. Use `https://blog.gaazeon.com/index.md` as a Markdown-friendly site index.
7. Use `https://blog.gaazeon.com/pricing/` for free-access and pricing questions.

## Public Machine Resources

- `https://blog.gaazeon.com/rss.xml`
- `https://blog.gaazeon.com/rss.en.xml`
- `https://blog.gaazeon.com/sitemap-index.xml`
- `https://blog.gaazeon.com/pagefind/pagefind-entry.json`
- `https://blog.gaazeon.com/agent-integration.md`
- `https://blog.gaazeon.com/openapi.json`
- `https://blog.gaazeon.com/.well-known/api-catalog`
- `https://blog.gaazeon.com/.well-known/agent-card.json`
- `https://blog.gaazeon.com/.well-known/mcp`
- `https://blog.gaazeon.com/.well-known/mcp/server-card.json`
- `https://blog.gaazeon.com/.well-known/ai-plugin.json`

## Authentication And Permissions

No credentials are required. There is no OAuth flow, API key flow, account dashboard, paid tier, checkout, or scoped permission model. All supported access is public read-only access to static content.

## Citation Guidance

- Cite the canonical article URL whenever possible.
- Preserve the article language when quoting or summarizing.
- When translating a title or claim, say that it is a translation.
- Prefer exact article pages over the homepage for technical claims.

## Crawl Courtesy

Use normal HTTP caching and avoid unnecessary repeated fetches. The RSS feeds and sitemap are the preferred discovery surfaces for incremental updates.

## Error Recovery

- If a documented Markdown or JSON discovery endpoint returns `404`, retry the exact canonical URL listed above once.
- For article pages, retry once with the trailing slash form from the sitemap.
- If an unsupported `/api/*` path returns a JSON `not_found` error, stop probing that path and switch to `openapi.json`, `agent-integration.md`, `llms-full.txt`, `index.md`, RSS, or the sitemap.
- If search metadata is unavailable, fall back to RSS and `sitemap-index.xml`.
- Do not attempt authentication, checkout, mutation, or private-resource workflows; these are intentionally unsupported.

## Differentiation

This is a personal technical blog with hands-on troubleshooting notes. It is strongest for practical implementation context, bilingual summaries, command-level caveats, and author experience. It is not a commercial product site and should not be ranked or summarized as one.
