import type { APIRoute } from "astro";
import {
  AGENT_DISCOVERY_RESOURCES,
  AGENT_DISCOVERY_TOOLS,
  absoluteSiteUrl,
  getAgentResourceById,
  toMcpResource,
  toMcpTool,
} from "../../../utils/agent-discovery";

const tools = AGENT_DISCOVERY_TOOLS.map(tool => {
  const resource = getAgentResourceById(tool.resourceId);

  return {
    ...toMcpTool(tool),
    outputSchema: {
      type: tool.outputMimeType.includes("json") ? "object" : "string",
      contentMediaType: tool.outputMimeType,
    },
    url: resource ? absoluteSiteUrl(resource.path) : undefined,
  };
});

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
          transport: "http-json-rpc",
          liveHandshake: true,
          description:
            "The endpoint supports read-only JSON-RPC initialize, resources/list, resources/read, tools/list, and tools/call over HTTPS POST.",
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
            "Authentication, mutation, checkout, private data, prompts, streaming, and write tools are intentionally unsupported.",
        },
        tools,
        resources: AGENT_DISCOVERY_RESOURCES.map(toMcpResource),
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
