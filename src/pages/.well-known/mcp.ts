import type { APIRoute } from "astro";
import { buildHandshake, buildErrorEnvelope } from "@/utils/mcp";

export const prerender = false;

function json(status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json; charset=utf-8" },
  });
}

function isInitializeRequest(
  body: unknown
): body is { jsonrpc: "2.0"; id: unknown; method: "initialize" } {
  return (
    typeof body === "object" &&
    body !== null &&
    "jsonrpc" in body &&
    (body as Record<string, unknown>).jsonrpc === "2.0" &&
    "id" in body &&
    "method" in body &&
    (body as Record<string, unknown>).method === "initialize"
  );
}

/**
 * GET /.well-known/mcp — returns the MCP handshake payload directly.
 * Satisfies Req 1.2: status 200, Content-Type application/json, body conforming
 * to MCP_Handshake_Response shape with liveHandshake: true.
 */
export const GET: APIRoute = () => {
  return json(200, buildHandshake({ liveHandshake: true }));
};

/**
 * POST /.well-known/mcp — handles JSON-RPC 2.0 `initialize` method.
 * Satisfies Req 1.3 (valid initialize → 200 JSON-RPC response) and
 * Req 1.7 (invalid JSON or non-initialize method → 400 Error_Envelope).
 */
export const POST: APIRoute = async ({ request }) => {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return json(
      400,
      buildErrorEnvelope({
        code: "invalid_json",
        message: "Request body is not valid JSON.",
        status: 400,
      })
    );
  }

  if (!isInitializeRequest(body)) {
    return json(
      400,
      buildErrorEnvelope({
        code: "unsupported_method",
        message:
          'Only the MCP "initialize" method is supported. Provide a JSON-RPC 2.0 body with method: "initialize".',
        status: 400,
      })
    );
  }

  // Echo the client's `id` verbatim and return the handshake as `result`.
  return json(200, {
    jsonrpc: "2.0",
    id: body.id,
    result: buildHandshake({ liveHandshake: true }),
  });
};

/**
 * PUT/DELETE/PATCH/OPTIONS/HEAD — returns 405 Method Not Allowed.
 * Satisfies Req 1.6.
 */
export const PUT: APIRoute = () => methodNotAllowed();
export const DELETE: APIRoute = () => methodNotAllowed();
export const PATCH: APIRoute = () => methodNotAllowed();
export const OPTIONS: APIRoute = () => methodNotAllowed();
export const HEAD: APIRoute = () => methodNotAllowed();

function methodNotAllowed(): Response {
  return json(
    405,
    buildErrorEnvelope({
      code: "method_not_allowed",
      message: "Only GET and POST are supported on the MCP discovery endpoint.",
      status: 405,
    })
  );
}
