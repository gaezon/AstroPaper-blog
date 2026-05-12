// Feature: agent-readiness-optimization, Property 9: AI-crawler policy applies uniformly across the six named agents
// **Validates: Requirements 3.1, 3.2, 3.3, 8.8**
import { describe, it, expect, beforeAll } from "vitest";
import { GET } from "../../src/pages/robots.txt";

const AI_AGENTS = [
  "GPTBot",
  "ClaudeBot",
  "PerplexityBot",
  "Google-Extended",
  "Applebot-Extended",
  "CCBot",
];

// Call the handler with a mock context to get the robots.txt content
async function getRobotsTxtContent(): Promise<string> {
  const response = await GET({
    site: new URL("https://blog.gaazeon.com/"),
  } as unknown as Parameters<typeof GET>[0]);
  return await response.text();
}

// Parse robots.txt into blocks keyed by User-agent
function parseRobotsTxt(content: string): Map<string, string[]> {
  const blocks = new Map<string, string[]>();
  let currentAgent: string | null = null;

  for (const line of content.split("\n")) {
    const trimmed = line.trim();
    if (trimmed.startsWith("User-agent:")) {
      currentAgent = trimmed.replace("User-agent:", "").trim();
      if (!blocks.has(currentAgent)) {
        blocks.set(currentAgent, []);
      }
    } else if (
      currentAgent &&
      (trimmed.startsWith("Allow:") || trimmed.startsWith("Disallow:"))
    ) {
      blocks.get(currentAgent)!.push(trimmed);
    }
  }

  return blocks;
}

describe("robots.txt AI crawler policy (P9)", () => {
  let content: string;
  let blocks: Map<string, string[]>;

  beforeAll(async () => {
    content = await getRobotsTxtContent();
    blocks = parseRobotsTxt(content);
  });

  it("contains all six named AI User-agent blocks", () => {
    for (const agent of AI_AGENTS) {
      expect(blocks.has(agent), `Missing User-agent block for ${agent}`).toBe(
        true
      );
    }
  });

  it("each named agent has Allow: /", () => {
    for (const agent of AI_AGENTS) {
      const directives = blocks.get(agent) ?? [];
      expect(
        directives.some(d => d === "Allow: /"),
        `${agent} missing Allow: /`
      ).toBe(true);
    }
  });

  it("each named agent has Disallow: /api/", () => {
    for (const agent of AI_AGENTS) {
      const directives = blocks.get(agent) ?? [];
      expect(
        directives.some(d => d === "Disallow: /api/"),
        `${agent} missing Disallow: /api/`
      ).toBe(true);
    }
  });

  it("no named agent has a conflicting Allow: /api/ directive", () => {
    for (const agent of AI_AGENTS) {
      const directives = blocks.get(agent) ?? [];
      const hasConflict = directives.some(
        d => d.startsWith("Allow:") && d.includes("/api/") && d !== "Allow: /"
      );
      expect(
        hasConflict,
        `${agent} has conflicting Allow: /api/ directive`
      ).toBe(false);
    }
  });

  it("default User-agent: * block still exists with Allow: /", () => {
    expect(blocks.has("*")).toBe(true);
    const directives = blocks.get("*") ?? [];
    expect(directives.some(d => d === "Allow: /")).toBe(true);
  });

  it("Sitemap reference is present", () => {
    expect(content).toContain("Sitemap:");
    expect(content).toContain("sitemap-index.xml");
  });

  it("AI discovery comments are preserved", () => {
    expect(content).toContain("# AI and agent discovery");
    expect(content).toContain("llms.txt");
    expect(content).toContain("agents.md");
  });
});
