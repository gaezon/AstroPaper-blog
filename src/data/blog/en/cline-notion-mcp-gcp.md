---
author: Gaazeon
pubDatetime: 2025-04-10T15:32:00+08:00
modDatetime: 2025-04-10T15:38:00+08:00
title: "TODO: Translate — Cline + Notion MCP 用自然语言为 Notion 数据库增加记录 —— 以管理个人订阅服务
  notion 数据库为例"
featured: false
draft: true
tags:
  - Notion
  - MCP
  - 自动化
  - LLM
description: "TODO: Translate — 本文详细介绍如何通过 Cline 结合 Notion MCP，利用 OpenRouter 的
  quasar-alpha 模型，实现通过自然语言自动化为 Notion 数据库添加订阅记录，并为条目添加 SVG
  图标，增加美感，涵盖安装、授权、调用的完整流程。"
locale: en
originalTitle: Cline + Notion MCP 用自然语言为 Notion 数据库增加记录 —— 以管理个人订阅服务 notion 数据库为例
---

<!-- TODO: Translate body content below into English -->
## Table of contents

## 前言

本人一直使用 Notion 作为订阅服务的管理工具，但过去每次都需要手动添加、维护订阅记录，既繁琐又容易遗漏。

有了 **Notion MCP**，配合 **Cline** 和大语言模型（LLM），可以直接用自然语言对话的方式，快速为 Notion 数据库增添订阅记录，不仅效率大幅提升，还能实现更高级的自动化。

比如，自动为我预先制作好的个人订阅表格增加记录，同时联网搜索该品牌的 SVG 图标，并将其自动添加到 Notion 记录中。

## 准备工作

### 1. 安装 Cline

Cline 是一个强大的命令行助手，支持多模型、多工具调用。  
本文使用 Cursor 安装 Cline 插件。配置好对应的模型，本文使用的是 openrouter 提供的 `openrouter/quasar-alpha`

### 2. 安装 Notion MCP

MCP（Model Context Protocol）是一个插件框架，允许你通过自然语言调用各种API。  
**Notion MCP** 是2025年04月专门用于操作 Notion 的插件。

**其实，最简单的方式是：**

你只需要在 Cline 里直接和 LLM 对话，告诉它：

> 帮我安装 Notion MCP 插件

Cline 会自动调用模型，完成 MCP 的安装、配置和注册，  
无需你手动敲命令，整个过程非常智能、便捷。

**当然，如果你想手动操作，也可以按以下步骤(其中一种安装示例方法)：**

- 进入 MCP 插件目录（如 `/Users/你的用户名/Documents/Cline/MCP`）
- 运行命令：

```bash
npx @modelcontextprotocol/create-server notion-mcp-server
cd notion-mcp-server
pnpm install
pnpm build
```

- 在 Cline 的配置文件中，添加 MCP 服务器路径，解决需要配置 Notion 的访问密钥。

### 3. 创建并授权 Notion 集成

1. 登录 [Notion](https://www.notion.so/)，点击左下角头像，进入 **设置与成员**。
2. 选择“集成” → “开发者工具” → “新建集成”。
3. 填写名称（如“自动订阅管理”），选择工作区，勾选所需权限，生成 **内部集成密钥**。
4. 点击“显示”复制这串密钥，配置到 Cline 的环境变量中。

![Notion 集成密钥和权限设置示意图](https://img.gaazeon.com/2025/04/notion-integration-token-and-permissions.avif)
_图：Notion 集成密钥位置及权限勾选示意_

5. 打开你的订阅管理数据库页面，点击右上角“分享”，将刚创建的集成授权访问。
6. 复制数据库页面链接中的32位ID，作为后续操作的数据库ID。

示例链接：

```txt
https://www.notion.so/你的工作区/xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx?v=yyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyy
```

`xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx` 即为数据库ID。

## 实战演示：为 Notion 数据库添加订阅记录

在实际使用中，**你无需准备任何参数或写代码**，  
只需要直接和 Cline 里的 LLM 对话，告诉它你的需求即可。

比如，你可以对 LLM 说：

> 帮我在 Notion 的订阅数据库里添加一条记录，内容是  
> 新增加了 VPS 订阅，名称是 Google Cloud，标签是 VPS，到期时间是 2025年7月10日，备注是：时间91天300刀。

LLM 会自动理解你的意图，调用 Notion MCP，  
帮你完成这条订阅记录的添加。

![Cline 通过自然语言自动生成 Notion API 请求示意图](https://img.gaazeon.com/2025/04/cline-llm-generate-notion-api-request.avif)
_图：Cline 识别自然语言，自动构造 Notion API 请求的过程_

整个过程无需写任何 JSON 或命令，  
只用自然语言对话，简单又高效。

### 遇到的问题与解决

在实际使用中，如果你与 LLM 的对话提示比较粗糙，提示词不够精细可能，首次运行可能会有 API错误、参数格式，但解决方法只需要用自然语言告诉 LLM 你的更明确需求即可。

如果你发现 LLM **没有理解你的格式**，或者添加的内容不符合预期，  
通常是因为模型对你的描述理解不够。

**这时，你可以尝试：**

- **换用支持多模态的模型**，比如支持图文理解的模型
- 直接把你 Notion 数据库的截图、示例格式发给 LLM
- 这样，LLM 会自动理解你的格式和需求，生成更准确的内容

只要模型理解了你的格式，  
它就能帮你自动完成所有操作，无需你操心技术细节。

### 示例：为订阅条目自动添加 SVG 图标

在为订阅添加完记录后，你还想更加优化
你同样不用写任何代码或命令，  
只需要继续和 LLM 对话，说：

> 帮我给刚才的 Google Cloud 订阅加上品牌的 SVG 图标

这时，LLM 会自动调用 **Exa Search 的 MCP**，  
在互联网上搜索最合适的 SVG 图标链接，  
比如去 Wikipedia、品牌官网、图标库等地方找。

找到合适的图标后，  
LLM 会再调用 **Notion MCP**，  
把这个 SVG 图标自动设置到你刚才的订阅条目前面。

![Notion中为Google Cloud添加SVG图标教程截图](https://img.gaazeon.com/2025/04/notion-google-cloud-svg-icon-tutorial.avif) \*图：使用 Cline 为 Notion 中 为 Google Cloud 添加 Google Cloud SVG 图标

如果你觉得图标不合适，  
你也可以告诉它：

> 换一个更好看的 Google Cloud logo

LLM 会重新用 Exa MCP 搜索，替换成新的图标。

整个过程完全自然语言交互，  
背后其实是多个 MCP 协同工作，  
但你不用操心技术细节，  
只管用中文或英文告诉 LLM 你的需求即可。

![Notion 订阅数据库带品牌图标示意图](https://img.gaazeon.com/2025/04/notion-subscription-database-with-brand-logo.avif)
_图：自动化添加订阅记录后，Notion 数据库中展示的品牌logo效果，图中 Google Cloud 的记录使用调用 MCP 添加的_

## 总结

通过 Cline + Notion MCP，结合 LLM 的强大的多模态模型，  
你可以轻松实现：

- 自动化批量管理 Notion 数据库
- 精准控制字段内容
- 自动为条目添加品牌图标

## 参考

1. [Notion API Capabilities](https://developers.notion.com/reference/capabilities)
2. [Cline 项目 GitHub](https://github.com/cline/cline)
3. [OpenRouter 平台](https://openrouter.ai/)
