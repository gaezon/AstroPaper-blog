// Tests for buildMcpWellKnownFunctionBundle() — verifies that the esbuild
// output has the correct ESM export shape and contains the expected handler
// logic, guarding against regressions in bundler config or entry shim.
import { beforeAll, describe, expect, it } from "vitest";
import { buildMcpWellKnownFunctionBundle } from "../../scripts/apply-vercel-routes";

describe("buildMcpWellKnownFunctionBundle", () => {
  // Build once and share across all tests — esbuild invocation is expensive.
  let bundle: string;
  beforeAll(async () => {
    bundle = await buildMcpWellKnownFunctionBundle();
  });

  it("produces non-empty ESM output", () => {
    expect(typeof bundle).toBe("string");
    expect(bundle.length).toBeGreaterThan(1000);
  });

  it("exports a default fetch handler (Vercel function shape)", () => {
    // esbuild ESM output uses named re-export: export { x as default }
    expect(bundle).toMatch(/export\s*\{[^}]*as\s+default/);
  });

  it("contains the JSON-RPC routing logic from mcp-endpoint.ts", () => {
    expect(bundle).toContain("handleJsonRpcMethod");
    expect(bundle).toContain("handleMcpEndpointRequest");
  });

  it("contains all six supported MCP methods", () => {
    for (const method of [
      "initialize",
      "notifications/initialized",
      "resources/list",
      "resources/read",
      "tools/list",
      "tools/call",
    ]) {
      expect(bundle).toContain(method);
    }
  });

  it("is executable: default export responds to a GET request", async () => {
    // Load the bundle via a data: URL so no temp files are needed.
    const dataUrl = `data:text/javascript;base64,${Buffer.from(bundle).toString("base64")}`;
    const mod = await import(dataUrl);
    const handler = mod.default as {
      fetch: (req: Request) => Promise<Response>;
    };

    expect(typeof handler.fetch).toBe("function");

    const response = await handler.fetch(
      new Request("https://blog.gaazeon.com/.well-known/mcp")
    );
    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body).toMatchObject({
      protocolVersion: expect.any(String),
      liveHandshake: true,
    });
  });
});
