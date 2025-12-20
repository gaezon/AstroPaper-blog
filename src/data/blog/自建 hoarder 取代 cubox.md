---
author: gaazeon
pubDatetime: 2024-06-08T17:21:00.000+08:00
modDatetime: 2025-12-15T00:00:00.000+08:00
title: 自建 Karakeep（原 Hoarder）剪藏服务取代 Cubox：解决隐私与成本问题
featured: false
draft: false
tags:
  - Karakeep
  - Hoarder
  - Cubox替代
  - 隐私保护
  - NAS
  - 数字囤积
  - 自建服务
  - selfhost
description: 详细教程：如何通过 Docker 自建开源的 Hoarder 剪藏服务来替代 Cubox，实现更好的隐私保护、完全数据控制和显著成本节约。包含完整的 Docker 安装配置步骤、数据迁移详细指南和深度使用对比分析，助你搭建功能完善的个人专属网页收藏和知识管理系统。
slug: hoarder-app-replace-cubox
---

## Table of contents

## 前言

> 2025-12-15 更新：Hoarder 项目已更名为 Karakeep（服务端），另外也有名为 Karakeeper 的第三方 iOS/Safari 客户端。本文已同步更新镜像名、配置示例，并补充一个容易踩坑的安全相关配置（`CRAWLER_ALLOWED_INTERNAL_HOSTNAMES`）。
>
> 在数字信息爆炸的时代，许多科技囤积症患者们都需要一个网页的剪藏服务。在此之前，我一直使用 Cubox 作为数字囤积的主要服务。然而，Cubox 的一些问题让我萌生了自建开源的 Hoarder 以取而代之的想法。

## 取代 cubox 想法的由来

