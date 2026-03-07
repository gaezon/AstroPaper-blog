export type BlogLocale = "zh-CN" | "en";

export function isBlogLocale(locale: string): locale is BlogLocale {
  return locale === "zh-CN" || locale === "en";
}

export function normalizeBlogLocale(locale: string): BlogLocale {
  if (isBlogLocale(locale)) {
    return locale;
  }

  throw new Error(
    `Unsupported blog locale: ${locale}. Expected one of: zh-CN, en.`
  );
}
