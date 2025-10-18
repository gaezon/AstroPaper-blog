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
 * 国际化支持的 remark-collapse 配置
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
 * 通用 collapse 配置，支持多种语言模式
 */
export const universalCollapseConfig: RemarkCollapseOptions = {
  test: /目录|目錄|table of contents|contents/i, // 支持中英文目录标题
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
 * 根据当前语言获取 collapse 配置
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
 * 获取支持国际化的通用配置
 */
export function getI18nCollapseConfig(): RemarkCollapseOptions {
  return universalCollapseConfig;
}

/**
 * 默认的 remark-toc 配置
 */
export const tocConfig = {
  heading: "contents|目录|table of contents",
  maxDepth: 3,
  tight: true,
  ordered: false,
  prefix: "",
};

/**
 * 验证 remark-collapse 配置选项
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
 * 合并默认配置和用户配置
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

  // 验证合并后的配置
  validateCollapseConfig(mergedConfig);

  return mergedConfig;
}
