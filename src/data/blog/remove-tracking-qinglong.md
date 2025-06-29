---
author: gaazeon
pubDatetime: 2024-09-15T10:06:57.000+08:00
modDatetime: 2024-09-15T10:06:57.000+08:00
title: 修改 docker-compose 配置移除青龙面板 sentry.io 跟踪 js 代码
featured: false
draft: false
tags:
  - docker-compose
  - 青龙面板
description: 详细教程：如何通过修改 docker-compose 配置文件和自定义脚本，彻底移除青龙面板中的 sentry.io 跟踪 JavaScript 代码。解决 AdGuardHome 频繁拦截 o1098464.ingest.sentry.io 域名的问题，提升系统运行效率和隐私保护。
slug: remove-tracking-qinglong
---

 修改 docker-compose 配置以移除青龙面板的 sentry.io 跟踪 JS 代码。青龙面板有跟踪参数，AdGuardHome 频繁拦截 o1098464.ingest.sentry.io 的域名。本文将教你如何通过修改 docker-compose 配置和 sh 脚本来阻止青龙面板发送跟踪请求。

## Table of contents

## 前言

青龙面板（截止本文 20240915 青龙面板的最新版本号为 `2.17.11`）使用 Sentry 来跟踪错误日志，但作者未提供让用户自行选择关闭的选项，导致家里的 AdGuardHome 总是拦截 o1098464.ingest.sentry.io，使其在拦截排行中位居首位，显得不太美观。同时，频繁的 DNS 请求也会消耗小主机的性能。

![adguardhome 拦截排名.avif](https://img.gaazeon.com/2024/09/202409151035933.avif)

GitHub issue 上有老哥给出了[解决方案](https://github.com/whyour/qinglong/issues/2001)，但是没有给出具体的操作步骤，本文将教你如何通过修改 docker-compose 配置和 sh 脚本，使用更优雅的方法在启动时阻止青龙面板发送跟踪请求。

## 修改 docker-compose.yml 文件

1. 创建名为 `remove-tracking.sh` 的 shell 脚本，在 `docker-compose.yml` 同一目录下

```sh
#!/bin/sh

# 检查文件是否已修改
if grep -q "return;" /ql/static/build/loaders/sentry.js; then
    echo "File already modified, starting normally"
    # 执行原始入口点命令
    exec ./docker/docker-entrypoint.sh
else
    echo "File not modified, applying changes and restarting"
    # 修改文件
    sed -i '/Sentry\.init/ s/^/return;/' /ql/static/build/loaders/sentry.js
    
    # 获取当前容器 ID
    CONTAINER_ID=$(cat /proc/self/cgroup | grep "docker" | sed 's/^.*\///' | tail -n 1)
    
    # 重启容器
    docker restart $CONTAINER_ID
    
    # 退出当前进程，让 Docker 重新启动容器
    exit 0
fi
```

2. 更新 docker-compose 配置，添加如下 `entrypoint` 字段

```yml
version: '3'

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

`docker-compose up -d` 启动容器后，青龙面板将不再发送跟踪请求。

## 参考

1. [Github｜一直在发送dns请求 · Issue #2001](https://github.com/whyour/qinglong/issues/2001)
