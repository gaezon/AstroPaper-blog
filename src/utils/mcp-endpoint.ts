import { buildErrorEnvelope, buildHandshake } from "./mcp";

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

export async function handleMcpEndpointRequest(
  request: Request
): Promise<Response> {
  switch (request.method) {
    case "GET":
      return json(200, buildHandshake({ liveHandshake: true }));

    case "POST": {
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

      return json(200, {
        jsonrpc: "2.0",
        id: body.id,
        result: buildHandshake({ liveHandshake: true }),
      });
    }

    default:
      return methodNotAllowed();
  }
}
