const id = "Tailscale Site to Site 异地组网.md";
						const collection = "blog";
						const slug = "tailscale-site-to-site-connect";
						const body = "\n# 前言\n\n因为家里和学校同时放了 2 台 OpenWrt 路由，需要相互组网方便在子网中每一个路由下的客户端不需要下载 tailscale 客户端便能相互访问，参考了网上做法都不对，于是自己写了这个教程。\n\n# 具体做法\n\nA：10.0.0.0/20 子网，需要添加一条到 tailnet 和远程 10.118.48.0/20 LAN 的静态路由：\n\n```plaintext\nip route add 100.64.0.0/10 via 10.0.0.2\nip route add 10.118.48.0/20 via 10.0.0.2\n```\n\nB：同样，10.118.48.0/20 子网，添加一条到 tailnet 和到远程 10.0.0.0/20 LAN 的静态路由：\n\n```plaintext\nip route add 100.64.0.0/10 via 10.118.48.2\nip route add 10.0.0.0/20 via 10.118.48.2\n```\n\n然后 tailscale 启动命令中  \n加上 `--snat-subnet-routes=false` 和 `--accept-routes`\n\n# 参考\n\n1. [[OpenWrt Wiki] Tailscale --- [OpenWrt 维基] Tailscale](https://openwrt.org/docs/guide-user/services/vpn/tailscale/start)\n2. [[Tailscale] tailscale 官方 site to site 组网说明](https://tailscale.com/kb/1214/site-to-site)\n";
						const data = {author:"Gaazeon",pubDatetime:new Date(1711330380000),modDatetime:new Date(1711351380000),title:"Tailscale Site to Site 异地组网教程",tags:["tailscale","网络"],description:"Tailscale Site to Site(点对点) 异地组网"};
						const _internal = {
							type: 'content',
							filePath: "/Users/leojun/AstroPaper-blog/src/content/blog/Tailscale Site to Site 异地组网.md",
							rawData: undefined,
						};

export { _internal, body, collection, data, id, slug };
