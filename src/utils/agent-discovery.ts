import { SITE } from "../config";

export type AgentResourceId =
  | "llm-overview"
  | "llm-full-context"
  | "agent-integration-guide"
  | "agent-instructions"
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
    description:
      "Read agent usage guidance, retrieval order, citation guidance, unsupported workflows, and error recovery notes.",
    resourceId: "agent-instructions",
    outputMimeType: "text/markdown",
  },
  {
    name: "get_agent_integration_guide",
    description:
      "Read the canonical integration guide for OpenAPI, MCP, Markdown negotiation, JSON errors, and unsupported workflows.",
    resourceId: "agent-integration-guide",
    outputMimeType: "text/markdown",
  },
  {
    name: "get_markdown_index",
    description:
      "Read the Markdown site index for public links, access model, and content topics.",
    resourceId: "markdown-index",
    outputMimeType: "text/markdown",
  },
  {
    name: "get_openapi_description",
    description:
      "Read the OpenAPI description for public static discovery resources.",
    resourceId: "openapi-description",
    outputMimeType: "application/vnd.oai.openapi+json",
  },
  {
    name: "get_pricing_access_model",
    description:
      "Read the free access and pricing model for the public static blog, including the absence of paid tiers, OAuth, accounts, and private APIs.",
    resourceId: "pricing-access-model",
    outputMimeType: "text/markdown",
  },
] as const satisfies readonly AgentDiscoveryTool[];

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
    description: tool.description,
    inputSchema: {
      type: "object",
      additionalProperties: false,
      properties: {},
    },
    annotations: {
      readOnlyHint: true,
      destructiveHint: false,
      idempotentHint: true,
      openWorldHint: true,
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
