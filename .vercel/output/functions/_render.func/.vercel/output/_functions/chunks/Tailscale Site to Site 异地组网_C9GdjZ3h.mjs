import { d as createComponent, r as renderTemplate, m as maybeRenderHead, u as unescapeHTML } from './astro_BOFBhy_c.mjs';
import 'kleur/colors';
import 'clsx';

const html = "<h1 id=\"前言\">前言</h1>\n<p>因为家里和学校同时放了 2 台 OpenWrt 路由，需要相互组网方便在子网中每一个路由下的客户端不需要下载 tailscale 客户端便能相互访问，参考了网上做法都不对，于是自己写了这个教程。</p>\n<h1 id=\"具体做法\">具体做法</h1>\n<p>A：10.0.0.0/20 子网，需要添加一条到 tailnet 和远程 10.118.48.0/20 LAN 的静态路由：</p>\n<pre class=\"astro-code one-dark-pro\" style=\"background-color:#282c34;color:#abb2bf; overflow-x: auto; white-space: pre-wrap; word-wrap: break-word;\" tabindex=\"0\"><code><span class=\"line\"><span>ip route add 100.64.0.0/10 via 10.0.0.2</span></span>\n<span class=\"line\"><span>ip route add 10.118.48.0/20 via 10.0.0.2</span></span>\n<span class=\"line\"><span></span></span></code></pre>\n<p>B：同样，10.118.48.0/20 子网，添加一条到 tailnet 和到远程 10.0.0.0/20 LAN 的静态路由：</p>\n<pre class=\"astro-code one-dark-pro\" style=\"background-color:#282c34;color:#abb2bf; overflow-x: auto; white-space: pre-wrap; word-wrap: break-word;\" tabindex=\"0\"><code><span class=\"line\"><span>ip route add 100.64.0.0/10 via 10.118.48.2</span></span>\n<span class=\"line\"><span>ip route add 10.0.0.0/20 via 10.118.48.2</span></span>\n<span class=\"line\"><span></span></span></code></pre>\n<p>然后 tailscale 启动命令中<br>\n加上 <code>--snat-subnet-routes=false</code> 和 <code>--accept-routes</code></p>\n<h1 id=\"参考\">参考</h1>\n<ol>\n<li><a href=\"https://openwrt.org/docs/guide-user/services/vpn/tailscale/start\">[OpenWrt Wiki] Tailscale --- [OpenWrt 维基] Tailscale</a></li>\n<li><a href=\"https://tailscale.com/kb/1214/site-to-site\">[Tailscale] tailscale 官方 site to site 组网说明</a></li>\n</ol>";

				const frontmatter = {"pubDatetime":"2024-03-25T01:33:00.000Z","modDatetime":"2024-03-25T07:23:00.000Z","title":"Tailscale Site to Site 异地组网教程","description":"Tailscale Site to Site(点对点) 异地组网","slug":"tailscale-site-to-site-connect","tags":["tailscale","网络"]};
				const file = "/Users/leojun/AstroPaper-blog/src/content/blog/Tailscale Site to Site 异地组网.md";
				const url = undefined;
				function rawContent() {
					return "\n# 前言\n\n因为家里和学校同时放了 2 台 OpenWrt 路由，需要相互组网方便在子网中每一个路由下的客户端不需要下载 tailscale 客户端便能相互访问，参考了网上做法都不对，于是自己写了这个教程。\n\n# 具体做法\n\nA：10.0.0.0/20 子网，需要添加一条到 tailnet 和远程 10.118.48.0/20 LAN 的静态路由：\n\n```plaintext\nip route add 100.64.0.0/10 via 10.0.0.2\nip route add 10.118.48.0/20 via 10.0.0.2\n```\n\nB：同样，10.118.48.0/20 子网，添加一条到 tailnet 和到远程 10.0.0.0/20 LAN 的静态路由：\n\n```plaintext\nip route add 100.64.0.0/10 via 10.118.48.2\nip route add 10.0.0.0/20 via 10.118.48.2\n```\n\n然后 tailscale 启动命令中  \n加上 `--snat-subnet-routes=false` 和 `--accept-routes`\n\n# 参考\n\n1. [[OpenWrt Wiki] Tailscale --- [OpenWrt 维基] Tailscale](https://openwrt.org/docs/guide-user/services/vpn/tailscale/start)\n2. [[Tailscale] tailscale 官方 site to site 组网说明](https://tailscale.com/kb/1214/site-to-site)\n";
				}
				function compiledContent() {
					return html;
				}
				function getHeadings() {
					return [{"depth":1,"slug":"前言","text":"前言"},{"depth":1,"slug":"具体做法","text":"具体做法"},{"depth":1,"slug":"参考","text":"参考"}];
				}

				const Content = createComponent((result, _props, slots) => {
					const { layout, ...content } = frontmatter;
					content.file = file;
					content.url = url;

					return renderTemplate`${maybeRenderHead()}${unescapeHTML(html)}`;
				});

export { Content, compiledContent, Content as default, file, frontmatter, getHeadings, rawContent, url };
