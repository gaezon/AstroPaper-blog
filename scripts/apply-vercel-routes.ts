import { mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { pathToFileURL } from "node:url";
import * as esbuild from "esbuild";

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
  '</docs.md>; rel="describedby"; type="text/markdown"',
  '</agent-integration.md>; rel="describedby"; type="text/markdown"',
  '</webhooks.md>; rel="describedby"; type="text/markdown"',
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

/**
 * Bundle `mcp-endpoint.ts` and its dependency tree into a self-contained ESM
 * file suitable for the Vercel Node.js serverless runtime (nodejs24.x).
 *
 * Strategy:
 *  1. Write a temporary entry file that re-exports `handleMcpEndpointRequest`
 *     as the default Vercel fetch handler.
 *  2. Run `esbuild.build()` with `bundle: true`, `platform: "node"`, targeting
 *     the same Node.js runtime declared in `.vc-config.json` (nodejs24.x).
 *  3. Return the bundled text; clean up the temp directory.
 *
 * The import specifier in the entry shim uses POSIX forward-slash separators
 * (via `replaceAll("\\", "/")`) so esbuild can resolve the path on all
 * platforms, including Windows where `path.join` produces backslashes.
 */
export async function buildMcpWellKnownFunctionBundle(): Promise<string> {
  // Resolve paths relative to the repo root (this script lives in scripts/)
  const repoRoot = resolve(import.meta.dirname, "..");
  const endpointSrc = join(repoRoot, "src/utils/mcp-endpoint.ts");

  // Use forward slashes so the specifier is valid on all platforms (esbuild
  // resolves file-system paths, not file:// URLs; POSIX separators work on
  // Windows too when passed to esbuild's bundler).
  const endpointPosix = endpointSrc.replaceAll("\\", "/");

  // Wrap the existing handler in the Vercel default-export fetch shape.
  const entrySource = `import { handleMcpEndpointRequest } from ${JSON.stringify(endpointPosix)};
export default { fetch: handleMcpEndpointRequest };
`;

  const tmpDir = await mkdtemp(join(tmpdir(), "mcp-bundle-"));
  const entryFile = join(tmpDir, "entry.ts");

  try {
    await writeFile(entryFile, entrySource, "utf8");

    const result = await esbuild.build({
      entryPoints: [entryFile],
      bundle: true,
      format: "esm",
      // Match the runtime declared in .vc-config.json (nodejs24.x).
      platform: "node",
      target: "node24",
      write: false,
      minify: false,
      treeShaking: true,
      logLevel: "error",
    });

    const output = result.outputFiles[0];
    if (!output) {
      throw new Error("esbuild produced no output files.");
    }
    return output.text;
  } finally {
    await rm(tmpDir, { recursive: true, force: true });
  }
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
  const bundleSource = await buildMcpWellKnownFunctionBundle();
  await writeFile(
    `${MCP_WELL_KNOWN_FUNCTION_DIR}/index.mjs`,
    bundleSource,
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
