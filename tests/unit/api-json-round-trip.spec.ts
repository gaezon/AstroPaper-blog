// Feature: agent-readiness-optimization, Property 13: Every emitted /api/*.json file is UTF-8 without BOM and parses as JSON
import { describe, it, expect } from "vitest";
import { readFileSync, existsSync, readdirSync } from "node:fs";
import { resolve, join } from "node:path";

const API_DIR = resolve(process.cwd(), ".vercel/output/static/api");

/**
 * Recursively walk a directory and collect all .json file paths.
 */
function walkJson(dir: string): string[] {
  const results: string[] = [];
  if (!existsSync(dir)) return results;
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) {
      results.push(...walkJson(full));
    } else if (entry.name.endsWith(".json")) {
      results.push(full);
    }
  }
  return results;
}

describe.skipIf(!existsSync(API_DIR))("API JSON round-trip (P13)", () => {
  const files = walkJson(API_DIR);

  it("should find at least one JSON file in the API output", () => {
    expect(files.length).toBeGreaterThan(0);
  });

  it.each(files.map(f => [f.replace(API_DIR, "/api"), f]))(
    "%s — no UTF-8 BOM",
    (_label, filePath) => {
      // Validates: Requirements 4.4
      const buf = readFileSync(filePath);
      // UTF-8 BOM is EF BB BF
      const hasBom =
        buf.length >= 3 &&
        buf[0] === 0xef &&
        buf[1] === 0xbb &&
        buf[2] === 0xbf;
      expect(hasBom, "File should not start with UTF-8 BOM").toBe(false);
    }
  );

  it.each(files.map(f => [f.replace(API_DIR, "/api"), f]))(
    "%s — JSON.parse → JSON.stringify → JSON.parse deep equality",
    (_label, filePath) => {
      // Validates: Requirements 4.7, 8.8
      const content = readFileSync(filePath, "utf-8");
      const firstParse = JSON.parse(content);
      const serialized = JSON.stringify(firstParse);
      const secondParse = JSON.parse(serialized);
      expect(secondParse).toStrictEqual(firstParse);
    }
  );
});
