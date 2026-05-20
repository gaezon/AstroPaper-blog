import { describe, it, expect } from "vitest";
import {
  POST_EXTENSIONS,
  POST_GLOB_EXT,
  isPostFile,
  stripPostExtension,
} from "../../src/utils/post-extensions";

describe("POST_EXTENSIONS / POST_GLOB_EXT", () => {
  it("exposes lowercase extensions with leading dot", () => {
    expect(POST_EXTENSIONS).toEqual([".md", ".mdx"]);
  });

  it("derives a glob fragment compatible with content collections", () => {
    // POST_GLOB_EXT must match the pattern used in src/content.config.ts
    expect(POST_GLOB_EXT).toBe("{md,mdx}");
  });
});

describe("isPostFile", () => {
  it.each([
    ["foo.md", true],
    ["foo.mdx", true],
    ["foo.MD", true],
    ["foo.MDX", true],
    ["foo.Md", true],
    ["mixed-case-Name.MdX", true],
    ["foo.txt", false],
    ["foo", false],
    ["foo.markdown", false],
    ["foo.md.bak", false],
    ["", false],
  ])("isPostFile(%j) -> %s", (input, expected) => {
    expect(isPostFile(input)).toBe(expected);
  });
});

describe("stripPostExtension", () => {
  it("strips .md while preserving stem casing", () => {
    expect(stripPostExtension("hello-World.md")).toBe("hello-World");
  });

  it("strips .mdx while preserving stem casing", () => {
    expect(stripPostExtension("Hello.MDX")).toBe("Hello");
  });

  it("returns original name when no recognised extension", () => {
    expect(stripPostExtension("foo.txt")).toBe("foo.txt");
    expect(stripPostExtension("README")).toBe("README");
  });

  it("preserves non-ASCII stems", () => {
    expect(stripPostExtension("自建-hoarder.md")).toBe("自建-hoarder");
  });
});
