// Feature: agent-readiness-optimization, Property 5: Breadcrumb chain is contiguous and locale-consistent
import { describe, it, expect, vi } from "vitest";
import fc from "fast-check";

// breadcrumbs.ts imports BlogLocale as a *type only* from `@/utils/blog-locale`,
// which TS erases at runtime — but Vitest still resolves module specifiers.
// Forward to the real implementation.
vi.mock("@/utils/blog-locale", async () =>
  vi.importActual<typeof import("../../src/utils/blog-locale")>(
    "../../src/utils/blog-locale"
  )
);

import {
  buildBreadcrumbs,
  toBreadcrumbListJsonLd,
  type BreadcrumbItem,
} from "../../src/utils/breadcrumbs";

const SITE_ORIGIN = "https://blog.gaazeon.com";

describe("buildBreadcrumbs (P5)", () => {
  it("home page returns empty array", () => {
    // Validates: Requirements 2.5, 8.8
    expect(
      buildBreadcrumbs({
        locale: "zh-CN",
        pathname: "/",
        pageTitle: "x",
        siteOrigin: SITE_ORIGIN,
      })
    ).toEqual([]);
    expect(
      buildBreadcrumbs({
        locale: "en",
        pathname: "/en/",
        pageTitle: "x",
        siteOrigin: SITE_ORIGIN,
      })
    ).toEqual([]);
  });

  it("non-reachable routes return empty array", () => {
    // Validates: Requirements 2.5
    expect(
      buildBreadcrumbs({
        locale: "zh-CN",
        pathname: "/about/",
        pageTitle: "x",
        siteOrigin: SITE_ORIGIN,
      })
    ).toEqual([]);
    expect(
      buildBreadcrumbs({
        locale: "en",
        pathname: "/en/about/",
        pageTitle: "x",
        siteOrigin: SITE_ORIGIN,
      })
    ).toEqual([]);
  });

  it("post page returns three items with correct shape", () => {
    // Validates: Requirements 2.5, 8.8
    const crumbs = buildBreadcrumbs({
      locale: "zh-CN",
      pathname: "/posts/foo-bar/",
      pageTitle: "Foo Bar",
      siteOrigin: SITE_ORIGIN,
    });
    expect(crumbs).toHaveLength(3);
    expect(crumbs[0].name).toBe("首页");
    expect(crumbs[0].item).toBe("https://blog.gaazeon.com/");
    expect(crumbs[2].name).toBe("Foo Bar");
    expect(crumbs[2].item).toBe("https://blog.gaazeon.com/posts/foo-bar/");
  });

  it("en post page uses en prefix", () => {
    // Validates: Requirements 2.5, 8.8
    const crumbs = buildBreadcrumbs({
      locale: "en",
      pathname: "/en/posts/foo-bar/",
      pageTitle: "Foo Bar",
      siteOrigin: SITE_ORIGIN,
    });
    expect(crumbs[0].item).toBe("https://blog.gaazeon.com/en/");
    expect(crumbs[1].item).toBe("https://blog.gaazeon.com/en/posts/");
    expect(crumbs[2].item).toBe("https://blog.gaazeon.com/en/posts/foo-bar/");
  });

  it("tag detail uses tagName when provided", () => {
    // Validates: Requirements 2.5
    const crumbs = buildBreadcrumbs({
      locale: "zh-CN",
      pathname: "/tags/self-hosted/",
      pageTitle: "ignored",
      tagName: "Self Hosted",
      siteOrigin: SITE_ORIGIN,
    });
    expect(crumbs).toHaveLength(3);
    expect(crumbs[2].name).toBe("Self Hosted");
  });

  it("tag detail derives tag from pathname when tagName is undefined", () => {
    // Validates: Requirements 2.5
    const crumbs = buildBreadcrumbs({
      locale: "en",
      pathname: "/en/tags/network/",
      pageTitle: "ignored",
      siteOrigin: SITE_ORIGIN,
    });
    expect(crumbs[2].name).toBe("network");
  });

  it("tag index returns two items", () => {
    // Validates: Requirements 2.5
    expect(
      buildBreadcrumbs({
        locale: "zh-CN",
        pathname: "/tags/",
        pageTitle: "ignored",
        siteOrigin: SITE_ORIGIN,
      })
    ).toHaveLength(2);
    expect(
      buildBreadcrumbs({
        locale: "en",
        pathname: "/en/tags/",
        pageTitle: "ignored",
        siteOrigin: SITE_ORIGIN,
      })
    ).toHaveLength(2);
  });

  it("every name is non-empty and every item is absolute", () => {
    // Validates: Requirements 2.5, 8.8
    const localeArb = fc.constantFrom<"zh-CN" | "en">("zh-CN", "en");
    const routeKindArb = fc.constantFrom<"post" | "tagIndex" | "tagDetail">(
      "post",
      "tagIndex",
      "tagDetail"
    );
    const slugArb = fc
      .stringMatching(/^[a-z0-9][a-z0-9\-]{0,20}$/)
      .filter(s => s.length > 0);
    const titleArb = fc
      .string({ minLength: 1, maxLength: 80 })
      .filter(s => s.trim().length > 0);
    const tagNameArb = fc
      .string({ minLength: 1, maxLength: 24 })
      .filter(s => s.trim().length > 0);
    const originArb = fc.constantFrom(
      "https://blog.gaazeon.com",
      "https://blog.gaazeon.com/"
    );

    fc.assert(
      fc.property(
        localeArb,
        routeKindArb,
        slugArb,
        titleArb,
        tagNameArb,
        originArb,
        (locale, kind, slug, title, tagName, origin) => {
          const prefix = locale === "en" ? "/en" : "";
          let pathname: string;
          switch (kind) {
            case "post":
              pathname = `${prefix}/posts/${slug}/`;
              break;
            case "tagIndex":
              pathname = `${prefix}/tags/`;
              break;
            case "tagDetail":
              pathname = `${prefix}/tags/${slug}/`;
              break;
          }

          const crumbs = buildBreadcrumbs({
            locale,
            pathname,
            pageTitle: title,
            tagName: kind === "tagDetail" ? tagName : undefined,
            siteOrigin: origin,
          });

          // None of post/tagIndex/tagDetail is the home route, so each emits
          // at least home + one segment.
          expect(crumbs.length).toBeGreaterThanOrEqual(2);

          // Every crumb has a non-empty name and an absolute URL item.
          for (const crumb of crumbs) {
            expect(crumb.name.length).toBeGreaterThan(0);
            expect(() => new URL(crumb.item)).not.toThrow();
          }

          const normalizedOrigin = origin.replace(/\/+$/, "");
          const expectedHome =
            locale === "en"
              ? `${normalizedOrigin}/en/`
              : `${normalizedOrigin}/`;
          expect(crumbs[0].item).toBe(expectedHome);

          // The last crumb's item equals the canonical absolute URL of the
          // page (origin + pathname).
          expect(crumbs[crumbs.length - 1].item).toBe(
            `${normalizedOrigin}${pathname}`
          );
          expect(crumbs[crumbs.length - 1].item.endsWith(pathname)).toBe(true);

          // Every non-first crumb's item pathname carries the correct locale
          // prefix.
          for (let i = 1; i < crumbs.length; i++) {
            const itemPath = new URL(crumbs[i].item).pathname;
            if (locale === "en") {
              expect(itemPath.startsWith("/en/")).toBe(true);
            } else {
              expect(itemPath.startsWith("/en/")).toBe(false);
              expect(itemPath.startsWith("/")).toBe(true);
            }
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  it("toBreadcrumbListJsonLd assigns contiguous positions starting at 1", () => {
    // Validates: Requirements 2.5, 8.8
    const itemArb: fc.Arbitrary<BreadcrumbItem> = fc.record({
      name: fc
        .string({ minLength: 1, maxLength: 50 })
        .filter(s => s.length > 0),
      item: fc.webUrl(),
    });

    fc.assert(
      fc.property(fc.array(itemArb, { minLength: 0, maxLength: 10 }), items => {
        const result = toBreadcrumbListJsonLd(items);
        expect(result["@type"]).toBe("BreadcrumbList");
        expect(result.itemListElement).toHaveLength(items.length);
        for (let i = 0; i < items.length; i++) {
          expect(result.itemListElement[i].position).toBe(i + 1);
          expect(result.itemListElement[i].name).toBe(items[i].name);
          expect(result.itemListElement[i].item).toBe(items[i].item);
          expect(result.itemListElement[i]["@type"]).toBe("ListItem");
        }
      }),
      { numRuns: 100 }
    );
  });

  it("full pipeline: buildBreadcrumbs + toBreadcrumbListJsonLd produces contiguous 1..n positions on post pages", () => {
    // Validates: Requirements 2.5, 8.8
    const localeArb = fc.constantFrom<"zh-CN" | "en">("zh-CN", "en");
    const slugArb = fc
      .stringMatching(/^[a-z0-9][a-z0-9\-]{0,20}$/)
      .filter(s => s.length > 0);
    const titleArb = fc
      .string({ minLength: 1, maxLength: 80 })
      .filter(s => s.trim().length > 0);

    fc.assert(
      fc.property(localeArb, slugArb, titleArb, (locale, slug, title) => {
        const prefix = locale === "en" ? "/en" : "";
        const pathname = `${prefix}/posts/${slug}/`;
        const crumbs = buildBreadcrumbs({
          locale,
          pathname,
          pageTitle: title,
          siteOrigin: SITE_ORIGIN,
        });
        const jsonld = toBreadcrumbListJsonLd(crumbs);
        expect(jsonld.itemListElement).toHaveLength(3);
        expect(jsonld.itemListElement.map(el => el.position)).toEqual([
          1, 2, 3,
        ]);
      }),
      { numRuns: 100 }
    );
  });
});
