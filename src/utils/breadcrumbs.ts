import type { BlogLocale } from "@/utils/blog-locale";

export interface BreadcrumbItem {
  /** Display label for the breadcrumb (non-empty). */
  name: string;
  /** Absolute URL for this breadcrumb item. */
  item: string;
}

export interface BuildBreadcrumbsArgs {
  locale: BlogLocale;
  /** Request pathname (will be normalized to start and end with `/`). */
  pathname: string;
  /** Used as the last crumb label on post pages. */
  pageTitle: string;
  /** Used as the last crumb label on tag detail pages (original, non-slugified). */
  tagName?: string;
  /** SITE.website origin; may or may not end with a trailing slash. */
  siteOrigin: string;
}

interface LocaleLabels {
  home: string;
  posts: string;
  tags: string;
}

const LABELS: Record<BlogLocale, LocaleLabels> = {
  "zh-CN": { home: "首页", posts: "文章", tags: "标签" },
  en: { home: "Home", posts: "Posts", tags: "Tags" },
};

function normalizeOrigin(origin: string): string {
  return origin.replace(/\/+$/, "");
}

function normalizePath(p: string): string {
  let path = p.startsWith("/") ? p : "/" + p;
  if (!path.endsWith("/")) path = path + "/";
  return path;
}

function localePrefix(locale: BlogLocale): string {
  return locale === "en" ? "/en" : "";
}

function localeHome(locale: BlogLocale): string {
  return locale === "en" ? "/en/" : "/";
}

/**
 * Build breadcrumb trail for the given page.
 *
 * Scope (Req 2.5):
 *  - Post page: Home → Posts → <pageTitle>
 *  - Tag index: Home → Tags
 *  - Tag detail: Home → Tags → <tagName>
 *  - Home (`/` or `/en/`): returns `[]` (no BreadcrumbList on home)
 *  - Any other route: returns `[]`
 *
 * Never throws. Returns `[]` on malformed input.
 */
export function buildBreadcrumbs(args: BuildBreadcrumbsArgs): BreadcrumbItem[] {
  try {
    const { locale, pageTitle, tagName } = args;
    const origin = normalizeOrigin(args.siteOrigin);
    const pathname = normalizePath(args.pathname);
    const prefix = localePrefix(locale);
    const labels = LABELS[locale];

    // Home — no breadcrumbs.
    if (pathname === localeHome(locale)) return [];

    const homeCrumb: BreadcrumbItem = {
      name: labels.home,
      item: origin + localeHome(locale),
    };

    // Post detail: /posts/<...>/ or /en/posts/<...>/ (requires at least one
    // path segment after "posts", so the bare list page is excluded).
    const postMatch = new RegExp(`^${prefix}/posts/([^/]+(?:/[^/]+)*)/$`).exec(
      pathname
    );
    if (postMatch) {
      return [
        homeCrumb,
        { name: labels.posts, item: origin + `${prefix}/posts/` },
        { name: pageTitle, item: origin + pathname },
      ];
    }

    // Tag detail: /tags/<tag>/ or /en/tags/<tag>/
    const tagDetailMatch = new RegExp(`^${prefix}/tags/([^/]+)/$`).exec(
      pathname
    );
    if (tagDetailMatch) {
      let derivedTag = tagDetailMatch[1];
      try {
        derivedTag = decodeURIComponent(derivedTag);
      } catch {
        // Keep the raw segment if decoding fails.
      }
      return [
        homeCrumb,
        { name: labels.tags, item: origin + `${prefix}/tags/` },
        { name: tagName ?? derivedTag, item: origin + pathname },
      ];
    }

    // Tag index: /tags/ or /en/tags/
    if (pathname === `${prefix}/tags/`) {
      return [homeCrumb, { name: labels.tags, item: origin + pathname }];
    }

    return [];
  } catch {
    return [];
  }
}

export interface BreadcrumbListJsonLd {
  "@type": "BreadcrumbList";
  itemListElement: Array<{
    "@type": "ListItem";
    position: number;
    name: string;
    item: string;
  }>;
}

export function toBreadcrumbListJsonLd(
  items: BreadcrumbItem[]
): BreadcrumbListJsonLd {
  return {
    "@type": "BreadcrumbList",
    itemListElement: items.map((it, idx) => ({
      "@type": "ListItem",
      position: idx + 1,
      name: it.name,
      item: it.item,
    })),
  };
}
