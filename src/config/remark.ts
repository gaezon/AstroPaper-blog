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
 */
export function validateCollapseConfig(config: RemarkCollapseOptions): boolean {
  if (
    config.test &&
    typeof config.test !== "string" &&
    !(config.test instanceof RegExp)
  ) {
    console.warn("remark-collapse: test should be string or RegExp");
    return false;
  }

  if (config.summary && typeof config.summary !== "string") {
    console.warn("remark-collapse: summary should be string");
    return false;
  }

  if (config.open !== undefined && typeof config.open !== "boolean") {
    console.warn("remark-collapse: open should be boolean");
    return false;
  }

  if (config.class && typeof config.class !== "string") {
    console.warn("remark-collapse: class should be string");
    return false;
  }

  if (config.attributes && typeof config.attributes !== "object") {
    console.warn("remark-collapse: attributes should be object");
    return false;
  }

  return true;
}

/**
 * 合并默认配置和用户配置
 */
export function mergeCollapseConfig(
  userConfig: Partial<RemarkCollapseOptions>,
  defaultConfig: RemarkCollapseOptions
): RemarkCollapseOptions {
  return {
    ...defaultConfig,
    ...userConfig,
    attributes: {
      ...defaultConfig.attributes,
      ...userConfig.attributes,
    },
  };
}
