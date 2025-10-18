import type { RemarkCollapseOptions } from "../../remark-collapse";

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
  test: /目录|Table of contents|目录/i, // 支持中英文目录标题
  summary: "展开/收起目录", // 默认中文摘要
  open: false,
  class: "toc-collapse",
  attributes: {
    "data-multilingual": "true",
    "data-zh-title": "展开/收起目录",
    "data-en-title": "Toggle TOC",
  },
};

/**
 * 根据当前语言获取 collapse 配置
 */
export function getCollapseConfig(
  locale: string = "zh-CN"
): RemarkCollapseOptions {
  return (
    collapseConfigs[locale as keyof typeof collapseConfigs] ||
    collapseConfigs.zh
  );
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
    throw new Error("remark-collapse: test should be string or RegExp");
  }

  if (config.summary && typeof config.summary !== "string") {
    throw new Error("remark-collapse: summary should be string");
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
