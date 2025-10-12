/**
 * @deprecated This file is kept for backward compatibility only.
 *
 * The Comment.astro component now uses originalTitle-based automatic mapping
 * instead of manual slug mapping. This approach eliminates the need for
 * manual maintenance of slug mappings.
 *
 * New bilingual posts should ensure both language versions have the same
 * originalTitle field in their frontmatter.
 *
 * For migration details, see the improved Comment.astro implementation.
 */

export const slugMapping: Record<string, string> = {
  "why-i-started-blogging": "why-did-i-start-blogging",
  "remove-tracking-qinglong": "remove-tracking-qinglong",
  "why-switch-from-hapigo-to-raycast": "why-switch-from-hapigo-to-raycast",
  "ibkr-drip": "is-ibkr-drip-really-commission-free",
  "obs-live-streaming-safe-broadcast-delay-pitfalls":
    "OBS-safe-broadcast-pitfalls",
  "tailscale-site-to-site-openwrt-p2p": "tailscale-site-to-site-connect",
  "upgrade-astropaper-git": "upgrade-astropaper-git",
  "cline-notion-mcp-gcp": "cline-notion-mcp-gcp",
  "self-host-hoarder-replace-cubox": "hoarder-app-replace-cubox",
  // Add more mappings here as new bilingual posts are created
  // Format: "english-slug": "chinese-slug"
};

/**
 * Helper function to get Chinese slug from English slug
 * @param englishSlug The English post slug
 * @returns The corresponding Chinese slug or undefined if not found
 */
export function getChineseSlug(englishSlug: string): string | undefined {
  return slugMapping[englishSlug];
}

/**
 * Helper function to check if a post has bilingual support
 * @param englishSlug The English post slug
 * @returns True if the post has a Chinese version mapped
 */
export function hasBilingualSupport(englishSlug: string): boolean {
  return englishSlug in slugMapping;
}

/**
 * Helper function to get all bilingual post mappings
 * @returns Array of objects containing English and Chinese slugs
 */
export function getBilingualMappings(): Array<{
  englishSlug: string;
  chineseSlug: string;
}> {
  return Object.entries(slugMapping).map(([englishSlug, chineseSlug]) => ({
    englishSlug,
    chineseSlug,
  }));
}

/**
 * Helper function to resolve the best Chinese slug for comment path construction
 * This function provides better readability by replacing complex ternary operators
 * @param englishSlug The English post slug
 * @param fallbackSlug The fallback slug (usually the post id or original slug)
 * @returns The best available Chinese slug or fallback slug
 */
export function getBestChineseSlugForPath(
  englishSlug: string,
  fallbackSlug: string
): string {
  // Try to get mapped Chinese slug first
  const mappedChineseSlug = getChineseSlug(englishSlug);
  if (mappedChineseSlug) {
    return mappedChineseSlug;
  }

  // Fall back to the original English slug if no mapping exists
  if (englishSlug) {
    return englishSlug;
  }

  // Final fallback to ensure we always return a valid slug
  return fallbackSlug;
}
