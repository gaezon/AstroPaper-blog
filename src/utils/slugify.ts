import kebabcase from "lodash.kebabcase";
import slugify from "slugify";

/**
 * Returns true when the string contains characters outside the ASCII range
 * (code points > 0x7F), e.g. Chinese, Japanese, Arabic, or accented Latin
 * like é/ü.  We use ASCII as the branch condition rather than "Latin" because
 * `slugify` only handles ASCII reliably; non-ASCII input falls back to
 * lodash.kebabcase which preserves those characters.
 */
const hasNonAscii = (str: string): boolean => /[^\x00-\x7F]/.test(str);

/**
 * Slugify a string using a hybrid approach:
 * - ASCII-only strings: slugify with { lower: true, strict: true }
 *   (e.g. "E2E Testing" → "e2e-testing"; strict mode strips punctuation
 *   like '.' and '!' so the output contains only ident-safe characters
 *   suitable for viewTransitionName and URL slug usage)
 * - Strings with non-ASCII chars (e.g. Chinese, accented Latin):
 *   lodash.kebabcase (preserves non-ASCII characters in the output)
 */
export const slugifyStr = (str: string): string => {
  if (hasNonAscii(str)) {
    return kebabcase(str);
  }
  return slugify(str, { lower: true, strict: true });
};

export const slugifyAll = (arr: string[]) => arr.map(str => slugifyStr(str));
