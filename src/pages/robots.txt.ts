import type { APIRoute } from "astro";

const AI_AGENTS = [
  "GPTBot",
  "ClaudeBot",
  "PerplexityBot",
  "Google-Extended",
  "Applebot-Extended",
  "CCBot",
] as const;

function buildAgentBlock(name: string): string {
  return `User-agent: ${name}\nAllow: /\nDisallow: /api/\n`;
}

const getRobotsTxt = (sitemapURL: URL) => {
  const origin = sitemapURL.origin;
  const agentBlocks = AI_AGENTS.map(buildAgentBlock).join("\n");

  return `User-agent: *
Allow: /

${agentBlocks}
Sitemap: ${sitemapURL.href}
Schemamap: ${new URL("schemamap.xml", origin).href}

# AI and agent discovery
# Public read-only content is available without authentication.
# LLM overview: ${new URL("llms.txt", origin).href}
# Full LLM context: ${new URL("llms-full.txt", origin).href}
# Agent instructions: ${new URL("agents.md", origin).href}
# Agent and developer resources: ${new URL("docs.md", origin).href}
# Webhook alternatives: ${new URL("webhooks.md", origin).href}
# API catalog: ${new URL(".well-known/api-catalog", origin).href}
`;
};

export const GET: APIRoute = ({ site }) => {
  const sitemapURL = new URL("sitemap-index.xml", site);
  return new Response(getRobotsTxt(sitemapURL));
};
