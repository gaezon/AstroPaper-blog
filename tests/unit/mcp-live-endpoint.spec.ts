// Feature: agent-readiness-optimization, Property 1/2/3: MCP live endpoint behavior
// Tests import the serverless handlers directly (no HTTP server needed).
import { afterEach, describe, it, expect, vi } from "vitest";
import fc from "fast-check";
import Ajv2020 from "ajv/dist/2020";
import addFormats from "ajv-formats";

// Mock path aliases used by the endpoint and its transitive dependencies.
// vi.mock calls are hoisted above imports by Vitest.
vi.mock("@/config", () => ({
  SITE: { website: "https://blog.gaazeon.com/" },
}));

vi.mock("@/utils/mcp", async () => {
  return await vi.importActual("../../src/utils/mcp");
});

vi.mock("@/utils/mcp-endpoint", async () => {
  return await vi.importActual("../../src/utils/mcp-endpoint");
});

import {
  GET,
  POST,
  PUT,
  DELETE,
  PATCH,
  OPTIONS,
  HEAD,
} from "../../src/pages/.well-known/mcp";
import { handleMcpEndpointRequest } from "../../src/utils/mcp-endpoint";
import handshakeSchema from "../../src/schemas/mcp-handshake.schema.json" with { type: "json" };
import envelopeSchema from "../../src/schemas/error-envelope.schema.json" with { type: "json" };

// Setup Ajv validators
const ajv = new Ajv2020({ strict: false });
addFormats(ajv);
const validateHandshake = ajv.compile(handshakeSchema);
const validateEnvelope = ajv.compile(envelopeSchema);

afterEach(() => {
  vi.unstubAllGlobals();
});

/**
 * Build a minimal APIContext with only the `request` field populated.
 * The MCP handlers only access `request` from the context.
 */
function makeContext(request: Request) {
  return { request } as unknown as Parameters<typeof GET>[0];
}

