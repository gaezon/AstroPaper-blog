import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const root = process.cwd();

function read(path: string) {
  return readFileSync(resolve(root, path), "utf-8");
}

describe("agent and developer resource discovery docs", () => {
  it("exposes Markdown docs and webhook alternatives without claiming webhook support", () => {
    const docs = read("public/docs.md");
    const webhooks = read("public/webhooks.md");

    expect(docs).toContain("https://blog.gaazeon.com/docs/");
    expect(docs).toContain("https://blog.gaazeon.com/webhooks/");
    expect(docs).toContain("/api/posts/{locale}/{slug}.json");

    expect(webhooks).toContain("does not provide webhooks");
    expect(webhooks).toContain("https://blog.gaazeon.com/rss.xml");
    expect(webhooks).toContain("https://blog.gaazeon.com/sitemap-index.xml");
    expect(webhooks).not.toContain("webhook secret");
  });

  it("links new resources from the primary agent discovery documents", () => {
    const llms = read("public/llms.txt");
    const full = read("public/llms-full.txt");
    const agents = read("public/agents.md");
    const integration = read("public/agent-integration.md");

    for (const content of [llms, full, agents, integration]) {
      expect(content).toContain("https://blog.gaazeon.com/docs.md");
      expect(content).toContain("https://blog.gaazeon.com/webhooks.md");
    }
  });

  it("lists docs and webhook alternatives in API catalog, MCP manifest, and agent skills", () => {
    const apiCatalog = JSON.parse(read("public/.well-known/api-catalog"));
    const mcp = JSON.parse(read("public/.well-known/mcp.json"));
    const skills = JSON.parse(read("public/.well-known/agent-skills"));

    const catalogHrefs = apiCatalog.linkset.flatMap(
      (entry: { item: Array<{ href: string }> }) =>
        entry.item.map(item => item.href)
    );

    expect(catalogHrefs).toContain("https://blog.gaazeon.com/docs.md");
    expect(catalogHrefs).toContain("https://blog.gaazeon.com/webhooks.md");
    expect(mcp.resources).toEqual(
      expect.arrayContaining([
        "https://blog.gaazeon.com/docs.md",
        "https://blog.gaazeon.com/webhooks.md",
        "ui://widget/resource-index.html",
      ])
    );
    expect(mcp.mcpApps).toMatchObject({
      uiResource: "ui://widget/resource-index.html",
      outputTemplate: "ui://widget/resource-index.html",
      widgetMimeType: "text/html+skybridge",
    });
    expect(skills.resources).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          type: "agent-developer-docs",
          url: "https://blog.gaazeon.com/docs.md",
        }),
        expect.objectContaining({
          type: "webhook-alternatives",
          url: "https://blog.gaazeon.com/webhooks.md",
        }),
      ])
    );
  });

  it("documents the new public paths in OpenAPI", () => {
    const openapi = JSON.parse(read("public/openapi.json"));
    const paths = openapi.paths;

    for (const path of [
      "/docs.md",
      "/webhooks.md",
      "/docs/",
      "/en/docs/",
      "/webhooks/",
      "/en/webhooks/",
      "/api/posts.json",
      "/api/tags.json",
      "/api/posts/{locale}/{slug}.json",
    ]) {
      expect(paths).toHaveProperty(path);
    }

    expect(paths["/api/posts/{locale}/{slug}.json"].get.parameters).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          name: "locale",
          schema: expect.objectContaining({ enum: ["zh-CN", "en"] }),
        }),
      ])
    );
  });
});
