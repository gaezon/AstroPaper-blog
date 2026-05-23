import { describe, expect, it } from "vitest";
import {
  AGENT_CARD_HEADERS_ROUTE,
  AGENT_SKILLS_HEADERS_ROUTE,
  AI_PLUGIN_HEADERS_ROUTE,
  MCP_SERVER_CARD_HEADERS_ROUTE,
  API_JSON_NOT_FOUND_ROUTE,
  API_CATALOG_HEADERS_ROUTE,
  applyLocalized404Routes,
  applyVercelRoutesConfig,
  LOCALIZED_NOT_FOUND_ROUTES,
  MARKDOWN_INDEX_NEGOTIATION_ROUTE,
  SECURITY_HEADERS_ROUTE,
} from "../../scripts/apply-vercel-routes";

describe("applyLocalized404Routes", () => {
  it("inserts the English 404 route before the default fallback", () => {
    const config = {
      version: 3,
      routes: [
        { handle: "filesystem" },
        {
          src: "^/_astro/(.*)$",
          headers: {
            "cache-control": "public, max-age=31536000, immutable",
          },
          continue: true,
        },
        { src: "^/.*$", dest: "/404.html", status: 404 },
      ],
    };

    expect(applyLocalized404Routes(config).routes).toEqual([
      { handle: "filesystem" },
      {
        src: "^/_astro/(.*)$",
        headers: {
          "cache-control": "public, max-age=31536000, immutable",
        },
        continue: true,
      },
      ...LOCALIZED_NOT_FOUND_ROUTES,
    ]);
  });

  it("stays idempotent when routes are already patched", () => {
    const config = {
      version: 3,
      routes: [{ handle: "filesystem" }, ...LOCALIZED_NOT_FOUND_ROUTES],
    };

    expect(applyLocalized404Routes(config).routes).toEqual(config.routes);
  });
});

