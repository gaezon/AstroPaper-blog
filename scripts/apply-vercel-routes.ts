import { mkdir, readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { buildErrorEnvelope, buildHandshake } from "../src/utils/mcp";

type VercelRoute = {
  src?: string;
  dest?: string;
  status?: number;
  handle?: string;
  continue?: boolean;
  has?: Array<{
    type: "header";
    key: string;
    value?: string;
  }>;
  headers?: Record<string, string>;
};

type VercelConfig = {
  version: number;
  routes: VercelRoute[];
};

const CONFIG_PATH = ".vercel/output/config.json";
const MCP_WELL_KNOWN_FUNCTION_DIR =
  ".vercel/output/functions/.well-known/mcp.func";
const VERCEL_WELL_KNOWN_BLOCK_ROUTE_SRC = "^/\\.well-known(?:/.*)?$";
const MCP_SAFE_WELL_KNOWN_BLOCK_ROUTE_SRC =
  "^/\\.well-known(?:/(?!mcp(?:/|$)).*)?$";
const VERCEL_EXTENSIONLESS_REDIRECT_ROUTE_SRC = "^/((?:[^/]+/)*[^/\\.]+)$";
const MCP_SAFE_EXTENSIONLESS_REDIRECT_ROUTE_SRC =
  "^/(?!\\.well-known/mcp$)((?:[^/]+/)*[^/\\.]+)$";
// Keep this deployable with the current site runtime:
// - inline scripts/styles are still used for first paint, comments, and search UI;
// - Pagefind loads WebAssembly at runtime and requires wasm-unsafe-eval.
// Tightening these directives should be paired with moving inline code to
// bundled assets or adding nonces/hashes.
const CONTENT_SECURITY_POLICY = [
  "default-src 'self'",
  "base-uri 'self'",
  "object-src 'none'",
  "frame-ancestors 'none'",
  "form-action 'self'",
  "script-src 'self' 'unsafe-inline' 'wasm-unsafe-eval' https://umami.gaazeon.com https://cdn.jsdelivr.net",
  "style-src 'self' 'unsafe-inline' https://cdn.jsdelivr.net",
  "img-src 'self' data: blob: https:",
  "font-src 'self' data:",
  "connect-src 'self' https://umami.gaazeon.com https://comment.gaazeon.com",
  "worker-src 'self' blob:",
  "manifest-src 'self'",
  "upgrade-insecure-requests",
].join("; ");

const DISCOVERY_LINK_HEADER = [
  '</sitemap-index.xml>; rel="sitemap"; type="application/xml"',
  '</llms.txt>; rel="describedby"; type="text/markdown"',
  '</index.md>; rel="alternate"; type="text/markdown"',
  '</agent-integration.md>; rel="describedby"; type="text/markdown"',
  '</openapi.json>; rel="service-desc"; type="application/vnd.oai.openapi+json"',
  '</.well-known/api-catalog>; rel="api-catalog"; type="application/linkset+json"',
  '</.well-known/agent-card.json>; rel="service-desc"; type="application/json"',
  '</.well-known/mcp/server-card.json>; rel="service-desc"; type="application/json"',
  '</.well-known/ai-plugin.json>; rel="service-desc"; type="application/json"',
].join(", ");

export const SECURITY_HEADERS_ROUTE = {
  src: "^/(.*)$",
  headers: {
    "Content-Security-Policy": CONTENT_SECURITY_POLICY,
    Link: DISCOVERY_LINK_HEADER,
    "Referrer-Policy": "strict-origin-when-cross-origin",
    "X-Content-Type-Options": "nosniff",
    "Permissions-Policy":
      "camera=(), microphone=(), geolocation=(), payment=(), usb=(), magnetometer=(), accelerometer=(), gyroscope=()",
  },
  continue: true,
} as const satisfies VercelRoute;

export const API_CATALOG_HEADERS_ROUTE = {
  src: "^/\\.well-known/api-catalog$",
  headers: {
    "Content-Type": "application/linkset+json; charset=utf-8",
  },
  continue: true,
} as const satisfies VercelRoute;

export const AGENT_SKILLS_HEADERS_ROUTE = {
  src: "^/\\.well-known/agent-skills$",
  headers: {
    "Content-Type": "application/json; charset=utf-8",
  },
  continue: true,
} as const satisfies VercelRoute;

export const AGENT_CARD_HEADERS_ROUTE = {
  src: "^/\\.well-known/agent-card\\.json$",
  headers: {
    "Content-Type": "application/json; charset=utf-8",
  },
  continue: true,
} as const satisfies VercelRoute;

export const AI_PLUGIN_HEADERS_ROUTE = {
  src: "^/\\.well-known/ai-plugin\\.json$",
  headers: {
    "Content-Type": "application/json; charset=utf-8",
  },
  continue: true,
} as const satisfies VercelRoute;

export const API_JSON_NOT_FOUND_ROUTE = {
  src: "^/api(?:/.*)?$",
  dest: "/api-error.json",
  status: 404,
  headers: {
    "Content-Type": "application/json; charset=utf-8",
  },
} as const satisfies VercelRoute;

export const MARKDOWN_INDEX_NEGOTIATION_ROUTE = {
  src: "^/$",
  has: [
    {
      type: "header",
      key: "accept",
      value: ".*text/markdown.*",
    },
  ],
  dest: "/index.md",
  headers: {
    "Content-Type": "text/markdown; charset=utf-8",
    Vary: "Accept",
  },
} as const satisfies VercelRoute;

const SECURITY_HEADER_KEYS = new Set(
  Object.keys(SECURITY_HEADERS_ROUTE.headers).map(key => key.toLowerCase())
);

const SECURITY_ROUTE_ID_HEADERS = Object.fromEntries(
  Object.entries(SECURITY_HEADERS_ROUTE.headers).filter(
    ([key]) => key !== "Link"
  )
);

const API_CATALOG_HEADER_KEYS = new Set(
  Object.keys(API_CATALOG_HEADERS_ROUTE.headers).map(key => key.toLowerCase())
);

const AGENT_SKILLS_HEADER_KEYS = new Set(
  Object.keys(AGENT_SKILLS_HEADERS_ROUTE.headers).map(key => key.toLowerCase())
);

const AGENT_CARD_HEADER_KEYS = new Set(
  Object.keys(AGENT_CARD_HEADERS_ROUTE.headers).map(key => key.toLowerCase())
);

const AI_PLUGIN_HEADER_KEYS = new Set(
  Object.keys(AI_PLUGIN_HEADERS_ROUTE.headers).map(key => key.toLowerCase())
);

const API_JSON_NOT_FOUND_HEADER_KEYS = new Set(
  Object.keys(API_JSON_NOT_FOUND_ROUTE.headers).map(key => key.toLowerCase())
);

const MARKDOWN_INDEX_NEGOTIATION_HEADER_KEYS = new Set(
  Object.keys(MARKDOWN_INDEX_NEGOTIATION_ROUTE.headers).map(key =>
    key.toLowerCase()
  )
);

const DEFAULT_NOT_FOUND_ROUTE = {
  src: "^/.*$",
  dest: "/404.html",
  status: 404,
} as const;

export const LOCALIZED_NOT_FOUND_ROUTES = [
  {
    src: "^/en(?:/.*)?$",
    dest: "/en/404/index.html",
    status: 404,
  },
  DEFAULT_NOT_FOUND_ROUTE,
] as const satisfies readonly VercelRoute[];

const ENGLISH_NOT_FOUND_ROUTE = LOCALIZED_NOT_FOUND_ROUTES[0];

const hasSameHeaders = (
  routeHeaders: VercelRoute["headers"],
  expectedHeaders: Record<string, string>
) => {
  if (!routeHeaders) return false;

  const normalizedRouteHeaders = Object.fromEntries(
    Object.entries(routeHeaders).map(([key, value]) => [
      key.toLowerCase(),
      value,
    ])
  );

  return Object.entries(expectedHeaders).every(
    ([key, value]) => normalizedRouteHeaders[key.toLowerCase()] === value
  );
};

const hasSameHasConditions = (
  routeHas: VercelRoute["has"],
  expectedHas: VercelRoute["has"]
): boolean => {
  if (!routeHas || !expectedHas) return routeHas === expectedHas;
  if (routeHas.length !== expectedHas.length) return false;

  return expectedHas.every((expected, index) => {
    const actual = routeHas[index];
    return (
      actual.type === expected.type &&
      actual.key.toLowerCase() === expected.key.toLowerCase() &&
      actual.value === expected.value
    );
  });
};

const hasSameRouteShape = (
  route: VercelRoute,
  expected: Partial<VercelRoute>
) =>
  Object.entries(expected).every(([key, value]) => {
    if (key === "headers") {
      return hasSameHeaders(route.headers, value as Record<string, string>);
    }

    if (key === "has") {
      return hasSameHasConditions(route.has, value as VercelRoute["has"]);
    }

    return route[key as keyof VercelRoute] === value;
  });

const mergeSecurityHeadersRoute = (route?: VercelRoute): VercelRoute => {
  const extraHeaders = Object.fromEntries(
    Object.entries(route?.headers ?? {}).filter(
      ([key]) => !SECURITY_HEADER_KEYS.has(key.toLowerCase())
    )
  );

  return {
    ...SECURITY_HEADERS_ROUTE,
    headers: {
      ...extraHeaders,
      ...SECURITY_HEADERS_ROUTE.headers,
    },
  };
};

const isSecurityHeadersRoute = (route: VercelRoute) =>
  route.src === SECURITY_HEADERS_ROUTE.src &&
  route.continue === SECURITY_HEADERS_ROUTE.continue &&
  hasSameHeaders(route.headers, SECURITY_ROUTE_ID_HEADERS);

const mergeHeadersRoute = (
  expectedRoute: VercelRoute,
  forcedHeaderKeys: Set<string>,
  route?: VercelRoute
): VercelRoute => {
  const extraHeaders = Object.fromEntries(
    Object.entries(route?.headers ?? {}).filter(
      ([key]) => !forcedHeaderKeys.has(key.toLowerCase())
    )
  );

  return {
    ...expectedRoute,
    headers: {
      ...extraHeaders,
      ...expectedRoute.headers,
    },
  };
};

export function applyLocalized404Routes(config: VercelConfig): VercelConfig {
  const routes = config.routes.filter(
    route => !hasSameRouteShape(route, ENGLISH_NOT_FOUND_ROUTE)
  );

  const fallbackIndex = routes.findIndex(route =>
    hasSameRouteShape(route, DEFAULT_NOT_FOUND_ROUTE)
  );

  if (fallbackIndex === -1) {
    throw new Error("Could not find Vercel default 404 fallback route.");
  }

  routes.splice(fallbackIndex, 1, ...LOCALIZED_NOT_FOUND_ROUTES);

  return {
    ...config,
    routes,
  };
}

export function applySecurityHeaders(config: VercelConfig): VercelConfig {
  const existingSecurityHeadersRoute = config.routes.find(route =>
    isSecurityHeadersRoute(route)
  );
  const routes = config.routes.filter(route => !isSecurityHeadersRoute(route));

  return {
    ...config,
    routes: [
      mergeSecurityHeadersRoute(existingSecurityHeadersRoute),
      ...routes,
    ],
  };
}

export function applyApiCatalogHeaders(config: VercelConfig): VercelConfig {
  const existingApiCatalogHeadersRoute = config.routes.find(route =>
    hasSameRouteShape(route, API_CATALOG_HEADERS_ROUTE)
  );
  const routes = config.routes.filter(
    route => !hasSameRouteShape(route, API_CATALOG_HEADERS_ROUTE)
  );

  return {
    ...config,
    routes: [
      mergeHeadersRoute(
        API_CATALOG_HEADERS_ROUTE,
        API_CATALOG_HEADER_KEYS,
        existingApiCatalogHeadersRoute
      ),
      ...routes,
    ],
  };
}

export function applyAgentSkillsHeaders(config: VercelConfig): VercelConfig {
  const existingAgentSkillsHeadersRoute = config.routes.find(route =>
    hasSameRouteShape(route, AGENT_SKILLS_HEADERS_ROUTE)
  );
  const routes = config.routes.filter(
    route => !hasSameRouteShape(route, AGENT_SKILLS_HEADERS_ROUTE)
  );

  return {
    ...config,
    routes: [
      mergeHeadersRoute(
        AGENT_SKILLS_HEADERS_ROUTE,
        AGENT_SKILLS_HEADER_KEYS,
        existingAgentSkillsHeadersRoute
      ),
      ...routes,
    ],
  };
}

export function applyAgentCardHeaders(config: VercelConfig): VercelConfig {
  const existingAgentCardHeadersRoute = config.routes.find(route =>
    hasSameRouteShape(route, AGENT_CARD_HEADERS_ROUTE)
  );
  const routes = config.routes.filter(
    route => !hasSameRouteShape(route, AGENT_CARD_HEADERS_ROUTE)
  );

  return {
    ...config,
    routes: [
      mergeHeadersRoute(
        AGENT_CARD_HEADERS_ROUTE,
        AGENT_CARD_HEADER_KEYS,
        existingAgentCardHeadersRoute
      ),
      ...routes,
    ],
  };
}

export function applyAiPluginHeaders(config: VercelConfig): VercelConfig {
  const existingAiPluginHeadersRoute = config.routes.find(route =>
    hasSameRouteShape(route, AI_PLUGIN_HEADERS_ROUTE)
  );
  const routes = config.routes.filter(
    route => !hasSameRouteShape(route, AI_PLUGIN_HEADERS_ROUTE)
  );

  return {
    ...config,
    routes: [
      mergeHeadersRoute(
        AI_PLUGIN_HEADERS_ROUTE,
        AI_PLUGIN_HEADER_KEYS,
        existingAiPluginHeadersRoute
      ),
      ...routes,
    ],
  };
}

export function applyMarkdownIndexNegotiation(
  config: VercelConfig
): VercelConfig {
  const existingMarkdownIndexNegotiationRoute = config.routes.find(route =>
    hasSameRouteShape(route, MARKDOWN_INDEX_NEGOTIATION_ROUTE)
  );
  const routes = config.routes.filter(
    route => !hasSameRouteShape(route, MARKDOWN_INDEX_NEGOTIATION_ROUTE)
  );
  const filesystemIndex = routes.findIndex(
    route => route.handle === "filesystem"
  );

  if (filesystemIndex === -1) {
    throw new Error("Could not find Vercel filesystem route.");
  }

  routes.splice(
    filesystemIndex,
    0,
    mergeHeadersRoute(
      MARKDOWN_INDEX_NEGOTIATION_ROUTE,
      MARKDOWN_INDEX_NEGOTIATION_HEADER_KEYS,
      existingMarkdownIndexNegotiationRoute
    )
  );

  return {
    ...config,
    routes,
  };
}

export function applyMcpWellKnownRoute(config: VercelConfig): VercelConfig {
  const routes = config.routes.filter(
    route => route.src !== "^/\\.well-known/mcp$"
  );
  const wellKnownBlockIndex = routes.findIndex(
    route =>
      route.src === VERCEL_WELL_KNOWN_BLOCK_ROUTE_SRC ||
      route.src === MCP_SAFE_WELL_KNOWN_BLOCK_ROUTE_SRC
  );

  if (wellKnownBlockIndex !== -1) {
    routes[wellKnownBlockIndex] = {
      ...routes[wellKnownBlockIndex],
      src: MCP_SAFE_WELL_KNOWN_BLOCK_ROUTE_SRC,
    };
  }

  const mcpSafeRoutes = routes.map(route =>
    route.src === VERCEL_EXTENSIONLESS_REDIRECT_ROUTE_SRC ||
    route.src === MCP_SAFE_EXTENSIONLESS_REDIRECT_ROUTE_SRC
      ? { ...route, src: MCP_SAFE_EXTENSIONLESS_REDIRECT_ROUTE_SRC }
      : route
  );

  return {
    ...config,
    routes: mcpSafeRoutes,
  };
}

export function applyApiJsonNotFoundRoute(config: VercelConfig): VercelConfig {
  const existingApiJsonNotFoundRoute = config.routes.find(route =>
    hasSameRouteShape(route, API_JSON_NOT_FOUND_ROUTE)
  );
  const routes = config.routes.filter(
    route => !hasSameRouteShape(route, API_JSON_NOT_FOUND_ROUTE)
  );
  const filesystemIndex = routes.findIndex(
    route => route.handle === "filesystem"
  );

  if (filesystemIndex === -1) {
    throw new Error("Could not find Vercel filesystem route.");
  }

  routes.splice(
    filesystemIndex + 1,
    0,
    mergeHeadersRoute(
      API_JSON_NOT_FOUND_ROUTE,
      API_JSON_NOT_FOUND_HEADER_KEYS,
      existingApiJsonNotFoundRoute
    )
  );

  return {
    ...config,
    routes,
  };
}

export function applyVercelRoutesConfig(config: VercelConfig): VercelConfig {
  const steps = [
    applySecurityHeaders,
    applyApiCatalogHeaders,
    applyAgentSkillsHeaders,
    applyAgentCardHeaders,
    applyAiPluginHeaders,
    applyMcpWellKnownRoute,
    applyApiJsonNotFoundRoute,
    applyMarkdownIndexNegotiation,
    applyLocalized404Routes,
  ];

  return steps.reduce((cfg, step) => step(cfg), config);
}

function buildMcpWellKnownFunctionSource(): string {
  const handshake = buildHandshake({ liveHandshake: true });
  const invalidJson = buildErrorEnvelope({
    code: "invalid_json",
    message: "Request body is not valid JSON.",
    status: 400,
  });
  const unsupportedMethod = buildErrorEnvelope({
    code: "unsupported_method",
    message:
      'Only the MCP "initialize" method is supported. Provide a JSON-RPC 2.0 body with method: "initialize".',
    status: 400,
  });
  const methodNotAllowed = buildErrorEnvelope({
    code: "method_not_allowed",
    message: "Only GET and POST are supported on the MCP discovery endpoint.",
    status: 405,
  });

  return `const handshake = ${JSON.stringify(handshake, null, 2)};
const invalidJson = ${JSON.stringify(invalidJson, null, 2)};
const unsupportedMethod = ${JSON.stringify(unsupportedMethod, null, 2)};
const methodNotAllowed = ${JSON.stringify(methodNotAllowed, null, 2)};

function json(status, body) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json; charset=utf-8" },
  });
}

function isInitializeRequest(body) {
  return (
    typeof body === "object" &&
    body !== null &&
    body.jsonrpc === "2.0" &&
    "id" in body &&
    body.method === "initialize"
  );
}

export default {
  async fetch(request) {
    switch (request.method) {
      case "GET":
        return json(200, handshake);

      case "POST": {
        let body;
        try {
          body = await request.json();
        } catch {
          return json(400, invalidJson);
        }

        if (!isInitializeRequest(body)) {
          return json(400, unsupportedMethod);
        }

        return json(200, {
          jsonrpc: "2.0",
          id: body.id,
          result: handshake,
        });
      }

      default:
        return json(405, methodNotAllowed);
    }
  },
};
`;
}

async function writeMcpWellKnownFunction(): Promise<void> {
  await mkdir(MCP_WELL_KNOWN_FUNCTION_DIR, { recursive: true });
  await writeFile(
    `${MCP_WELL_KNOWN_FUNCTION_DIR}/package.json`,
    `${JSON.stringify({ type: "module" }, null, 2)}\n`,
    "utf8"
  );
  await writeFile(
    `${MCP_WELL_KNOWN_FUNCTION_DIR}/.vc-config.json`,
    `${JSON.stringify(
      {
        runtime: "nodejs24.x",
        handler: "index.mjs",
        launcherType: "Nodejs",
      },
      null,
      2
    )}\n`,
    "utf8"
  );
  await writeFile(
    `${MCP_WELL_KNOWN_FUNCTION_DIR}/index.mjs`,
    buildMcpWellKnownFunctionSource(),
    "utf8"
  );
}

async function main() {
  const rawConfig = await readFile(CONFIG_PATH, "utf8");
  const currentConfig = JSON.parse(rawConfig) as VercelConfig;
  const nextConfig = applyVercelRoutesConfig(currentConfig);
  const formattedConfig = `${JSON.stringify(nextConfig, null, 2)}\n`;

  await writeMcpWellKnownFunction();

  if (rawConfig === formattedConfig) {
    console.log("Vercel routes config and MCP function already applied.");
    return;
  }

  await writeFile(CONFIG_PATH, formattedConfig, "utf8");
  console.log(
    "Applied Vercel routes config and MCP function to .vercel/output."
  );
}

const entryScriptPath = process.argv[1];

if (
  entryScriptPath &&
  import.meta.url === pathToFileURL(resolve(entryScriptPath)).href
) {
  await main();
}
