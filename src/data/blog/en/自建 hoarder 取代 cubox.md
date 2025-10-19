---
author: gaazeon
pubDatetime: 2024-06-08T17:21:00.000+08:00
modDatetime: 2024-06-08T17:21:00.000+08:00
title: "Self‑Host Hoarder to Replace Cubox: Enhanced Privacy, Data Control and Cost Savings"
featured: false
draft: false
tags:
  - Hoarder
  - Cubox alternative
  - Privacy
  - NAS
  - Digital hoarding
  - Self‑host
description: "Self-host Hoarder web clipper as a privacy-focused Cubox alternative. Learn Docker setup, AI auto-tagging, and cost-saving benefits."
locale: en
originalTitle: 自建 Hoarder 剪藏服务取代 Cubox：解决隐私与成本问题
slug: self-host-hoarder-replace-cubox
---

## Table of contents

## Why leave Cubox

> In an age of information overload, a good web clipper is a must for digital hoarders. I used Cubox for a long time, but several issues pushed me to self‑host Hoarder instead.

- **Privacy**: The mainland edition of Cubox applies content controls. Some clipped pages could not be shared due to “force majeure”. Keeping a local copy on my NAS is more trustworthy.

  ![censorship of Cubox](https://img.gaazeon.com/2024/06/202406081735586.avif)

- **Pricing**: The free tier is limited to 200 items; VIP costs ¥198/year. If you already have a NAS, self‑hosting is cheaper over time.

  ![price-of-cubox](https://img.gaazeon.com/2024/06/202406081735584.avif)

- **No need for extra fluff**: Cubox kept adding features (AI summaries, etc.) that I don’t need. I use Readwise for reading; I want a reliable “cold storage” for web pages.

## Self-Hosting Installation Guide

> Hoarder is an open-source project available on [GitHub](https://github.com/hoarder-app/hoarder). For detailed installation instructions on Linux machines or Synology systems, consult the official documentation or follow the comprehensive tutorial from [NasDaddy](https://nasdaddy.com/how-to-install-hoarder-on-your-nas/#5-%E4%BD%BF%E7%94%A8).

I highly recommend using Docker for installation. Here's a reference Docker Compose YAML configuration:

```yaml
version: "3.8"
services:
  web:
    image: ghcr.io/hoarder-app/hoarder-web:${HOARDER_VERSION:-release}
    restart: unless-stopped
    volumes:
      - data:/data
    ports:
      - 3000:3000 # change to any port you prefer
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

Create a `.env` file yourself (compose won’t generate it) and restart the stack whenever you change values:

```plaintext
HOARDER_VERSION=release
NEXTAUTH_SECRET=xxxx # random string
MEILI_MASTER_KEY=xxxx # random string
NEXTAUTH_URL=http://localhost:3000 # local URL of Hoarder or your reverse-proxy URL

## Optional below
OPENAI_BASE_URL=https://xxx.com/v1 # OpenAI official endpoint or third-party compatible endpoint
OPENAI_API_KEY=sk-xxxxx # OpenAI API key
INFERENCE_LANG=chinese
INFERENCE_TEXT_MODEL=qwen2-72b-instruct # model used for auto-tagging; qwen2-72b-instruct works great in my setup
```

## What I like

### AI‑assisted tagging

Great for hands‑off clipping — I don’t need to decide tags each time, but still get useful categorization for later search.

![AI-Mark-of-Hoard](https://img.gaazeon.com/2024/06/202406081735583.avif)

## What could be better

### Proprietary snapshot format

Snapshots are stored in `.db` files. I’d love an option to keep an `.html` snapshot or a `.png` image for maximal portability.

![dbformat-of-Hoarder](https://img.gaazeon.com/2024/06/202406081735585.avif)

### Some sites are hard to capture

Hoarder drives a headless Chrome to capture snapshots. Some blogs behind Cloudflare’s bot checks may block it (e.g. [Sukka’s post](https://blog.skk.moe/post/what-happend-to-dns-in-proxy/)):

![cf-block-Hoarder-eg](https://img.gaazeon.com/2024/06/202406081735587.avif)

## References

1. [Hoarder on GitHub](https://github.com/hoarder-app/hoarder)
2. [NasDaddy — how to run Hoarder on your NAS](https://nasdaddy.com/how-to-install-hoarder-on-your-nas/#5-%E4%BD%BF%E7%94%A8)
