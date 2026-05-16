import {
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

/**
 * MCP wire protocol version exposed through the handshake. Kept in lockstep
 * with the upstream Model Context Protocol specification.
 */
export const MCP_PROTOCOL_VERSION = "2024-11-05";

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
 * Shape returned by the /.well-known/mcp live endpoint on GET and inside the
 * JSON-RPC `result` on POST initialize. Mirrors `mcp-handshake.schema.json`.
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
    resources: AGENT_DISCOVERY_RESOURCES.map(resource => {
      const { uri, name, mimeType } = toMcpResource(resource);
      return { uri, name, mimeType };
    }),
    documentationUrl,
  };
}

export function buildMcpResourcesList() {
  return {
    resources: AGENT_DISCOVERY_RESOURCES.map(toMcpResource),
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

  return {
    content: [
      {
        type: "text",
        text,
      },
    ],
    structuredContent: {
      source: resource ? absoluteSiteUrl(resource.path) : undefined,
      mimeType: tool.outputMimeType,
    },
  };
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
