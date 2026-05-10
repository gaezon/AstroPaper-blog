import { describe, expect, it } from "vitest";
import {
  AGENT_SKILLS_HEADERS_ROUTE,
  API_CATALOG_HEADERS_ROUTE,
  applyLocalized404Routes,
  applyVercelRoutesConfig,
  LOCALIZED_NOT_FOUND_ROUTES,
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
      AGENT_SKILLS_HEADERS_ROUTE,
      API_CATALOG_HEADERS_ROUTE,
      SECURITY_HEADERS_ROUTE,
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
        AGENT_SKILLS_HEADERS_ROUTE,
        API_CATALOG_HEADERS_ROUTE,
        parsedSecurityHeadersRoute,
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
      AGENT_SKILLS_HEADERS_ROUTE,
      API_CATALOG_HEADERS_ROUTE,
      {
        ...SECURITY_HEADERS_ROUTE,
        headers: {
          "x-extra-security-header": "preserved-by-platform",
          ...SECURITY_HEADERS_ROUTE.headers,
        },
      },
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
      AGENT_SKILLS_HEADERS_ROUTE
    );
    expect(applyVercelRoutesConfig(config).routes[1]).toEqual(
      API_CATALOG_HEADERS_ROUTE
    );
  });

  it("preserves extra headers on well-known discovery URL routes", () => {
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
        { handle: "filesystem" },
        ...LOCALIZED_NOT_FOUND_ROUTES,
      ],
    };

    expect(applyVercelRoutesConfig(config).routes.slice(0, 2)).toEqual([
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
      AGENT_SKILLS_HEADERS_ROUTE,
      API_CATALOG_HEADERS_ROUTE,
      {
        ...SECURITY_HEADERS_ROUTE,
        headers: {
          "x-extra-security-header": "preserved-by-platform",
          ...SECURITY_HEADERS_ROUTE.headers,
        },
      },
      { handle: "filesystem" },
      ...LOCALIZED_NOT_FOUND_ROUTES,
    ]);
  });
});
