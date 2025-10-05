import type { AstroGlobal } from "astro";
import { I18N_CONFIG, getLocaleProfile } from "./config";

/**
 * 获取当前页面的语言
 */
export function getCurrentLocale(Astro: AstroGlobal): string {
  return Astro.currentLocale || I18N_CONFIG.defaultLocale;
}

/**
 * 获取当前语言的翻译消息
 */
export function getTranslations(Astro: AstroGlobal) {
  const locale = getCurrentLocale(Astro);
  const profile = getLocaleProfile(locale);
  return profile.messages;
}

/**
 * 获取翻译文本
 */
export function t(
  Astro: AstroGlobal,
  key: string,
  params?: Record<string, string | number>
): string {
  const messages = getTranslations(Astro);
  const keys = key.split(".");
  let value: any = messages;

  for (const k of keys) {
    if (value && typeof value === "object" && k in value) {
      value = value[k];
    } else {
      // 如果找不到翻译，返回 key 本身
      return key;
    }
  }

  if (typeof value !== "string") {
    return key;
  }

  // 参数替换
  if (params) {
    return value.replace(/\{\{(\w+)\}\}/g, (match, param) => {
      return String(params[param] || match);
    });
  }

  return value;
}

/**
 * 获取语言切换的 URL
 * 如果目标语言的翻译版本不存在，则跳转到该语言的博客列表页
 */
export function getLocaleSwitchUrl(Astro: AstroGlobal, targetLocale: string): string {
  const currentPath = Astro.url.pathname;
  const currentLocale = getCurrentLocale(Astro);

  // 如果已经是目标语言，返回当前 URL
  if (currentLocale === targetLocale) {
    return ensureTrailingSlash(currentPath);
  }

  // 检查当前是否在文章详情页
  const isPostPage = currentPath.includes("/posts/") && !currentPath.endsWith("/posts/");

  // 如果不是文章页，直接进行语言切换
  if (!isPostPage) {
    return getLocaleSwitchUrlForPath(currentPath, currentLocale, targetLocale);
  }

  // 对于文章页，检查目标语言的翻译是否存在
  const englishPostPath = `/en${currentPath}`;
  const chinesePostPath = currentPath.replace("/en", "");

  // 如果切换到英文且英文版本不存在，跳转到英文博客列表页
  if (targetLocale === "en" && currentLocale === "zh-CN") {
    // 这里可以添加更复杂的逻辑来检查英文版本是否存在
    // 目前先跳转到英文博客列表页
    return ensureTrailingSlash("/en/posts/");
  }

  // 如果切换到中文且中文版本不存在，跳转到中文博客列表页
  if (targetLocale === "zh-CN" && currentLocale === "en") {
    // 这里可以添加更复杂的逻辑来检查中文版本是否存在
    // 目前先跳转到中文博客列表页
    return ensureTrailingSlash("/posts/");
  }

  // 默认情况：直接进行语言切换
  return getLocaleSwitchUrlForPath(currentPath, currentLocale, targetLocale);
}

/**
 * 获取指定路径的语言切换 URL
 */
function getLocaleSwitchUrlForPath(currentPath: string, currentLocale: string, targetLocale: string): string {
  // 构建新的路径
  let newPath = currentPath;

  // 如果当前是默认语言（中文），需要移除前缀并添加目标语言前缀
  if (currentLocale === I18N_CONFIG.defaultLocale) {
    if (targetLocale !== I18N_CONFIG.defaultLocale) {
      newPath = `/${targetLocale}${currentPath}`;
    }
  } else {
    // 如果当前是非默认语言，需要移除当前前缀并添加目标前缀
    if (targetLocale === I18N_CONFIG.defaultLocale) {
      newPath = currentPath.replace(`/${currentLocale}`, "");
      if (newPath === "") newPath = "/";
    } else {
      newPath = currentPath.replace(`/${currentLocale}`, `/${targetLocale}`);
    }
  }

  return ensureTrailingSlash(newPath);
}

// 辅助函数：确保 URL 以 / 结尾
function ensureTrailingSlash(path: string): string {
  if (path === "/") return "/";
  return path.endsWith("/") ? path : `${path}/`;
}

/**
 * 获取所有可用的语言列表
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
 * 获取页面的语言标签
 */
export function getLangTag(Astro: AstroGlobal): string {
  const locale = getCurrentLocale(Astro);
  const profile = getLocaleProfile(locale);
  return profile.langTag;
}

/**
 * 获取页面的文本方向
 */
export function getTextDirection(Astro: AstroGlobal): "ltr" | "rtl" {
  const locale = getCurrentLocale(Astro);
  const profile = getLocaleProfile(locale);
  return profile.direction;
}

/**
 * 格式化日期
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
 * 获取相对时间
 */
export function getRelativeTime(Astro: AstroGlobal, date: Date | string): string {
  const locale = getCurrentLocale(Astro);
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

  const relative = messages.datetime?.relative || {};

  if (diffMins < 1) return relative.justNow || "Just now";
  if (diffMins < 60) return t(Astro, "datetime.relative.minutesAgo", { count: diffMins });
  if (diffHours < 24) return t(Astro, "datetime.relative.hoursAgo", { count: diffHours });
  if (diffDays < 7) return t(Astro, "datetime.relative.daysAgo", { count: diffDays });
  if (diffWeeks < 4) return t(Astro, "datetime.relative.weeksAgo", { count: diffWeeks });
  if (diffMonths < 12) return t(Astro, "datetime.relative.monthsAgo", { count: diffMonths });
  return t(Astro, "datetime.relative.yearsAgo", { count: diffYears });
}