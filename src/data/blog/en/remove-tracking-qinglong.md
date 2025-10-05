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
description: "How to prevent Qinglong from loading Sentry tracking JS by overriding the container entrypoint. Fixes constant DNS hits to o1098464.ingest.sentry.io seen in AdGuardHome and improves privacy."
locale: en
originalTitle: 修改 docker-compose 配置移除青龙面板 sentry.io 跟踪 js 代码
---

Qinglong embeds Sentry for error telemetry, which triggers constant requests to `o1098464.ingest.sentry.io`. Here’s a simple way to block that by replacing the container entrypoint with a tiny shell script that disables the Sentry loader.

## Table of contents

## Why

As of 2024‑09‑15 (Qinglong `2.17.11`), there’s no built‑in switch to opt out of Sentry. On my network, AdGuardHome’s blocklist spammed entries for `o1098464.ingest.sentry.io`, and the extra DNS traffic is unnecessary.

![adguardhome 拦截排名.avif](https://img.gaazeon.com/2024/09/202409151035933.avif)

GitHub issue 上有老哥给出了[解决方案](https://github.com/whyour/qinglong/issues/2001)，但是没有给出具体的操作步骤，本文将教你如何通过修改 docker-compose 配置和 sh 脚本，使用更优雅的方法在启动时阻止青龙面板发送跟踪请求。

## docker‑compose.yml changes

1) Create a `remove-tracking.sh` next to your `docker-compose.yml`:

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

2) Update your docker‑compose service with a custom `entrypoint`:

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