describe("applyVercelRoutesConfig", () => {
  it("inserts discovery headers, security headers, and localized 404 routes", () => {
    const astroCacheRoute = {
      src: "^/_astro/(.*)$",
      headers: {
        "cache-control": "public, max-age=31536000, immutable",
      },
      continue: true,
    };
    const config = {
      version: 3,
      routes: [
        { handle: "filesystem" },
        astroCacheRoute,
        { src: "^/.*$", dest: "/404.html", status: 404 },
      ],
    };

    expect(applyVercelRoutesConfig(config).routes).toEqual([
      MCP_SERVER_CARD_HEADERS_ROUTE,
      AI_PLUGIN_HEADERS_ROUTE,
      AGENT_CARD_HEADERS_ROUTE,
      AGENT_SKILLS_HEADERS_ROUTE,
      API_CATALOG_HEADERS_ROUTE,
      SECURITY_HEADERS_ROUTE,
      MARKDOWN_INDEX_NEGOTIATION_ROUTE,
      { handle: "filesystem" },
      API_JSON_NOT_FOUND_ROUTE,
      astroCacheRoute,
      ...LOCALIZED_NOT_FOUND_ROUTES,
    ]);
  });

  it("stays idempotent when discovery headers, security headers, and localized 404 routes are already patched", () => {
    const parsedSecurityHeadersRoute = JSON.parse(
      JSON.stringify(SECURITY_HEADERS_ROUTE)
    );
    const config = {
      version: 3,
      routes: [
        MCP_SERVER_CARD_HEADERS_ROUTE,
        AI_PLUGIN_HEADERS_ROUTE,
        AGENT_CARD_HEADERS_ROUTE,
        AGENT_SKILLS_HEADERS_ROUTE,
        API_CATALOG_HEADERS_ROUTE,
        parsedSecurityHeadersRoute,
        MARKDOWN_INDEX_NEGOTIATION_ROUTE,
        { handle: "filesystem" },
        API_JSON_NOT_FOUND_ROUTE,
        ...LOCALIZED_NOT_FOUND_ROUTES,
      ],
    };

    expect(applyVercelRoutesConfig(config).routes).toEqual(config.routes);
  });

  it("upgrades legacy security headers that are missing the discovery Link header", () => {
    const legacySecurityHeadersRoute = JSON.parse(
      JSON.stringify(SECURITY_HEADERS_ROUTE)
    );
    delete legacySecurityHeadersRoute.headers.Link;
    legacySecurityHeadersRoute.headers["x-extra-security-header"] =
      "preserved-by-platform";

    const config = {
      version: 3,
      routes: [
        legacySecurityHeadersRoute,
        { handle: "filesystem" },
        ...LOCALIZED_NOT_FOUND_ROUTES,
      ],
    };

    expect(applyVercelRoutesConfig(config).routes).toEqual([
      MCP_SERVER_CARD_HEADERS_ROUTE,
      AI_PLUGIN_HEADERS_ROUTE,
      AGENT_CARD_HEADERS_ROUTE,
      AGENT_SKILLS_HEADERS_ROUTE,
      API_CATALOG_HEADERS_ROUTE,
      {
        ...SECURITY_HEADERS_ROUTE,
        headers: {
          "x-extra-security-header": "preserved-by-platform",
          ...SECURITY_HEADERS_ROUTE.headers,
        },
      },
      MARKDOWN_INDEX_NEGOTIATION_ROUTE,
      { handle: "filesystem" },
      API_JSON_NOT_FOUND_ROUTE,
      ...LOCALIZED_NOT_FOUND_ROUTES,
    ]);
  });

  it("adds content type headers for well-known discovery URLs", () => {
    const config = {
      version: 3,
      routes: [{ handle: "filesystem" }, ...LOCALIZED_NOT_FOUND_ROUTES],
    };

    expect(applyVercelRoutesConfig(config).routes[0]).toEqual(
      MCP_SERVER_CARD_HEADERS_ROUTE
    );
    expect(applyVercelRoutesConfig(config).routes[1]).toEqual(
      AI_PLUGIN_HEADERS_ROUTE
    );
    expect(applyVercelRoutesConfig(config).routes[2]).toEqual(
      AGENT_CARD_HEADERS_ROUTE
    );
    expect(applyVercelRoutesConfig(config).routes[3]).toEqual(
      AGENT_SKILLS_HEADERS_ROUTE
    );
    expect(applyVercelRoutesConfig(config).routes[4]).toEqual(
      API_CATALOG_HEADERS_ROUTE
    );
  });

  it("preserves extra headers on well-known discovery URL routes", () => {
    const mcpServerCardRoute = {
      ...MCP_SERVER_CARD_HEADERS_ROUTE,
      headers: {
        "Cache-Control": "public, max-age=300",
        ...MCP_SERVER_CARD_HEADERS_ROUTE.headers,
      },
    };
    const aiPluginRoute = {
      ...AI_PLUGIN_HEADERS_ROUTE,
      headers: {
        "Cache-Control": "public, max-age=300",
        ...AI_PLUGIN_HEADERS_ROUTE.headers,
      },
    };
    const agentCardRoute = {
      ...AGENT_CARD_HEADERS_ROUTE,
      headers: {
        "Cache-Control": "public, max-age=300",
        ...AGENT_CARD_HEADERS_ROUTE.headers,
      },
    };
    const agentSkillsRoute = {
      ...AGENT_SKILLS_HEADERS_ROUTE,
      headers: {
        "Cache-Control": "public, max-age=300",
        ...AGENT_SKILLS_HEADERS_ROUTE.headers,
      },
    };
    const apiCatalogRoute = {
      ...API_CATALOG_HEADERS_ROUTE,
      headers: {
        "Cache-Control": "public, max-age=300",
        ...API_CATALOG_HEADERS_ROUTE.headers,
      },
    };
    const config = {
      version: 3,
      routes: [
        apiCatalogRoute,
        agentSkillsRoute,
        agentCardRoute,
        aiPluginRoute,
        mcpServerCardRoute,
        { handle: "filesystem" },
        ...LOCALIZED_NOT_FOUND_ROUTES,
      ],
    };

    expect(applyVercelRoutesConfig(config).routes.slice(0, 5)).toEqual([
      mcpServerCardRoute,
      aiPluginRoute,
      agentCardRoute,
      agentSkillsRoute,
      apiCatalogRoute,
    ]);
  });

  it("deduplicates serialized security headers and preserves extra headers", () => {
    const serializedSecurityHeadersRoute = JSON.parse(
      JSON.stringify(SECURITY_HEADERS_ROUTE)
    );
    serializedSecurityHeadersRoute.headers = Object.fromEntries(
      Object.entries(serializedSecurityHeadersRoute.headers).map(
        ([key, value]) => [key.toLowerCase(), value]
      )
    );
    serializedSecurityHeadersRoute.headers["x-extra-security-header"] =
      "preserved-by-platform";

    const config = {
      version: 3,
      routes: [
        serializedSecurityHeadersRoute,
        { handle: "filesystem" },
        ...LOCALIZED_NOT_FOUND_ROUTES,
      ],
    };

    expect(applyVercelRoutesConfig(config).routes).toEqual([
      MCP_SERVER_CARD_HEADERS_ROUTE,
      AI_PLUGIN_HEADERS_ROUTE,
      AGENT_CARD_HEADERS_ROUTE,
      AGENT_SKILLS_HEADERS_ROUTE,
      API_CATALOG_HEADERS_ROUTE,
      {
        ...SECURITY_HEADERS_ROUTE,
        headers: {
          "x-extra-security-header": "preserved-by-platform",
          ...SECURITY_HEADERS_ROUTE.headers,
        },
      },
      MARKDOWN_INDEX_NEGOTIATION_ROUTE,
      { handle: "filesystem" },
      API_JSON_NOT_FOUND_ROUTE,
      ...LOCALIZED_NOT_FOUND_ROUTES,
    ]);
  });

  it("inserts Markdown content negotiation before filesystem routing", () => {
    const config = {
      version: 3,
      routes: [{ handle: "filesystem" }, ...LOCALIZED_NOT_FOUND_ROUTES],
    };
    const routes = applyVercelRoutesConfig(config).routes;

    expect(routes).toContainEqual(MARKDOWN_INDEX_NEGOTIATION_ROUTE);

    const mdIndex = routes.findIndex(
      route =>
        route.src === MARKDOWN_INDEX_NEGOTIATION_ROUTE.src &&
        route.dest === MARKDOWN_INDEX_NEGOTIATION_ROUTE.dest
    );
    const fsIndex = routes.findIndex(route => route.handle === "filesystem");

    expect(mdIndex).toBeGreaterThanOrEqual(0);
    expect(mdIndex).toBeLessThan(fsIndex);
  });

  it("keeps the Vercel well-known block from shadowing the MCP filesystem function", () => {
    const wellKnownBlockRoute = { src: "^/\\.well-known(?:/.*)?$" };
    const mcpSafeWellKnownBlockRoute = {
      src: "^/\\.well-known(?:/(?!mcp(?:/|$)).*)?$",
    };
    const extensionlessRedirectRoute = {
      src: "^/((?:[^/]+/)*[^/\\.]+)$",
      headers: {
        Location: "/$1/",
      },
      status: 308,
    };
    const config = {
      version: 3,
      routes: [
        wellKnownBlockRoute,
        extensionlessRedirectRoute,
        { handle: "filesystem" },
        {
          src: "^/\\.well-known/mcp/$",
          dest: "_render",
        },
        ...LOCALIZED_NOT_FOUND_ROUTES,
      ],
    };
    const routes = applyVercelRoutesConfig(config).routes;
    const mcpSafeWellKnownBlockRegex = new RegExp(
      mcpSafeWellKnownBlockRoute.src
    );

    const wellKnownBlockIndex = routes.findIndex(
      route => route.src === mcpSafeWellKnownBlockRoute.src
    );
    const filesystemIndex = routes.findIndex(
      route => route.handle === "filesystem"
    );

    expect(wellKnownBlockIndex).toBeGreaterThanOrEqual(0);
    expect(wellKnownBlockIndex).toBeLessThan(filesystemIndex);
    expect(routes).not.toContainEqual(wellKnownBlockRoute);
    expect(routes).not.toContainEqual({ src: "^/\\.well-known/mcp$" });
    expect("/.well-known/mcp/").not.toMatch(mcpSafeWellKnownBlockRegex);
    expect("/.well-known/mcp/server-card.json").not.toMatch(
      mcpSafeWellKnownBlockRegex
    );
    expect("/.well-known/api-catalog").toMatch(mcpSafeWellKnownBlockRegex);
    expect(routes).not.toContainEqual(extensionlessRedirectRoute);
    expect(routes).toContainEqual({
      ...extensionlessRedirectRoute,
      src: "^/(?!\\.well-known/mcp$)((?:[^/]+/)*[^/\\.]+)$",
    });
  });

  it("removes stale extensionless MCP route variants so filesystem can serve the function", () => {
    const config = {
      version: 3,
      routes: [
        {
          src: "^/\\.well-known/mcp$",
          status: 308,
          headers: {
            Location: "/.well-known/mcp/",
          },
        },
        { handle: "filesystem" },
        ...LOCALIZED_NOT_FOUND_ROUTES,
      ],
    };
    const routes = applyVercelRoutesConfig(config).routes;

    expect(
      routes.filter(route => route.src === "^/\\.well-known/mcp$")
    ).toEqual([]);
  });

  it("inserts the API JSON 404 route after filesystem routing", () => {
    const config = {
      version: 3,
      routes: [{ handle: "filesystem" }, ...LOCALIZED_NOT_FOUND_ROUTES],
    };
    const routes = applyVercelRoutesConfig(config).routes;

    expect(routes).toContainEqual(API_JSON_NOT_FOUND_ROUTE);

    const apiNotFoundIndex = routes.findIndex(
      route =>
        route.src === API_JSON_NOT_FOUND_ROUTE.src &&
        route.dest === API_JSON_NOT_FOUND_ROUTE.dest
    );
    const fsIndex = routes.findIndex(route => route.handle === "filesystem");

    expect(apiNotFoundIndex).toBeGreaterThan(fsIndex);
  });

  it("preserves extra headers on the Markdown negotiation route", () => {
    const markdownRouteWithExtra = {
      ...MARKDOWN_INDEX_NEGOTIATION_ROUTE,
      headers: {
        "Cache-Control": "public, max-age=300",
        ...MARKDOWN_INDEX_NEGOTIATION_ROUTE.headers,
      },
    };
    const config = {
      version: 3,
      routes: [
        markdownRouteWithExtra,
        { handle: "filesystem" },
        ...LOCALIZED_NOT_FOUND_ROUTES,
      ],
    };

    const routes = applyVercelRoutesConfig(config).routes;

    expect(routes).toContainEqual({
      ...MARKDOWN_INDEX_NEGOTIATION_ROUTE,
      headers: {
        "Cache-Control": "public, max-age=300",
        ...MARKDOWN_INDEX_NEGOTIATION_ROUTE.headers,
      },
    });
  });

  it("stays idempotent when Markdown routes carry extra headers", () => {
    const markdownRouteWithExtra = {
      ...MARKDOWN_INDEX_NEGOTIATION_ROUTE,
      headers: {
        "Cache-Control": "public, max-age=300",
        ...MARKDOWN_INDEX_NEGOTIATION_ROUTE.headers,
      },
    };
    const config = {
      version: 3,
      routes: [
        markdownRouteWithExtra,
        API_JSON_NOT_FOUND_ROUTE,
        { handle: "filesystem" },
        ...LOCALIZED_NOT_FOUND_ROUTES,
      ],
    };

    const firstResult = applyVercelRoutesConfig(config);

    expect(applyVercelRoutesConfig(firstResult).routes).toEqual(
      firstResult.routes
    );
  });
});
