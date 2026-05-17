import {
  AGENT_RESOURCE_WIDGET_URI,
  AGENT_DISCOVERY_RESOURCES,
  AGENT_DISCOVERY_TOOLS,
  absoluteSiteUrl,
  getAgentResourceById,
  getAgentResourceByUri,
  getAgentTool,
  toMcpResource,
  toMcpTool,
  type AgentDiscoveryResource,
  type AgentDiscoveryTool,
} from "./agent-discovery";

const UNSUPPORTED_WORKFLOWS = [
  "User accounts",
  "OAuth login",
  "API keys",
  "Payment or checkout",
  "Write APIs",
  "Webhook registration",
  "Event callbacks",
  "Private resources",
] as const;

const MCP_APP_RESOURCE = {
  uri: AGENT_RESOURCE_WIDGET_URI,
  name: "Agent resource index widget",
  description:
    "Read-only MCP Apps UI resource that renders the blog's public agent resources, unsupported workflows, and fallback paths.",
  mimeType: "text/html+skybridge",
} as const;

/**
 * MCP wire protocol version exposed through the handshake. Kept in lockstep
 * with the upstream Model Context Protocol specification.
 */
export const MCP_PROTOCOL_VERSION = "2025-03-26";
export const MCP_LEGACY_PROTOCOL_VERSION = "2024-11-05";

/**
 * Human-readable server name surfaced in `serverInfo.name`.
 */
export const MCP_SERVER_NAME = "Gaazeon's Blog MCP Discovery";

/**
 * Semantic version of the server implementation surfaced in `serverInfo.version`.
 */
export const MCP_SERVER_VERSION = "1.0.0";

/**
 * Auditable schema version for the handshake payload. Bumped whenever the
 * response envelope changes shape (see `mcp-handshake.schema.json`).
 */
export const MCP_SCHEMA_VERSION = "1.0.0";

/**
 * Discovery shape returned by the /.well-known/mcp live endpoint on GET.
 * JSON-RPC initialize returns a standard MCP InitializeResult instead.
 */
export interface MCPHandshake {
  schemaVersion: string;
  protocolVersion: string;
  serverInfo: {
    name: string;
    version: string;
  };
  capabilities: {
    tools: boolean;
    resources: boolean;
    prompts: boolean;
    streaming: boolean;
  };
  liveHandshake: boolean;
  resources: Array<{
    uri: string;
    name: string;
    mimeType: string;
  }>;
  documentationUrl?: string;
}

export interface McpInitializeResult {
  protocolVersion: string;
  capabilities: {
    tools: Record<string, never>;
    resources: Record<string, never>;
  };
  serverInfo: {
    name: string;
    version: string;
  };
  instructions: string;
}

export function buildMcpInitializeResult(opts?: {
  requestedProtocolVersion?: string;
}): McpInitializeResult {
  const requested = opts?.requestedProtocolVersion;
  const protocolVersion =
    requested === MCP_LEGACY_PROTOCOL_VERSION
      ? MCP_LEGACY_PROTOCOL_VERSION
      : MCP_PROTOCOL_VERSION;

  return {
    protocolVersion,
    capabilities: {
      tools: {},
      resources: {},
    },
    serverInfo: {
      name: MCP_SERVER_NAME,
      version: MCP_SERVER_VERSION,
    },
    instructions:
      "Read-only public discovery server for Gaazeon's Blog. Use resources/list, resources/read, tools/list, and tools/call to retrieve public Markdown, OpenAPI, sitemap, and MCP Apps resource metadata. No authentication, writes, prompts, streaming, payments, or private data are supported.",
  };
}

export function buildAgentResourceIndexStructuredContent(args?: {
  source?: string;
  mimeType?: string;
}) {
  return {
    source: args?.source ?? absoluteSiteUrl("docs.md"),
    mimeType: args?.mimeType ?? "text/markdown",
    resources: AGENT_DISCOVERY_RESOURCES.map(toMcpResource),
    unsupportedWorkflows: [...UNSUPPORTED_WORKFLOWS],
  };
}

/**
 * Canonical JSON error shape returned by every Static_Content_API path and by
 * the MCP endpoint on 400/405. Mirrors `error-envelope.schema.json`.
 *
 * NOTE: The envelope uses snake_case `documentation_url` while the MCP
 * handshake metadata retains camelCase `documentationUrl`. This asymmetry is
 * intentional and locked by design.
 */
export interface ErrorEnvelope {
  error: {
    code: string;
    message: string;
    status: number;
    documentation_url: string;
    availableResources?: string[];
  };
}

export interface McpJsonRpcRequest {
  jsonrpc: "2.0";
  id?: unknown;
  method: string;
  params?: unknown;
}

