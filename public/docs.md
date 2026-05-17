# Agent and Developer Resources

Gaazeon's Blog is a static public technical blog. This document indexes the real machine-readable resources available to AI agents, crawlers, search systems, and developer tools.

## Canonical Pages

- Human-readable docs: [https://blog.gaazeon.com/docs/](https://blog.gaazeon.com/docs/)
- English docs: [https://blog.gaazeon.com/en/docs/](https://blog.gaazeon.com/en/docs/)
- Webhook alternatives: [https://blog.gaazeon.com/webhooks/](https://blog.gaazeon.com/webhooks/)
- English webhook alternatives: [https://blog.gaazeon.com/en/webhooks/](https://blog.gaazeon.com/en/webhooks/)

## Discovery Resources

- [llms.txt](https://blog.gaazeon.com/llms.txt)
- [llms-full.txt](https://blog.gaazeon.com/llms-full.txt)
- [agents.md](https://blog.gaazeon.com/agents.md)
- [agent-integration.md](https://blog.gaazeon.com/agent-integration.md)
- [index.md](https://blog.gaazeon.com/index.md)
- [openapi.json](https://blog.gaazeon.com/openapi.json)
- [api-catalog](https://blog.gaazeon.com/.well-known/api-catalog)
- [agent-card.json](https://blog.gaazeon.com/.well-known/agent-card.json)
- [MCP discovery](https://blog.gaazeon.com/.well-known/mcp)
- [MCP server card](https://blog.gaazeon.com/.well-known/mcp/server-card.json)
- MCP Apps resource widget: `ui://widget/resource-index.html`
- [ai-plugin.json](https://blog.gaazeon.com/.well-known/ai-plugin.json)

## Content Feeds

- [sitemap-index.xml](https://blog.gaazeon.com/sitemap-index.xml)
- [rss.xml](https://blog.gaazeon.com/rss.xml)
- [rss.en.xml](https://blog.gaazeon.com/rss.en.xml)

## Read-Only JSON

- `/api/posts.json`: all public posts.
- `/api/tags.json`: all public tags.
- `/api/posts/{locale}/{slug}.json`: one public post, where `locale` is `zh-CN` or `en`.

## Unsupported Workflows

The blog does not provide user accounts, OAuth, API keys, paid plans, checkout flows, write APIs, webhooks, subscription callbacks, or private resources.

For incremental updates, use RSS, sitemap files, and public JSON indexes. Unsupported `/api/*` paths return JSON 404 responses with canonical discovery links.

The MCP Apps widget is read-only and only renders the public resource index. It does not enable login, checkout, write actions, webhook registration, or private content access.
