import {
  buildErrorEnvelope,
  buildMcpAppResourceReadResult,
  buildHandshake,
  buildMcpInitializeResult,
  buildMcpJsonRpcError,
  buildMcpJsonRpcResult,
  buildMcpResourceReadResult,
  buildMcpResourcesList,
  buildMcpToolCallResult,
  buildMcpToolsList,
  getMcpResourceByUri,
  getMcpResourceForTool,
  getMcpResourceUri,
  getMcpToolByName,
  isMcpAppResourceUri,
  MCP_PROTOCOL_VERSION,
  type McpJsonRpcRequest,
} from "./mcp";

function json(status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "MCP-Protocol-Version": MCP_PROTOCOL_VERSION,
    },
  });
}

function empty(status: number): Response {
  return new Response(null, { status });
}

function isJsonRpcRequest(body: unknown): body is McpJsonRpcRequest {
  return (
    typeof body === "object" &&
    body !== null &&
    "jsonrpc" in body &&
    (body as Record<string, unknown>).jsonrpc === "2.0" &&
    "method" in body &&
    typeof (body as Record<string, unknown>).method === "string"
  );
}

function requestId(body: unknown): unknown {
  if (typeof body === "object" && body !== null && "id" in body) {
    return (body as Record<string, unknown>).id;
  }
  return null;
}

function objectParams(
  request: McpJsonRpcRequest
): Record<string, unknown> | undefined {
  if (
    typeof request.params === "object" &&
    request.params !== null &&
    !Array.isArray(request.params)
  ) {
    return request.params as Record<string, unknown>;
  }
  return undefined;
}

function requestedProtocolVersion(
  request: McpJsonRpcRequest
): string | undefined {
  const params = objectParams(request);
  return typeof params?.protocolVersion === "string"
    ? params.protocolVersion
    : undefined;
}

async function readCanonicalResource(uri: string) {
  if (isMcpAppResourceUri(uri)) {
    return {
      appResource: buildMcpAppResourceReadResult(),
    };
  }

  const resource = getMcpResourceByUri(uri);

  if (!resource) {
    return {
      error: buildMcpJsonRpcError({
        id: null,
        code: -32602,
        message: "Unknown resource URI.",
        data: { uri },
      }),
    };
  }

  let response: Response;
  try {
    response = await fetch(uri);
  } catch (error) {
    return {
      error: buildMcpJsonRpcError({
        id: null,
        code: -32000,
        message: "Resource fetch failed.",
        data: {
          uri,
          cause: error instanceof Error ? error.message : String(error),
        },
      }),
    };
  }

  if (!response.ok) {
    return {
      error: buildMcpJsonRpcError({
        id: null,
        code: -32000,
        message: "Resource fetch failed.",
        data: { uri, status: response.status },
      }),
    };
  }

  return {
    resource,
    text: await response.text(),
  };
}

async function handleJsonRpcMethod(
  request: McpJsonRpcRequest,
  protocolVersionHeader?: string | null
) {
  const id = requestId(request);

  switch (request.method) {
    case "initialize":
      return buildMcpJsonRpcResult(
        id,
        buildMcpInitializeResult({
          requestedProtocolVersion:
            requestedProtocolVersion(request) ??
            protocolVersionHeader ??
            undefined,
        })
      );

    case "notifications/initialized":
      return undefined;

    case "resources/list":
      return buildMcpJsonRpcResult(id, buildMcpResourcesList());

    case "resources/read": {
      const params = objectParams(request);
      const uri = params?.uri;
      if (typeof uri !== "string") {
        return buildMcpJsonRpcError({
          id,
          code: -32602,
          message: 'Invalid params: "uri" must be a string.',
        });
      }

      const result = await readCanonicalResource(uri);
      if ("error" in result) {
        return { ...result.error, id };
      }
      if ("appResource" in result) {
        return buildMcpJsonRpcResult(id, result.appResource);
      }

      return buildMcpJsonRpcResult(
        id,
        buildMcpResourceReadResult(result.resource, result.text)
      );
    }

    case "tools/list":
      return buildMcpJsonRpcResult(id, buildMcpToolsList());

    case "tools/call": {
      const params = objectParams(request);
      const name = params?.name;
      if (typeof name !== "string") {
        return buildMcpJsonRpcError({
          id,
          code: -32602,
          message: 'Invalid params: "name" must be a string.',
        });
      }

      const tool = getMcpToolByName(name);
      const resource = tool ? getMcpResourceForTool(tool) : undefined;
      if (!tool || !resource) {
        return buildMcpJsonRpcError({
          id,
          code: -32602,
          message: "Unknown tool name.",
          data: { name },
        });
      }

      const result = await readCanonicalResource(getMcpResourceUri(resource));
      if ("error" in result) {
        return { ...result.error, id };
      }
      if ("appResource" in result) {
        return buildMcpJsonRpcResult(id, result.appResource);
      }

      return buildMcpJsonRpcResult(
        id,
        buildMcpToolCallResult(tool, result.text)
      );
    }

    default:
      return buildMcpJsonRpcError({
        id,
        code: -32601,
        message: "Method not found.",
        data: {
          supportedMethods: [
            "initialize",
            "notifications/initialized",
            "resources/list",
            "resources/read",
            "tools/list",
            "tools/call",
          ],
        },
      });
  }
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
      if (request.headers.get("Accept")?.includes("text/event-stream")) {
        return methodNotAllowed();
      }
      return json(200, buildHandshake({ liveHandshake: true }));

    case "POST": {
      let body: unknown;
      try {
        body = await request.json();
      } catch {
        return json(
          400,
          buildMcpJsonRpcError({
            id: null,
            code: -32700,
            message: "Parse error.",
          })
        );
      }

      if (!isJsonRpcRequest(body)) {
        return json(
          400,
          buildMcpJsonRpcError({
            id: requestId(body),
            code: -32600,
            message:
              'Invalid Request. Provide a JSON-RPC 2.0 object with a string "method".',
          })
        );
      }

      const result = await handleJsonRpcMethod(
        body,
        request.headers.get("MCP-Protocol-Version")
      );
      return result === undefined ? empty(202) : json(200, result);
    }

    default:
      return methodNotAllowed();
  }
}
