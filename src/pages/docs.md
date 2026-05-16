---
layout: ../layouts/AboutLayout.astro
title: "Agent 与开发者资源"
description: "Gaazeon 博客面向 AI agents、爬虫和开发者工具的公开静态资源索引。说明真实可用的 RSS、站点地图、Markdown、OpenAPI、MCP 和只读 JSON 入口。"
---

这个页面是 Gaazeon 博客的公开资源索引，面向 AI agents、爬虫、搜索系统和开发者工具。本站是静态技术博客，不是 SaaS 控制台，也不提供写入 API。

## 内容发现

- 首页：[https://blog.gaazeon.com/](/)
- 中文文章列表：[中文 posts](/posts/)
- 英文文章列表：[English posts](/en/posts/)
- 标签：[Tags](/tags/)
- 归档：[Archives](/archives/)
- 搜索：[Search](/search/)
- 站点地图：[sitemap-index.xml](/sitemap-index.xml)
- 中文 RSS：[rss.xml](/rss.xml)
- 英文 RSS：[rss.en.xml](/rss.en.xml)

## Agent 入口

- 紧凑 LLM 概览：[llms.txt](/llms.txt)
- 完整 LLM 上下文：[llms-full.txt](/llms-full.txt)
- Agent 指令：[agents.md](/agents.md)
- Agent 集成指南：[agent-integration.md](/agent-integration.md)
- Markdown 主页索引：[index.md](/index.md)
- OpenAPI 描述：[openapi.json](/openapi.json)
- API catalog：[/.well-known/api-catalog](/.well-known/api-catalog)
- A2A agent card：[/.well-known/agent-card.json](/.well-known/agent-card.json)
- MCP discovery：[/.well-known/mcp](/.well-known/mcp)
- MCP server card：[/.well-known/mcp/server-card.json](/.well-known/mcp/server-card.json)
- OpenAI plugin manifest：[/.well-known/ai-plugin.json](/.well-known/ai-plugin.json)

## 只读 JSON 入口

- 全部文章索引：`/api/posts.json`
- 全部标签索引：`/api/tags.json`
- 单篇文章 JSON：`/api/posts/{locale}/{slug}.json`

支持的 `locale` 是 `zh-CN` 和 `en`。这些 JSON 入口只用于读取公开内容，不需要 OAuth、API key 或用户会话。

## 错误恢复

如果 agent 请求了不存在的 `/api/*` 路径，本站会返回 JSON 404，并提供 canonical 发现入口。推荐恢复顺序：

1. 重试文档中列出的 canonical URL。
2. 如果是文章页面，优先使用站点地图里的 trailing slash URL。
3. 回退到 [llms-full.txt](/llms-full.txt)、[index.md](/index.md)、RSS 和 sitemap。
4. 不要尝试登录、结账、写入、webhook 注册或私有数据访问。

## 不支持的工作流

本站不提供用户账号、OAuth、API key、付费套餐、结账流程、写入 API、webhook、订阅回调或私有资源。需要增量更新时，请使用 RSS、sitemap 和公开 JSON 索引。
