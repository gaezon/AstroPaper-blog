---
author: gaazeon
pubDatetime: 2024-09-15T10:06:57.000+08:00
modDatetime: 2024-09-15T10:06:57.000+08:00
title: "Remove sentry.io tracking code from Qinglong (via docker‑compose + startup script)"
featured: false
draft: false
tags:
  - docker-compose
  - Qinglong
  - Privacy
description: "Shows how to strip Qinglong's sentry.io tracking by overriding the Docker entrypoint with a small script, stopping outbound telemetry without breaking updates."
locale: en
originalTitle: 修改 docker-compose 配置移除青龙面板 sentry.io 跟踪 js 代码
---

Qinglong embeds Sentry for error telemetry, which triggers constant requests to `o1098464.ingest.sentry.io`. Here’s a simple way to block that by replacing the container entrypoint with a tiny shell script that disables the Sentry loader.

## Table of contents

## Why

As of 2024‑09‑15 (Qinglong `2.17.11`), there’s no built‑in switch to opt out of Sentry. On my network, AdGuardHome’s blocklist spammed entries for `o1098464.ingest.sentry.io`, and the extra DNS traffic is unnecessary.

![AdGuardHome blocked requests ranking](https://img.gaazeon.com/2024/09/202409151035933.avif)

A solution was mentioned in a GitHub issue, but without concrete steps. This post walks through a cleaner approach: tweak `docker-compose` and use a small shell script so Qinglong stops sending Sentry tracking requests at startup.

## docker‑compose.yml changes

1. Create a `remove-tracking.sh` next to your `docker-compose.yml`:

```sh
#!/bin/sh

# If already patched, run the original entrypoint
if grep -q "return;" /ql/static/build/loaders/sentry.js; then
    echo "File already modified, starting normally"
    exec ./docker/docker-entrypoint.sh
else
    echo "File not modified, applying changes and restarting"
    sed -i '/Sentry\.init/ s/^/return;/' /ql/static/build/loaders/sentry.js

    # Get current container ID
    CONTAINER_ID=$(cat /proc/self/cgroup | grep "docker" | sed 's/^.*\///' | tail -n 1)

    # Restart container so the patched JS is picked up
    docker restart $CONTAINER_ID

    # Exit so Docker restarts us
    exit 0
fi
```

2. Update your docker‑compose service with a custom `entrypoint`:

```yml
version: "3"

services:
  web:
    image: whyour/qinglong:latest
    volumes:
      - ./ql/data:/ql/data
      - ./remove-tracking.sh:/ql/remove-tracking.sh
    ports:
      - "5700:5700"
    restart: unless-stopped
    entrypoint: ["/bin/sh", "/remove-tracking.sh"]
```

After `docker-compose up -d`, Qinglong will stop sending Sentry telemetry.

## Reference

1. [GitHub — “一直在发送dns请求” · Issue #2001](https://github.com/whyour/qinglong/issues/2001)
