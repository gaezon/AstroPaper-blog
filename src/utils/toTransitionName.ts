import { slugifyStr } from "./slugify";

/**
 * Produce a valid CSS <custom-ident> for view-transition-name.
 */
export const toTransitionName = (str: string): string => {
  const base = slugifyStr(str.replaceAll(".", "-"));
  const result = base
    .replace(
      /[^\x00-\x7F]/gu,
      c => `u${c.codePointAt(0)!.toString(16).padStart(6, "0")}`
    )
    .replace(/[^a-zA-Z0-9_-]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "");

  return result ? `post-${result}` : "post";
};
