export interface LocaleProfile {
  /** Locale display name */
  name: string;
  /** Translation messages object */
  messages: Record<string, unknown>;
  /** Language tag (ISO 639-1 + ISO 3166-1) */
  langTag: string;
  /** Text direction: "ltr" | "rtl" */
  direction: "ltr" | "rtl";
  /** Font configuration */
  font?: {
    family: string;
    weights?: string[];
  };
  /** Is default locale */
  isDefault?: boolean;
  /** Label shown in language switcher */
  label?: string;
}

export interface I18nConfig {
  /** Supported locales */
  supportedLocales: readonly string[];
  /** Default locale */
  defaultLocale: string;
  /** Locale profile mapping */
  localeProfiles: Record<string, LocaleProfile>;
  /** Locale-to-name mapping */
  localesToNames: Record<string, string>;
}

export interface TranslationNamespace {
  [key: string]: string | TranslationNamespace;
}

export type Locale = "zh-CN" | "en";

export interface BlogPostSchema {
  author: string;
  pubDatetime: Date;
  modDatetime?: Date | null;
  title: string;
  featured?: boolean;
  draft?: boolean;
  tags: string[];
  ogImage?: string | { src: string; alt: string };
  description: string;
  canonicalURL?: string;
  hideEditPost?: boolean;
  timezone?: string;
  /** Locale identifier */
  locale?: string;
  /** Original post title (for translated article reference) */
  originalTitle?: string;
}
