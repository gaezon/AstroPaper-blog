import { SITE } from "../config";

export type AgentResourceId =
  | "llm-overview"
  | "llm-full-context"
  | "agent-integration-guide"
  | "agent-instructions"
  | "developer-resource-docs"
  | "webhook-alternatives"
  | "markdown-index"
  | "openapi-description"
  | "pricing-access-model"
  | "sitemap-index";

export interface AgentDiscoveryResource {
  id: AgentResourceId;
  path: string;
  name: string;
  description: string;
  mimeType: string;
}

export interface AgentDiscoveryTool {
  name: string;
  title: string;
  description: string;
  resourceId: AgentResourceId;
  outputMimeType: string;
}

export function absoluteSiteUrl(path: string): string {
  return new URL(path, SITE.website).href;
}

export const AGENT_DISCOVERY_RESOURCES = [
  {
    id: "llm-overview",
    path: "llms.txt",
    name: "LLM overview",
    description:
      "Compact overview of the blog, canonical retrieval order, access model, and agent constraints.",
    mimeType: "text/markdown",
  },
  {
    id: "llm-full-context",
    path: "llms-full.txt",
    name: "Full LLM context",
    description:
      "Full machine-readable site context with identity, access model, retrieval strategy, examples, and public resource links.",
    mimeType: "text/markdown",
  },
  {
    id: "agent-integration-guide",
    path: "agent-integration.md",
    name: "Agent integration guide",
    description:
      "Canonical integration guide for OpenAPI, MCP, Markdown negotiation, JSON errors, and unsupported workflows.",
    mimeType: "text/markdown",
  },
  {
    id: "agent-instructions",
    path: "agents.md",
    name: "Agent instructions",
    description:
      "Operational instructions for AI agents, crawlers, retrieval systems, and developer tools.",
    mimeType: "text/markdown",
  },
  {
    id: "developer-resource-docs",
    path: "docs.md",
    name: "Agent and developer resources",
    description:
      "Public static resource index for AI agents, crawlers, search systems, and developer tools consuming the blog.",
    mimeType: "text/markdown",
  },
  {
    id: "webhook-alternatives",
    path: "webhooks.md",
    name: "Webhook alternatives",
    description:
      "Static publishing alternatives to webhooks, including RSS, sitemap files, and read-only JSON indexes.",
    mimeType: "text/markdown",
  },
  {
    id: "markdown-index",
    path: "index.md",
    name: "Markdown home index",
    description:
      "Markdown index of main site links, agent entry points, RSS feeds, and access model.",
    mimeType: "text/markdown",
  },
  {
    id: "openapi-description",
    path: "openapi.json",
    name: "OpenAPI description",
    description:
      "OpenAPI 3.1 description for public static discovery resources and read-only JSON endpoints.",
    mimeType: "application/vnd.oai.openapi+json",
  },
  {
    id: "pricing-access-model",
    path: "pricing.md",
    name: "Pricing and access model",
    description:
      "Free public access model, unsupported paid tiers, and no-auth read-only constraints.",
    mimeType: "text/markdown",
  },
  {
    id: "sitemap-index",
    path: "sitemap-index.xml",
    name: "Sitemap index",
    description: "XML sitemap index for canonical article and page discovery.",
    mimeType: "application/xml",
  },
] as const satisfies readonly AgentDiscoveryResource[];

