---
layout: ../layouts/AboutLayout.astro
title: "Webhook 与增量更新"
description: "Gaazeon 博客不提供 webhook。本文说明静态博客的 RSS、站点地图和公开 JSON 替代方案，供 agents 和开发者工具做增量发现。"
---

Gaazeon 博客是静态技术博客，不提供 webhook、事件订阅、回调注册或写入 API。

## 不提供 Webhook 的原因

本站没有用户账号、应用安装、私有资源或事件流。公开内容通过静态 HTML、Markdown、RSS、sitemap 和只读 JSON 索引发布，因此没有需要第三方注册 webhook 的服务端状态。

## 推荐替代方案

- 中文 RSS：[rss.xml](/rss.xml)
- 英文 RSS：[rss.en.xml](/rss.en.xml)
- 站点地图：[sitemap-index.xml](/sitemap-index.xml)
- 全部文章 JSON：`/api/posts.json`
- 全部标签 JSON：`/api/tags.json`
- Markdown 索引：[index.md](/index.md)
- 完整 LLM 上下文：[llms-full.txt](/llms-full.txt)

## Agent 行为建议

1. 使用 RSS 发现新增文章。
2. 使用 sitemap 校验 canonical URL。
3. 使用 `/api/posts.json` 和 `/api/tags.json` 获取结构化索引。
4. 尊重 HTTP 缓存，不要高频全站抓取。
5. 不要尝试创建 webhook、订阅事件或写入内容。

## 错误语义

请求不存在的 webhook 或 mutation 路径时，应视为不支持的工作流。请回退到 RSS、sitemap 和公开 JSON 索引，而不是继续探测私有 API。
