---
pubDatetime: 2024-03-25T09:33:00+08:00
modDatetime: 2024-03-25T15:23:00+08:00
title: Tailscale Site to Site 异地组网教程
description: Tailscale Site to Site(点对点) 异地组网
tags:
  - tailscale
  - 网络
---

# 前言

因为家里和学校同时放了 2 台 OpenWrt 路由，需要相互组网方便在子网中每一个路由下的客户端不需要下载 tailscale 客户端便能相互访问，参考了网上做法都不对，于是自己写了这个教程。

# 具体做法

A：10.0.0.0/20 子网，需要添加一条到 tailnet 和远程 10.118.48.0/20 LAN 的静态路由：

```plaintext
ip route add 100.64.0.0/10 via 10.0.0.2
ip route add 10.118.48.0/20 via 10.0.0.2
```

B：同样，10.118.48.0/20 子网，添加一条到 tailnet 和到远程 10.0.0.0/20 LAN 的静态路由：

```plaintext
ip route add 100.64.0.0/10 via 10.118.48.2
ip route add 10.0.0.0/20 via 10.118.48.2
```

然后 tailscale 启动命令中  
加上 `--snat-subnet-routes=false` 和 `--accept-routes`

# 参考

1. [[OpenWrt Wiki] Tailscale --- [OpenWrt 维基] Tailscale](https://openwrt.org/docs/guide-user/services/vpn/tailscale/start)
2. [[Tailscale] tailscale 官方 site to site 组网说明](https://tailscale.com/kb/1214/site-to-site)
