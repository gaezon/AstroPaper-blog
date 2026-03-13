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

const hasSameRouteShape = (
  route: VercelRoute,
  expected: Partial<VercelRoute>
) =>
  Object.entries(expected).every(
    ([key, value]) => route[key as keyof VercelRoute] === value
  );

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

async function main() {
  const rawConfig = await readFile(CONFIG_PATH, "utf8");
  const currentConfig = JSON.parse(rawConfig) as VercelConfig;
  const nextConfig = applyLocalized404Routes(currentConfig);
  const formattedConfig = `${JSON.stringify(nextConfig, null, 2)}\n`;

  if (rawConfig === formattedConfig) {
    console.log("Vercel localized 404 routes already applied.");
    return;
  }

  await writeFile(CONFIG_PATH, formattedConfig, "utf8");
  console.log(
    "Applied localized Vercel 404 routes to .vercel/output/config.json."
  );
}

const entryScriptPath = process.argv[1];

if (
  entryScriptPath &&
  import.meta.url === pathToFileURL(resolve(entryScriptPath)).href
) {
  await main();
}
