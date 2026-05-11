import { describe, expect, it } from "vitest";
import {
  AGENT_CARD_HEADERS_ROUTE,
  AGENT_SKILLS_HEADERS_ROUTE,
  AI_PLUGIN_HEADERS_ROUTE,
  API_JSON_NOT_FOUND_ROUTE,
  API_CATALOG_HEADERS_ROUTE,
  applyLocalized404Routes,
  applyVercelRoutesConfig,
  LOCALIZED_NOT_FOUND_ROUTES,
  MARKDOWN_INDEX_NEGOTIATION_ROUTE,
  MCP_WELL_KNOWN_ROUTE,
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
      AI_PLUGIN_HEADERS_ROUTE,
      AGENT_CARD_HEADERS_ROUTE,
      AGENT_SKILLS_HEADERS_ROUTE,
      API_CATALOG_HEADERS_ROUTE,
      SECURITY_HEADERS_ROUTE,
      MCP_WELL_KNOWN_ROUTE,
      API_JSON_NOT_FOUND_ROUTE,
      MARKDOWN_INDEX_NEGOTIATION_ROUTE,
      { handle: "filesystem" },
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
        AI_PLUGIN_HEADERS_ROUTE,
        AGENT_CARD_HEADERS_ROUTE,
        AGENT_SKILLS_HEADERS_ROUTE,
        API_CATALOG_HEADERS_ROUTE,
        parsedSecurityHeadersRoute,
        MCP_WELL_KNOWN_ROUTE,
        API_JSON_NOT_FOUND_ROUTE,
        MARKDOWN_INDEX_NEGOTIATION_ROUTE,
        { handle: "filesystem" },
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
      MCP_WELL_KNOWN_ROUTE,
      API_JSON_NOT_FOUND_ROUTE,
      MARKDOWN_INDEX_NEGOTIATION_ROUTE,
      { handle: "filesystem" },
      ...LOCALIZED_NOT_FOUND_ROUTES,
    ]);
  });

  it("adds content type headers for well-known discovery URLs", () => {
    const config = {
      version: 3,
      routes: [{ handle: "filesystem" }, ...LOCALIZED_NOT_FOUND_ROUTES],
    };

    expect(applyVercelRoutesConfig(config).routes[0]).toEqual(
      AI_PLUGIN_HEADERS_ROUTE
    );
    expect(applyVercelRoutesConfig(config).routes[1]).toEqual(
      AGENT_CARD_HEADERS_ROUTE
    );
    expect(applyVercelRoutesConfig(config).routes[2]).toEqual(
      AGENT_SKILLS_HEADERS_ROUTE
    );
    expect(applyVercelRoutesConfig(config).routes[3]).toEqual(
      API_CATALOG_HEADERS_ROUTE
    );
  });

  it("preserves extra headers on well-known discovery URL routes", () => {
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
        { handle: "filesystem" },
        ...LOCALIZED_NOT_FOUND_ROUTES,
      ],
    };

    expect(applyVercelRoutesConfig(config).routes.slice(0, 4)).toEqual([
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
      MCP_WELL_KNOWN_ROUTE,
      API_JSON_NOT_FOUND_ROUTE,
      MARKDOWN_INDEX_NEGOTIATION_ROUTE,
      { handle: "filesystem" },
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

  it("inserts the exact MCP well-known route before filesystem routing", () => {
    const config = {
      version: 3,
      routes: [{ handle: "filesystem" }, ...LOCALIZED_NOT_FOUND_ROUTES],
    };
    const routes = applyVercelRoutesConfig(config).routes;

    expect(routes).toContainEqual(MCP_WELL_KNOWN_ROUTE);

    const mcpIndex = routes.findIndex(
      route =>
        route.src === MCP_WELL_KNOWN_ROUTE.src &&
        route.dest === MCP_WELL_KNOWN_ROUTE.dest
    );
    const fsIndex = routes.findIndex(route => route.handle === "filesystem");

    expect(mcpIndex).toBeGreaterThanOrEqual(0);
    expect(mcpIndex).toBeLessThan(fsIndex);
  });

  it("inserts the API JSON 404 route before filesystem routing", () => {
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

    expect(apiNotFoundIndex).toBeGreaterThanOrEqual(0);
    expect(apiNotFoundIndex).toBeLessThan(fsIndex);
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

  it("preserves extra headers on the MCP well-known route", () => {
    const mcpRouteWithExtra = {
      ...MCP_WELL_KNOWN_ROUTE,
      headers: {
        "Cache-Control": "public, max-age=300",
        ...MCP_WELL_KNOWN_ROUTE.headers,
      },
    };
    const config = {
      version: 3,
      routes: [
        mcpRouteWithExtra,
        { handle: "filesystem" },
        ...LOCALIZED_NOT_FOUND_ROUTES,
      ],
    };

    const routes = applyVercelRoutesConfig(config).routes;

    expect(routes).toContainEqual({
      ...MCP_WELL_KNOWN_ROUTE,
      headers: {
        "Cache-Control": "public, max-age=300",
        ...MCP_WELL_KNOWN_ROUTE.headers,
      },
    });
  });

  it("stays idempotent when Markdown and MCP routes carry extra headers", () => {
    const markdownRouteWithExtra = {
      ...MARKDOWN_INDEX_NEGOTIATION_ROUTE,
      headers: {
        "Cache-Control": "public, max-age=300",
        ...MARKDOWN_INDEX_NEGOTIATION_ROUTE.headers,
      },
    };
    const mcpRouteWithExtra = {
      ...MCP_WELL_KNOWN_ROUTE,
      headers: {
        "Cache-Control": "public, max-age=300",
        ...MCP_WELL_KNOWN_ROUTE.headers,
      },
    };
    const config = {
      version: 3,
      routes: [
        markdownRouteWithExtra,
        mcpRouteWithExtra,
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
