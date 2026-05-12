/**
 * Test helper for serving the Vercel prebuilt static output locally.
 *
 * For static file tests (API JSON 404, round-trip validation), this spawns a
 * lightweight HTTP server against `.vercel/output/static/`.
 *
 * For serverless function tests (MCP live endpoint), tests should import the
 * handler directly from `src/pages/.well-known/mcp.ts` and invoke it
 * programmatically — this avoids needing the Vercel CLI or a full function
 * runtime in the test environment.
 */
import { createServer, type Server } from "node:http";
import { readFileSync, existsSync, statSync } from "node:fs";
import { resolve, join, extname } from "node:path";

const STATIC_DIR = resolve(process.cwd(), ".vercel/output/static");
const DEFAULT_PORT = 4173;

let server: Server | null = null;
let port = DEFAULT_PORT;

const MIME_TYPES: Record<string, string> = {
  ".json": "application/json; charset=utf-8",
  ".html": "text/html; charset=utf-8",
  ".xml": "application/xml; charset=utf-8",
  ".txt": "text/plain; charset=utf-8",
  ".md": "text/markdown; charset=utf-8",
};

export const PREVIEW_BASE_URL = `http://localhost:${DEFAULT_PORT}`;

/**
 * Start a static file server for `.vercel/output/static/`.
 * Serves files with correct Content-Type based on extension.
 * For paths under `/api/` that don't match a file, returns the content of
 * `/api-error.json` with status 404 (mimicking the Vercel rewrite).
 */
export async function startPreviewServer(): Promise<string> {
  if (server) return `http://localhost:${port}`;

  return new Promise((resolvePromise, reject) => {
    const srv = createServer((req, res) => {
      const urlPath = (req.url ?? "/").split("?")[0];
      // Strip leading slash for path.join (avoids treating as absolute)
      const relativePath = urlPath.replace(/^\/+/, "");
      const filePath = urlPath.endsWith("/")
        ? join(STATIC_DIR, relativePath, "index.html")
        : join(STATIC_DIR, relativePath);

      if (existsSync(filePath)) {
        try {
          const stat = statSync(filePath);
          if (stat.isFile()) {
            const ext = extname(filePath);
            const contentType = MIME_TYPES[ext] ?? "application/octet-stream";
            const content = readFileSync(filePath);
            res.writeHead(200, { "Content-Type": contentType });
            res.end(content);
            return;
          }
        } catch {
          // Fall through to 404 handling
        }
      }

      // Mimic Vercel's API 404 rewrite for /api or /api/* paths
      if (urlPath === "/api" || urlPath.startsWith("/api/")) {
        const errorFilePath = join(STATIC_DIR, "api-error.json");
        if (existsSync(errorFilePath)) {
          const content = readFileSync(errorFilePath);
          res.writeHead(404, {
            "Content-Type": "application/json; charset=utf-8",
          });
          res.end(content);
          return;
        }
      }

      // Generic 404
      res.writeHead(404, { "Content-Type": "text/plain" });
      res.end("Not Found");
    });

    srv.listen(DEFAULT_PORT, () => {
      server = srv;
      port = DEFAULT_PORT;
      resolvePromise(`http://localhost:${port}`);
    });

    srv.on("error", (err: NodeJS.ErrnoException) => {
      if (err.code === "EADDRINUSE") {
        // Let the OS assign an available port
        srv.listen(0, () => {
          const addr = srv.address();
          port =
            typeof addr === "object" && addr !== null
              ? addr.port
              : DEFAULT_PORT;
          server = srv;
          resolvePromise(`http://localhost:${port}`);
        });
      } else {
        reject(err);
      }
    });
  });
}

/**
 * Stop the preview server and release the port.
 */
export async function stopPreviewServer(): Promise<void> {
  if (!server) return;
  return new Promise(resolvePromise => {
    server!.close(() => {
      server = null;
      resolvePromise();
    });
  });
}

/**
 * Check if the static output directory exists (build must have run).
 */
export function hasStaticOutput(): boolean {
  return existsSync(STATIC_DIR);
}
