import { describe, expect, it } from "vitest";
import { toTransitionName } from "../../src/utils/toTransitionName";

describe("toTransitionName", () => {
  it("keeps simple ASCII titles readable", () => {
    expect(toTransitionName("Hello World")).toBe("post-hello-world");
  });

  it("sanitizes punctuation for CSS custom identifiers", () => {
    expect(toTransitionName("Node.js 24 / Astro")).toBe(
      "post-node-js-24-astro"
    );
  });

  it("encodes non-ASCII titles", () => {
    expect(toTransitionName("前端开发")).toBe(
      "post-u00524du007aefu005f00u0053d1"
    );
  });

  it("does not start with a digit", () => {
    expect(toTransitionName("2026 release")).toBe("post-2026-release");
  });

  it("falls back when the title has no usable characters", () => {
    expect(toTransitionName("...")).toBe("post");
  });

  it("prefixes reserved CSS custom identifier keywords", () => {
    expect(toTransitionName("none")).toBe("post-none");
    expect(toTransitionName("auto")).toBe("post-auto");
    expect(toTransitionName("initial")).toBe("post-initial");
    expect(toTransitionName("inherit")).toBe("post-inherit");
    expect(toTransitionName("unset")).toBe("post-unset");
    expect(toTransitionName("revert")).toBe("post-revert");
    expect(toTransitionName("revert-layer")).toBe("post-revert-layer");
    expect(toTransitionName("default")).toBe("post-default");
    expect(toTransitionName("root")).toBe("post-root");
  });
});
