import { describe, expect, it } from "vitest";
import { CONTENT_SECURITY_POLICY } from "../../src/utils/http-headers";

const connectSrc = CONTENT_SECURITY_POLICY.split("; ").find(directive =>
  directive.startsWith("connect-src ")
);

describe("CONTENT_SECURITY_POLICY", () => {
  it("allowlists the official Twikoo OwO catalog host for XHR", () => {
    expect(connectSrc).toBeDefined();
    expect(connectSrc).toContain("https://owo.imaegoo.com");
    expect(connectSrc).toContain("https://comment.gaazeon.com");
    expect(connectSrc).not.toMatch(/\bhttps:\s*$/);
  });
});
