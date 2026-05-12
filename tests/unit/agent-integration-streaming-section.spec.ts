// Feature: agent-readiness-optimization, Req 5.3/5.4: Streaming section in agent-integration.md
import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const agentIntegrationPath = resolve(
  process.cwd(),
  "public/agent-integration.md"
);
const content = readFileSync(agentIntegrationPath, "utf-8");

describe("agent-integration.md streaming section (Req 5.3, 5.4)", () => {
  it("contains a ## Streaming heading", () => {
    expect(content).toContain("## Streaming");
  });

  it("contains per-post JSON fallback URL pattern", () => {
    expect(content).toContain(
      "https://blog.gaazeon.com/api/posts/{locale}/{slug}.json"
    );
  });

  it("contains Chinese RSS feed URL", () => {
    expect(content).toContain("https://blog.gaazeon.com/rss.xml");
  });

  it("contains English RSS feed URL", () => {
    expect(content).toContain("https://blog.gaazeon.com/rss.en.xml");
  });

  it("contains llms-full.txt URL", () => {
    expect(content).toContain("https://blog.gaazeon.com/llms-full.txt");
  });

  it("declares capabilities.streaming: false", () => {
    expect(content).toContain("capabilities.streaming: false");
  });

  it("has bilingual subsections (zh-CN and en)", () => {
    expect(content).toContain("### zh-CN");
    expect(content).toContain("### en");
  });
});
