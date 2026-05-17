# Agent Integration Guide

Gaazeon's Blog is a public static technical blog. This guide is the canonical machine-readable integration entry point for agents that need to discover, retrieve, cite, or summarize public content from `https://blog.gaazeon.com/`.

## Supported Agent Surfaces

- [OpenAPI description](https://blog.gaazeon.com/openapi.json)
- [API catalog](https://blog.gaazeon.com/.well-known/api-catalog)
- [OpenAI plugin manifest](https://blog.gaazeon.com/.well-known/ai-plugin.json)
- [A2A agent card](https://blog.gaazeon.com/.well-known/agent-card.json)
- [MCP discovery document](https://blog.gaazeon.com/.well-known/mcp)
- [MCP server card](https://blog.gaazeon.com/.well-known/mcp/server-card.json)
- [Agent instructions](https://blog.gaazeon.com/agents.md)
- [Agent and developer resources](https://blog.gaazeon.com/docs.md)
- [Human-readable agent resources](https://blog.gaazeon.com/docs/)
- [Webhook alternatives](https://blog.gaazeon.com/webhooks.md)
- [Human-readable webhook alternatives](https://blog.gaazeon.com/webhooks/)
- [LLM overview](https://blog.gaazeon.com/llms.txt)
- [Full LLM context](https://blog.gaazeon.com/llms-full.txt)
- [Markdown home index](https://blog.gaazeon.com/index.md)
- [Pricing and access model](https://blog.gaazeon.com/pricing.md)
- [Sitemap index](https://blog.gaazeon.com/sitemap-index.xml)
- [Chinese RSS](https://blog.gaazeon.com/rss.xml)
- [English RSS](https://blog.gaazeon.com/rss.en.xml)

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

## MCP JSON-RPC Discovery

The blog exposes a minimal read-only MCP Streamable HTTP endpoint for agent bootstrap:

- `GET /.well-known/mcp` returns a live handshake with public resources and capability flags.
- `POST /.well-known/mcp` accepts JSON-RPC 2.0 requests for `initialize`, `notifications/initialized`, `resources/list`, `resources/read`, `tools/list`, and `tools/call`.
- `/.well-known/mcp/server-card.json` lists the same read-only discovery tools and resource URLs for static clients.
- `resources/list` also exposes `ui://widget/resource-index.html`, a `text/html+skybridge` MCP Apps UI resource for rendering the public resource index.

All tools are read-only, idempotent, public, and unauthenticated. The site does not expose mutation, subscription, prompts, or server-initiated SSE streams.

`initialize` returns a standard MCP `InitializeResult` with object-shaped `tools` and `resources` capabilities. Clients may send `MCP-Protocol-Version: 2025-03-26`; legacy `2024-11-05` initialize requests are accepted for compatibility.

MCP Apps clients can use each tool's `openai/outputTemplate` metadata to render the same `ui://widget/resource-index.html` resource. Tool results also include structured content with the canonical source URL, MIME type, public resources, and intentionally unsupported workflows.

### Initialize

```http
POST /.well-known/mcp HTTP/2
Host: blog.gaazeon.com
Content-Type: application/json
Accept: application/json, text/event-stream
MCP-Protocol-Version: 2025-03-26

{"jsonrpc":"2.0","id":1,"method":"initialize","params":{"protocolVersion":"2025-03-26","capabilities":{},"clientInfo":{"name":"example-agent","version":"1.0.0"}}}
```

### List Resources

```json
{
  "jsonrpc": "2.0",
  "id": 2,
  "method": "resources/list"
}
```

### Read A Resource

```json
{
  "jsonrpc": "2.0",
  "id": 3,
  "method": "resources/read",
  "params": {
    "uri": "https://blog.gaazeon.com/llms-full.txt"
  }
}
```

### List Tools

```json
{
  "jsonrpc": "2.0",
  "id": 4,
  "method": "tools/list"
}
```

### Call A Read-Only Tool

```json
{
  "jsonrpc": "2.0",
  "id": 5,
  "method": "tools/call",
  "params": {
    "name": "get_agent_integration_guide",
    "arguments": {}
  }
}
```

## OpenAI And ChatGPT Compatibility

`/.well-known/ai-plugin.json` advertises a no-auth OpenAPI manifest for ChatGPT-style tool discovery. The manifest is read-only and points to the public OpenAPI description. The MCP endpoint additionally exposes a read-only MCP Apps UI resource at `ui://widget/resource-index.html` for clients that support `text/html+skybridge` widgets. The blog does not provide account actions, purchases, private data, or write-capable Apps SDK flows.

## Rate Limits And Crawl Courtesy

The site is static and cacheable. Agents should use normal HTTP caching, prefer RSS and sitemap resources for incremental discovery, and avoid repeated broad crawls when the Markdown and OpenAPI resources already answer the request.

## Unsupported Workflows

Do not attempt:

- OAuth, API key, or account creation.
- Checkout, payment, or subscription flows.
- Mutation, writeback, comments, or private user data access.
- Server-sent event streaming or write-capable MCP tools.
- Webhook registration, event callbacks, or subscription APIs.
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

## Webhooks

### zh-CN

本站不提供 webhook、事件订阅、回调注册或写入 API。需要增量更新时，请使用 RSS、sitemap 和公开 JSON 索引。

- Webhook 替代方案：`https://blog.gaazeon.com/webhooks/`
- Markdown 说明：`https://blog.gaazeon.com/webhooks.md`
- 中文 RSS：`https://blog.gaazeon.com/rss.xml`
- 英文 RSS：`https://blog.gaazeon.com/rss.en.xml`
- 站点地图：`https://blog.gaazeon.com/sitemap-index.xml`

### en

This site does not provide webhooks, event subscriptions, callback registration, or write APIs. For incremental updates, use RSS, sitemap files, and public JSON indexes.

- Webhook alternatives: `https://blog.gaazeon.com/webhooks/`
- Markdown guide: `https://blog.gaazeon.com/webhooks.md`
- Chinese RSS: `https://blog.gaazeon.com/rss.xml`
- English RSS: `https://blog.gaazeon.com/rss.en.xml`
- Sitemap index: `https://blog.gaazeon.com/sitemap-index.xml`
