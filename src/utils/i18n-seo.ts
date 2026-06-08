import { ensureTrailingSlash } from "@/utils/url";

export interface BilingualPostPaths {
  zh: string;
  en: string;
}

export interface GeneratedBilingualPath {
  zhPath: string;
  enPath: string;
}

export interface HreflangLink {
  locale: string;
  href: string;
}

export interface AlternateMetadataOptions {
  supportedLocales: readonly string[];
  defaultLocale: string;
  currentLocale: string;
  canonicalURL: string;
  pathname: string;
  alternateURLs?: Record<string, string | undefined>;
  disableAutoAlternates?: boolean;
  site: string | URL;
}

export interface AlternateMetadata {
  alternateUrlByLocale: Record<string, string>;
  hreflangLinks: HreflangLink[];
  xDefaultURL: string;
}

export interface BlogPostingGraphIds {
  blog: string;
  author: string;
}

export interface BlogPostingStructuredDataOptions {
  canonicalURL: string;
  title: string;
  description: string;
  socialImageURL: string;
  pubDatetime: Date;
  modDatetime?: Date | null;
  langTag: string;
  author: string;
  profile?: string;
  graphIds: BlogPostingGraphIds;
  bilingualPostMap: Map<string, BilingualPostPaths>;
  siteWebsite: string;
}

export interface BlogPostingStructuredData {
  "@type": "BlogPosting";
  "@id": string;
  mainEntityOfPage: {
    "@type": "WebPage";
    "@id": string;
  };
  isPartOf: {
    "@id": string;
  };
  speakable: {
    "@type": "SpeakableSpecification";
    cssSelector: string[];
  };
  headline: string;
  description: string;
  image: string;
  url: string;
  datePublished: string;
  dateModified: string;
  inLanguage: string;
  author: {
    "@id": string;
    name: string;
    url?: string;
  };
  publisher: {
    "@id": string;
  };
  sameAs?: string[];
  translationOfWork?: {
    "@type": "CreativeWork";
    "@id": string;
  };
}

export function buildBilingualPostMap(
  entries: Iterable<GeneratedBilingualPath>
): Map<string, BilingualPostPaths> {
  const map = new Map<string, BilingualPostPaths>();

  for (const { zhPath, enPath } of entries) {
    map.set(zhPath.replace(/\/$/, ""), { zh: zhPath, en: enPath });
    map.set(enPath.replace(/\/$/, ""), { zh: zhPath, en: enPath });
  }

  return map;
}

export function stripLocalePrefix(
  pathname: string,
  nonDefaultLocales: readonly string[]
): string {
  for (const locale of nonDefaultLocales) {
    if (pathname === `/${locale}` || pathname === `/${locale}/`) {
      return "/";
    }

    if (pathname.startsWith(`/${locale}/`)) {
      const stripped = pathname.slice(locale.length + 1);
      return stripped === "" ? "/" : stripped;
    }
  }

  return pathname;
}

export function buildAlternateMetadata(
  options: AlternateMetadataOptions
): AlternateMetadata {
  const {
    supportedLocales,
    defaultLocale,
    currentLocale,
    canonicalURL,
    pathname,
    alternateURLs = {},
    disableAutoAlternates = false,
    site,
  } = options;

  const normalizedPathname = ensureTrailingSlash(pathname);
  const isPostPage =
    normalizedPathname.includes("/posts/") &&
    !normalizedPathname.endsWith("/posts/");
  const nonDefaultLocales = supportedLocales.filter(
    locale => locale !== defaultLocale
  );
  const basePath = ensureTrailingSlash(
    stripLocalePrefix(normalizedPathname, nonDefaultLocales)
  );

  const alternateUrlByLocale = supportedLocales.reduce<Record<string, string>>(
    (acc, locale) => {
      if (locale === currentLocale) {
        acc[locale] = canonicalURL;
        return acc;
      }

      const override = alternateURLs[locale];
      if (override) {
        acc[locale] = new URL(ensureTrailingSlash(override), site).href;
        return acc;
      }

      if (!isPostPage && !disableAutoAlternates) {
        const localizedPath =
          locale === defaultLocale ? basePath : `/${locale}${basePath}`;
        acc[locale] = new URL(localizedPath, site).href;
      }

      return acc;
    },
    {}
  );

  const hreflangLinks = supportedLocales
    .map(locale => ({
      locale,
      href: alternateUrlByLocale[locale],
    }))
    .filter((link): link is HreflangLink => Boolean(link.href));

  return {
    alternateUrlByLocale,
    hreflangLinks,
    xDefaultURL: alternateUrlByLocale[defaultLocale] ?? canonicalURL,
  };
}

export function resolveBilingualCounterpartUrl(
  canonicalURL: string,
  bilingualPostMap: Map<string, BilingualPostPaths>,
  siteWebsite: string
): string | undefined {
  const canonicalPathname = new URL(canonicalURL, siteWebsite).pathname.replace(
    /\/$/,
    ""
  );
  const counterpartMapping = bilingualPostMap.get(canonicalPathname);
  const siteBase = siteWebsite.replace(/\/$/, "");

  if (!counterpartMapping) {
    return undefined;
  }

  return canonicalPathname === counterpartMapping.zh.replace(/\/$/, "")
    ? siteBase + counterpartMapping.en
    : siteBase + counterpartMapping.zh;
}

export function buildBlogPostingStructuredData(
  options: BlogPostingStructuredDataOptions
): BlogPostingStructuredData[] {
  const {
    canonicalURL,
    title,
    description,
    socialImageURL,
    pubDatetime,
    modDatetime,
    langTag,
    author,
    profile,
    graphIds,
    bilingualPostMap,
    siteWebsite,
  } = options;
  const counterpartUrl = resolveBilingualCounterpartUrl(
    canonicalURL,
    bilingualPostMap,
    siteWebsite
  );

  return [
    {
      "@type": "BlogPosting",
      "@id": new URL("#blogposting", canonicalURL).href,
      mainEntityOfPage: {
        "@type": "WebPage",
        "@id": canonicalURL,
      },
      isPartOf: {
        "@id": graphIds.blog,
      },
      speakable: {
        "@type": "SpeakableSpecification",
        cssSelector: ["main h1", "main h2", "main p"],
      },
      headline: title,
      description,
      image: socialImageURL,
      url: canonicalURL,
      datePublished: pubDatetime.toISOString(),
      dateModified: modDatetime
        ? modDatetime.toISOString()
        : pubDatetime.toISOString(),
      inLanguage: langTag,
      author: {
        "@id": graphIds.author,
        name: author,
        ...(profile && { url: profile }),
      },
      publisher: {
        "@id": graphIds.author,
      },
      ...(counterpartUrl && {
        sameAs: [counterpartUrl],
        translationOfWork: {
          "@type": "CreativeWork",
          "@id": counterpartUrl,
        },
      }),
    },
  ];
}
