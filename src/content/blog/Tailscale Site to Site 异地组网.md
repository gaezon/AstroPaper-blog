---
author: Gaazeon
pubDatetime: 2024-03-25T09:33:00Z
modDatetime: 2024-03-25T09:33:47.400Z
title: Tailscale Site to Site 异地组网教程
description:Tailscale Site to Site(点对点) 异地组网
tags:
  - tailscale
---

# 前言

因为家里和学校同时放了 2 台 OpenWrt 路由，需要相互组网，方便在子网中，每一个路由下的客户端不需要下载 tailscale 便能相互访问。

# 具体做法

A：10.0.0.0/20 子网，需要添加一条到 tailnet 和远程 10.118.48.0/20 LAN 的静态路由：

```text
ip route add 100.64.0.0/10 via 10.0.0.2
ip route add 10.118.48.0/20 via 10.0.0.2
```

B：同样，10.118.48.0/20 子网，添加一条到 tailnet 和到远程 10.0.0.0/20 LAN 的静态路由：

```text
ip route add 100.64.0.0/10 via 10.118.48.2
ip route add 10.0.0.0/20 via 10.118.48.2
```

然后 tailscale 启动命令  
加上 `--snat-subnet-routes=false` 和 `--accept-routes`

# 参考

1. [[OpenWrt Wiki] Tailscale --- [OpenWrt 维基] Tailscale](https://openwrt.org/docs/guide-user/services/vpn/tailscale/start
2. https://tailscale.com/kb/1214/site-to-site
