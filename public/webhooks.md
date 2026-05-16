# Webhook Alternatives

Gaazeon's Blog does not provide webhooks, event subscriptions, callback registration, mutation endpoints, or private APIs. It is a static public technical blog.

## Use These Instead

- Chinese RSS: [https://blog.gaazeon.com/rss.xml](https://blog.gaazeon.com/rss.xml)
- English RSS: [https://blog.gaazeon.com/rss.en.xml](https://blog.gaazeon.com/rss.en.xml)
- Sitemap index: [https://blog.gaazeon.com/sitemap-index.xml](https://blog.gaazeon.com/sitemap-index.xml)
- All posts JSON: [https://blog.gaazeon.com/api/posts.json](https://blog.gaazeon.com/api/posts.json)
- All tags JSON: [https://blog.gaazeon.com/api/tags.json](https://blog.gaazeon.com/api/tags.json)
- Markdown index: [https://blog.gaazeon.com/index.md](https://blog.gaazeon.com/index.md)
- Full LLM context: [https://blog.gaazeon.com/llms-full.txt](https://blog.gaazeon.com/llms-full.txt)

## Agent Guidance

1. Poll RSS for new posts.
2. Use sitemap files to verify canonical URLs.
3. Use public JSON indexes for structured retrieval.
4. Respect HTTP cache headers.
5. Treat webhook registration and content mutation as unsupported workflows.
