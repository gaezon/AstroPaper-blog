/**
 * Single source of truth for post file extensions.
 *
 * Both the Astro content collection (src/content.config.ts) and the
 * maintenance scripts under scripts/ must agree on which extensions
 * count as a post. Adding a new format (e.g. .md → .mdoc) only
 * requires updating this file.
 */

/** Lowercase extensions, including the leading dot. */
export const POST_EXTENSIONS = [".md", ".mdx"] as const;

/**
 * Glob pattern fragment matching either Markdown or MDX, e.g. `{md,mdx}`.
 * Use it inside a glob like `**\/[^_]*.${POST_GLOB_EXT}`.
 */
export const POST_GLOB_EXT = `{${POST_EXTENSIONS.map(ext => ext.slice(1)).join(",")}}`;

/**
 * True if the filename ends with a recognised post extension.
 * Comparison is case-insensitive (e.g. `.MDX` is also recognised).
 */
export function isPostFile(name: string): boolean {
  const lower = name.toLowerCase();
  return POST_EXTENSIONS.some(ext => lower.endsWith(ext));
}

/**
 * Strip the trailing post extension to derive a slug from a filename.
 * Comparison is case-insensitive; the original casing of the stem is preserved.
 */
export function stripPostExtension(name: string): string {
  const lower = name.toLowerCase();
  for (const ext of POST_EXTENSIONS) {
    if (lower.endsWith(ext)) return name.slice(0, -ext.length);
  }
  return name;
}
