import { readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";

type VercelRoute = {
  src?: string;
  dest?: string;
  status?: number;
  handle?: string;
  continue?: boolean;
  headers?: Record<string, string>;
};

type VercelConfig = {
  version: number;
  routes: VercelRoute[];
};

const CONFIG_PATH = ".vercel/output/config.json";
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
  '</openapi.json>; rel="service-desc"; type="application/vnd.oai.openapi+json"',
  '</.well-known/api-catalog>; rel="api-catalog"; type="application/linkset+json"',
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

const hasSameRouteShape = (
  route: VercelRoute,
  expected: Partial<VercelRoute>
) =>
  Object.entries(expected).every(([key, value]) => {
    if (key === "headers") {
      return hasSameHeaders(route.headers, value as Record<string, string>);
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

export function applyVercelRoutesConfig(config: VercelConfig): VercelConfig {
  return applyLocalized404Routes(
    applyAgentSkillsHeaders(
      applyApiCatalogHeaders(applySecurityHeaders(config))
    )
  );
}

async function main() {
  const rawConfig = await readFile(CONFIG_PATH, "utf8");
  const currentConfig = JSON.parse(rawConfig) as VercelConfig;
  const nextConfig = applyVercelRoutesConfig(currentConfig);
  const formattedConfig = `${JSON.stringify(nextConfig, null, 2)}\n`;

  if (rawConfig === formattedConfig) {
    console.log("Vercel routes config already applied.");
    return;
  }

  await writeFile(CONFIG_PATH, formattedConfig, "utf8");
  console.log("Applied Vercel routes config to .vercel/output/config.json.");
}

const entryScriptPath = process.argv[1];

if (
  entryScriptPath &&
  import.meta.url === pathToFileURL(resolve(entryScriptPath)).href
) {
  await main();
}
