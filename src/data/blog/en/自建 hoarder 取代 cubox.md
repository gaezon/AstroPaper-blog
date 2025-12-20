---
author: gaazeon
pubDatetime: 2024-06-08T17:21:00.000+08:00
modDatetime: 2025-12-15T00:00:00.000+08:00
title: "Self‑Host Karakeep (formerly Hoarder) to Replace Cubox: Privacy, Data Control, and Cost Savings"
featured: false
draft: false
tags:
  - Karakeep
  - Hoarder
  - Cubox alternative
  - Privacy
  - NAS
  - Digital hoarding
  - Self‑host
description: "Self-host Hoarder web clipper as a privacy-focused Cubox alternative. Learn Docker setup, AI auto-tagging, and cost-saving benefits."
locale: en
originalTitle: 自建 Karakeep（原 Hoarder）剪藏服务取代 Cubox：解决隐私与成本问题
slug: self-host-hoarder-replace-cubox
---

## Table of contents

## Why leave Cubox

> Update (2025-12-15): Hoarder has been rebranded to **Karakeep** (server). There is also a third‑party iOS/Safari client called **Karakeeper**. This post updates the Docker image / compose example accordingly, and adds a note about a security‑related crawler setting (`CRAWLER_ALLOWED_INTERNAL_HOSTNAMES`).
>
> In an age of information overload, a good web clipper is a must for digital hoarders. I used Cubox for a long time, but several issues pushed me to self‑host Hoarder i nstead.

