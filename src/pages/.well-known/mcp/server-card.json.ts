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
        documentationUrl: "https://blog.gaazeon.com/agents.md",
        authentication: {
          required: false,
          description:
            "No authentication is required. The static blog exposes public read-only resources only.",
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
            url: "https://blog.gaazeon.com/agents.md",
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
            url: "https://blog.gaazeon.com/openapi.json",
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
