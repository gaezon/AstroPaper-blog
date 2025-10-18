---
author: gaazeon
pubDatetime: 2024-03-25T09:33:00+08:00
modDatetime: 2024-05-05T17:15:00+08:00
title: "Tailscale Site-to-Site Networking: Connect Two OpenWrt Routers Across Locations (Point-to-Point)"
featured: false
draft: false
tags:
  - tailscale
  - Networking
  - OpenWrt
description: "Connect OpenWrt routers across locations with Tailscale. Setup subnet routing, firewall rules, and P2P networking for secure cross-site communication."
locale: en
originalTitle: Tailscale Site to Site 点对点两台 OpenWrt 异地组网教程
slug: tailscale-site-to-site-openwrt-p2p
---

## Introduction

I have two OpenWrt routers deployed simultaneously—one at home and one at my university campus. I needed to establish mutual network connectivity so that client devices under each router's subnet could access each other without requiring individual Tailscale client installations. After trying various online tutorials that didn't work correctly, I wrote this comprehensive guide.

## Implementation Details

I'll skip the basic "installing Tailscale on OpenWrt" procedures here, as these are well-documented elsewhere.

However, to achieve true P2P direct connections: **you must open UDP port `41641` in your firewall on both sides**.

Additionally, you need to enable **subnet routes** for both OpenWrt nodes in the Tailscale admin console.

## Table of contents

## Why I needed this

I had two OpenWrt routers (home and campus) and wanted both LANs to reach each other without installing the Tailscale client on every single device. Most guides I found were incomplete or simply wrong, so here’s a minimal setup that actually works.

## Steps

I’ll skip the basic “install Tailscale on OpenWrt” part — plenty of docs exist. The key pieces for P2P are:

- Open the UDP port that Tailscale uses: **UDP `41641`** must be allowed in your firewall (both sides).
- Enable **subnet routes** for both OpenWrt nodes in the Tailscale admin.

### Add static routes on both LANs

Assume:

- Site A LAN: `10.0.0.0/20` (router at `10.0.0.2`)
- Site B LAN: `10.118.48.0/20` (router at `10.118.48.2`)
- Tailnet CGNAT range (as used by Tailscale): `100.64.0.0/10`

On Site A, add routes towards the tailnet and the remote LAN via your OpenWrt router:

```plaintext
ip route add 100.64.0.0/10 via 10.0.0.2
ip route add 10.118.48.0/20 via 10.0.0.2
```

On Site B, do the symmetric routes:

```plaintext
ip route add 100.64.0.0/10 via 10.118.48.2
ip route add 10.0.0.0/20 via 10.118.48.2
```

![OpenWrt static route example](https://img.gaazeon.com/2024/05/openwrt202405042119416.avif)

### Start Tailscale with the right flags

Make sure you accept routes from the tailnet on both routers, and that you advertise your local subnets:

```sh
tailscale up \
  --advertise-routes=10.0.0.0/24,10.0.1.0/24 \
  --accept-routes \
  --advertise-exit-node
```

That’s it. With firewall, subnet routes and the static routes in place, clients behind both OpenWrt routers should be able to talk directly without installing the Tailscale client.

## References

1. [OpenWrt Wiki — Tailscale](https://openwrt.org/docs/guide-user/services/vpn/tailscale/start)
2. [Tailscale — Site‑to‑site networking](https://tailscale.com/kb/1214/site-to-site)