- **Privacy**: The mainland edition of Cubox applies content controls. Some clipped pages could not be shared due to “force majeure”. Keeping a local copy on my NAS is more trustworthy.

  ![censorship of Cubox](https://img.gaazeon.com/2024/06/202406081735586.avif)

- **Pricing**: The free tier is limited to 200 items; VIP costs ¥198/year. If you already have a NAS, self‑hosting is cheaper over time. In this economy, every cent saved counts.

  ![price-of-cubox](https://img.gaazeon.com/2024/06/202406081735584.avif)

- **No need for extra fluff**: Cubox kept adding features (AI summaries, highlighting, etc.) that I don't need. I use Readwise for reading—Cubox to me is just a "digital hoarder's junk drawer," a local archive in case the original source disappears overnight. Occam's Razor: don't multiply entities unnecessarily.

## Self-Hosting Installation Guide

> Karakeep (formerly Hoarder) is open-source and available on [GitHub](https://github.com/karakeep-app/karakeep). There is also an official Hoarder → Karakeep migration note. For Synology/NAS specific walkthroughs, you can also follow [NasDaddy](https://nasdaddy.com/how-to-install-hoarder-on-your-nas/#5-%E4%BD%BF%E7%94%A8).

I highly recommend using Docker for installation. Here's a reference Docker Compose YAML configuration:

```yaml
version: "3.8"
services:
  web:
    image: ghcr.io/karakeep-app/karakeep:${KARAKEEP_VERSION:-release}
    restart: unless-stopped
    volumes:
      - data:/data
    ports:
      - 3000:3000 # change to any port you prefer
    env_file:
      - .env
    environment:
      MEILI_ADDR: http://meilisearch:7700
      BROWSER_WEB_URL: http://chrome:9222
      DATA_DIR: /data # DON'T CHANGE THIS
      # Allowlist internal hostnames for the crawler (SSRF protection).
      # Passing "." allowlists all domains (use with care; see notes below).
      CRAWLER_ALLOWED_INTERNAL_HOSTNAMES: "."
      # OPENAI_API_KEY: ...
  chrome:
    image: gcr.io/zenika-hub/alpine-chrome:124
    restart: unless-stopped
    command:
      - --no-sandbox
      - --disable-gpu
      - --disable-dev-shm-usage
      - --remote-debugging-address=0.0.0.0
      - --remote-debugging-port=9222
      - --hide-scrollbars
  meilisearch:
    image: getmeili/meilisearch:v1.13.3
    restart: unless-stopped
    env_file:
      - .env
    environment:
      MEILI_NO_ANALYTICS: "true"
    volumes:
      - meilisearch:/meili_data

volumes:
  meilisearch:
  data:
```

Create a `.env` file yourself (compose won’t generate it) and restart the stack whenever you change values:

```plaintext
KARAKEEP_VERSION=release
NEXTAUTH_SECRET=xxxx # random string
MEILI_MASTER_KEY=xxxx # random string
NEXTAUTH_URL=http://localhost:3000 # local URL of Karakeep or your reverse-proxy URL

## Optional below
OPENAI_BASE_URL=https://xxx.com/v1 # OpenAI official endpoint or third-party compatible endpoint
OPENAI_API_KEY=sk-xxxxx # OpenAI API key
INFERENCE_LANG=chinese
INFERENCE_TEXT_MODEL=qwen2-72b-instruct # model used for auto-tagging; qwen2-72b-instruct works great in my setup
```

## `CRAWLER_ALLOWED_INTERNAL_HOSTNAMES` (Security note)

Karakeep’s crawler/worker makes outbound requests (crawling pages, fetching RSS, delivering webhooks, etc.). For safety, Karakeep blocks worker‑initiated requests where DNS resolves to private / loopback / link‑local IPs by default.

- **When it was introduced**: `v0.28.0` (release notes show Nov 9) shipped “Stricter URL validation to protect against SSRF attacks” (PR [#2082](https://github.com/karakeep-app/karakeep/pull/2082)). It also states that internal IP requests are blocked by default unless explicitly allowlisted via `CRAWLER_ALLOWED_INTERNAL_HOSTNAMES`.
- **Official semantics**: The configuration docs explain wildcard support (prefix a dot like `.local`), and explicitly say that passing `.` allowlists all domains. It also notes that internal IP validation is bypassed when a proxy is configured for the URL.
- **Bypass‑all shortcut**: `v0.29.0` release notes mention that you can bypass IP validation for all domains by setting `CRAWLER_ALLOWED_INTERNAL_HOSTNAMES` to `.` (see commit [67b8a3c](https://github.com/karakeep-app/karakeep/commit/67b8a3c141e537571c9cda58265b261ff35ed385)).

This setting often matters if you run DNS “fake‑IP” modes in transparent proxy setups. In mainland China, cross‑border connectivity restrictions and DNS interference (pollution/hijacking) are more commonly encountered, so transparent proxy + policy routing setups are widely used and fake‑IP is a common DNS mode. In these setups, some hostnames may resolve to private IPs and get blocked. Prefer a narrow allowlist (e.g. `.local` or your internal domain suffix) and only use `.` as a temporary troubleshooting switch.

## What I like

### AI‑assisted tagging

Great for hands‑off clipping—I don't need to agonize over which tags to apply, yet everything still ends up reasonably categorized for later search.

![AI-Mark-of-Hoard](https://img.gaazeon.com/2024/06/202406081735583.avif)

## What could be better

### Proprietary snapshot format

Snapshots are stored in `.db` files. I’d love an option to keep an `.html` snapshot or a `.png` image for maximal portability.

![dbformat-of-Hoarder](https://img.gaazeon.com/2024/06/202406081735585.avif)

### Some sites are hard to capture

Hoarder drives a headless Chrome to capture snapshots. Some blogs protected by Cloudflare's bot checks will block it—for example, [Sukka's blog](https://blog.skk.moe/post/what-happend-to-dns-in-proxy/) (a well-known developer in the Chinese tech community):

![cf-block-Hoarder-eg](https://img.gaazeon.com/2024/06/202406081735587.avif)

## References

1. [Karakeep on GitHub](https://github.com/karakeep-app/karakeep)
2. [Hoarder → Karakeep migration note (official)](https://docs.karakeep.app/guides/hoarder-to-karakeep-migration/)
3. [Karakeep configuration docs (official)](https://docs.karakeep.app/configuration/)
4. [Karakeep `v0.28.0` release (SSRF hardening / PR #2082)](https://github.com/karakeep-app/karakeep/releases/tag/v0.28.0)
5. [Karakeep `v0.29.0` release (`CRAWLER_ALLOWED_INTERNAL_HOSTNAMES=.` bypass)](https://github.com/karakeep-app/karakeep/releases/tag/v0.29.0)
6. [NasDaddy — how to run Hoarder on your NAS](https://nasdaddy.com/how-to-install-hoarder-on-your-nas/#5-%E4%BD%BF%E7%94%A8)
