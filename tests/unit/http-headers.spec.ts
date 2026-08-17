import { describe, expect, it } from "vitest";
import { CONTENT_SECURITY_POLICY } from "../../src/utils/http-headers";

const connectSrc = CONTENT_SECURITY_POLICY.split("; ").find(directive =>
  directive.startsWith("connect-src ")
);

describe("CONTENT_SECURITY_POLICY", () => {
  it("keeps connect-src as an explicit allowlist without the OwO catalog host", () => {
    expect(connectSrc).toBeDefined();

    const sources = connectSrc?.split(/\s+/).slice(1) ?? [];

    expect(sources).toContain("https://comment.gaazeon.com");
    expect(sources).not.toContain("https://owo.imaegoo.com");
    expect(sources).not.toContain("https:");
  });
});
