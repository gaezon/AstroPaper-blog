---
layout: ../../layouts/AboutLayout.astro
title: "Webhooks and Incremental Updates"
description: "Gaazeon's Blog does not provide webhooks. This page documents RSS, sitemap, and public JSON alternatives for agents and developer tools."
---

Gaazeon's Blog is a static technical blog. It does not provide webhooks, event subscriptions, callback registration, or write APIs.

## Why Webhooks Are Not Available

The site has no user accounts, app installs, private resources, or event stream. Public content is published through static HTML, Markdown, RSS, sitemap files, and read-only JSON indexes, so there is no server-side state that requires third-party webhook registration.

## Recommended Alternatives

- Chinese RSS: [rss.xml](/rss.xml)
- English RSS: [rss.en.xml](/rss.en.xml)
- Sitemap index: [sitemap-index.xml](/sitemap-index.xml)
- All posts JSON: `/api/posts.json`
- All tags JSON: `/api/tags.json`
- Markdown index: [index.md](/index.md)
- Full LLM context: [llms-full.txt](/llms-full.txt)

## Agent Guidance

1. Use RSS feeds for new post discovery.
2. Use the sitemap to verify canonical URLs.
3. Use `/api/posts.json` and `/api/tags.json` for structured indexes.
4. Respect HTTP caching and avoid repeated broad crawls.
5. Do not attempt webhook creation, event subscription, or content mutation.

## Error Semantics

Requests for nonexistent webhook or mutation paths should be treated as unsupported workflows. Fall back to RSS, sitemap, and public JSON indexes instead of probing private APIs.
