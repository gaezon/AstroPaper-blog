# Ora / Agent Readiness 优化复盘

本文记录 2026-05 围绕 `blog.gaazeon.com` 做的一轮 Ora Agent Readiness 优化。它的目的不是继续追逐评分器，而是给后续维护提供上下文：哪些优化已经落地、它们对真实静态博客有什么意义、哪些方向已经不值得继续加复杂度。

## 当前结论

本站是静态个人技术博客，不是 SaaS、控制台、应用商店或交易系统。Agent readiness 的合理边界是：

- 让 agent 能发现公开内容。
- 让 agent 能读取 Markdown、RSS、sitemap、OpenAPI 和只读 JSON。
- 明确告诉 agent 不支持登录、支付、写入、webhook 注册、私有数据和实时流。
- 保持真实用户浏览体验不被 agent 评分优化拖累。

截至 2026-05-17，Ora 最新扫描仍为 `72 / 100`，B，Competitive。合并后的真实线上 MCP `initialize` 已经返回标准 `2025-03-26` `InitializeResult`，但 Ora 仍显示 `MCP manifest found ... protocol handshake failed`。这说明继续盲目堆 MCP Apps / NLWeb / SDK / CLI 很可能不符合本站真实目标。

## 最新 Ora 状态

2026-05-17 扫描结果：

- 总分：`72 / 100`
- Discovery：`8/20`
- Identity：`16/20`
- Auth & Access：`27/30`
- Agent Integration：`13/20`
- User Experience：`6/10`

Ora 仍报告的主要问题：

- `MCP manifest found at /.well-known/mcp.json but protocol handshake failed`
- `docs MCP found but connection failed - cannot test error handling`
- `docs MCP found but no tools available to evaluate`
- `MCP server found but connection failed - cannot list resources`
- `No NLWeb /ask endpoint found`
- `No Wikipedia article or Wikidata entity presence`
- `OpenAPI spec found but could not fully parse for detailed analysis`

其中 NLWeb、Wikipedia/Wikidata、SDK/CLI 这类方向不应作为静态个人博客的默认目标。

## 已落地优化总览

### 1. 公开发现入口

新增或补强的机器可读入口：

- `https://blog.gaazeon.com/llms.txt`
- `https://blog.gaazeon.com/llms-full.txt`
- `https://blog.gaazeon.com/agents.md`
- `https://blog.gaazeon.com/index.md`
- `https://blog.gaazeon.com/docs.md`
- `https://blog.gaazeon.com/webhooks.md`
- `https://blog.gaazeon.com/pricing.md`
- `https://blog.gaazeon.com/openapi.json`
- `https://blog.gaazeon.com/.well-known/api-catalog`
- `https://blog.gaazeon.com/.well-known/agent-card.json`
- `https://blog.gaazeon.com/.well-known/agent-skills`
- `https://blog.gaazeon.com/.well-known/ai-plugin.json`
- `https://blog.gaazeon.com/.well-known/mcp.json`
- `https://blog.gaazeon.com/.well-known/mcp/server-card.json`
- `https://blog.gaazeon.com/.well-known/mcp`

真实意义：

- `llms.txt` / `llms-full.txt` 给 LLM 一个低成本站点上下文。
- `agents.md` 给自动化 agent 明确行为边界。
- `index.md` 给首页一个显式 Markdown fallback。
- `openapi.json` 描述只读 JSON 和静态资源。
- `.well-known/*` 提供不同生态的服务发现兼容层。

### 2. Markdown 与内容协商

已支持：

- 首页通过 `Accept: text/markdown` 返回 Markdown 表示。
- `index.md` 作为显式 Markdown 入口。
- 响应包含 `Vary: Accept`，避免 HTML / Markdown 缓存混淆。

真实意义：

- 对会发送 `Accept` header 的 agent 有价值。
- 对普通用户无感。
- 比引入动态 API 更符合静态博客。

### 3. 只读 JSON API

新增或补强：

- `/api/posts.json`
- `/api/tags.json`
- `/api/posts/{locale}/{slug}.json`

相关实现：

- `src/utils/agent-api.ts`
- `src/schemas/post-summary.schema.json`
- `src/schemas/post-detail.schema.json`
- `src/schemas/tags.schema.json`
- `tests/unit/api-json-schema.spec.ts`
- `tests/unit/api-json-round-trip.spec.ts`
- `tests/unit/api-posts-bilingual-presence.spec.ts`

真实意义：