- 隐私担忧

  Cubox 国内版有审查，某一次发现自己剪藏的文章，因为「不可抗力」的原因无法分享，同时思前想后发现剪藏这类服务还是存在自己 NAS 中自己保存一份比较安心

  ![censorship of Cubox](https://img.gaazeon.com/2024/06/202406081735586.avif)

- 价格原因

  Cubox 的免费版仅限量 200 个收藏，而 VIP 版则需要每年 ¥198。对于那些没有 NAS 的人来说，这个价格可能不算贵，但对于像我这样已经有 NAS 的人来说，自建服务显然更加经济实惠。毕竟，在这经济下行的年代，能省一分是一分

  ![price-of-cubox](https://img.gaazeon.com/2024/06/202406081735584.avif)

- 不需要过于花哨的内容

  一开始 cubox 作为剪藏产品还是比较简洁功能单一，随后不断加入一些花哨的功能，比如 Cubox 中的 AI 解读、标记功能对我来说并不适用。我已经有了 Readwise 作为阅读器，Cubox 对我而且其实只是作为一个「数字囤积爱好者的垃圾桶」，用来本地化存储一些网页，防止删库跑路。显然，稍后读、AI 解读对我而言稍显冗余，秉承「如无必要，勿增实体」的哲学，我早就想换掉 Cubox 了

## 自建安装步骤

> Karakeep（原 Hoarder）是一个开源项目，可以在 [GitHub](https://github.com/karakeep-app/karakeep) 上找到。官方也提供了 Hoarder → Karakeep 的迁移说明。具体 Linux 机器或群晖系统安装可以参考官方文档，或者参照 [NasDaddy](https://nasdaddy.com/how-to-install-hoarder-on-your-nas/#5-%E4%BD%BF%E7%94%A8) 的教程。

这边建议使用 Docker 进行安装
Docker Compose YAML 参考配置如下：

```yaml
version: "3.8"
services:
    image: ghcr.io/karakeep-app/karakeep:${KARAKEEP_VERSION:-release}
    image: ghcr.io/hoarder-app/hoarder-web:${HOARDER_VERSION:-release}
    restart: unless-stopped
    volumes:
      - data:/data
    ports:
      - 3000:3000 #修改成自己想要的端口
    env_file:
      - .env
      REDIS_HOST: redis
      BROWSER_WEB_URL: http://chrome:9222
      MEILI_ADDR: http://meilisearch:7700
      # CRAWLER_ALLOWED_INTERNAL_HOSTNAMES 用于允许访问解析到内网/回环/链路本地地址的域名。
      # 传入 "." 等于放行所有域名（有安全风险，见下方说明）。
      CRAWLER_ALLOWED_INTERNAL_HOSTNAMES: "."
      # OPENAI_API_KEY: ...
      - redis:/data
    image: gcr.io/zenika-hub/alpine-chrome:124
    image: gcr.io/zenika-hub/alpine-chrome:123
    restart: unless-stopped
    command:
      - --no-sandbox
      - --disable-gpu
      - --disable-dev-shm-usage
      - --remote-debugging-address=0.0.0.0
      - --remote-debugging-port=9222
      - --hide-scrollbars
    image: getmeili/meilisearch:v1.13.3
    image: getmeili/meilisearch:v1.6
    restart: unless-stopped
    env_file:
      - .env
    environment:
      MEILI_NO_ANALYTICS: "true"
    volumes:

volumes:
  meilisearch:
  data:
```

其中要说明的是 `.env` 环境变量，需要自己创建 `.env` 文件并在其中指定所需的环境变量。Docker Compose 不会自动创建这个文件。启动时，Docker Compose 会读取你提供的 .env 文件，并将其中的变量注入到相应的服务中，每次修改 `.env` 需要重构 Docker Compose

```plaintext
KARAKEEP_VERSION=release
NEXTAUTH_SECRET=xxxx # xxx为随机字符串
MEILI_MASTER_KEY=xxxx # xxx为随机字符串
NEXTAUTH_URL=http://localhost:3000 # 本地访问 Karakeep 的 url 或者反代之后的 url

## 下面为可选
OPENAI_BASE_URL=https://xxx.com/v1 # OpenAI api 官方端口或者第三方服务端口
OPENAI_API_KEY=sk-xxxxx # OpenAI API key
INFERENCE_LANG=chinese
INFERENCE_TEXT_MODEL=qwen2-72b-instruct #用于打标的模型，我自己用上最新的 qwen2-72b-instruct开源模型很香
```

## `CRAWLER_ALLOWED_INTERNAL_HOSTNAMES`（安全说明）

Karakeep 的 worker/crawler 会发起外部请求（抓取网页、RSS、Webhook 等）。从安全角度出发，Karakeep 默认会阻止「域名解析到内网/回环/链路本地 IP」的请求，避免 SSRF 类风险。

- **引入时间（安全收紧）**：在 `v0.28.0`（GitHub Release 显示为 Nov 9）中引入了更严格的 SSRF 防护（PR [#2082](https://github.com/karakeep-app/karakeep/pull/2082)）。该版本的 release notes 明确：所有 server 发起、指向内部 IP 的请求默认会被阻止，除非通过 `CRAWLER_ALLOWED_INTERNAL_HOSTNAMES` 显式 allowlist。
- **官方文档语义**：配置页说明该变量支持前导点通配（例如 `.local`、`.internal.company.com`），并且 **传入 `.` 会放行所有域名**；此外，若目标 URL 配置了代理（`CRAWLER_HTTP_PROXY/CRAWLER_HTTPS_PROXY`），内部 IP 校验会被绕过（因为实际 DNS 解析可能由代理侧完成）。
- **“`.` 放行全部”的能力**：在 `v0.29.0` 的 release notes 中明确提到：将 `CRAWLER_ALLOWED_INTERNAL_HOSTNAMES` 设为 `.` 可绕过所有域名的 IP 校验（对应修复提交 [67b8a3c](https://github.com/karakeep-app/karakeep/commit/67b8a3c141e537571c9cda58265b261ff35ed385)）。

但实际使用上，官方这个配置，不符合中国大陆特殊的环境，「透明代理 / Fake-IP DNS」一起出现：在中国大陆的网络环境中，跨境站点访问限制、DNS 污染/劫持等问题更常见，我们一般会使用代理软件做透明代理与分流，Fake-IP 也是常见配置之一。比如你启用了 OpenClash 的 Fake-IP，某些域名可能会被解析到私网地址，crawler 就会认为是「内部地址」从而拒绝抓取。

- **解决方法**：

docker-compose.yml 中添加

```yaml
# 👇 新增：允许爬虫访问解析为内网 IP 的域名（解决 OpenClash Fake-IP 问题）
CRAWLER_ALLOWED_INTERNAL_HOSTNAMES: "."
```

## Hoarder 的优点

### AI 智能打标

对于我这种只是用来囤积的人太有用了，不用每次想贴什么标签，但又能为自己囤积的网页做一定程度的分类管理

![AI-Mark-of-Hoard](https://img.gaazeon.com/2024/06/202406081735583.avif)

## Hoarder 有待改进的地方

### 私有格式存储

Hoarder 在本地存储的都是 `db` 结尾格式的特定数据库文件，貌似无法使用其他软件打开，如下图所示

![dbformat-of-Hoarder](https://img.gaazeon.com/2024/06/202406081735585.avif)

如果能采用通用格式比如保存成 `html` 或者直接截图一张 `png` 来存储快照个人觉得比较适合

### 某些网站无法抓取

Hoarder 貌似使用 Chrome 浏览器模拟人类访问，来存储网页快照的，这就带来一个问题，某些博客使用 cloudflare 的人机验证服务会把 Hoarder 拒之门外，比如抓取 [Sukka 大佬的博客](https://blog.skk.moe/post/what-happend-to-dns-in-proxy/) 如下图所示：

![cf-block-Hoarder-eg](https://img.gaazeon.com/2024/06/202406081735587.avif)

## 参考

1. [Karakeep | GitHub](https://github.com/karakeep-app/karakeep)
2. [Hoarder → Karakeep 迁移/更名说明（官方）](https://docs.karakeep.app/guides/hoarder-to-karakeep-migration/)
3. [Karakeep 配置文档：`CRAWLER_ALLOWED_INTERNAL_HOSTNAMES`（官方）](https://docs.karakeep.app/configuration/)
4. [Karakeep `v0.28.0` Release（SSRF 收紧 / PR #2082）](https://github.com/karakeep-app/karakeep/releases/tag/v0.28.0)
5. [Karakeep `v0.29.0` Release（支持 `CRAWLER_ALLOWED_INTERNAL_HOSTNAMES=.` 放行全部）](https://github.com/karakeep-app/karakeep/releases/tag/v0.29.0)
6. [Nas用户的完美本地运行的书签管理：如何搭建和使用 Hoarder（NasDaddy）](https://nasdaddy.com/how-to-install-hoarder-on-your-nas/#5-%E4%BD%BF%E7%94%A8)
