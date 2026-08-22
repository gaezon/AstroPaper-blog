---
layout: ../../layouts/AboutLayout.astro
title: "Privacy Policy"
description: "Privacy policy for Gaazeon's Blog, covering analytics, comments, search, and external links on this public technical blog."
---

# Privacy Policy

Gaazeon's Blog is a public technical blog. Articles can be read anonymously. The site does not provide user accounts, paid subscriptions, private APIs, or a login system.

## Analytics

In production, this site uses a self-hosted Umami instance for basic traffic analytics. Umami records information such as page path, page title, referrer, browser language, and screen size, and derives anonymous dimensions such as browser, operating system, device type, and approximate location. The IP address may be used during request processing to generate an anonymous session and calculate location, but it is not stored as an analytics record. The data helps understand page visits and improve content structure. It is not used for advertising targeting. See the [Umami metric definitions](https://docs.umami.is/docs/metric-definitions) for the default metric details.

The Umami source code and custom changes used for this site are public in [gaezon/umami](https://github.com/gaezon/umami), so the implementation can be inspected directly. Umami's raw analytics data and admin console are not public; the public article-views endpoint exposed by the Umami instance and used by the blog returns only aggregate article view counts. The public repository does not contain the running instance's environment variables, admin credentials, database, or raw analytics records.

The production site also loads [Vercel Speed Insights](https://vercel.com/docs/speed-insights/privacy-policy) to collect Web Vitals and other page-performance metrics. These performance metrics are received and processed by Vercel Speed Insights separately from this site's self-hosted Umami analytics.

## Comments

Some posts may load a comment component. If you choose to post a comment, the submitted content, nickname, and related form data are used to display the comment and support follow-up discussion.

## Search

Site search uses a static Pagefind index. Search primarily runs locally in the browser and does not require an account.

## External Links

Articles may link to third-party websites. When you visit a third-party website, that website's privacy policy applies.

## Contact

For privacy questions, use the email listed on the [contact page](/en/contact/).
