/* eslint-disable no-console */
import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import type { Plugin, ViteDevServer } from "vite";
import type { IncomingMessage, ServerResponse } from "node:http";
import { SECURITY_HEADERS, WELL_KNOWN_CONTENT_TYPES } from "./http-headers";

export function devParityPlugin(): Plugin {
  return {
    name: "vite-plugin-dev-parity",
    apply: "serve", // Only run in development server mode
    configureServer(server: ViteDevServer) {
      server.middlewares.use(
        (req: IncomingMessage, res: ServerResponse, next: () => void) => {
          const url = new URL(
            req.url || "",
            `http://${req.headers.host || "localhost"}`
          );
          const pathname = url.pathname;

          // 1. Markdown content negotiation interception
          const acceptHeader = req.headers["accept"] || "";
          if (pathname === "/" && acceptHeader.includes("text/markdown")) {
            const markdownPath = join(process.cwd(), "public", "index.md");
            if (existsSync(markdownPath)) {
              try {
                const content = readFileSync(markdownPath);
                res.writeHead(200, {
                  "Content-Type": "text/markdown; charset=utf-8",
                  Vary: "Accept",
                  ...SECURITY_HEADERS,
                });
                res.end(content);
                return;
              } catch (err) {
                console.error("Vite Dev Parity Error (index.md):", err);
              }
            }
          }

          // 2. Well-Known discovery resource interception
          for (const [route, contentType] of Object.entries(
            WELL_KNOWN_CONTENT_TYPES
          )) {
            if (
              pathname === `/.well-known${route}` ||
              pathname === `/.well-known${route}/`
            ) {
              const filePath = join(
                process.cwd(),
                "public",
                ".well-known",
                route.replace(/^\//, "")
              );
              if (existsSync(filePath)) {
                try {
                  const content = readFileSync(filePath);
                  res.writeHead(200, {
                    "Content-Type": contentType,
                    ...SECURITY_HEADERS,
                  });
                  res.end(content);
                  return;
                } catch (err) {
                  console.error(`Vite Dev Parity Error (${pathname}):`, err);
                }
              }
            }
          }

          // 3. API 404 JSON interception
          if (pathname === "/api" || pathname.startsWith("/api/")) {
            const cleanPath = pathname.replace(/\/$/, "");

            // Check if this is a valid API route
            const isValidApiRoute =
              cleanPath === "/api/posts.json" ||
              cleanPath === "/api/tags.json" ||
              /^\/api\/posts\/(zh-CN|en)\/.+$/.test(cleanPath);

            if (!isValidApiRoute) {
              const errorJsonPath = join(
                process.cwd(),
                "public",
                "api-error.json"
              );
              if (existsSync(errorJsonPath)) {
                try {
                  const errorContent = readFileSync(errorJsonPath);
                  res.writeHead(404, {
                    "Content-Type": "application/json; charset=utf-8",
                    ...SECURITY_HEADERS,
                  });
                  res.end(errorContent);
                  return;
                } catch (err) {
                  console.error(`Vite Dev Parity Error (API 404):`, err);
                }
              }
            }
          }

          next();
        }
      );
    },
  };
}