export interface McpJsonRpcSuccess {
  jsonrpc: "2.0";
  id: unknown;
  result: unknown;
}

export interface McpJsonRpcFailure {
  jsonrpc: "2.0";
  id: unknown;
  error: {
    code: number;
    message: string;
    data?: unknown;
  };
}

export type McpJsonRpcResponse = McpJsonRpcSuccess | McpJsonRpcFailure;

const ERROR_CODE_PATTERN = /^[a-z][a-z0-9_]*$/;
const MESSAGE_MIN_LENGTH = 1;
const MESSAGE_MAX_LENGTH = 500;
const STATUS_MIN = 400;
const STATUS_MAX = 599;

/**
 * Build the MCP handshake payload served by the live discovery endpoint.
 *
 * The `resources` array is constructed fresh on every call so that
 * `SITE.website` lookups stay explicit and the output remains deterministic
 * per invocation.
 */
export function buildHandshake(opts: { liveHandshake: boolean }): MCPHandshake {
  const documentationUrl = absoluteSiteUrl("agent-integration.md");

  return {
    schemaVersion: MCP_SCHEMA_VERSION,
    protocolVersion: MCP_PROTOCOL_VERSION,
    serverInfo: {
      name: MCP_SERVER_NAME,
      version: MCP_SERVER_VERSION,
    },
    capabilities: {
      tools: true,
      resources: true,
      prompts: false,
      streaming: false,
    },
    liveHandshake: opts.liveHandshake,
    resources: buildMcpResourcesList().resources.map(resource => {
      const { uri, name, mimeType } = resource;
      return { uri, name, mimeType };
    }),
    documentationUrl,
  };
}

export function buildMcpResourcesList() {
  return {
    resources: [
      ...AGENT_DISCOVERY_RESOURCES.map(toMcpResource),
      MCP_APP_RESOURCE,
    ],
  };
}

export function buildMcpToolsList() {
  return {
    tools: AGENT_DISCOVERY_TOOLS.map(toMcpTool),
  };
}

export function buildMcpResourceReadResult(
  resource: AgentDiscoveryResource,
  text: string
) {
  return {
    contents: [
      {
        uri: absoluteSiteUrl(resource.path),
        mimeType: resource.mimeType,
        text,
      },
    ],
  };
}

export function buildMcpToolCallResult(tool: AgentDiscoveryTool, text: string) {
  const resource = getAgentResourceById(tool.resourceId);
  const source = resource ? absoluteSiteUrl(resource.path) : undefined;
  const mimeType = resource?.mimeType ?? tool.outputMimeType;

  return {
    content: [
      {
        type: "text",
        text,
      },
    ],
    structuredContent: buildAgentResourceIndexStructuredContent({
      source,
      mimeType,
    }),
    _meta: {
      ui: {
        resourceUri: AGENT_RESOURCE_WIDGET_URI,
      },
    },
  };
}

export function isMcpAppResourceUri(uri: string) {
  return uri === AGENT_RESOURCE_WIDGET_URI;
}

export function buildMcpAppResourceReadResult() {
  return {
    contents: [
      {
        uri: MCP_APP_RESOURCE.uri,
        mimeType: MCP_APP_RESOURCE.mimeType,
        text: buildMcpAppResourceHtml(),
        _meta: {
          ui: {
            prefersBorder: true,
            csp: {
              connectDomains: [],
              resourceDomains: [],
              frameDomains: [],
            },
          },
          "openai/widgetDescription":
            "A read-only index of public blog resources for AI agents and developer tools.",
          "openai/widgetPrefersBorder": true,
          "openai/widgetCSP": {
            connect_domains: [],
            resource_domains: [],
            frame_domains: [],
            redirect_domains: ["https://blog.gaazeon.com"],
          },
        },
      },
    ],
  };
}

