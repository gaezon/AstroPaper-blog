// Feature: agent-readiness-optimization, Property 1/2/3: MCP live endpoint behavior
// Tests import the serverless handlers directly (no HTTP server needed).
import { describe, it, expect, vi } from "vitest";
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

  describe("P1 — POST echoes arbitrary id types and returns schema-valid handshake", () => {
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

            // result validates against handshake schema
            const valid = validateHandshake(body.result);
            expect(valid, JSON.stringify(validateHandshake.errors)).toBe(true);
          }
        ),
        { numRuns: 100 }
      );
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
  });

  describe("P3 — malformed POST returns 400 + schema-valid envelope", () => {
    it("invalid JSON and non-initialize methods return 400 (100 runs)", async () => {
      // Validates: Requirements 1.7, 8.8
      await fc.assert(
        fc.asyncProperty(
          fc.oneof(
            // Non-parseable JSON strings
            fc.string().filter(s => {
              try {
                JSON.parse(s);
                return false;
              } catch {
                return true;
              }
            }),
            // Valid JSON but with a method other than "initialize"
            fc
              .record({
                jsonrpc: fc.constant("2.0"),
                id: fc.integer(),
                method: fc.string().filter(m => m !== "initialize"),
              })
              .map(o => JSON.stringify(o))
          ),
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
            const valid = validateEnvelope(body);
            expect(valid, JSON.stringify(validateEnvelope.errors)).toBe(true);
            expect(["invalid_json", "unsupported_method"]).toContain(
              body.error.code
            );
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});
