---
author: gaazeon
pubDatetime: 2024-05-23T09:30:37.000+08:00
title: "Why I moved on from Hapigo after two years: stalled updates and why Raycast is a better replacement"
featured: false
draft: false
tags:
  - Hapigo
  - Raycast
  - GPT AI
  - macOS Launcher
description: "Why I stopped using the macOS launcher Hapigo after two years and switched to Raycast. A practical comparison of features, why Hapigo's stalled updates became a blocker, and how Raycast's extension ecosystem changed my workflow. Includes migration notes and tips for macOS users."
locale: en
originalTitle: 为什么放弃已经使用两年多的 Hapigo：官方更新停滞与 Raycast 的强大替代
---

## Why leave Hapigo after two years?

### Stalled updates are the real blocker

As of May 22, 2024, the last public Hapigo release shown on the official site is v2.12.0 (Dec 28, 2023) — roughly half a year without updates. In a fast‑moving LLM era, that gap hurt. Several long‑requested features never landed either: custom AI model support for Hapigo GPT AI, better screenshot tools, and more.

### LobeChat replaced Hapigo's GPT AI for me

I initially subscribed to Hapigo largely for its GPT AI feature (introduced in mid‑2023). I paid ¥69 for a year (then saw a later ¥59 promo elsewhere…). Early on it even allowed GPT‑4 access, which was later removed due to API cost; the Pro tier effectively stuck with GPT‑3.5‑turbo. That was acceptable for a while, but the landscape moved on.

While models improved rapidly, Hapigo stayed still: no custom model button, no support for local/Chinese providers. Over the last six months I migrated all my day‑to‑day chat to a self‑hosted stack (one‑api + LobeChat). It's cheaper, under my control, and keeps data off third‑party servers.

Once I no longer relied on Hapigo for chat, switching launchers became easy. Raycast has a steeper initial learning curve, but its lively extension ecosystem opened a lot of new doors for me.

![My historical Hapigo usage](https://img.gaazeon.com/2024%2F05%2F202405222325673.avif)
I used to be a heavy Hapigo user.

## Most Hapigo features are replaceable — and often better — in Raycast

Besides global/Everything‑style search, these are the Hapigo features I used most. Raycast has equivalents for all of them, often with stronger UX.

### 1) Aliases & quick web jumps ⇋ Quicklinks

Both launchers let you type a short alias + space + {query}. The difference: Hapigo makes you set icons manually; Raycast reads the site favicon automatically. Even common Chinese sites show the right icon out of the box.

![Raycast-QuickLinks-示例](https://img.gaazeon.com/2024/05/202405230923546.avif)

Raycast also ships a curated Quicklink library and, more importantly, a Store full of extensions. For example, instead of a bare Perplexity quicklink, the official Perplexity extension exposes richer features (like a "Use Copilot" toggle).

![Raycast-中的-perplexity-插件示例](https://img.gaazeon.com/2024%2F05%2F202405222325800.avif)

### 2) Snippets & Clipboard History

Raycast's Snippets are significantly more capable. Hapigo only covers the basics (categories + trigger keywords).

![Hapigo-中普通的-snippet](https://img.gaazeon.com/2024%2F05%2F202405222325764.avif)

In Raycast you get "Dynamic Placeholders" — cursor placement, auto‑insert current time, UUID generation, etc. If you do lots of templated replies or routine notes, this is a big deal.

![Raycast-的-snippet](https://img.gaazeon.com/2024%2F05%2F202405222325780.avif)

## The extension ecosystem is the real differentiator

This is the reason I wish I'd switched earlier. Compared to Hapigo's closed approach, Raycast's Store feels like the gap between Apple Silicon Macs and early Windows on ARM.

For example: Obsidian, CleanShot X, Warp Terminal — many popular apps already have solid Raycast extensions. They wire into everyday tasks in a way that saves steps. In Obsidian, I can create today's daily note directly from the launcher.

![使用-riji-alias-Raycast-调用-obsidian](https://img.gaazeon.com/2024%2F05%2F202405222325702.avif)

Typing my `riji` alias opens today's Obsidian journal. One step, done.

There are many more: I use the open‑source [Easydict](https://github.com/tisfeng/Easydict) plus the official [Raycast extension](https://github.com/raycast/extensions/blob/1eb9ef9d103488453a7bfa4bae630d8adaa1e3da/extensions/easydict/README.md) to replace Hapigo's translator — with the option to plug in affordable local models instead of GPT‑4.

## Caveats: Raycast isn't perfect

Two things held me back before:

- The learning curve
- No Chinese localization

As of May 2024, Raycast still doesn't ship official Chinese UI. After actually using it, the learning curve was milder than I feared (certainly easier than Alfred). 

Hapigo does have some China‑specific conveniences (e.g. currency conversions triggered by colloquial keywords). In Raycast you may need a few extra keystrokes. For me, the extension ecosystem easily outweighs those small niceties.

![Hapigo-中的汇率转换功能](https://img.gaazeon.com/2024%2F05%2F202405222325726.avif)
![Raycast-中的汇率转换功能](https://img.gaazeon.com/2024%2F05%2F202405222325818.avif)
