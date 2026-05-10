import type { APIRoute } from "astro";

const getRobotsTxt = (sitemapURL: URL) => `
User-agent: *
Allow: /

Sitemap: ${sitemapURL.href}
Schemamap: ${new URL("schemamap.xml", sitemapURL).href}

# AI and agent discovery
# Public read-only content is available without authentication.
# LLM overview: ${new URL("llms.txt", sitemapURL).href}
# Full LLM context: ${new URL("llms-full.txt", sitemapURL).href}
# Agent instructions: ${new URL("agents.md", sitemapURL).href}
# API catalog: ${new URL(".well-known/api-catalog", sitemapURL).href}
`;

export const GET: APIRoute = ({ site }) => {
  const sitemapURL = new URL("sitemap-index.xml", site);
  return new Response(getRobotsTxt(sitemapURL));
};
