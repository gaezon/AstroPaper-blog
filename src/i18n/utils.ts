import type { AstroGlobal } from "astro";
import { ensureTrailingSlash } from "@/utils/url";
import { I18N_CONFIG, getLocaleProfile } from "./config";

/**
 * Get the current page locale
 */
export function getCurrentLocale(Astro: AstroGlobal): string {
  return Astro.currentLocale || I18N_CONFIG.defaultLocale;
}

/**
 * Get translations for the current locale
 */
export function getTranslations(Astro: AstroGlobal) {
  const locale = getCurrentLocale(Astro);
  const profile = getLocaleProfile(locale);
  return profile.messages;
}

/**
 * Get a translated string
 */
export function t(
  Astro: AstroGlobal,
  key: string,
  params?: Record<string, string | number>
): string {
  const messages = getTranslations(Astro);
  const keys = key.split(".");
  let value: unknown = messages;

  for (const k of keys) {
    if (value && typeof value === "object" && k in value) {
      value = (value as Record<string, unknown>)[k];
    } else {
      // If translation is not found, return the key itself
      return key;
    }
  }

  if (typeof value !== "string") {
    return key;
  }

  // Parameter substitution
  if (params) {
    return value.replace(/\{\{(\w+)\}\}/g, (match, param) => {
      return String(params[param] || match);
    });
  }

  return value;
}

/**
 * Get the URL for switching locales
 * If the target translation does not exist, show a friendly notice page
 */
export function getLocaleSwitchUrl(
  Astro: AstroGlobal,
  targetLocale: string
): string {
  const currentPath = Astro.url.pathname;
  const currentSearch = Astro.url.search;
  const currentHash = Astro.url.hash;
  const currentLocale = getCurrentLocale(Astro);

  // If already at the target locale, return current URL
  if (currentLocale === targetLocale) {
    return appendUrlParts(
      ensureTrailingSlash(currentPath),
      currentSearch,
      currentHash
    );
  }

  // Check whether we are on a post detail page
  const isPostPage =
    currentPath.includes("/posts/") && !currentPath.endsWith("/posts/");

  // If not a post page, switch language directly
  if (!isPostPage) {
    return getLocaleSwitchUrlForPath(
      currentPath,
      currentLocale,
      targetLocale,
      currentSearch,
      currentHash
    );
  }

  // For post pages, check whether a target translation exists
  // If switching to English and it does not exist, show a notice page
  if (targetLocale === "en" && currentLocale === "zh-CN") {
    // Redirect to /en/translation-not-found/ for English
    return `/en/translation-not-found/?target=en&path=${encodeURIComponent(currentPath)}`;
  }

  // If switching to Chinese and the Chinese version doesn't exist, show the notice page
  if (targetLocale === "zh-CN" && currentLocale === "en") {
    // Redirect to /translation-not-found/ for Chinese
    return `/translation-not-found/?target=zh-CN&path=${encodeURIComponent(currentPath)}`;
  }

  // Default: switch language directly
  return getLocaleSwitchUrlForPath(
    currentPath,
    currentLocale,
    targetLocale,
    currentSearch,
    currentHash
  );
}

/**
 * Get locale switch URL for a specific path
 */
function getLocaleSwitchUrlForPath(
  currentPath: string,
  currentLocale: string,
  targetLocale: string,
  search = "",
  hash = ""
): string {
  // Build the new path
  let newPath = currentPath;

  // If current is the default (Chinese), remove prefix and add target prefix
  if (currentLocale === I18N_CONFIG.defaultLocale) {
    if (targetLocale !== I18N_CONFIG.defaultLocale) {
      newPath = `/${targetLocale}${currentPath}`;
    }
  } else {
    // If current is a non-default locale, remove its prefix and add the target prefix
    if (targetLocale === I18N_CONFIG.defaultLocale) {
      newPath = currentPath.replace(`/${currentLocale}`, "");
      if (newPath === "") newPath = "/";
    } else {
      newPath = currentPath.replace(`/${currentLocale}`, `/${targetLocale}`);
    }
  }

  return appendUrlParts(ensureTrailingSlash(newPath), search, hash);
}

// Helper: ensure the URL ends with /
function appendUrlParts(path: string, search: string, hash: string): string {
  return `${path}${search ?? ""}${hash ?? ""}`;
}

/**
 * Get all available locales
 */
export function getAvailableLocales() {
  return I18N_CONFIG.supportedLocales.map(locale => ({
    code: locale,
    name: I18N_CONFIG.localesToNames[locale],
    isDefault: locale === I18N_CONFIG.defaultLocale,
    profile: getLocaleProfile(locale),
  }));
}

/**
 * Get the page language tag
 */
export function getLangTag(Astro: AstroGlobal): string {
  const locale = getCurrentLocale(Astro);
  const profile = getLocaleProfile(locale);
  return profile.langTag;
}

/**
 * Get the page text direction
 */
export function getTextDirection(Astro: AstroGlobal): "ltr" | "rtl" {
  const locale = getCurrentLocale(Astro);
  const profile = getLocaleProfile(locale);
  return profile.direction;
}

/**
 * Format date
 */
export function formatDate(
  Astro: AstroGlobal,
  date: Date | string,
  format: "short" | "long" | "full" = "long"
): string {
  const locale = getCurrentLocale(Astro);
  const profile = getLocaleProfile(locale);

  if (typeof date === "string") {
    date = new Date(date);
  }

  const localeCode = profile.langTag;

  switch (format) {
    case "short":
      return date.toLocaleDateString(localeCode, {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
      });
    case "long":
      return date.toLocaleDateString(localeCode, {
        year: "numeric",
        month: "long",
        day: "numeric",
      });
    case "full":
      return date.toLocaleDateString(localeCode, {
        year: "numeric",
        month: "long",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    default:
      return date.toLocaleDateString(localeCode);
  }
}

/**
 * Get relative time
 */
export function getRelativeTime(
  Astro: AstroGlobal,
  date: Date | string
): string {
  const messages = getTranslations(Astro);

  if (typeof date === "string") {
    date = new Date(date);
  }

  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);
  const diffWeeks = Math.floor(diffDays / 7);
  const diffMonths = Math.floor(diffDays / 30);
  const diffYears = Math.floor(diffDays / 365);

  const relative =
    (messages.datetime as { relative?: Record<string, unknown> })?.relative ||
    {};

  if (diffMins < 1)
    return (relative.justNow as string | undefined) || "Just now";
  if (diffMins < 60)
    return t(Astro, "datetime.relative.minutesAgo", { count: diffMins });
  if (diffHours < 24)
    return t(Astro, "datetime.relative.hoursAgo", { count: diffHours });
  if (diffDays < 7)
    return t(Astro, "datetime.relative.daysAgo", { count: diffDays });
  if (diffWeeks < 4)
    return t(Astro, "datetime.relative.weeksAgo", { count: diffWeeks });
  if (diffMonths < 12)
    return t(Astro, "datetime.relative.monthsAgo", { count: diffMonths });
  return t(Astro, "datetime.relative.yearsAgo", { count: diffYears });
}
