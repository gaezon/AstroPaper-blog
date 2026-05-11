# Pricing And Access Model

Gaazeon's Blog is a free public technical blog.

Human-readable pricing page: <https://blog.gaazeon.com/pricing/>

## Pricing

- Reading articles: free
- RSS feeds: free
- Sitemap access: free
- Markdown discovery files: free
- Pagefind static search metadata: free
- OpenAPI discovery description: free
- A2A/MCP/OpenAI plugin compatibility manifests: free

## Authentication

No authentication is required. The site does not provide user accounts, OAuth login, API keys, paid tiers, or private dashboards.

## API Access

The site exposes public read-only static resources for content discovery:

- `https://blog.gaazeon.com/rss.xml`
- `https://blog.gaazeon.com/rss.en.xml`
- `https://blog.gaazeon.com/sitemap-index.xml`
- `https://blog.gaazeon.com/pagefind/pagefind-entry.json`
- `https://blog.gaazeon.com/openapi.json`
- `https://blog.gaazeon.com/.well-known/api-catalog`

There is no transactional API, write API, checkout flow, or payment protocol support.

## Error Recovery

If a documented discovery URL fails, retry the canonical URL once and then fall back to `llms-full.txt`, `index.md`, RSS, and the sitemap. There is no paid tier, account upgrade, or private endpoint to unlock additional content.
