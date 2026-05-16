import type { APIRoute } from "astro";
import { handleMcpEndpointRequest } from "@/utils/mcp-endpoint";

export const prerender = false;

/**
 * GET /.well-known/mcp — returns the MCP handshake payload directly.
 * Satisfies Req 1.2: status 200, Content-Type application/json, body conforming
 * to MCP_Handshake_Response shape with liveHandshake: true.
 */
export const GET: APIRoute = ({ request }) => {
  return handleMcpEndpointRequest(request);
};

/**
 * POST /.well-known/mcp — handles read-only JSON-RPC 2.0 MCP methods:
 * initialize, resources/list, resources/read, tools/list, and tools/call.
 */
export const POST: APIRoute = ({ request }) => {
  return handleMcpEndpointRequest(request);
};

/**
 * PUT/DELETE/PATCH/OPTIONS/HEAD — returns 405 Method Not Allowed.
 * Satisfies Req 1.6.
 */
export const PUT: APIRoute = ({ request }) => handleMcpEndpointRequest(request);
export const DELETE: APIRoute = ({ request }) =>
  handleMcpEndpointRequest(request);
export const PATCH: APIRoute = ({ request }) =>
  handleMcpEndpointRequest(request);
export const OPTIONS: APIRoute = ({ request }) =>
  handleMcpEndpointRequest(request);
export const HEAD: APIRoute = ({ request }) =>
  handleMcpEndpointRequest(request);
