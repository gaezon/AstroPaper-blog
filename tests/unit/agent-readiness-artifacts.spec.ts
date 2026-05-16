// Feature: agent-readiness-optimization, Property 23: Every artifact enumerated in the catalog exists after build
// **Validates: Requirements 8.7**
import { describe, it, expect } from "vitest";
import { existsSync, readFileSync } from "node:fs";
import { resolve, join } from "node:path";

const STATIC_DIR = resolve(process.cwd(), ".vercel/output/static");
const CONFIG_PATH = resolve(process.cwd(), ".vercel/output/config.json");
const CATALOG_PATH = resolve(
  process.cwd(),
  "src/schemas/agent-readiness-artifacts.json"
);

const catalog = JSON.parse(readFileSync(CATALOG_PATH, "utf-8")) as {
  requiredPaths: string[];
};

function pathExistsAsStatic(p: string): boolean {
  // Strip leading slash so path.join doesn't treat it as absolute
  const relative = p.replace(/^\//, "");
  const direct = join(STATIC_DIR, relative);
  if (existsSync(direct)) return true;
  const withIndex = join(STATIC_DIR, relative, "index.html");
  if (existsSync(withIndex)) return true;
  return false;
}

function pathExistsAsFunction(p: string): boolean {
  // Function routes are registered in .vercel/output/config.json
  if (!existsSync(CONFIG_PATH)) return false;
  const config = JSON.parse(readFileSync(CONFIG_PATH, "utf-8"));
  const routes = config.routes || [];
  // Check whether any route can serve the required path exactly. Do not
  // normalize missing trailing slashes here; scanners probe the documented URL.
  return routes.some((route: Record<string, unknown>) => {
    if (typeof route.src !== "string") return false;
    const hasRouteTarget =
      Boolean(route.dest) ||
      (typeof route.status === "number" &&
        route.status >= 300 &&
        route.status < 400 &&
        typeof (route.headers as Record<string, unknown> | undefined)
          ?.Location === "string");
    if (!hasRouteTarget) return false;
    try {
      const regex = new RegExp(route.src);
      return regex.test(p);
    } catch {
      return false;
    }
  });
}

describe.skipIf(!existsSync(STATIC_DIR))(
  "agent-readiness artifacts catalog (P23)",
  () => {
    it("catalog file exists and has requiredPaths", () => {
      expect(catalog.requiredPaths).toBeDefined();
      expect(catalog.requiredPaths.length).toBeGreaterThan(0);
    });

    for (const path of catalog.requiredPaths) {
      it(`${path} exists as static file or function route`, () => {
        const exists = pathExistsAsStatic(path) || pathExistsAsFunction(path);
        expect(exists, `Required artifact missing: ${path}`).toBe(true);
      });
    }
  }
);
