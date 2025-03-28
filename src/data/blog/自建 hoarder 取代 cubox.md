---
author: gaazeon
pubDatetime: 2024-06-08T17:21:00.000+08:00
modDatetime: 2024-06-08T17:21:00.000+08:00
title: 自建 Hoarder 剪藏服务取代 Cubox：解决隐私与成本问题
featured: false
draft: false
tags:
  - Hoarder
  - Cubox替代
  - 隐私保护
  - NAS
  - 数字囤积
  - 自建服务
  - selfhost
description: 了解如何通过自建 Hoarder 剪藏服务来替代 Cubox，提高隐私保护并降低成本
slug: hoarder-app-replace-cubox
---

## Table of contents

## 前言

> 在数字信息爆炸的时代，许多科技囤积症患者们都需要一个网页的剪藏服务。在此之前，我一直使用 Cubox 作为数字囤积的主要服务。然而，Cubox 的一些问题让我萌生了自建开源的 Hoarder 以取而代之的想法。

## 取代 cubox 想法的由来

- 隐私担忧

  Cubox 国内版有审查，某一次发现自己剪藏的文章，因为「不可抗力」的原因无法分享，同时思前想后发现剪藏这类服务还是存在自己 NAS 中自己保存一份比较安心

  ![censorship of Cubox](https://img.gaazeon.com/2024/06/202406081735586.avif)

- 价格原因

  Cubox 的免费版仅限量 200 个收藏，而 VIP 版则需要每年 ¥198。对于那些没有 NAS 的人来说，这个价格可能不算贵，但对于像我这样已经有 NAS 的人来说，自建服务显然更加经济实惠。毕竟，在这经济下行的年代，能省一分是一分

  ![price-of-cubox](https://img.gaazeon.com/2024/06/202406081735584.avif)

- 不需要过于花哨的内容

  一开始 cubox 作为剪藏产品还是比较简洁功能单一，随后不断加入一些花哨的功能，比如 Cubox 中的 AI 解读、标记功能对我来说并不适用。我已经有了 Readwise 作为阅读器，Cubox 对我而且其实只是作为一个“数字囤积爱好者的垃圾桶”，用来本地化存储一些网页，防止删库跑路。显然，稍后读、AI 解读对我而言稍显冗余，秉承「如无必要，勿增实体」的哲学，我早就想换掉 Cubox 了

## 自建安装步骤

> Hoarder 是一个开源项目，可以在 [GitHub](https://github.com/hoarder-app/hoarder) 上找到，具体 Linux 机器或群晖系统安装可以参考，官方文档或者参照 [NasDaddy](https://nasdaddy.com/how-to-install-hoarder-on-your-nas/#5-%E4%BD%BF%E7%94%A8) 的教程。

这边建议使用 Docker 进行安装
Docker Compose YAML 参考配置如下：

```yaml
version: "3.8"
services:
  web:
    image: ghcr.io/hoarder-app/hoarder-web:${HOARDER_VERSION:-release}
    restart: unless-stopped
    volumes:
      - data:/data
    ports:
      - 3000:3000 #修改成自己想要的端口
    env_file:
      - .env
    environment:
      REDIS_HOST: redis
      MEILI_ADDR: http://meilisearch:7700
      DATA_DIR: /data
  redis:
    image: redis:7.2-alpine
    restart: unless-stopped
    volumes:
      - redis:/data
  chrome:
    image: gcr.io/zenika-hub/alpine-chrome:123
    restart: unless-stopped
    command:
      - --no-sandbox
      - --disable-gpu
      - --disable-dev-shm-usage
      - --remote-debugging-address=0.0.0.0
      - --remote-debugging-port=9222
      - --hide-scrollbars
  meilisearch:
    image: getmeili/meilisearch:v1.6
    restart: unless-stopped
    env_file:
      - .env
    environment:
      MEILI_NO_ANALYTICS: "true"
    volumes:
      - meilisearch:/meili_data
  workers:
    image: ghcr.io/hoarder-app/hoarder-workers:${HOARDER_VERSION:-release}
    restart: unless-stopped
    volumes:
      - data:/data
    env_file:
      - .env
    environment:
      REDIS_HOST: redis
      MEILI_ADDR: http://meilisearch:7700
      BROWSER_WEB_URL: http://chrome:9222
      DATA_DIR: /data
      # OPENAI_API_KEY: ...
    depends_on:
      web:
        condition: service_started

volumes:
  redis:
  meilisearch:
  data:
```

其中要说明的是 `.env` 环境变量，需要自己创建 `.env` 文件并在其中指定所需的环境变量。Docker Compose 不会自动创建这个文件。启动时，Docker Compose 会读取你提供的 .env 文件，并将其中的变量注入到相应的服务中，每次修改 `.env` 需要重构 Docker Compose

```.env
HOARDER_VERSION=release
NEXTAUTH_SECRET=xxxx # xxx为随机字符串
MEILI_MASTER_KEY=xxxx # xxx为随机字符串
NEXTAUTH_URL=http://localhost:3000 # 本地访问 hoarder 的 url 或者反代之后的 url

## 下面为可选
OPENAI_BASE_URL=https://xxx.com/v1 # OpenAI api 官方端口或者第三方服务端口
OPENAI_API_KEY=sk-xxxxx # OpenAI API key
INFERENCE_LANG=chinese
INFERENCE_TEXT_MODEL=qwen2-72b-instruct #用于打标的模型，我自己用上最新的 qwen2-72b-instruct开源模型很香
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

1. [Hoarder-app/ hoarder| GitHub](https://github.com/hoarder-app/hoarder)
2. [Nas用户的完美本地运行的书签管理 一站式信息管理：如何搭建和使用Hoarder 管理你的数字信息？| NasDaddy](https://nasdaddy.com/how-to-install-hoarder-on-your-nas/#5-%E4%BD%BF%E7%94%A8)
