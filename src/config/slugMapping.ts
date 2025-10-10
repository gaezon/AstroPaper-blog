/**
 * Bilingual post slug mapping configuration
 *
 * This file maintains the mapping between English and Chinese post slugs
 * for the Twikoo comment system to ensure comment synchronization
 * across language versions.
 *
 * Format: "english-slug": "Chinese-Slug"
 *
 * Usage:
 * - When creating a new bilingual post, add the mapping here
 * - English slug should match the slug in src/data/blog/en/
 * - Chinese slug should match the slug in src/data/blog/
 *
 * Example:
 * {
 *   "why-i-started-blogging": "Why-did-I-start-blogging",
 *   "another-english-post": "Another-Chinese-Post"
 * }
 */

export const slugMapping: Record<string, string> = {
  "why-i-started-blogging": "Why-did-I-start-blogging",
  // Add more mappings here as new bilingual posts are created
  // Format: "english-slug": "Chinese-Slug"
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
