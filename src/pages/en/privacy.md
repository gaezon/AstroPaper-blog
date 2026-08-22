---
layout: ../../layouts/AboutLayout.astro
title: "Privacy Policy"
description: "Privacy policy for Gaazeon's Blog, covering analytics, comments, search, and external links on this public technical blog."
---

# Privacy Policy

Gaazeon's Blog is a public technical blog. Articles can be read anonymously. The site does not provide user accounts, paid subscriptions, private APIs, or a login system.

## Analytics

In production, this site uses a self-hosted Umami instance for basic traffic analytics. The data helps understand page visits and improve content structure. It is not used for advertising targeting.

The Umami source code and custom changes used for this site are public in [gaezon/umami](https://github.com/gaezon/umami), so the implementation can be inspected directly. The public repository does not contain the running instance's environment variables, admin credentials, database, or raw analytics records; the article views endpoint exposed by the blog returns only aggregate article view counts.

The production site also loads [Vercel Speed Insights](https://github.com/vercel/speed-insights) to collect Web Vitals and other page-performance metrics. This runs separately from Umami.

## Comments

Some posts may load a comment component. If you choose to post a comment, the submitted content, nickname, and related form data are used to display the comment and support follow-up discussion.

## Search

Site search uses a static Pagefind index. Search primarily runs locally in the browser and does not require an account.

## External Links

Articles may link to third-party websites. When you visit a third-party website, that website's privacy policy applies.

## Contact

For privacy questions, use the email listed on the [contact page](/en/contact/).
