export interface RemarkCollapseOptions {
  /**
   * Test string or RegExp to match headings that should be collapsible
   * @default "Table of contents"
   */
  test?: string | RegExp;

  /**
   * Summary text for the collapsible section
   * @default "Toggle"
   */
  summary?: string | ((heading: string) => string);

  /**
   * Whether the collapsible section should be open by default
   * @default true
   */
  open?: boolean;

  /**
   * CSS class to add to the collapsible container
   * @default "remark-collapse"
   */
  class?: string;

  /**
   * Additional HTML attributes to add to the details element
   */
  attributes?: Record<string, string>;
}

/**
 * Remark-collapse config with i18n support
 */
export const collapseConfigs = {
  zh: {
    test: "目录",
    summary: "展开/收起目录",
    open: false,
    class: "toc-collapse-zh",
    attributes: {
      "data-locale": "zh-CN",
    },
  } as RemarkCollapseOptions,

  en: {
    test: "Table of contents",
    summary: "Toggle TOC",
    open: false,
    class: "toc-collapse-en",
    attributes: {
      "data-locale": "en",
    },
  } as RemarkCollapseOptions,
};

/**
 * Universal collapse config supporting multiple locales
 */
export const universalCollapseConfig: RemarkCollapseOptions = {
  test: /目录|目錄|table of contents|contents/i, // Support both Chinese and English TOC headings
  summary: heading => {
    const text = heading.toLowerCase();
    if (/table\s+of\s+contents|contents/.test(text)) {
      return "Toggle TOC";
    }
    if (/目录|目錄/.test(heading)) {
      return "展开/收起目录";
    }
    return "Toggle TOC";
  },
  open: false,
  class: "toc-collapse",
};

/**
 * Get collapse config by current locale
 */
export function getCollapseConfig(
  locale: string = "zh-CN"
): RemarkCollapseOptions {
  const normalizedLocale = locale?.toLowerCase?.() ?? "zh-cn";

  if (Object.prototype.hasOwnProperty.call(collapseConfigs, normalizedLocale)) {
    return collapseConfigs[normalizedLocale as keyof typeof collapseConfigs];
  }

  const baseLocale = normalizedLocale.split("-")[0];

  if (Object.prototype.hasOwnProperty.call(collapseConfigs, baseLocale)) {
    return collapseConfigs[baseLocale as keyof typeof collapseConfigs];
  }

  return collapseConfigs.zh;
}

/**
 * Get universal config with i18n
 */
export function getI18nCollapseConfig(): RemarkCollapseOptions {
  return universalCollapseConfig;
}

/**
 * Default remark-toc config
 */
export const tocConfig = {
  heading: "contents|目录|table of contents",
  maxDepth: 3,
  tight: true,
  ordered: false,
  prefix: "",
};

/**
 * Validate remark-collapse config options
 * @throws Error if configuration is invalid
 */
export function validateCollapseConfig(config: RemarkCollapseOptions): void {
  if (
    config.test &&
    typeof config.test !== "string" &&
    !(config.test instanceof RegExp)
  ) {
    throw new Error(
      `remark-collapse: test should be string or RegExp, received ${typeof config.test}`
    );
  }

  if (
    config.summary &&
    typeof config.summary !== "string" &&
    typeof config.summary !== "function"
  ) {
    throw new Error("remark-collapse: summary should be string or function");
  }

  if (config.open !== undefined && typeof config.open !== "boolean") {
    throw new Error("remark-collapse: open should be boolean");
  }

  if (config.class && typeof config.class !== "string") {
    throw new Error("remark-collapse: class should be string");
  }

  if (config.attributes && typeof config.attributes !== "object") {
    throw new Error("remark-collapse: attributes should be object");
  }
}

/**
 * Merge default config and user config
 */
export function mergeCollapseConfig(
  userConfig: Partial<RemarkCollapseOptions>,
  defaultConfig: RemarkCollapseOptions
): RemarkCollapseOptions {
  const mergedConfig = {
    ...defaultConfig,
    ...userConfig,
    attributes: {
      ...defaultConfig.attributes,
      ...userConfig.attributes,
    },
  };

  // Validate merged config
  validateCollapseConfig(mergedConfig);

  return mergedConfig;
}