- 给 agent 一个稳定、结构化、低成本的文章读取入口。
- 比让 agent 抓 HTML 更可靠。
- 仍保持只读、公开、无认证。

### 4. JSON 错误与恢复路径

已落地：

- 不存在的 `/api/*` 路径返回 JSON 404，而不是 HTML 404。
- 错误响应包含 `documentation_url` 和 `availableResources`。
- OpenAPI 中声明 `404`、`429`、`500` 等响应。
- `agent-integration.md` 记录 fallback 策略。

相关文件：

- `src/schemas/error-envelope.schema.json`
- `src/utils/mcp.ts`
- `src/components/NotFoundPage.astro`
- `tests/unit/api-json-404.spec.ts`
- `tests/unit/error-envelope-builder.spec.ts`
- `tests/unit/validation-errors.spec.ts`

真实意义：

- 对 agent 排错有价值。
- 对真实用户没有负担。

### 5. OpenAPI 描述

`public/openapi.json` 已从基础静态描述扩展为覆盖：

- Markdown 静态资源。
- RSS / sitemap / API catalog。
- 只读 JSON endpoints。
- MCP discovery / JSON-RPC endpoint。
- 错误响应、rate limit 响应、schema 结构。
- 无认证、无写入、无私有资源。

局限：

- Ora 仍提示 `OpenAPI spec found but could not fully parse for detailed analysis`。
- 继续补 typed schema 可能加分，但维护成本会增加。
- 当前 OpenAPI 已足够表达「静态博客的只读资源」。

### 6. MCP 发现与只读工具

MCP 相关入口：

- `/.well-known/mcp.json`
- `/.well-known/mcp/server-card.json`
- `/.well-known/mcp`

已支持 JSON-RPC 方法：

- `initialize`
- `notifications/initialized`
- `resources/list`
- `resources/read`
- `tools/list`
- `tools/call`

已暴露只读工具：

- `get_agent_instructions`
- `get_agent_integration_guide`
- `get_developer_resource_docs`
- `get_webhook_alternatives`
- `get_markdown_index`
- `get_openapi_description`
- `get_pricing_access_model`

相关实现：

- `src/utils/agent-discovery.ts`
- `src/utils/mcp.ts`
- `src/utils/mcp-endpoint.ts`
- `src/pages/.well-known/mcp.ts`
- `src/pages/.well-known/mcp/server-card.json.ts`
- `scripts/apply-vercel-routes.ts`

真实意义：

- 对能够显式连接 MCP endpoint 的 agent 有意义。
- 对浏览器用户无意义。
- 目前保留是合理的，但不建议继续把博客改造成复杂 MCP 应用。

### 7. MCP Apps / UI resource

已增加：

- `ui://widget/resource-index.html`
- MIME：`text/html+skybridge`
- tool `_meta.openai/outputTemplate`
- tool `_meta.ui.resourceUri`
- tool output schema
- structured tool result

真实意义：

- 对支持 MCP Apps / OpenAI Apps SDK 风格 widget 的客户端有兼容价值。
- 对普通 agent 和普通用户意义有限。
- 这一层已足够，不建议继续扩展复杂交互。

### 8. 标准 MCP initialize 修复

最后一次 MCP 修复的核心是：

- `GET /.well-known/mcp` 继续返回 discovery JSON。
- `POST /.well-known/mcp` 的 `initialize` 返回标准 MCP `InitializeResult`。
- 默认协议版本：`2025-03-26`。
- legacy 协议版本：`2024-11-05`。
- `capabilities.tools` 和 `capabilities.resources` 改为对象，而不是布尔值。
- `notifications/initialized` 返回 `202` 且无 body。
- `GET` + `Accept: text/event-stream` 返回 `405`，表示不支持 server-initiated SSE。
- response header 带 `MCP-Protocol-Version: 2025-03-26`。

线上验证命令：

```bash
curl -i -X POST https://blog.gaazeon.com/.well-known/mcp \
  -H 'Content-Type: application/json' \
  -H 'Accept: application/json, text/event-stream' \
  -H 'MCP-Protocol-Version: 2025-03-26' \
  -d '{"jsonrpc":"2.0","id":1,"method":"initialize","params":{"protocolVersion":"2025-03-26","capabilities":{},"clientInfo":{"name":"probe","version":"1"}}}'
```

期望关键字段：

```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "result": {
    "protocolVersion": "2025-03-26",
    "capabilities": {
      "tools": {},
      "resources": {}
    }
  }
}
```

### 9. Vercel 路由与生成函数

`scripts/apply-vercel-routes.ts` 负责在构建后修补 `.vercel/output/config.json` 和生成 MCP function。

