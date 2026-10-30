import { slugifyStr } from "./slugify";

export type TransitionNameKind = "post" | "tag";

/**
 * Produce a valid CSS <custom-ident> for view-transition-name.
 *
 * Posts and tags share a page (a post renders its tag chips next to the
 * title), so each kind gets its own namespace to keep names unique.
 */
export const toTransitionName = (
  str: string,
  kind: TransitionNameKind = "post"
): string => {
  const base = slugifyStr(str.replaceAll(".", "-"));
  const result = base
    .replace(
      /[^\x00-\x7F]/gu,
      c => `u${c.codePointAt(0)!.toString(16).padStart(6, "0")}`
    )
    .replace(/[^a-zA-Z0-9_-]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "");

  return result ? `${kind}-${result}` : kind;
};
