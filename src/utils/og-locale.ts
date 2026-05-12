/**
 * Map a locale identifier to the OpenGraph locale format.
 * Used by Layout.astro for og:locale and og:locale:alternate meta tags,
 * and by tests to verify consistency.
 */
export function toOgLocale(locale: string): string {
  if (locale === "zh-CN") return "zh_CN";
  if (locale === "en") return "en_US";
  return locale.replaceAll("-", "_");
}
