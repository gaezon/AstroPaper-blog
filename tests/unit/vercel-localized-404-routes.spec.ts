import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import {
  applyLocalized404Routes,
  applyArticleViewsRewrite,
  applyHtmlDocumentCache,
  applyVercelRoutesConfig,
  hoistAstroCacheRoute,
  ARTICLE_VIEWS_REWRITE_ROUTE,
  HTML_DOCUMENT_CACHE_ROUTE,
  HTML_DOCUMENT_CACHE_PATH_PATTERN,
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

describe("applyHtmlDocumentCache", () => {
  it("inserts the HTML cache route before filesystem handling", () => {
    const config = {
      version: 3,
      routes: [{ handle: "filesystem" }, ...LOCALIZED_NOT_FOUND_ROUTES],
    };

    expect(applyHtmlDocumentCache(config).routes).toEqual([
      HTML_DOCUMENT_CACHE_ROUTE,
      { handle: "filesystem" },
      ...LOCALIZED_NOT_FOUND_ROUTES,
    ]);
  });

  it("stays idempotent when the HTML cache route is already present", () => {
    const config = {
      version: 3,
      routes: [HTML_DOCUMENT_CACHE_ROUTE, { handle: "filesystem" }],
    };

    expect(applyHtmlDocumentCache(config).routes).toEqual(config.routes);
  });

  it("keeps browsers on max-age=0 without SWR and SWR only on CDN headers", () => {
    expect(HTML_DOCUMENT_CACHE_ROUTE.headers["Cache-Control"]).toBe(
      "public, max-age=0, must-revalidate"
    );
    expect(HTML_DOCUMENT_CACHE_ROUTE.headers["Cache-Control"]).not.toContain(
      "stale-while-revalidate"
    );
    expect(HTML_DOCUMENT_CACHE_ROUTE.headers["CDN-Cache-Control"]).toBe(
      "public, s-maxage=600, stale-while-revalidate=86400"
    );
    expect(HTML_DOCUMENT_CACHE_ROUTE.headers["Vercel-CDN-Cache-Control"]).toBe(
      "public, s-maxage=600, stale-while-revalidate=86400"
    );
  });

  it.each([
    "/",
    "/en/",
    "/about/",
    "/posts/",
    "/posts/2/",
    "/posts/hoarder-app-replace-cubox/",
    "/en/posts/self-host-hoarder-replace-cubox/",
    "/tags/selfhost/",
    "/search/",
    "/en/404/",
    "/translation-not-found/",
  ])("matches HTML document URL %s", pathname => {
    expect(HTML_DOCUMENT_CACHE_PATH_PATTERN.test(pathname)).toBe(true);
  });

  it.each([
    "/rss.xml",
    "/rss.en.xml",
    "/sitemap-index.xml",
    "/favicon.svg",
    "/astropaper-og.jpg",
    "/ads.txt",
    "/index.md",
    "/llms.txt",
    "/llms-full.txt",
    "/robots.txt",
    "/og.png",
    "/en/og.png",
    "/posts/hoarder-app-replace-cubox/index.png/",
    "/_astro/dummy-logo.BkuKyzzX.svg",
    "/api/article-views/",
    "/pagefind/pagefind.js",
    "/pagefind/",
    "/twikoo/owo.json",
  ])("does not match non-document URL %s", pathname => {
    expect(HTML_DOCUMENT_CACHE_PATH_PATTERN.test(pathname)).toBe(false);
  });
});

describe("applyArticleViewsRewrite", () => {
  it("inserts the article views proxy before filesystem handling", () => {
    const config = {
      version: 3,
      routes: [{ handle: "filesystem" }, ...LOCALIZED_NOT_FOUND_ROUTES],
    };

    expect(applyArticleViewsRewrite(config).routes).toEqual([
      ARTICLE_VIEWS_REWRITE_ROUTE,
      { handle: "filesystem" },
      ...LOCALIZED_NOT_FOUND_ROUTES,
    ]);
  });

  it("stays idempotent when the proxy route is already present", () => {
    const config = {
      version: 3,
      routes: [ARTICLE_VIEWS_REWRITE_ROUTE, { handle: "filesystem" }],
    };

    expect(applyArticleViewsRewrite(config).routes).toEqual(config.routes);
  });

  it("matches the CDN-Cache-Control value in vercel.json to prevent silent config drift", () => {
    type VercelJsonHeader = { key: string; value: string };
    type VercelJsonHeaderRule = { source: string; headers: VercelJsonHeader[] };
    type VercelJson = { headers?: VercelJsonHeaderRule[] };

    const vercelJson = JSON.parse(
      readFileSync(resolve(__dirname, "../../vercel.json"), "utf8")
    ) as VercelJson;

    const articleViewsRule = vercelJson.headers?.find(
      rule => rule.source === "/api/article-views/"
    );
    const cdnHeader = articleViewsRule?.headers.find(
      h => h.key === "CDN-Cache-Control"
    );

    expect(cdnHeader?.value).toBeDefined();
    expect(cdnHeader?.value).toBe(
      ARTICLE_VIEWS_REWRITE_ROUTE.headers["CDN-Cache-Control"]
    );
  });
});

describe("applyVercelRoutesConfig", () => {
  it("inserts security headers, hoists asset cache, caches HTML, and localizes 404 routes", () => {
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
      HTML_DOCUMENT_CACHE_ROUTE,
      ARTICLE_VIEWS_REWRITE_ROUTE,
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
        HTML_DOCUMENT_CACHE_ROUTE,
        ARTICLE_VIEWS_REWRITE_ROUTE,
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
      HTML_DOCUMENT_CACHE_ROUTE,
      ARTICLE_VIEWS_REWRITE_ROUTE,
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
        ARTICLE_VIEWS_REWRITE_ROUTE,
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
      HTML_DOCUMENT_CACHE_ROUTE,
      ARTICLE_VIEWS_REWRITE_ROUTE,
      { handle: "filesystem" },
      ...LOCALIZED_NOT_FOUND_ROUTES,
    ]);
  });
});
