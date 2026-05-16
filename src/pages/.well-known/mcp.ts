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
 * POST /.well-known/mcp — handles JSON-RPC 2.0 `initialize` method.
 * Satisfies Req 1.3 (valid initialize → 200 JSON-RPC response) and
 * Req 1.7 (invalid JSON or non-initialize method → 400 Error_Envelope).
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