export const AGENT_DISCOVERY_TOOLS = [
  {
    name: "get_agent_instructions",
    title: "Get Agent Instructions",
    description:
      "Read agent usage guidance, retrieval order, citation guidance, unsupported workflows, and error recovery notes.",
    resourceId: "agent-instructions",
    outputMimeType: "text/markdown",
  },
  {
    name: "get_agent_integration_guide",
    title: "Get Agent Integration Guide",
    description:
      "Read the canonical integration guide for OpenAPI, MCP, Markdown negotiation, JSON errors, and unsupported workflows.",
    resourceId: "agent-integration-guide",
    outputMimeType: "text/markdown",
  },
  {
    name: "get_developer_resource_docs",
    title: "Get Developer Resource Docs",
    description:
      "Read the public static resource index for agents and developer tools, including RSS, sitemap, Markdown, OpenAPI, MCP, and read-only JSON entry points.",
    resourceId: "developer-resource-docs",
    outputMimeType: "text/markdown",
  },
  {
    name: "get_webhook_alternatives",
    title: "Get Webhook Alternatives",
    description:
      "Read why webhooks are unsupported for the static blog and which RSS, sitemap, and JSON resources agents should use for incremental updates.",
    resourceId: "webhook-alternatives",
    outputMimeType: "text/markdown",
  },
  {
    name: "get_markdown_index",
    title: "Get Markdown Index",
    description:
      "Read the Markdown site index for public links, access model, and content topics.",
    resourceId: "markdown-index",
    outputMimeType: "text/markdown",
  },
  {
    name: "get_openapi_description",
    title: "Get OpenAPI Description",
    description:
      "Read the OpenAPI description for public static discovery resources.",
    resourceId: "openapi-description",
    outputMimeType: "application/vnd.oai.openapi+json",
  },
  {
    name: "get_pricing_access_model",
    title: "Get Pricing Access Model",
    description:
      "Read the free access and pricing model for the public static blog, including the absence of paid tiers, OAuth, accounts, and private APIs.",
    resourceId: "pricing-access-model",
    outputMimeType: "text/markdown",
  },
] as const satisfies readonly AgentDiscoveryTool[];

export const AGENT_RESOURCE_WIDGET_URI = "ui://widget/resource-index.html";

export const AGENT_TOOL_OUTPUT_SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: ["source", "mimeType", "resources", "unsupportedWorkflows"],
  properties: {
    source: {
      type: "string",
      format: "uri",
      description: "Canonical URL for the resource returned by this tool.",
    },
    mimeType: {
      type: "string",
      description: "MIME type for the returned resource content.",
    },
    resources: {
      type: "array",
      description:
        "Public read-only resources available to agents and developer tools.",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["name", "uri", "mimeType", "description"],
        properties: {
          name: { type: "string" },
          uri: { type: "string" },
          mimeType: { type: "string" },
          description: { type: "string" },
        },
      },
    },
    unsupportedWorkflows: {
      type: "array",
      description:
        "Workflows intentionally unsupported by the static public blog.",
      items: { type: "string" },
    },
  },
} as const;

export function toMcpResource(resource: AgentDiscoveryResource) {
  return {
    uri: absoluteSiteUrl(resource.path),
    name: resource.name,
    description: resource.description,
    mimeType: resource.mimeType,
  };
}

export function toMcpTool(tool: AgentDiscoveryTool) {
  return {
    name: tool.name,
    title: tool.title,
    description: tool.description,
    inputSchema: {
      type: "object",
      additionalProperties: false,
      properties: {},
    },
    outputSchema: AGENT_TOOL_OUTPUT_SCHEMA,
    annotations: {
      readOnlyHint: true,
      destructiveHint: false,
      idempotentHint: true,
      openWorldHint: true,
    },
    _meta: {
      ui: {
        resourceUri: AGENT_RESOURCE_WIDGET_URI,
        visibility: ["model", "app"],
      },
      "openai/outputTemplate": AGENT_RESOURCE_WIDGET_URI,
      "openai/toolInvocation/invoking": "Reading public resources",
      "openai/toolInvocation/invoked": "Resources ready",
    },
  };
}

export function getAgentResourceByUri(uri: string) {
  return AGENT_DISCOVERY_RESOURCES.find(
    resource => absoluteSiteUrl(resource.path) === uri
  );
}

export function getAgentResourceById(id: AgentResourceId) {
  return AGENT_DISCOVERY_RESOURCES.find(resource => resource.id === id);
}

export function getAgentTool(name: string) {
  return AGENT_DISCOVERY_TOOLS.find(tool => tool.name === name);
}
