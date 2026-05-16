import { defineMiddleware } from "astro:middleware";
import { handleMcpEndpointRequest } from "@/utils/mcp-endpoint";

export const onRequest = defineMiddleware((context, next) => {
  const pathname = new URL(context.request.url).pathname;

  if (pathname === "/.well-known/mcp" || pathname === "/.well-known/mcp/") {
    return handleMcpEndpointRequest(context.request);
  }

  return next();
});
