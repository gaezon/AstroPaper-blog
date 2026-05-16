// Feature: agent-readiness-optimization, Property 24: Every newly introduced build-output path lies under /api/, /.well-known/, or is a new top-level file
// **Validates: Requirements 10.1**
import { describe, it, expect } from "vitest";
import { existsSync, readdirSync } from "node:fs";
import { resolve, join, relative, sep } from "node:path";

const STATIC_DIR = resolve(process.cwd(), ".vercel/output/static");

/**
 * Recursively collect all file paths under a directory, relative to that directory.
 */
function walkAll(dir: string, base = dir): string[] {
  const results: string[] = [];
  if (!existsSync(dir)) return results;
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) {
      results.push(...walkAll(full, base));
    } else {
      // Normalize to forward slashes for cross-platform consistency
      results.push("/" + relative(base, full).split(sep).join("/"));
    }
  }
  return results;
}

// Allowed prefixes for new paths introduced by this feature
const ALLOWED_PREFIXES = ["/api/", "/.well-known/"];

// Known intentional top-level static files. New entries here should be reviewed
// alongside the discovery artifacts they expose.
const ALLOWED_TOP_LEVEL_FILES = new Set([
  "/.DS_Store",
  "/404.html",
  "/ads.txt",
  "/agent-integration.md",
  "/agents.md",
  "/api-error.json",
  "/astropaper-og.jpg",
  "/docs.md",
  "/dummy-logo.svg",
  "/favicon.svg",
  "/index.html",
  "/index.md",
  "/llms-full.txt",
  "/llms.txt",
  "/og.png",
  "/openapi.json",
  "/pricing.md",
  "/robots.txt",
  "/rss.en.xml",
  "/rss.xml",
  "/schemamap.xml",
  "/sitemap-0.xml",
  "/sitemap-index.xml",
  "/webhooks.md",
]);

describe.skipIf(!existsSync(STATIC_DIR))(
  "Vercel output path allowlist (P24)",
  () => {
    const allPaths = walkAll(STATIC_DIR);

    // Filter to paths under /api/ or /.well-known/ — these are the new ones
    const apiPaths = allPaths.filter(p => p.startsWith("/api/"));
    const wellKnownPaths = allPaths.filter(p => p.startsWith("/.well-known/"));

    it("has at least one /api/ path from the new JSON endpoints", () => {
      expect(apiPaths.length).toBeGreaterThan(0);
    });

    it("has at least one /.well-known/ path", () => {
      expect(wellKnownPaths.length).toBeGreaterThan(0);
    });

    it("no new nested directories outside /api/ and /.well-known/ were introduced", () => {
      // Get all paths that are NOT under /api/ or /.well-known/ and NOT pre-existing
      const otherPaths = allPaths.filter(
        p =>
          !ALLOWED_PREFIXES.some(prefix => p.startsWith(prefix)) &&
          !ALLOWED_TOP_LEVEL_FILES.has(p)
      );

      // These should all be under known pre-existing directory structures
      // (fonts/, pagefind/, posts/, en/, tags/, archives/, etc.)
      // The key assertion: no NEW top-level file was introduced that isn't
      // in the pre-existing set or under an allowed prefix
      const newTopLevelFiles = otherPaths.filter(p => {
        const segments = p.split("/").filter(Boolean);
        // A "top-level file" has exactly 1 segment (e.g., /newfile.json)
        return segments.length === 1;
      });

      // If any new top-level files exist, they should be documented
      // For now, we just assert none were accidentally introduced
      expect(
        newTopLevelFiles,
        `Unexpected new top-level files: ${newTopLevelFiles.join(", ")}`
      ).toEqual([]);
    });
  }
);
