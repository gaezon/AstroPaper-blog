// Feature: agent-readiness-optimization, Req 8.1: Static mcp.json contains required keys
import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const mcpJsonPath = resolve(process.cwd(), "public/.well-known/mcp.json");

describe("public/.well-known/mcp.json (Req 8.1)", () => {
  const content = JSON.parse(readFileSync(mcpJsonPath, "utf-8"));

  it("contains serverCardUrl", () => {
    expect(content).toHaveProperty("serverCardUrl");
    expect(typeof content.serverCardUrl).toBe("string");
    expect(content.serverCardUrl).toMatch(/^https?:\/\//);
  });

  it("contains authentication", () => {
    expect(content).toHaveProperty("authentication");
    expect(content.authentication).toHaveProperty("required");
    expect(content.authentication).toHaveProperty("description");
  });

  it("contains capabilities with all four boolean flags", () => {
    expect(content).toHaveProperty("capabilities");
    expect(content.capabilities).toHaveProperty("tools");
    expect(content.capabilities).toHaveProperty("resources");
    expect(content.capabilities).toHaveProperty("prompts");
    expect(content.capabilities).toHaveProperty("streaming");
    expect(content.capabilities.streaming).toBe(false);
  });

  it("contains resources array", () => {
    expect(content).toHaveProperty("resources");
    expect(Array.isArray(content.resources)).toBe(true);
    expect(content.resources.length).toBeGreaterThanOrEqual(5);
  });

  it("contains handshakeUrl pointing at the live endpoint", () => {
    expect(content).toHaveProperty("handshakeUrl");
    expect(content.handshakeUrl).toBe(
      "https://blog.gaazeon.com/.well-known/mcp/"
    );
  });
});
