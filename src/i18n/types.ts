export interface LocaleProfile {
  /** 语言名称 */
  name: string;
  /** 翻译消息对象 */
  messages: Record<string, unknown>;
  /** 语言标签 (ISO 639-1 + ISO 3166-1) */
  langTag: string;
  /** 文本方向: "ltr" | "rtl" */
  direction: "ltr" | "rtl";
  /** 字体配置 */
  font?: {
    family: string;
    weights?: string[];
  };
  /** 是否为默认语言 */
  isDefault?: boolean;
  /** 语言切换器中显示的标签 */
  label?: string;
}

export interface I18nConfig {
  /** 支持的语言列表 */
  supportedLocales: readonly string[];
  /** 默认语言 */
  defaultLocale: string;
  /** 语言配置映射 */
  localeProfiles: Record<string, LocaleProfile>;
  /** 语言到名称的映射 */
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
  /** 语言标识 */
  locale?: string;
  /** 原始文章标题（用于翻译文章的引用） */
  originalTitle?: string;
}
