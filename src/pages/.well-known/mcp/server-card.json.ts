import type { APIRoute } from "astro";

export const GET: APIRoute = () =>
  new Response(
    JSON.stringify(
      {
        name: "Gaazeon's Blog Public Discovery",
        description:
          "Public read-only static discovery resources for Gaazeon's bilingual technical blog.",
        version: "1.0.0",
        serverUrl: "https://blog.gaazeon.com/",
        documentationUrl: "https://blog.gaazeon.com/agent-integration.md",
        protocol: {
          transport: "static-discovery",
          liveHandshake: false,
          description:
            "The static site provides read-only discovery resources and does not expose JSON-RPC tool invocation.",
        },
        authentication: {
          required: false,
          description:
            "No authentication is required. The static blog exposes public read-only resources only.",
        },
        errorHandling: {
          notFound:
            "Unsupported /api/* paths return application/json with a not_found error and canonical discovery links.",
          retry:
            "Retry canonical Markdown or JSON resources once, then fall back to llms-full.txt, index.md, RSS feeds, and sitemap files.",
          unsupported:
            "Authentication, mutation, checkout, private data, and live MCP tool invocation are intentionally unsupported.",
        },
        tools: [
          {
            name: "get_agent_instructions",
            description:
              "Read agent usage guidance, retrieval order, citation guidance, unsupported workflows, and error recovery notes.",
            inputSchema: {
              type: "object",
              additionalProperties: false,
              properties: {},
            },
            outputSchema: {
              type: "string",
              contentMediaType: "text/markdown",
            },
            annotations: {
              readOnlyHint: true,
              destructiveHint: false,
              idempotentHint: true,
              openWorldHint: true,
            },
            url: "https://blog.gaazeon.com/agents.md",
          },
          {
            name: "get_agent_integration_guide",
            description:
              "Read the canonical integration guide for OpenAPI, MCP-style discovery, Markdown negotiation, JSON errors, and unsupported agent workflows.",
            inputSchema: {
              type: "object",
              additionalProperties: false,
              properties: {},
            },
            outputSchema: {
              type: "string",
              contentMediaType: "text/markdown",
            },
            annotations: {
              readOnlyHint: true,
              destructiveHint: false,
              idempotentHint: true,
              openWorldHint: true,
            },
            url: "https://blog.gaazeon.com/agent-integration.md",
          },
          {
            name: "get_markdown_index",
            description:
              "Read the Markdown site index for public links, access model, and content topics.",
            inputSchema: {
              type: "object",
              additionalProperties: false,
              properties: {},
            },
            outputSchema: {
              type: "string",
              contentMediaType: "text/markdown",
            },
            annotations: {
              readOnlyHint: true,
              destructiveHint: false,
              idempotentHint: true,
              openWorldHint: true,
            },
            url: "https://blog.gaazeon.com/index.md",
          },
          {
            name: "get_openapi_description",
            description:
              "Read the OpenAPI description for public static discovery resources.",
            inputSchema: {
              type: "object",
              additionalProperties: false,
              properties: {},
            },
            outputSchema: {
              type: "object",
              contentMediaType: "application/vnd.oai.openapi+json",
              description:
                "OpenAPI 3.1 document describing public static discovery resources.",
            },
            annotations: {
              readOnlyHint: true,
              destructiveHint: false,
              idempotentHint: true,
              openWorldHint: true,
            },
            url: "https://blog.gaazeon.com/openapi.json",
          },
          {
            name: "get_pricing_access_model",
            description:
              "Read the free access and pricing model for the public static blog, including the absence of paid tiers, OAuth, accounts, and private APIs.",
            inputSchema: {
              type: "object",
              additionalProperties: false,
              properties: {},
            },
            outputSchema: {
              type: "string",
              contentMediaType: "text/markdown",
            },
            annotations: {
              readOnlyHint: true,
              destructiveHint: false,
              idempotentHint: true,
              openWorldHint: true,
            },
            url: "https://blog.gaazeon.com/pricing.md",
          },
        ],
        resources: [
          {
            uri: "https://blog.gaazeon.com/llms.txt",
            name: "Compact LLM overview",
            mimeType: "text/markdown",
          },
          {
            uri: "https://blog.gaazeon.com/llms-full.txt",
            name: "Full LLM context",
            mimeType: "text/markdown",
          },
          {
            uri: "https://blog.gaazeon.com/agent-integration.md",
            name: "Agent integration guide",
            mimeType: "text/markdown",
          },
          {
            uri: "https://blog.gaazeon.com/sitemap-index.xml",
            name: "Sitemap index",
            mimeType: "application/xml",
          },
        ],
      },
      null,
      2
    ),
    {
      headers: {
        "Content-Type": "application/json; charset=utf-8",
      },
    }
  );
