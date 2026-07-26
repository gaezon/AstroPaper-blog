import { describe, expect, it } from "vitest";
import {
  applyLocalized404Routes,
  applyVercelRoutesConfig,
  hoistAstroCacheRoute,
  LOCALIZED_NOT_FOUND_ROUTES,
  SECURITY_HEADERS_ROUTE,
} from "../../scripts/apply-vercel-routes";

const astroCacheRoute = {
  src: "^/_astro/(.*)$",
  headers: {
    "cache-control": "public, max-age=31536000, immutable",
  },
  continue: true,
};

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

describe("hoistAstroCacheRoute", () => {
  it("moves the adapter's cache route from the filesystem phase into the main phase", () => {
    const config = {
      version: 3,
      routes: [
        { handle: "filesystem" },
        astroCacheRoute,
        { src: "^/.*$", dest: "/404.html", status: 404 },
      ],
    };

    expect(hoistAstroCacheRoute(config).routes).toEqual([
      astroCacheRoute,
      { handle: "filesystem" },
      { src: "^/.*$", dest: "/404.html", status: 404 },
    ]);
  });

  it("stays idempotent when the cache route is already in the main phase", () => {
    const config = {
      version: 3,
      routes: [astroCacheRoute, { handle: "filesystem" }],
    };

    expect(hoistAstroCacheRoute(config).routes).toEqual(config.routes);
  });

  it("leaves configs without a cache route untouched", () => {
    const config = {
      version: 3,
      routes: [{ handle: "filesystem" }],
    };

    expect(hoistAstroCacheRoute(config).routes).toEqual(config.routes);
  });
});

describe("applyVercelRoutesConfig", () => {
  it("inserts security headers, hoists the cache route, and localizes 404 routes", () => {
    const config = {
      version: 3,
      routes: [
        { handle: "filesystem" },
        astroCacheRoute,
        { src: "^/.*$", dest: "/404.html", status: 404 },
      ],
    };

    expect(applyVercelRoutesConfig(config).routes).toEqual([
      SECURITY_HEADERS_ROUTE,
      astroCacheRoute,
      { handle: "filesystem" },
      ...LOCALIZED_NOT_FOUND_ROUTES,
    ]);
  });

  it("stays idempotent when security headers and localized 404 routes are already patched", () => {
    const parsedSecurityHeadersRoute = JSON.parse(
      JSON.stringify(SECURITY_HEADERS_ROUTE)
    );
    const config = {
      version: 3,
      routes: [
        parsedSecurityHeadersRoute,
        astroCacheRoute,
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
