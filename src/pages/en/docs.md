---
layout: ../../layouts/AboutLayout.astro
title: "Agent and Developer Resources"
description: "Public static resource index for AI agents, crawlers, and developer tools consuming Gaazeon's Blog. Documents RSS, sitemap, Markdown, OpenAPI, MCP, and read-only JSON entry points."
---

This page is the public resource index for AI agents, crawlers, search systems, and developer tools consuming Gaazeon's Blog. The site is a static technical blog, not a SaaS control plane, and it does not provide write APIs.

## Content Discovery

- Home: [https://blog.gaazeon.com/](/)
- Chinese posts: [Chinese posts](/posts/)
- English posts: [English posts](/en/posts/)
- Tags: [Tags](/tags/)
- Archives: [Archives](/archives/)
- Search: [Search](/search/)
- Sitemap index: [sitemap-index.xml](/sitemap-index.xml)
- Chinese RSS: [rss.xml](/rss.xml)
- English RSS: [rss.en.xml](/rss.en.xml)

## Agent Entry Points

- Compact LLM overview: [llms.txt](/llms.txt)
- Full LLM context: [llms-full.txt](/llms-full.txt)
- Agent instructions: [agents.md](/agents.md)
- Agent integration guide: [agent-integration.md](/agent-integration.md)
- Markdown home index: [index.md](/index.md)
- OpenAPI description: [openapi.json](/openapi.json)
- API catalog: [/.well-known/api-catalog](/.well-known/api-catalog)
- A2A agent card: [/.well-known/agent-card.json](/.well-known/agent-card.json)
- MCP discovery: [/.well-known/mcp](/.well-known/mcp)
- MCP server card: [/.well-known/mcp/server-card.json](/.well-known/mcp/server-card.json)
- MCP Apps resource widget: `ui://widget/resource-index.html`
- MCP transport: Streamable HTTP over JSON-RPC POST, with `2025-03-26` initialize support.
- OpenAI plugin manifest: [/.well-known/ai-plugin.json](/.well-known/ai-plugin.json)

## Read-Only JSON Entry Points

- All posts index: `/api/posts.json`
- All tags index: `/api/tags.json`
- Single post JSON: `/api/posts/{locale}/{slug}.json`

Supported `locale` values are `zh-CN` and `en`. These JSON entry points only read public content and do not require OAuth, API keys, or user sessions.

## Error Recovery

If an agent requests an unsupported `/api/*` path, the site returns a JSON 404 body with canonical discovery resources. Recommended recovery order:

1. Retry the exact canonical URL documented here.
2. For article pages, prefer the trailing slash URL from the sitemap.
3. Fall back to [llms-full.txt](/llms-full.txt), [index.md](/index.md), RSS, and sitemap resources.
4. Do not attempt login, checkout, mutation, webhook registration, or private data access.

## Unsupported Workflows

The site does not provide user accounts, OAuth, API keys, paid plans, checkout flows, write APIs, webhooks, subscription callbacks, or private resources. For incremental updates, use RSS, sitemap files, and public JSON indexes.

The MCP Apps widget only renders the public resource index in read-only clients. It does not add login, checkout, write actions, webhook registration, or private content access.
