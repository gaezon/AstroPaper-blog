// Feature: agent-readiness-optimization, Property 1: Initialize echoes id and returns a schema-valid handshake
import { describe, it, expect, vi } from "vitest";
import fc from "fast-check";
import Ajv2020 from "ajv/dist/2020";
import addFormats from "ajv-formats";

// The project uses the `@/*` TypeScript path alias, which is wired through
// Astro/Vite but not through Vitest's module resolver. Intercept the real
// SITE config so `src/utils/mcp.ts` can resolve its `@/config` import under
// the plain Vitest runner without touching any source file or shared config.
// `vi.mock` calls are hoisted above imports by Vitest.
vi.mock("@/config", () => ({
  SITE: { website: "https://blog.gaazeon.com/" },
}));

import {
  buildHandshake,
  MCP_SCHEMA_VERSION,
  MCP_PROTOCOL_VERSION,
  MCP_SERVER_NAME,
  MCP_SERVER_VERSION,
} from "../../src/utils/mcp";
import handshakeSchema from "../../src/schemas/mcp-handshake.schema.json" with { type: "json" };

// Ajv strict mode is disabled because the handshake schema carries a top-level
// `schemaVersion` sibling of `$schema` that is informational (not a JSON
// Schema keyword); strict mode would otherwise emit a warning.
const ajv = new Ajv2020({ strict: false });
addFormats(ajv);
const validate = ajv.compile(handshakeSchema);

// Required resource path suffixes (order-insensitive); the builder exposes at
// least these five canonical discovery resources (Req 1.3, 1.4, 1.5).
const REQUIRED_RESOURCE_PATH_SUFFIXES = [
  "/llms.txt",
  "/llms-full.txt",
  "/agent-integration.md",
  "/openapi.json",
  "/sitemap-index.xml",
] as const;

function assertHandshakeInvariants(result: ReturnType<typeof buildHandshake>) {
  // Schema validity is the primary invariant (Req 1.3, 10.2).
  const ok = validate(result);
  expect(ok, JSON.stringify(validate.errors)).toBe(true);

  // Locked-const invariants (Req 1.4, 1.5, 8.8).
  expect(result.schemaVersion).toBe(MCP_SCHEMA_VERSION);
  expect(result.protocolVersion).toBe(MCP_PROTOCOL_VERSION);
  expect(result.serverInfo.name).toBe(MCP_SERVER_NAME);
  expect(result.serverInfo.version).toBe(MCP_SERVER_VERSION);

  // Capability flags are locked per design (read-only tools/resources, no streaming/prompts).
  expect(result.capabilities.streaming).toBe(false);

  // Minimum five canonical resources per schema (Req 1.3).
  expect(result.resources.length).toBeGreaterThanOrEqual(5);
}

describe("buildHandshake (P1/P4)", () => {
  it("MCP_SCHEMA_VERSION literal matches schema const", () => {
    // Validates: Requirements 1.4, 8.8
    expect(MCP_SCHEMA_VERSION).toBe("1.0.0");
    expect(
      (handshakeSchema as { properties: { schemaVersion: { const: string } } })
        .properties.schemaVersion.const
    ).toBe(MCP_SCHEMA_VERSION);
  });

  it("GET form (liveHandshake=true) is schema-valid", () => {
    // Validates: Requirements 1.3, 1.4, 1.5, 10.2
    fc.assert(
      fc.property(fc.constant(true), flag => {
        const result = buildHandshake({ liveHandshake: flag });
        assertHandshakeInvariants(result);
        expect(result.liveHandshake).toBe(true);
      }),
      { numRuns: 100 }
    );
  });

  it("POST form (liveHandshake=false) is schema-valid", () => {
    // Validates: Requirements 1.3, 1.4, 1.5, 10.2
    fc.assert(
      fc.property(fc.constant(false), flag => {
        const result = buildHandshake({ liveHandshake: flag });
        assertHandshakeInvariants(result);
        expect(result.liveHandshake).toBe(false);
      }),
      { numRuns: 100 }
    );
  });

  it("handshake round-trip is structurally equal", () => {
    // Validates: Requirements 1.3, 10.2
    fc.assert(
      fc.property(fc.boolean(), flag => {
        const handshake = buildHandshake({ liveHandshake: flag });
        const parsed = JSON.parse(JSON.stringify(handshake));
        expect(parsed).toEqual(handshake);
      }),
      { numRuns: 100 }
    );
  });

  it("resources are absolute URLs with non-empty name and mimeType", () => {
    // Validates: Requirements 1.3, 1.5
    fc.assert(
      fc.property(fc.boolean(), flag => {
        const result = buildHandshake({ liveHandshake: flag });

        for (const resource of result.resources) {
          expect(() => new URL(resource.uri)).not.toThrow();
          expect(resource.name.length).toBeGreaterThan(0);
          expect(resource.mimeType.length).toBeGreaterThan(0);
        }

        const pathnames = result.resources.map(r => new URL(r.uri).pathname);
        for (const suffix of REQUIRED_RESOURCE_PATH_SUFFIXES) {
          expect(
            pathnames.some(p => p.endsWith(suffix)),
            `expected a resource with pathname ending in ${suffix}, got: ${JSON.stringify(pathnames)}`
          ).toBe(true);
        }

        expect(result.resources).toEqual(
          expect.arrayContaining([
            expect.objectContaining({
              uri: "ui://widget/resource-index.html",
              mimeType: "text/html+skybridge",
            }),
          ])
        );
      }),
      { numRuns: 100 }
    );
  });

  it("capabilities flags are all boolean and match locked decision", () => {
    // Validates: Requirements 1.4, 8.8
    const result = buildHandshake({ liveHandshake: true });
    expect(result.capabilities).toStrictEqual({
      tools: true,
      resources: true,
      prompts: false,
      streaming: false,
    });
  });
});
