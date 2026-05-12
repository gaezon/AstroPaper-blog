# Agent Integration Guide

Gaazeon's Blog is a public static technical blog. This guide is the canonical machine-readable integration entry point for agents that need to discover, retrieve, cite, or summarize public content from `https://blog.gaazeon.com/`.

## Supported Agent Surfaces

- OpenAPI description: <https://blog.gaazeon.com/openapi.json>
- API catalog: <https://blog.gaazeon.com/.well-known/api-catalog>
- OpenAI plugin manifest: <https://blog.gaazeon.com/.well-known/ai-plugin.json>
- A2A agent card: <https://blog.gaazeon.com/.well-known/agent-card.json>
- MCP discovery document: <https://blog.gaazeon.com/.well-known/mcp>
- MCP server card: <https://blog.gaazeon.com/.well-known/mcp/server-card.json>
- Agent instructions: <https://blog.gaazeon.com/agents.md>
- LLM overview: <https://blog.gaazeon.com/llms.txt>
- Full LLM context: <https://blog.gaazeon.com/llms-full.txt>
- Markdown home index: <https://blog.gaazeon.com/index.md>
- Pricing and access model: <https://blog.gaazeon.com/pricing.md>
- Sitemap index: <https://blog.gaazeon.com/sitemap-index.xml>
- Chinese RSS: <https://blog.gaazeon.com/rss.xml>
- English RSS: <https://blog.gaazeon.com/rss.en.xml>

## Markdown Content Negotiation

Agents can request the canonical home URL with `Accept: text/markdown` to receive the Markdown representation at the same URL. The response includes `Vary: Accept` so caches can distinguish the HTML and Markdown variants.

```http
GET / HTTP/2
Host: blog.gaazeon.com
Accept: text/markdown
```

Use `https://blog.gaazeon.com/index.md` as the explicit Markdown fallback when a client cannot send custom `Accept` headers.

## Error Handling

Unsupported `/api/*` paths return JSON rather than the HTML 404 page. Agents should treat this as a terminal unsupported-path signal and switch to the documented public resources.

```json
{
  "error": {
    "code": "not_found",
    "message": "No public API endpoint exists at this path. Gaazeon's Blog exposes read-only static discovery resources only.",
    "status": 404,
    "documentation_url": "https://blog.gaazeon.com/agent-integration.md",
    "availableResources": [
      "https://blog.gaazeon.com/agent-integration.md",
      "https://blog.gaazeon.com/openapi.json",
      "https://blog.gaazeon.com/llms.txt",
      "https://blog.gaazeon.com/llms-full.txt",
      "https://blog.gaazeon.com/agents.md",
      "https://blog.gaazeon.com/index.md",
      "https://blog.gaazeon.com/sitemap-index.xml"
    ]
  }
}
```

For public Markdown, JSON, RSS, or sitemap resources, retry the exact canonical URL once. For article pages, retry once with the trailing slash form from the sitemap. If the resource is still unavailable, fall back to `llms-full.txt`, `index.md`, RSS, and the sitemap.

## MCP-Style Discovery

The blog exposes static MCP-oriented discovery documents for agent bootstrap:

- `/.well-known/mcp` summarizes public resources, authentication, capabilities, and fallback behavior.
- `/.well-known/mcp/server-card.json` lists read-only discovery tools and resource URLs.

The static site does not expose live JSON-RPC tool invocation, mutation, subscription, or streaming MCP transport. Agents should call the listed HTTPS resources directly and treat every tool as read-only, idempotent, and public.

## OpenAI And ChatGPT Compatibility

`/.well-known/ai-plugin.json` advertises a no-auth OpenAPI manifest for ChatGPT-style tool discovery. The manifest is read-only and points to the public OpenAPI description. The blog does not provide account actions, purchases, private data, or an embedded OpenAI Apps SDK UI.

## Rate Limits And Crawl Courtesy

The site is static and cacheable. Agents should use normal HTTP caching, prefer RSS and sitemap resources for incremental discovery, and avoid repeated broad crawls when the Markdown and OpenAPI resources already answer the request.

## Unsupported Workflows

Do not attempt:

- OAuth, API key, or account creation.
- Checkout, payment, or subscription flows.
- Mutation, writeback, comments, or private user data access.
- Live MCP tool invocation or server-sent event streaming.
- Treating the blog as official vendor documentation.

When a user needs authoritative vendor behavior, cite the relevant blog post only for Gaazeon's experience and consult the vendor's official documentation separately.

## Streaming

### zh-CN

本站声明 `capabilities.streaming: false`。不提供 Server-Sent Events 或实时流式传输端点。

如需获取内容，请使用以下静态回退路径：

- 单篇文章 JSON：`https://blog.gaazeon.com/api/posts/{locale}/{slug}.json`
- 中文 RSS 订阅：`https://blog.gaazeon.com/rss.xml`
- 英文 RSS 订阅：`https://blog.gaazeon.com/rss.en.xml`
- 完整 LLM 上下文：`https://blog.gaazeon.com/llms-full.txt`

### en

This site declares `capabilities.streaming: false`. No Server-Sent Events or real-time streaming endpoints are available.

To retrieve content, use the following static fallback paths:

- Per-post JSON: `https://blog.gaazeon.com/api/posts/{locale}/{slug}.json`
- Chinese RSS feed: `https://blog.gaazeon.com/rss.xml`
- English RSS feed: `https://blog.gaazeon.com/rss.en.xml`
- Full LLM context: `https://blog.gaazeon.com/llms-full.txt`
