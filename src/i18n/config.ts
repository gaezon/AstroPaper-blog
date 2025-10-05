import type { I18nConfig, LocaleProfile } from "./types";
import zhCNMessages from "./locales/zh-CN";
import enMessages from "./locales/en";

// 定义各语言的配置
const localeProfiles: Record<string, LocaleProfile> = {
  "zh-CN": {
    name: "简体中文",
    messages: zhCNMessages,
    langTag: "zh-CN",
    direction: "ltr",
    isDefault: true,
    label: "中文",
    font: {
      family: "Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif",
      weights: ["300", "400", "500", "600", "700"],
    },
  },
  en: {
    name: "English",
    messages: enMessages,
    langTag: "en",
    direction: "ltr",
    label: "English",
    font: {
      family: "Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif",
      weights: ["300", "400", "500", "600", "700"],
    },
  },
};

// 导出 i18n 配置
export const I18N_CONFIG: I18nConfig = {
  supportedLocales: ["zh-CN", "en"],
  defaultLocale: "zh-CN",
  localeProfiles,
  localesToNames: {
    "zh-CN": "简体中文",
    en: "English",
  },
} as const;

// 常用的辅助函数
export const SUPPORTED_LOCALES = I18N_CONFIG.supportedLocales as readonly string[];
export const DEFAULT_LOCALE = I18N_CONFIG.defaultLocale;
export const LOCALE_PROFILES = I18N_CONFIG.localeProfiles;

// 获取语言配置
export function getLocaleProfile(locale: string): LocaleProfile {
  return LOCALE_PROFILES[locale] || LOCALE_PROFILES[DEFAULT_LOCALE];
}

// 检查是否为支持的语言
export function isSupportedLocale(locale: string): locale is keyof typeof LOCALE_PROFILES {
  return locale in LOCALE_PROFILES;
}

// 获取默认语言
export function getDefaultLocale(): string {
  return DEFAULT_LOCALE;
}

// 获取所有支持的语言
export function getSupportedLocales(): readonly string[] {
  return SUPPORTED_LOCALES;
}

// 获取语言名称
export function getLocaleName(locale: string): string {
  return I18N_CONFIG.localesToNames[locale] || locale;
}