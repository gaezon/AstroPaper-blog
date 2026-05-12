// Feature: agent-readiness-optimization, Req 5.1: Streaming posture consistency
import { describe, it, expect, vi } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

vi.mock("@/config", () => ({
  SITE: { website: "https://blog.gaazeon.com/" },
}));

import { buildHandshake } from "../../src/utils/mcp";

const mcpJsonPath = resolve(process.cwd(), "public/.well-known/mcp.json");

describe("streaming posture consistency (Req 5.1)", () => {
  const staticMcp = JSON.parse(readFileSync(mcpJsonPath, "utf-8"));

  it("static mcp.json declares capabilities.streaming === false", () => {
    expect(staticMcp.capabilities.streaming).toBe(false);
  });

  it("live handshake declares capabilities.streaming === false", () => {
    const handshake = buildHandshake({ liveHandshake: true });
    expect(handshake.capabilities.streaming).toBe(false);
  });

  it("both declarations hold the same boolean value", () => {
    const handshake = buildHandshake({ liveHandshake: true });
    expect(handshake.capabilities.streaming).toBe(
      staticMcp.capabilities.streaming
    );
  });
});
