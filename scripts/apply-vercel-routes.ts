import { readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { SECURITY_HEADERS } from "../src/utils/http-headers";

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

export const SECURITY_HEADERS_ROUTE = {
  src: "^/(.*)$",
  headers: SECURITY_HEADERS,
  continue: true,
} as const satisfies VercelRoute;

export const ARTICLE_VIEWS_REWRITE_ROUTE = {
  src: "^/api/article-views/$",
  dest: "https://umami.gaazeon.com/api/public/article-views",
  headers: {
    "CDN-Cache-Control": "public, max-age=600, stale-while-revalidate=3600",
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

const isAstroCacheRoute = (route: VercelRoute) =>
  typeof route.src === "string" &&
  route.src.startsWith("^/_astro/") &&
  route.continue === true &&
  !!route.headers &&
  Object.keys(route.headers).some(key => key.toLowerCase() === "cache-control");

/**
 * The Astro Vercel adapter emits its immutable cache-control route for
 * hashed /_astro/ assets after the `handle: "filesystem"` marker. Routes in
 * that phase only run when the filesystem does NOT match, so the header never
 * applies to the very files it targets (production serves them with Vercel's
 * default max-age=0). Hoist the route into the main phase, where header
 * routes with `continue: true` apply before filesystem serving.
 */
export function hoistAstroCacheRoute(config: VercelConfig): VercelConfig {
  const cacheRouteIndex = config.routes.findIndex(isAstroCacheRoute);
  const filesystemIndex = config.routes.findIndex(
    route => route.handle === "filesystem"
  );

  if (
    cacheRouteIndex === -1 ||
    filesystemIndex === -1 ||
    cacheRouteIndex < filesystemIndex
  ) {
    return config;
  }

  const routes = [...config.routes];
  const [cacheRoute] = routes.splice(cacheRouteIndex, 1);
  routes.splice(filesystemIndex, 0, cacheRoute);

  return {
    ...config,
    routes,
  };
}

export function applyArticleViewsRewrite(config: VercelConfig): VercelConfig {
  const routes = config.routes.filter(
    route => !hasSameRouteShape(route, ARTICLE_VIEWS_REWRITE_ROUTE)
  );
  const filesystemIndex = routes.findIndex(
    route => route.handle === "filesystem"
  );

  if (filesystemIndex === -1) {
    throw new Error("Could not find Vercel filesystem route.");
  }

  routes.splice(filesystemIndex, 0, ARTICLE_VIEWS_REWRITE_ROUTE);

  return {
    ...config,
    routes,
  };
}

export function applyVercelRoutesConfig(config: VercelConfig): VercelConfig {
  const steps = [
    applySecurityHeaders,
    hoistAstroCacheRoute,
    applyArticleViewsRewrite,
    applyLocalized404Routes,
  ];

  return steps.reduce((cfg, step) => step(cfg), config);
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
  console.log("Applied Vercel routes config to .vercel/output.");
}

const entryScriptPath = process.argv[1];

if (
  entryScriptPath &&
  import.meta.url === pathToFileURL(resolve(entryScriptPath)).href
) {
  await main();
}
