import { BLOG_PATH } from "@/content.config";
import { DEFAULT_LOCALE, SUPPORTED_LOCALES } from "@/i18n/config";
import { slugifyStr } from "./slugify";

const LOCALE_SEGMENT_MAP = SUPPORTED_LOCALES.reduce<Record<string, string>>(
  (acc, locale) => {
    const slug = slugifyStr(locale);
    acc[slug] = locale;

    const short = locale.split("-")[0];
    acc[slugifyStr(short)] = locale;

    return acc;
  },
  {}
);

/**
 * Get full path of a blog post
 * @param id - id of the blog post (aka slug)
 * @param filePath - the blog post full file location
 * @param includeBase - whether to include `/posts` in return value
 * @param customSlug - optional custom slug from frontmatter
 * @returns blog post path
 */
export function getPath(
  id: string,
  filePath: string | undefined,
  includeBase = true,
  customSlug?: string
) {
  const segments =
    filePath
      ?.replace(BLOG_PATH, "")
      .split("/")
      .filter(path => path !== "") // remove empty string in the segments ["", "other-path"] <- empty string will be removed
      .filter(path => !path.startsWith("_")) // exclude directories start with underscore "_"
      .slice(0, -1) // remove the last segment (file name) since it's unnecessary
      .map(segment => slugifyStr(segment)) ?? [];

  const blogId = id.split("/");
  const slug =
    customSlug || (blogId.length > 0 ? blogId[blogId.length - 1] : "");

  let normalizedSegments = [...segments];
  let localePrefix: string | undefined;

  if (normalizedSegments.length > 0) {
    const maybeLocale = normalizedSegments[0];
    const matchedLocale = LOCALE_SEGMENT_MAP[maybeLocale];

    if (matchedLocale) {
      normalizedSegments = normalizedSegments.slice(1);
      if (matchedLocale !== DEFAULT_LOCALE) {
        localePrefix = matchedLocale;
      }
    }
  }

  const pathParts = [...normalizedSegments, slug].filter(Boolean);

  if (!includeBase) {
    return pathParts.join("/");
  }

  const baseParts = ["posts", ...pathParts];
  if (localePrefix) {
    baseParts.unshift(localePrefix);
  }

  const path = `/${baseParts.join("/")}`;
  return path.endsWith("/") ? path : `${path}/`;
}
