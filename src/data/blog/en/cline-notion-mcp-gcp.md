---
author: Gaazeon
pubDatetime: 2025-04-10T15:32:00+08:00
modDatetime: 2025-04-10T15:38:00+08:00
title: "Cline + Notion MCP: add Notion database rows by talking to your AI (subscription DB example)"
featured: false
draft: false
tags:
  - Notion
  - MCP
  - Automation
  - LLM
description: "Show Cline working with Notion MCP to add subscription database rows from natural language, with setup steps, required permissions and prompt examples."
locale: en
originalTitle: Cline + Notion MCP 用自然语言为 Notion 数据库增加记录 —— 以管理个人订阅服务 notion 数据库为例
---

## Table of contents

## Why this is useful

I manage my subscriptions in a Notion database. Adding rows by hand is tedious and error‑prone. With **Notion MCP** + **Cline** + an **LLM**, I can just describe what I want and let the tools do the rest. It can even fetch an SVG brand logo and set it as the page icon automatically.

## Setup

### 1) Install Cline

Install the Cline extension (e.g., in Cursor) and configure a model. I used OpenRouter’s `openrouter/quasar-alpha` in my tests, but any capable model works.

### 2) Install the Notion MCP

MCP (Model Context Protocol) is a plugin framework for tool access via natural language. **Notion MCP** (Apr‑2025) exposes Notion operations. The easiest way:

> In Cline, tell the model: “Install the Notion MCP plugin for me.”

Cline will generate the steps, install and register the server for you. If you prefer manual steps, you can scaffold and build a server with:

```bash
npx @modelcontextprotocol/create-server notion-mcp-server
cd notion-mcp-server
pnpm install
pnpm build
```

Then point Cline to the server path and configure your Notion token.

### 3) Create a Notion integration and grant access

1. In [Notion](https://www.notion.so/) → Settings & members → Developers → New integration.
2. Name it (e.g., “Subscription automation”), select workspace, grant required capabilities and copy the internal token.
3. Put this token in Cline’s environment.
4. On your subscription DB page, Share → invite the integration.
5. Copy the 32‑char database ID from the page URL.

![Notion integration token and permissions](https://img.gaazeon.com/2025/04/notion-integration-token-and-permissions.avif)

## Add a subscription row by talking

In Cline, simply say:

> Add a row to my Notion Subscription DB: name “Google Cloud”, tag “VPS”, due date 2025‑07‑10, note “91 days · $300”.

The model will plan the steps and call **Notion MCP** to create the row. No JSON crafting needed.

![Cline generating Notion API calls](https://img.gaazeon.com/2025/04/cline-llm-generate-notion-api-request.avif)

### Make it robust

If the first attempt fails (bad field names, wrong types), clarify the schema in natural language or paste a screenshot of your Notion DB. A multimodal model will map your fields correctly and retry with a valid request.

### Auto‑attach an SVG brand icon

Ask:

> Find an SVG brand logo for Google Cloud and set it as the page icon we just created.

The model can call **Exa Search MCP** to find an SVG on Wikipedia/official sites, then call **Notion MCP** again to set the page icon.

![Add Google Cloud SVG icon in Notion](https://img.gaazeon.com/2025/04/notion-google-cloud-svg-icon-tutorial.avif)

If you don’t like the result, ask for another logo. The model will search again and replace it.

## Summary

With Cline + Notion MCP + a decent LLM you can:

- Automate adding rows to Notion databases
- Control field values precisely via natural language
- Auto‑attach brand icons for a clean catalog look

## References

1. [Notion API Capabilities](https://developers.notion.com/reference/capabilities)
2. [Cline on GitHub](https://github.com/cline/cline)
3. [OpenRouter](https://openrouter.ai/)
