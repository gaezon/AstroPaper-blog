---
author: gaazeon
pubDatetime: 2024-05-23T09:30:37.000+08:00
modDatetime:
title: 为什么放弃已经使用两年多的 Hapigo：官方更新停滞与 Raycast 的强大替代
slug: why-switch-from-hapigo-to-raycast
draft: false
tags:
  - Hapigo
  - Raycast
  - GPT AI
  - MacOS 启动器
description: 深入分析为什么放弃使用两年多的 macOS 启动器 Hapigo，转向功能更强大的 Raycast。详细对比两者的功能差异，剖析 Hapigo 官方更新停滞的问题，以及 Raycast 丰富插件生态的优势。包含实际使用体验、功能对比和迁移建议，为 Mac 用户选择合适的效率工具提供参考。
---

## 前言：为什么放弃已经使用两年多的 Hapigo

### 官方更新停滞不前

发布这篇博客的时间是 2024 年 05 月 22 日，距离 [Hapigo 官网](https://www.hapigo.com/) 显示的上一次更新的最新版本 v2.12.0（2023 年 12 月 28 日），已经差不多半年了。在这日新月异的 LLM 时代，半年时间 Hapigo 官方都没有任何更新。某些我一直想要的功能也没有添加，比如增加 Hapigo GPT AI 的自定义 AI 模型、增强截图功能等。

### Lobechat 替代了 Hapigo 的 GPT AI

我个人开通 Hapigo 的订阅，很大程度上是因为 Hapigo 去年（2023 年中）推出的 GPT AI，我为此花了 69 大洋开了一年订阅（刚更新第一天就付费订阅了，后面还被少数派卖 ¥59 背刺了）。在开通后，使用的初期甚至还能免费用 GPT-4 模型，后来官方下架了，因为 GPT-4 API 太贵了，个人 Pro 订阅仅限免费使用 GPT-3.5-turbo，但当时觉得 69 元用一年 GPT-3.5-turbo 还是是非常值的。

然而，随着 OpenAI 的更新和更强大模型的推出，而 Hapigo 官方却一直处于不更新的状态，付费用户也只能用 GPT-3.5-turbo，没有适配国内的大模型，甚至都没有一个自定义模型的按钮。

我的所有 Chat 服务在这半年中也逐渐从 Hapigo 提供的 GPT AI 转向自建的 one-api + Lobechat。Hapigo 提供的服务越来越少用。在这期间我也明白了自己搭建 chatbot 才是最好的，不需要经过第三方提供商的服务器，数据也更安全。

没有了 ChatBot 这层枷锁的束缚，毅然决然地放弃 Hapigo，转向虽然上手难度更大，但插件社区更活跃的 Raycast，由此打开了新大门。

![个人的 Hapigo 用量](https://img.gaazeon.com/2024%2F05%2F202405222325673.avif)
本人之前一直是 Hapigo 的重度用户

## Hapigo 的大部分功能能被完美替代，甚至更强

使用启动器，我最常用的功能之一就是类似 Everything 的搜索功能，抛开这个功能，以下这些是之前我在 Hapigo 中最常用的功能，目前在 Raycast 中都有相似的功能，同时发现 Raycast 中它们更加强大。

### 1. 别名与快捷键 (网页直达) ⇋ Quicklink

这个功能在两个软件上使用几乎无异，均为输入短的 alias 之后再输入空格 {query} 触发。相比之下，Hapigo 中添加网页 URL 后还要手动添加 icon，Raycast 中直接就能读取 URL 的 favicon，自动生成图标。比如，说中年男性常用的「什么值得买」搜索就能直接读取 icon，而相同的操作在 Hapigo 中则需要手动添加 icon。

![Raycast-QuickLinks-示例](https://img.gaazeon.com/2024/05/202405230923546.avif)

同时 Raycast 甚至提供了预设的 Library ，能直接添加常用服务，更加方便，也可以直接做成插件形式。比如：添加 Perplexity 服务的时候更建议去安装 Raycast Store 中的 Perplexity 插件，能使用的功能更全，如图，多了一个 "Use Copilot" 的参数选项。

![Raycast-中的-perplexity-插件示例](https://img.gaazeon.com/2024%2F05%2F202405222325800.avif)

### 2. 剪贴板与 Snippet ⇋ Snippet & Clipboard History

Raycast 自带的 Snippet 比 Hapigo 的强大多了，Hapigo 的 Snippet 只有最基本的分类、触发关键词。

![Hapigo-中普通的-snippet](https://img.gaazeon.com/2024%2F05%2F202405222325764.avif)

相较之下，Raycast 的 Snippet 有更强的自定义功能，官方称之为 "Dynamic Placeholders"（动态占位符），使用它能自定义光标位置，自动替换当前时间，自动生成 UUID 等，非常适合客服一类工具人使用。

![Raycast-的-snippet](https://img.gaazeon.com/2024%2F05%2F202405222325780.avif)

## 丰富的插件生态

Raycast 丰富的插件生态其实才是它的核心竞争力，也是我换用 Raycast 之后才觉得相见恨晚的原因。

相较于封闭的 Hapigo，Raycast 和 Hapigo 之间的插件生态 PK 就像 Apple Silicon 的 Mac 和 Windows for ARM 的差距一样。

举个例子，换用 Raycast 我才发现，我常用的 Obsidian、Clean Shot X、Warp Terminal 等，诸多你能想到的知名第三方软件都已经有开发者为 Raycast 做插件了。这些插件与 Raycast 的结合大大增强了用户体验，例如，在 Obsidian 中，直接在启动器中输入快捷方式即可新建 Obsidian 日记。在这之前，相同结果，得操作起码三步以上，现在使用了 Raycast 只需要一步到位。

![使用-riji-alias-Raycast-调用-obsidian](https://img.gaazeon.com/2024%2F05%2F202405222325702.avif)

输入我预设的 `riji` 的 alias 就能直接为我的 Obsidian 打开今天的日记，非常强大，真是相见恨晚。

还有非常多的其他插件，比如我用了开源的 [Easydict](https://github.com/tisfeng/Easydict) 和 Raycast 的 [extensions/easydict](https://github.com/raycast/extensions/blob/1eb9ef9d103488453a7bfa4bae630d8adaa1e3da/extensions/easydict/README.md) 插件取代了 Hapigo 的翻译，能自定义用国内模型取代价格比较贵的 GPT-4 来翻译，真香。

## 补充说明：Raycast 的不足

之前阻止我使用 Raycast 的最大理由是两个：

- 上手难度
- 没有汉化

截止 2024 年 5 月，虽然 Raycast 也还是没有官方汉化。但是自己上手以后，发现难度更多是我自己高估了，实际上并不高，起码没有 Alfred 这么让人头痛吧！~~Raycast 可能也没把主要精力放在国人上吧~~

诚然，Hapigo 某些功能有对国人使用习惯进行优化，比如在汇率转换功能中，直接输入 xx 刀，使用「刀」这个关键词就能触发美元汇率的换算，而在 Raycast 中是没有这样的优化的。但对用户而言，使用 Raycast 汇率转换功能，仅需多操作几步，输入更多符号而已。比较起 Raycast 丰富的生态，Hapigo 这些小小细节似乎不能留下我这个老用户了。

![Hapigo-中的汇率转换功能](https://img.gaazeon.com/2024%2F05%2F202405222325726.avif)
![Raycast-中的汇率转换功能](https://img.gaazeon.com/2024%2F05%2F202405222325818.avif)
