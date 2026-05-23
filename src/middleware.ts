import { defineMiddleware, sequence } from "astro:middleware";
import { handleMcpEndpointRequest } from "@/utils/mcp-endpoint";
import { SECURITY_HEADERS } from "./utils/http-headers";

// 1. MCP Endpoint handler (Runs in both DEV and PROD)
const mcpEndpoint = defineMiddleware((context, next) => {
  const pathname = new URL(context.request.url).pathname;

  if (pathname === "/.well-known/mcp" || pathname === "/.well-known/mcp/") {
    return handleMcpEndpointRequest(context.request);
  }

  return next();
});

// 2. Dev-only Security Headers & Link Headers for Astro-rendered routes
const devSecurityHeaders = defineMiddleware(async (_context, next) => {
  const response = await next();

  // Append security and discovery headers to the response
  Object.entries(SECURITY_HEADERS).forEach(([key, value]) => {
    response.headers.set(key, value);
  });

  return response;
});

export const onRequest = sequence(
  mcpEndpoint,
  ...(import.meta.env.DEV ? [devSecurityHeaders] : [])
);