describe("MCP live endpoint — direct handler invocation", () => {
  describe("GET returns schema-valid handshake", () => {
    it("responds with 200 and a valid handshake payload", async () => {
      // Validates: Requirements 1.2
      const response = await GET(
        makeContext(new Request("https://blog.gaazeon.com/.well-known/mcp/"))
      );
      expect(response.status).toBe(200);
      expect(response.headers.get("Content-Type")).toMatch(
        /^application\/json/
      );

      const body = await response.json();
      const valid = validateHandshake(body);
      expect(valid, JSON.stringify(validateHandshake.errors)).toBe(true);
      expect(body.liveHandshake).toBe(true);
    });

    it("serves the documented extensionless URL before trailing-slash routing", async () => {
      const response = await handleMcpEndpointRequest(
        new Request("https://blog.gaazeon.com/.well-known/mcp")
      );

      expect(response.status).toBe(200);
      expect(response.headers.get("Content-Type")).toMatch(
        /^application\/json/
      );

      const body = await response.json();
      const valid = validateHandshake(body);
      expect(valid, JSON.stringify(validateHandshake.errors)).toBe(true);
      expect(body.liveHandshake).toBe(true);
    });
  });

  describe("P1 — POST initialize returns standard MCP InitializeResult", () => {
    it("echoes string, integer, null, and float id values (100 runs)", async () => {
      // Validates: Requirements 1.2, 1.3
      await fc.assert(
        fc.asyncProperty(
          fc.oneof(
            fc.string(),
            fc.integer(),
            fc.constant(null),
            fc.double({ noNaN: true, noDefaultInfinity: true })
          ),
          async id => {
            const request = new Request(
              "https://blog.gaazeon.com/.well-known/mcp/",
              {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  jsonrpc: "2.0",
                  id,
                  method: "initialize",
                  params: {
                    protocolVersion: "2025-03-26",
                    capabilities: {},
                    clientInfo: {
                      name: "test-client",
                      version: "1.0.0",
                    },
                  },
                }),
              }
            );

            const response = await POST(makeContext(request));
            expect(response.status).toBe(200);
            expect(response.headers.get("Content-Type")).toMatch(
              /^application\/json/
            );

            const body = await response.json();
            expect(body.jsonrpc).toBe("2.0");

            // id echoed verbatim — use JSON round-trip comparison for float precision
            expect(JSON.stringify(body.id)).toBe(JSON.stringify(id));

            expect(body.result).toMatchObject({
              protocolVersion: "2025-03-26",
              capabilities: {
                tools: {},
                resources: {},
              },
              serverInfo: {
                name: expect.any(String),
                version: expect.any(String),
              },
              instructions: expect.stringContaining("Read-only"),
            });
          }
        ),
        { numRuns: 100 }
      );
    });

    it("accepts MCP-Protocol-Version header for streamable HTTP clients", async () => {
      const response = await POST(
        makeContext(
          new Request("https://blog.gaazeon.com/.well-known/mcp/", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Accept: "application/json, text/event-stream",
              "MCP-Protocol-Version": "2025-03-26",
            },
            body: JSON.stringify({
              jsonrpc: "2.0",
              id: "init",
              method: "initialize",
              params: {
                capabilities: {},
                clientInfo: {
                  name: "ora-compatible-client",
                  version: "1.0.0",
                },
              },
            }),
          })
        )
      );

      expect(response.status).toBe(200);
      const body = await response.json();
      expect(body.result.capabilities).toStrictEqual({
        tools: {},
        resources: {},
      });
      expect(body.result.protocolVersion).toBe("2025-03-26");
    });

    it("keeps legacy initialize compatibility for 2024-11-05 clients", async () => {
      const response = await POST(
        makeContext(
          new Request("https://blog.gaazeon.com/.well-known/mcp/", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "MCP-Protocol-Version": "2024-11-05",
            },
            body: JSON.stringify({
              jsonrpc: "2.0",
              id: "legacy-init",
              method: "initialize",
            }),
          })
        )
      );

      expect(response.status).toBe(200);
      const body = await response.json();
      expect(body.result.protocolVersion).toBe("2024-11-05");
    });

    it("accepts initialized notifications without a JSON-RPC response body", async () => {
      const response = await POST(
        makeContext(
          new Request("https://blog.gaazeon.com/.well-known/mcp/", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              jsonrpc: "2.0",
              method: "notifications/initialized",
            }),
          })
        )
      );

      expect(response.status).toBe(202);
      expect(await response.text()).toBe("");
    });
  });

  describe("P1 — POST supports read-only MCP resources and tools", () => {
    it("lists canonical resources", async () => {
      const response = await POST(
        makeContext(
          new Request("https://blog.gaazeon.com/.well-known/mcp/", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              jsonrpc: "2.0",
              id: "resources",
              method: "resources/list",
            }),
          })
        )
      );

      expect(response.status).toBe(200);
      const body = await response.json();
      expect(body.jsonrpc).toBe("2.0");
      expect(body.id).toBe("resources");
      expect(body.result.resources.length).toBeGreaterThanOrEqual(5);
      expect(body.result.resources).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            uri: "https://blog.gaazeon.com/llms-full.txt",
            mimeType: "text/markdown",
          }),
          expect.objectContaining({
            uri: "ui://widget/resource-index.html",
            mimeType: "text/html+skybridge",
          }),
        ])
      );
    });

    it("reads the MCP Apps resource index widget", async () => {
      const response = await POST(
        makeContext(
          new Request("https://blog.gaazeon.com/.well-known/mcp/", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              jsonrpc: "2.0",
              id: "widget",
              method: "resources/read",
              params: {
                uri: "ui://widget/resource-index.html",
              },
            }),
          })
        )
      );

      expect(response.status).toBe(200);

      const body = await response.json();
      expect(body.result.contents).toEqual([
        expect.objectContaining({
          uri: "ui://widget/resource-index.html",
          mimeType: "text/html+skybridge",
          text: expect.stringContaining("Gaazeon's Blog Agent Resources"),
          _meta: expect.objectContaining({
            ui: expect.objectContaining({
              prefersBorder: true,
              csp: expect.objectContaining({
                connectDomains: [],
                resourceDomains: [],
              }),
            }),
            "openai/widgetDescription": expect.any(String),
            "openai/widgetCSP": expect.objectContaining({
              redirect_domains: ["https://blog.gaazeon.com"],
            }),
          }),
        }),
      ]);
    });

    it("reads a canonical resource", async () => {
      const fetchMock = vi.fn(async () => new Response("# Full context"));
      vi.stubGlobal("fetch", fetchMock);

      const response = await POST(
        makeContext(
          new Request("https://blog.gaazeon.com/.well-known/mcp/", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              jsonrpc: "2.0",
              id: "read",
              method: "resources/read",
              params: {
                uri: "https://blog.gaazeon.com/llms-full.txt",
              },
            }),
          })
        )
      );

      expect(response.status).toBe(200);
      expect(fetchMock).toHaveBeenCalledWith(
        "https://blog.gaazeon.com/llms-full.txt"
      );

      const body = await response.json();
      expect(body.result.contents).toEqual([
        {
          uri: "https://blog.gaazeon.com/llms-full.txt",
          mimeType: "text/markdown",
          text: "# Full context",
        },
      ]);
    });

    it("lists read-only tools with input schemas", async () => {
      const response = await POST(
        makeContext(
          new Request("https://blog.gaazeon.com/.well-known/mcp/", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              jsonrpc: "2.0",
              id: "tools",
              method: "tools/list",
            }),
          })
        )
      );

      expect(response.status).toBe(200);
      const body = await response.json();
      expect(body.result.tools).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            name: "get_agent_integration_guide",
            inputSchema: expect.objectContaining({
              type: "object",
              additionalProperties: false,
            }),
            outputSchema: expect.objectContaining({
              type: "object",
              required: expect.arrayContaining([
                "source",
                "resources",
                "unsupportedWorkflows",
              ]),
            }),
            annotations: expect.objectContaining({
              readOnlyHint: true,
              idempotentHint: true,
            }),
            _meta: expect.objectContaining({
              ui: expect.objectContaining({
                resourceUri: "ui://widget/resource-index.html",
                visibility: ["model", "app"],
              }),
              "openai/outputTemplate": "ui://widget/resource-index.html",
              "openai/toolInvocation/invoking": expect.any(String),
              "openai/toolInvocation/invoked": expect.any(String),
            }),
          }),
        ])
      );
    });

    it("calls a read-only tool and returns text content", async () => {
      const fetchMock = vi.fn(async () => new Response("# Agent guide"));
      vi.stubGlobal("fetch", fetchMock);

      const response = await POST(
        makeContext(
          new Request("https://blog.gaazeon.com/.well-known/mcp/", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              jsonrpc: "2.0",
              id: "call",
              method: "tools/call",
              params: {
                name: "get_agent_integration_guide",
                arguments: {},
              },
            }),
          })
        )
      );

      expect(response.status).toBe(200);
      expect(fetchMock).toHaveBeenCalledWith(
        "https://blog.gaazeon.com/agent-integration.md"
      );

      const body = await response.json();
      expect(body.result.content).toEqual([
        {
          type: "text",
          text: "# Agent guide",
        },
      ]);
      expect(body.result.structuredContent).toMatchObject({
        source: "https://blog.gaazeon.com/agent-integration.md",
        mimeType: "text/markdown",
        resources: expect.arrayContaining([
          expect.objectContaining({
            uri: "https://blog.gaazeon.com/docs.md",
          }),
          expect.objectContaining({
            uri: "https://blog.gaazeon.com/webhooks.md",
          }),
        ]),
        unsupportedWorkflows: expect.arrayContaining([
          "Webhook registration",
          "Write APIs",
        ]),
      });
      expect(body.result._meta).toMatchObject({
        ui: {
          resourceUri: "ui://widget/resource-index.html",
        },
      });
    });

    it("returns a JSON-RPC error when resource fetch fails", async () => {
      vi.stubGlobal(
        "fetch",
        vi.fn(async () => {
          throw new Error("network down");
        })
      );

      const response = await POST(
        makeContext(
          new Request("https://blog.gaazeon.com/.well-known/mcp/", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              jsonrpc: "2.0",
              id: "failure",
              method: "resources/read",
              params: {
                uri: "https://blog.gaazeon.com/llms-full.txt",
              },
            }),
          })
        )
      );

      expect(response.status).toBe(200);
      const body = await response.json();
      expect(body).toMatchObject({
        jsonrpc: "2.0",
        id: "failure",
        error: {
          code: -32000,
          message: "Resource fetch failed.",
          data: {
            uri: "https://blog.gaazeon.com/llms-full.txt",
            cause: "network down",
          },
        },
      });
    });
  });

  describe("P2 — non-GET/POST methods return 405 + schema-valid envelope", () => {
    it("PUT, DELETE, PATCH, OPTIONS, HEAD all return 405 (100 runs)", async () => {
      // Validates: Requirements 1.6, 8.8
      const handlers = [
        { fn: PUT, name: "PUT" },
        { fn: DELETE, name: "DELETE" },
        { fn: PATCH, name: "PATCH" },
        { fn: OPTIONS, name: "OPTIONS" },
        { fn: HEAD, name: "HEAD" },
      ] as const;

      await fc.assert(
        fc.asyncProperty(fc.constantFrom(...handlers), async ({ fn, name }) => {
          const request = new Request(
            "https://blog.gaazeon.com/.well-known/mcp/",
            { method: name }
          );

          const response = await fn(makeContext(request));
          expect(response.status).toBe(405);

          const body = await response.json();
          const valid = validateEnvelope(body);
          expect(valid, JSON.stringify(validateEnvelope.errors)).toBe(true);
          expect(body.error.code).toBe("method_not_allowed");
        }),
        { numRuns: 100 }
      );
    });

    it("GET with text/event-stream Accept is rejected because server-initiated SSE is unsupported", async () => {
      const response = await GET(
        makeContext(
          new Request("https://blog.gaazeon.com/.well-known/mcp/", {
            headers: { Accept: "text/event-stream" },
          })
        )
      );

      expect(response.status).toBe(405);
      const body = await response.json();
      const valid = validateEnvelope(body);
      expect(valid, JSON.stringify(validateEnvelope.errors)).toBe(true);
      expect(body.error.code).toBe("method_not_allowed");
    });
  });

  describe("P3 — malformed POST returns JSON-RPC errors", () => {
    it("invalid JSON returns parse error (100 runs)", async () => {
      // Validates: Requirements 1.7, 8.8
      await fc.assert(
        fc.asyncProperty(
          fc.string().filter(s => {
            try {
              JSON.parse(s);
              return false;
            } catch {
              return true;
            }
          }),
          async bodyStr => {
            const request = new Request(
              "https://blog.gaazeon.com/.well-known/mcp/",
              {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: bodyStr,
              }
            );

            const response = await POST(makeContext(request));
            expect(response.status).toBe(400);

            const body = await response.json();
            expect(body).toMatchObject({
              jsonrpc: "2.0",
              id: null,
              error: {
                code: -32700,
                message: "Parse error.",
              },
            });
          }
        ),
        { numRuns: 100 }
      );
    });

    it("invalid JSON-RPC shape returns invalid request", async () => {
      const response = await POST(
        makeContext(
          new Request("https://blog.gaazeon.com/.well-known/mcp/", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ jsonrpc: "2.0", id: 1 }),
          })
        )
      );

      expect(response.status).toBe(400);
      const body = await response.json();
      expect(body.error.code).toBe(-32600);
    });

    it("unknown methods return method-not-found JSON-RPC errors", async () => {
      const response = await POST(
        makeContext(
          new Request("https://blog.gaazeon.com/.well-known/mcp/", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              jsonrpc: "2.0",
              id: "unknown",
              method: "unknown/method",
            }),
          })
        )
      );

      expect(response.status).toBe(200);
      const body = await response.json();
      expect(body).toMatchObject({
        jsonrpc: "2.0",
        id: "unknown",
        error: {
          code: -32601,
          message: "Method not found.",
        },
      });
      expect(body.error.data.supportedMethods).toContain("resources/list");
      expect(body.error.data.supportedMethods).toContain("tools/list");
    });
  });
});
