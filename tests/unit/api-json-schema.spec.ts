// Feature: agent-readiness-optimization, Property 22: Every emitted /api/*.json validates against its corresponding schema
import { describe, it, expect } from "vitest";
import { readFileSync, existsSync, readdirSync } from "node:fs";
import { resolve, join } from "node:path";
import Ajv2020 from "ajv/dist/2020";
import addFormats from "ajv-formats";

import postSummarySchema from "../../src/schemas/post-summary.schema.json" with { type: "json" };
import postDetailSchema from "../../src/schemas/post-detail.schema.json" with { type: "json" };
import tagsSchema from "../../src/schemas/tags.schema.json" with { type: "json" };

const API_DIR = resolve(process.cwd(), ".vercel/output/static/api");

const ajv = new Ajv2020({ strict: false });
addFormats(ajv);

const validatePostSummary = ajv.compile(postSummarySchema);
const validatePostDetail = ajv.compile(postDetailSchema);
const validateTags = ajv.compile(tagsSchema);

/**
 * Recursively collect all .json files under a directory.
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

describe.skipIf(!existsSync(API_DIR))(
  "API JSON schema validation (P22)",
  () => {
    it("posts.json validates against post-summary.schema.json", () => {
      // Validates: Requirements 8.4
      const postsPath = join(API_DIR, "posts.json");
      expect(existsSync(postsPath), "posts.json should exist").toBe(true);

      const content = JSON.parse(readFileSync(postsPath, "utf-8"));
      const valid = validatePostSummary(content);
      expect(valid, JSON.stringify(validatePostSummary.errors, null, 2)).toBe(
        true
      );
    });

    it("tags.json validates against tags.schema.json", () => {
      // Validates: Requirements 8.4
      const tagsPath = join(API_DIR, "tags.json");
      expect(existsSync(tagsPath), "tags.json should exist").toBe(true);

      const content = JSON.parse(readFileSync(tagsPath, "utf-8"));
      const valid = validateTags(content);
      expect(valid, JSON.stringify(validateTags.errors, null, 2)).toBe(true);
    });

    describe("per-post detail files validate against post-detail.schema.json", () => {
      const postsDir = join(API_DIR, "posts");
      const detailFiles = existsSync(postsDir) ? walkJson(postsDir) : [];

      it("should find at least one per-post detail file", () => {
        expect(detailFiles.length).toBeGreaterThan(0);
      });

      it.each(detailFiles.map(f => [f.replace(API_DIR, "/api"), f]))(
        "%s validates against post-detail.schema.json",
        (_label, filePath) => {
          // Validates: Requirements 8.4
          const content = JSON.parse(readFileSync(filePath, "utf-8"));
          const valid = validatePostDetail(content);
          expect(
            valid,
            `Schema validation failed for ${_label}:\n${JSON.stringify(validatePostDetail.errors, null, 2)}`
          ).toBe(true);
        }
      );
    });
  }
);
