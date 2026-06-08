import { describe, expect, it } from "vitest";
import {
  buildAlternateMetadata,
  buildBilingualPostMap,
  buildBlogPostingStructuredData,
  resolveBilingualCounterpartUrl,
  stripLocalePrefix,
} from "../../src/utils/i18n-seo";

const SITE = "https://blog.gaazeon.com/";
const SUPPORTED_LOCALES = ["zh-CN", "en"] as const;
const DEFAULT_LOCALE = "zh-CN";

const bilingualPostMap = buildBilingualPostMap([
  {
    zhPath: "/posts/Why-did-I-start-blogging/",
    enPath: "/en/posts/why-i-started-blogging/",
  },
]);

describe("i18n SEO helpers", () => {
  it("builds a bilingual post lookup for both locale paths", () => {
    expect(bilingualPostMap.get("/posts/Why-did-I-start-blogging")).toEqual({
      zh: "/posts/Why-did-I-start-blogging/",
      en: "/en/posts/why-i-started-blogging/",
    });
    expect(bilingualPostMap.get("/en/posts/why-i-started-blogging")).toEqual({
      zh: "/posts/Why-did-I-start-blogging/",
      en: "/en/posts/why-i-started-blogging/",
    });
  });

  it("strips only non-default locale prefixes", () => {
    expect(stripLocalePrefix("/en/search/", ["en"])).toBe("/search/");
    expect(stripLocalePrefix("/en/", ["en"])).toBe("/");
    expect(stripLocalePrefix("/posts/foo/", ["en"])).toBe("/posts/foo/");
  });

  it("keeps structural page alternates and x-default pointed at zh-CN", () => {
    const metadata = buildAlternateMetadata({
      supportedLocales: SUPPORTED_LOCALES,
      defaultLocale: DEFAULT_LOCALE,
      currentLocale: "en",
      canonicalURL: "https://blog.gaazeon.com/en/search/",
      pathname: "/en/search/",
      site: SITE,
    });

    expect(metadata.alternateUrlByLocale).toEqual({
      "zh-CN": "https://blog.gaazeon.com/search/",
      en: "https://blog.gaazeon.com/en/search/",
    });
    expect(metadata.hreflangLinks).toEqual([
      { locale: "zh-CN", href: "https://blog.gaazeon.com/search/" },
      { locale: "en", href: "https://blog.gaazeon.com/en/search/" },
    ]);
    expect(metadata.xDefaultURL).toBe("https://blog.gaazeon.com/search/");
  });

  it("uses explicit post alternates and x-default pointed at zh-CN", () => {
    const metadata = buildAlternateMetadata({
      supportedLocales: SUPPORTED_LOCALES,
      defaultLocale: DEFAULT_LOCALE,
      currentLocale: "zh-CN",
      canonicalURL: "https://blog.gaazeon.com/posts/Why-did-I-start-blogging/",
      pathname: "/posts/Why-did-I-start-blogging/",
      alternateURLs: {
        en: "/en/posts/why-i-started-blogging/",
      },
      site: SITE,
    });

    expect(metadata.alternateUrlByLocale).toEqual({
      "zh-CN": "https://blog.gaazeon.com/posts/Why-did-I-start-blogging/",
      en: "https://blog.gaazeon.com/en/posts/why-i-started-blogging/",
    });
    expect(metadata.xDefaultURL).toBe(
      "https://blog.gaazeon.com/posts/Why-did-I-start-blogging/"
    );
  });

  it("does not invent target-language alternates for single-language posts", () => {
    const metadata = buildAlternateMetadata({
      supportedLocales: SUPPORTED_LOCALES,
      defaultLocale: DEFAULT_LOCALE,
      currentLocale: "zh-CN",
      canonicalURL: "https://blog.gaazeon.com/posts/upgrade-astropaper-git/",
      pathname: "/posts/upgrade-astropaper-git/",
      site: SITE,
    });

    expect(metadata.alternateUrlByLocale).toEqual({
      "zh-CN": "https://blog.gaazeon.com/posts/upgrade-astropaper-git/",
    });
    expect(metadata.hreflangLinks).toEqual([
      {
        locale: "zh-CN",
        href: "https://blog.gaazeon.com/posts/upgrade-astropaper-git/",
      },
    ]);
    expect(metadata.xDefaultURL).toBe(
      "https://blog.gaazeon.com/posts/upgrade-astropaper-git/"
    );
  });

  it("resolves bilingual counterpart URLs from canonical post URLs", () => {
    expect(
      resolveBilingualCounterpartUrl(
        "https://blog.gaazeon.com/posts/Why-did-I-start-blogging/",
        bilingualPostMap,
        SITE
      )
    ).toBe("https://blog.gaazeon.com/en/posts/why-i-started-blogging/");

    expect(
      resolveBilingualCounterpartUrl(
        "https://blog.gaazeon.com/en/posts/why-i-started-blogging/",
        bilingualPostMap,
        SITE
      )
    ).toBe("https://blog.gaazeon.com/posts/Why-did-I-start-blogging/");
  });

  it("resolves bilingual counterpart URLs from relative post paths", () => {
    expect(
      resolveBilingualCounterpartUrl(
        "/posts/Why-did-I-start-blogging/",
        bilingualPostMap,
        SITE
      )
    ).toBe("https://blog.gaazeon.com/en/posts/why-i-started-blogging/");
  });

  it("emits BlogPosting translation metadata when a counterpart exists", () => {
    const [node] = buildBlogPostingStructuredData({
      canonicalURL: "https://blog.gaazeon.com/posts/Why-did-I-start-blogging/",
      title: "我為什麼要寫博客",
      description: "desc",
      socialImageURL: "https://blog.gaazeon.com/og.png",
      pubDatetime: new Date("2021-10-03T00:00:00.000+08:00"),
      modDatetime: null,
      langTag: "zh-CN",
      author: "Gaazeon",
      profile: "",
      graphIds: {
        blog: "https://blog.gaazeon.com/#blog",
        author: "https://blog.gaazeon.com/#author",
      },
      bilingualPostMap,
      siteWebsite: SITE,
    });

    expect(node.sameAs).toEqual([
      "https://blog.gaazeon.com/en/posts/why-i-started-blogging/",
    ]);
    expect(node.translationOfWork).toEqual({
      "@type": "CreativeWork",
      "@id": "https://blog.gaazeon.com/en/posts/why-i-started-blogging/",
    });
    expect(node.dateModified).toBe(node.datePublished);
    expect(node.inLanguage).toBe("zh-CN");
  });

  it("omits BlogPosting translation metadata when no counterpart exists", () => {
    const [node] = buildBlogPostingStructuredData({
      canonicalURL: "https://blog.gaazeon.com/posts/upgrade-astropaper-git/",
      title: "使用 git 升级更新 Astropaper theme 主题",
      description: "desc",
      socialImageURL: "https://blog.gaazeon.com/og.png",
      pubDatetime: new Date("2024-08-13T19:45:16.000+08:00"),
      langTag: "zh-CN",
      author: "Gaazeon",
      graphIds: {
        blog: "https://blog.gaazeon.com/#blog",
        author: "https://blog.gaazeon.com/#author",
      },
      bilingualPostMap,
      siteWebsite: SITE,
    });

    expect(node.sameAs).toBeUndefined();
    expect(node.translationOfWork).toBeUndefined();
  });
});
