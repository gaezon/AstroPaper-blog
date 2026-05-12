import { SITE } from "@/config";

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

const ERROR_CODE_PATTERN = /^[a-z][a-z0-9_]*$/;
const MESSAGE_MIN_LENGTH = 1;
const MESSAGE_MAX_LENGTH = 500;
const STATUS_MIN = 400;
const STATUS_MAX = 599;

function absoluteUrl(path: string): string {
  return new URL(path, SITE.website).href;
}

/**
 * Build the MCP handshake payload served by the live discovery endpoint.
 *
 * The `resources` array is constructed fresh on every call so that
 * `SITE.website` lookups stay explicit and the output remains deterministic
 * per invocation.
 */
export function buildHandshake(opts: { liveHandshake: boolean }): MCPHandshake {
  const documentationUrl = absoluteUrl("agent-integration.md");

  return {
    schemaVersion: MCP_SCHEMA_VERSION,
    protocolVersion: MCP_PROTOCOL_VERSION,
    serverInfo: {
      name: MCP_SERVER_NAME,
      version: MCP_SERVER_VERSION,
    },
    capabilities: {
      tools: false,
      resources: true,
      prompts: false,
      streaming: false,
    },
    liveHandshake: opts.liveHandshake,
    resources: [
      {
        uri: absoluteUrl("llms.txt"),
        name: "LLM overview",
        mimeType: "text/markdown",
      },
      {
        uri: absoluteUrl("llms-full.txt"),
        name: "Full LLM context",
        mimeType: "text/markdown",
      },
      {
        uri: documentationUrl,
        name: "Agent integration guide",
        mimeType: "text/markdown",
      },
      {
        uri: absoluteUrl("openapi.json"),
        name: "OpenAPI description",
        mimeType: "application/vnd.oai.openapi+json",
      },
      {
        uri: absoluteUrl("sitemap-index.xml"),
        name: "Sitemap index",
        mimeType: "application/xml",
      },
    ],
    documentationUrl,
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
    documentation_url: absoluteUrl("agent-integration.md"),
    ...(availableResources !== undefined ? { availableResources } : {}),
  };

  return { error };
}