function buildMcpAppResourceHtml() {
  const structured = buildAgentResourceIndexStructuredContent();
  const resources = structured.resources
    .map(
      resource => `<li>
        <a href="${resource.uri}" target="_blank" rel="noopener noreferrer">${escapeHtml(resource.name)}</a>
        <span>${escapeHtml(resource.mimeType)}</span>
        <p>${escapeHtml(resource.description)}</p>
      </li>`
    )
    .join("");
  const unsupported = structured.unsupportedWorkflows
    .map(item => `<li>${escapeHtml(item)}</li>`)
    .join("");

  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Gaazeon's Blog Agent Resources</title>
    <style>
      :root {
        color-scheme: light dark;
        font-family: ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
      }
      body {
        margin: 0;
        padding: 16px;
        background: Canvas;
        color: CanvasText;
      }
      main {
        display: grid;
        gap: 16px;
      }
      h1 {
        margin: 0;
        font-size: 1.15rem;
        line-height: 1.3;
      }
      p {
        margin: 4px 0 0;
        color: color-mix(in srgb, CanvasText 72%, transparent);
        font-size: 0.92rem;
        line-height: 1.45;
      }
      ul {
        display: grid;
        gap: 10px;
        list-style: none;
        margin: 0;
        padding: 0;
      }
      li {
        border: 1px solid color-mix(in srgb, CanvasText 16%, transparent);
        border-radius: 8px;
        padding: 10px;
      }
      a {
        color: LinkText;
        font-weight: 650;
        text-decoration-thickness: 0.08em;
        text-underline-offset: 0.18em;
      }
      span {
        display: block;
        margin-top: 4px;
        font-family: ui-monospace, "SFMono-Regular", Consolas, monospace;
        font-size: 0.78rem;
        color: color-mix(in srgb, CanvasText 62%, transparent);
      }
    </style>
  </head>
  <body>
    <main>
      <header>
        <h1>Gaazeon's Blog Agent Resources</h1>
        <p>Read-only public resources for RSS polling, sitemap discovery, Markdown retrieval, OpenAPI inspection, and MCP tool calls.</p>
      </header>
      <section aria-labelledby="resources-title">
        <h2 id="resources-title">Public resources</h2>
        <ul>${resources}</ul>
      </section>
      <section aria-labelledby="unsupported-title">
        <h2 id="unsupported-title">Unsupported workflows</h2>
        <ul>${unsupported}</ul>
      </section>
    </main>
  </body>
</html>`;
}

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
}

export function getMcpResourceByUri(uri: string) {
  return getAgentResourceByUri(uri);
}

export function getMcpToolByName(name: string) {
  return getAgentTool(name);
}

export function getMcpResourceForTool(tool: AgentDiscoveryTool) {
  return getAgentResourceById(tool.resourceId);
}

export function getMcpResourceUri(resource: AgentDiscoveryResource) {
  return absoluteSiteUrl(resource.path);
}

export function buildMcpJsonRpcResult(
  id: unknown,
  result: unknown
): McpJsonRpcSuccess {
  return {
    jsonrpc: "2.0",
    id,
    result,
  };
}

export function buildMcpJsonRpcError(args: {
  id: unknown;
  code: number;
  message: string;
  data?: unknown;
}): McpJsonRpcFailure {
  return {
    jsonrpc: "2.0",
    id: args.id,
    error: {
      code: args.code,
      message: args.message,
      ...(args.data !== undefined ? { data: args.data } : {}),
    },
  };
}

/**
 * Build a canonical error envelope, validating the inputs against the
 * field-naming and range constraints defined in `error-envelope.schema.json`.
 *
 * Throws `Error` with a field-naming diagnostic when a constraint is violated.
 */
export function buildErrorEnvelope(args: {
  code: string;
  message: string;
  status: number;
  availableResources?: string[];
}): ErrorEnvelope {
  const { code, message, status, availableResources } = args;

  if (typeof code !== "string" || !ERROR_CODE_PATTERN.test(code)) {
    throw new Error(
      `buildErrorEnvelope: "code" must match /^[a-z][a-z0-9_]*$/ (got: ${String(code)})`
    );
  }

  if (
    typeof message !== "string" ||
    message.length < MESSAGE_MIN_LENGTH ||
    message.length > MESSAGE_MAX_LENGTH
  ) {
    const length = typeof message === "string" ? message.length : 0;
    throw new Error(
      `buildErrorEnvelope: "message" length must be 1..500 (got length: ${length})`
    );
  }

  if (
    typeof status !== "number" ||
    !Number.isInteger(status) ||
    status < STATUS_MIN ||
    status > STATUS_MAX
  ) {
    throw new Error(
      `buildErrorEnvelope: "status" must be an integer in [400, 599] (got: ${String(status)})`
    );
  }

  if (availableResources !== undefined) {
    if (!Array.isArray(availableResources)) {
      throw new Error(
        `buildErrorEnvelope: "availableResources" must be an array of non-empty strings`
      );
    }
    for (let i = 0; i < availableResources.length; i++) {
      const entry = availableResources[i];
      if (typeof entry !== "string" || entry.length === 0) {
        throw new Error(
          `buildErrorEnvelope: "availableResources[${i}]" must be a non-empty string`
        );
      }
      try {
        new URL(entry);
      } catch {
        throw new Error(
          `buildErrorEnvelope: "availableResources[${i}]" must be a valid URI (got: ${entry})`
        );
      }
    }
  }

  const error: ErrorEnvelope["error"] = {
    code,
    message,
    status,
    documentation_url: absoluteSiteUrl("agent-integration.md"),
    ...(availableResources !== undefined ? { availableResources } : {}),
  };

  return { error };
}