关键目标：

- `/.well-known/mcp` 和 `/.well-known/mcp/` 都能命中 MCP handler。
- `.well-known` catch-all 不遮蔽 MCP endpoint。
- localized 404 和 security headers 不破坏 agent endpoints。
- Vercel prebuilt 输出和源码 handler 行为一致。

相关测试：

- `tests/unit/vercel-localized-404-routes.spec.ts`
- `tests/unit/vercel-output-path-allowlist.spec.ts`

### 10. 结构化数据与可访问性

落地过的增强包括：

- `BlogPosting` JSON-LD。
- breadcrumb JSON-LD。
- `main` landmark。
- `mainEntity`。
- localized 404。
- tag / post pages 的结构化信息。

相关文件：

- `src/utils/breadcrumbs.ts`
- `src/layouts/Layout.astro`
- `src/layouts/PostDetails.astro`
- `src/components/NotFoundPage.astro`
- `src/components/TagsPage.astro`
- `src/components/TagPostsPage.astro`

真实意义：

- 这类优化对真实用户、搜索引擎和 agent 都比较健康。
- 后续可以正常维护。

### 11. Webhook 替代说明

新增：

- `public/webhooks.md`
- `/webhooks/`
- `/en/webhooks/`

核心立场：

- 本站不提供 webhook、事件订阅、回调注册或写入 API。
- 增量更新应使用 RSS、sitemap、公开 JSON 索引。

真实意义：

- 这是防御性文档，能减少 agent 误判。
- 比为了评分做假 webhook 更健康。

## 相关 PR / commit 时间线

| Commit    | PR   | 主题                                  | 要点                                                                                                              |
| --------- | ---- | ------------------------------------- | ----------------------------------------------------------------------------------------------------------------- |
| `8946e4e` | #105 | Improve agent readiness discovery     | 增加 `llms.txt`、`llms-full.txt`、`agents.md`、OpenAPI、agent skills、API catalog、privacy、robots 与基础路由修补 |
| `c7f10fe` | #107 | Improve Ora agent readiness discovery | 增加 MCP manifest、agent integration、API error 示例、server card 与 OpenAPI 补强                                 |
| `12b6943` | #108 | Agent readiness optimization          | 增加只读 JSON API、schema、MCP live endpoint、结构化数据、localized 404、测试矩阵                                 |
| `821afd6` | #109 | Restore extensionless MCP route       | 修复 `/.well-known/mcp` 被路由遮蔽的问题，抽出 `mcp-endpoint`                                                     |
| `5f5ae7a` | #110 | Expose read-only MCP tools            | 增加 MCP resources/tools/list/call，集中 `agent-discovery`                                                        |
| `d982852` | main | Static agent resource docs            | 增加 `docs.md`、`webhooks.md`、中英文页面和发现文档联动                                                           |
| `cdbb268` | #112 | Expose MCP Apps resource widget       | 增加 `ui://widget/resource-index.html`、tool `_meta`、structured content                                          |
| `95cdbd4` | #113 | Standard MCP initialize result        | 修复 `initialize` 为标准 MCP `InitializeResult`，声明 Streamable HTTP                                             |

## 当前最有价值的入口清单

后续排查或向 agent 说明时，优先给这些 URL：

```text
https://blog.gaazeon.com/llms.txt
https://blog.gaazeon.com/llms-full.txt
https://blog.gaazeon.com/agents.md
https://blog.gaazeon.com/agent-integration.md
https://blog.gaazeon.com/docs.md
https://blog.gaazeon.com/webhooks.md
https://blog.gaazeon.com/index.md
https://blog.gaazeon.com/openapi.json
https://blog.gaazeon.com/sitemap-index.xml
https://blog.gaazeon.com/rss.xml
https://blog.gaazeon.com/rss.en.xml
https://blog.gaazeon.com/api/posts.json
https://blog.gaazeon.com/api/tags.json
https://blog.gaazeon.com/.well-known/api-catalog
https://blog.gaazeon.com/.well-known/mcp.json
https://blog.gaazeon.com/.well-known/mcp
https://blog.gaazeon.com/.well-known/mcp/server-card.json
https://blog.gaazeon.com/.well-known/ai-plugin.json
```

## 常用验证命令

### 构建与质量检查

```bash
fnm exec --using 24 pnpm lint
fnm exec --using 24 pnpm build
```

### MCP 相关单元测试

