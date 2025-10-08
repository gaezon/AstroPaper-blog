---
author: gaazeon
pubDatetime: 2024-05-23T09:30:37.000+08:00
title: "Why I Switched from Hapigo to Raycast After Two Years: Stalled Development and Superior Alternatives"
featured: false
draft: false
tags:
  - Hapigo
  - Raycast
  - GPT AI
  - macOS Launcher
description: "In-depth analysis of why I abandoned Hapigo after two years of use in favor of the more powerful Raycast. Detailed comparison of features, examination of Hapigo's stalled development, and Raycast's thriving plugin ecosystem. Includes real-world usage experiences, feature comparisons, and migration recommendations for Mac productivity tool users."
locale: en
originalTitle: 为什么放弃已经使用两年多的 Hapigo:官方更新停滞与 Raycast 的强大替代
---

## Why I Left Hapigo After Two Years of Loyal Use

### Development Has Completely Stalled

As of May 22, 2024, when I'm writing this article, it's been nearly six months since Hapigo's last update—version v2.12.0 released on December 28, 2023, according to the [official Hapigo website](https://www.hapigo.com/). In this rapidly evolving LLM era, six months without any updates is concerning. Many features I've long requested remain unimplemented, such as adding custom AI model support for Hapigo GPT AI and enhanced screenshot capabilities.

### LobeChat Replaced Hapigo's GPT AI Functionality

I originally subscribed to Hapigo primarily for its GPT AI feature launched mid-2023. I paid ¥69 for an annual subscription (and subscribed on day one of the feature launch, only to feel betrayed when a ¥59 promotional price appeared on Sspai later). Initially, subscribers could even access GPT-4 for free, but the official team later removed this option due to the high cost of GPT-4 API calls. Pro subscribers were limited to GPT-3.5-turbo, though at the time, ¥69 per year for GPT-3.5-turbo still felt like excellent value.

However, as OpenAI continued releasing more powerful models while Hapigo remained stagnant without updates, paid users were stuck with GPT-3.5-turbo. There was no integration with domestic Chinese large language models, not even a simple custom model configuration button.

Over the past six months, I gradually migrated all my chat services from Hapigo's GPT AI to my self-hosted one-api + LobeChat setup. I used Hapigo's services less and less. During this period, I came to realize that self-hosting a chatbot is the optimal solution—no need to route through third-party servers, and data security is significantly enhanced.

Without the constraint of the ChatBot dependency, I decisively abandoned Hapigo and switched to Raycast, which has a steeper learning curve but a far more active plugin community. This opened up a whole new world of possibilities.

![Personal Hapigo usage statistics](https://img.gaazeon.com/2024%2F05%2F202405222325673.avif)
I was previously a heavy Hapigo power user.

## Most Hapigo Features Can Be Perfectly Replaced—Often With Better Alternatives

When using a launcher, one of my most frequently used features is the Everything-style search functionality. Setting that aside, here are the Hapigo features I used most regularly, all of which have equivalent or superior alternatives in Raycast.

### 1. Aliases & Quick Web Navigation ⇋ Quicklinks

The functionality in both applications is virtually identical: type a short alias followed by a space and {query} to trigger the search. The key difference is that in Hapigo, after adding a webpage URL, you must manually add an icon. In Raycast, the system automatically reads the URL's favicon and generates the icon. For example, when setting up a search for the popular Chinese e-commerce site "Smzdm" (什么值得买), Raycast automatically fetches the icon, whereas Hapigo requires manual icon upload.

![Raycast QuickLinks example](https://img.gaazeon.com/2024/05/202405230923546.avif)

Additionally, Raycast provides a pre-configured Library that allows direct addition of commonly used services, making setup even more convenient. Services can also be created as plugins. For instance, when adding Perplexity service, it's better to install the official Perplexity plugin from the Raycast Store, which offers more comprehensive functionality, such as an additional "Use Copilot" parameter option shown in the image.

![Perplexity plugin example in Raycast](https://img.gaazeon.com/2024%2F05%2F202405222325800.avif)

### 2. Clipboard & Snippets ⇋ Snippet & Clipboard History

Raycast's built-in Snippet functionality is far more powerful than Hapigo's. Hapigo's Snippets only offer basic categorization and trigger keywords.

![Basic snippet functionality in Hapigo](https://img.gaazeon.com/2024%2F05%2F202405222325764.avif)

In contrast, Raycast's Snippets feature robust customization capabilities through what they call "Dynamic Placeholders." These allow you to customize cursor position, automatically replace current time, auto-generate UUIDs, and more—making them ideal for customer service representatives and other workflow-intensive users.

![Raycast's advanced snippet features](https://img.gaazeon.com/2024%2F05%2F202405222325780.avif)

## The Rich Plugin Ecosystem: Raycast's True Competitive Advantage

Raycast's extensive plugin ecosystem is its real competitive edge and the reason I felt I should have switched much earlier.

Compared to Hapigo's closed ecosystem, the difference between Raycast and Hapigo's plugin ecosystems is like comparing Apple Silicon Macs to Windows on ARM—night and day.

For example, after switching to Raycast, I discovered that many popular third-party applications I regularly use—including Obsidian, CleanShot X, Warp Terminal, and numerous others—already have developer-created Raycast plugins. These plugins' integration with Raycast dramatically enhances the user experience. For instance, in Obsidian, I can now create a new daily journal entry by simply typing a shortcut in the launcher. Previously, achieving the same result required at least three separate steps; now with Raycast, it's accomplished in one seamless action.

![Using the 'riji' alias in Raycast to invoke Obsidian](https://img.gaazeon.com/2024%2F05%2F202405222325702.avif)

Simply typing my preset `riji` alias directly opens today's journal in Obsidian—incredibly powerful. I really wish I had discovered this sooner.

There are many other excellent plugins. For example, I use the open-source [Easydict](https://github.com/tisfeng/Easydict) combined with Raycast's [extensions/easydict](https://github.com/raycast/extensions/blob/1eb9ef9d103488453a7bfa4bae630d8adaa1e3da/extensions/easydict/README.md) plugin to replace Hapigo's translation feature. This setup allows me to use more affordable domestic models instead of the relatively expensive GPT-4 for translation—absolutely fantastic.

## Additional Notes: Raycast's Limitations

The two main factors that previously prevented me from using Raycast were:

- The learning curve
- Lack of Chinese localization

As of May 2024, Raycast still doesn't offer official Chinese localization. However, after actually diving in and using it, I found the difficulty was far less daunting than I had anticipated—certainly easier to master than Alfred. ~~Perhaps Raycast hasn't prioritized the Chinese market in their development roadmap.~~

Admittedly, Hapigo does have some optimizations tailored to Chinese user habits. For example, in the currency conversion feature, you can simply type "xx 刀" (using the colloquial term "刀" for dollars) to trigger USD exchange rate calculations. Raycast lacks this kind of localized optimization. However, for users, the Raycast currency conversion feature only requires a few extra keystrokes and symbols. Compared to Raycast's incredibly rich ecosystem, these small conveniences in Hapigo aren't enough to retain a long-time user like myself.

![Currency conversion feature in Hapigo](https://img.gaazeon.com/2024%2F05%2F202405222325726.avif)
![Currency conversion feature in Raycast](https://img.gaazeon.com/2024%2F05%2F202405222325818.avif)
