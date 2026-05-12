// Feature: agent-readiness-optimization, Property 18: Generated bilingual mapping never emits the `zh` alias
import { describe, it, expect, vi } from "vitest";
import fc from "fast-check";

// bilingualMapping.ts has no `@/` imports, so the mock block is minimal.
// But test structure benefits from pinning fc + vi for future maintainers.
void vi;

import {
  dynamicSlugMapping,
  unifiedCommentPaths,
  mappingMetadata,
} from "../../src/utils/generated/bilingualMapping";

function collectStrings(value: unknown, acc: string[] = []): string[] {
  if (typeof value === "string") {
    acc.push(value);
  } else if (Array.isArray(value)) {
    for (const v of value) {
      collectStrings(v, acc);
    }
  } else if (value && typeof value === "object") {
    for (const v of Object.values(value as Record<string, unknown>)) {
      collectStrings(v, acc);
    }
  }
  return acc;
}

describe("bilingual mapping locale invariants (P18)", () => {
  it("zh paths start with /posts/ not /zh/ or /zh-CN/", () => {
    // Validates: Requirements 6.6
    for (const [title, entry] of Object.entries(unifiedCommentPaths)) {
      expect(
        entry.zhPath.startsWith("/posts/"),
        `zh path for ${title}: ${entry.zhPath}`
      ).toBe(true);
      expect(
        entry.zhPath.startsWith("/zh/"),
        `zhPath should not start with /zh/: ${entry.zhPath}`
      ).toBe(false);
      expect(
        entry.zhPath.startsWith("/zh-CN/"),
        `zhPath should not start with /zh-CN/: ${entry.zhPath}`
      ).toBe(false);
    }
  });

  it("en paths start with /en/posts/", () => {
    // Validates: Requirements 6.6
    for (const [title, entry] of Object.entries(unifiedCommentPaths)) {
      expect(
        entry.enPath.startsWith("/en/posts/"),
        `en path for ${title}: ${entry.enPath}`
      ).toBe(true);
    }
  });

  it("no value anywhere in the mapping equals the bare string 'zh'", () => {
    // Validates: Requirements 6.6
    const allStrings = [
      ...collectStrings(dynamicSlugMapping),
      ...collectStrings(unifiedCommentPaths),
      ...collectStrings(mappingMetadata),
    ];
    const offenders = allStrings.filter(s => s === "zh");
    expect(offenders, `mapping contains "zh" alias`).toEqual([]);
  });

  it("no path contains a /zh/ or /zh-CN/ segment", () => {
    // Validates: Requirements 6.6
    const pathStrings = Object.values(unifiedCommentPaths).flatMap(e => [
      e.zhPath,
      e.enPath,
      e.unifiedCommentPath,
    ]);
    for (const p of pathStrings) {
      expect(p.includes("/zh/"), `path contains /zh/: ${p}`).toBe(false);
      expect(p.includes("/zh-CN/"), `path contains /zh-CN/: ${p}`).toBe(false);
    }
  });

  it("zhPath and enPath are distinct for every entry", () => {
    // Validates: Requirements 6.6
    const entries = Object.values(unifiedCommentPaths);
    // When the fixture has at least one entry, sample via fast-check; otherwise
    // skip the property assertion (empty mapping would fail fc.constantFrom).
    if (entries.length === 0) return;
    fc.assert(
      fc.property(fc.constantFrom(...entries), entry => {
        expect(entry.zhPath).not.toBe(entry.enPath);
      }),
      { numRuns: 100 }
    );
  });

  it("every zhPath and enPath ends with trailing slash", () => {
    // Validates: Requirements 6.6
    for (const entry of Object.values(unifiedCommentPaths)) {
      expect(entry.zhPath.endsWith("/")).toBe(true);
      expect(entry.enPath.endsWith("/")).toBe(true);
    }
  });
});
