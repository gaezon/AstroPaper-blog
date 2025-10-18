import type { I18nConfig, LocaleProfile } from "./types";
import zhCNMessages from "./locales/zh-CN";
import enMessages from "./locales/en";

// Define configuration for each supported locale
const localeProfiles: Record<string, LocaleProfile> = {
  "zh-CN": {
    name: "简体中文",
    messages: zhCNMessages,
    langTag: "zh-CN",
    direction: "ltr",
    isDefault: true,
    label: "中文",
    font: {
      family:
        "Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif",
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
      family:
        "Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif",
      weights: ["300", "400", "500", "600", "700"],
    },
  },
};

// Export i18n configuration
export const I18N_CONFIG: I18nConfig = {
  supportedLocales: ["zh-CN", "en"],
  defaultLocale: "zh-CN",
  localeProfiles,
  localesToNames: {
    "zh-CN": "简体中文",
    en: "English",
  },
} as const;

// Common helper constants
export const SUPPORTED_LOCALES =
  I18N_CONFIG.supportedLocales as readonly string[];
export const DEFAULT_LOCALE = I18N_CONFIG.defaultLocale;
export const LOCALE_PROFILES = I18N_CONFIG.localeProfiles;

// Get locale profile
export function getLocaleProfile(locale: string): LocaleProfile {
  return LOCALE_PROFILES[locale] || LOCALE_PROFILES[DEFAULT_LOCALE];
}

// Check if the locale is supported
export function isSupportedLocale(
  locale: string
): locale is keyof typeof LOCALE_PROFILES {
  return locale in LOCALE_PROFILES;
}

// Get the default locale
export function getDefaultLocale(): string {
  return DEFAULT_LOCALE;
}

// Get all supported locales
export function getSupportedLocales(): readonly string[] {
  return SUPPORTED_LOCALES;
}

// Get the display name for a locale
export function getLocaleName(locale: string): string {
  return I18N_CONFIG.localesToNames[locale] || locale;
}