```bash
fnm exec --using 24 pnpm exec vitest run \
  tests/unit/mcp-live-endpoint.spec.ts \
  tests/unit/mcp-handshake-builder.spec.ts \
  tests/unit/mcp-well-known-json.spec.ts \
  tests/unit/mcp-streaming-posture.spec.ts \
  tests/unit/vercel-localized-404-routes.spec.ts \
  tests/unit/agent-docs-discovery.spec.ts
```

### 线上 MCP initialize 探针

```bash
curl -i -X POST https://blog.gaazeon.com/.well-known/mcp \
  -H 'Content-Type: application/json' \
  -H 'Accept: application/json, text/event-stream' \
  -H 'MCP-Protocol-Version: 2025-03-26' \
  -d '{"jsonrpc":"2.0","id":1,"method":"initialize","params":{"protocolVersion":"2025-03-26","capabilities":{},"clientInfo":{"name":"probe","version":"1"}}}'
```

### 线上 MCP resources/list 探针

```bash
curl -i -X POST https://blog.gaazeon.com/.well-known/mcp \
  -H 'Content-Type: application/json' \
  -H 'Accept: application/json, text/event-stream' \
  -H 'MCP-Protocol-Version: 2025-03-26' \
  -d '{"jsonrpc":"2.0","id":2,"method":"resources/list"}'
```

### 线上 manifest 探针

```bash
curl -i https://blog.gaazeon.com/.well-known/mcp.json
curl -i https://blog.gaazeon.com/.well-known/mcp/server-card.json
curl -i https://blog.gaazeon.com/.well-known/ai-plugin.json
curl -i https://blog.gaazeon.com/openapi.json
```

## 哪些优化值得保留

值得长期保留：

- RSS / sitemap。
- `llms.txt` / `llms-full.txt`。
- `agents.md`。
- Markdown content negotiation。
- OpenAPI。
- 只读 JSON endpoints。
- JSON error envelope。
- `docs.md` / `webhooks.md`。
- 基础 MCP discovery / tools。
- Vercel route regression tests。
- 结构化数据和 accessibility 相关改动。

这些都符合静态博客的真实用途。

## 哪些方向不建议继续做

不建议为了 Ora 继续推进：

- NLWeb `/ask` endpoint。
- 伪造 SDK / CLI 包。
- 为了评分创建 Wikipedia / Wikidata。
- 账号、OAuth、API key、支付、结账、私有资源。
- webhook 注册、事件回调、写入 API。
- 复杂 MCP Apps UI 或交互式 widget。
- agentic commerce。

原因：

- 会让静态博客承担不真实的产品语义。
- 会增加长期维护成本。
- 对真实读者几乎无价值。
- 也不一定能让 Ora 识别成功。

## 如果以后一定要继续排查 Ora MCP

只建议按「反向复现」方式做，不要先改代码。

优先步骤：

1. 用 Ora API 显式传 `mcpUrl`，隔离 domain discovery 和 MCP 连接问题。
2. 用官方 MCP TypeScript SDK 连接 `https://blog.gaazeon.com/.well-known/mcp`。
3. 对比 Ora 自己示例 MCP server 和本站 MCP server 的 `initialize`、`tools/list`、`resources/list` raw response。
4. 如果 SDK 成功但 Ora 失败，优先怀疑 Ora 探测器兼容问题，而不是本站功能缺失。
5. 只有在真实 MCP client 需要时，才考虑扩展 `capabilities.extensions` 或新增 `text/html;profile=mcp-app` 兼容 MIME。

参考资料：

- MCP Streamable HTTP transport：<https://modelcontextprotocol.io/specification/2025-03-26/basic/transports>
- MCP lifecycle / initialize：<https://modelcontextprotocol.io/specification/2025-03-26/basic/lifecycle>
- MCP extensions overview：<https://modelcontextprotocol.io/extensions>
- OpenAI GPT Actions / plugin manifest：<https://platform.openai.com/docs/plugins/>
- Ora docs：<https://ora.ai/docs>

## 维护原则

后续维护时建议坚持：

- 先问「这对真实读者或真实 agent 是否有用」。
- 能静态解决就不要动态化。
- 能只读就不要引入写入。
- 能用 RSS、sitemap、Markdown、JSON 解决，就不要引入复杂协议。
- 所有 agent-facing 入口都必须明确 unsupported workflows。
- 每次改 `.well-known` 或 Vercel routes，都要跑 MCP 和 route regression tests。

当前状态可以视为一轮合理收尾：本站已经具备较完整的静态 agent discovery 能力，不需要继续为了评分器牺牲博客的简单性。
