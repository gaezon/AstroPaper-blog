import { unifiedCommentPaths } from "@/utils/generated/bilingualMapping";

const articleViewPathMap = new Map<string, readonly string[]>();

for (const { zhPath, enPath } of Object.values(unifiedCommentPaths)) {
  const paths = [zhPath, enPath] as const;
  articleViewPathMap.set(zhPath, paths);
  articleViewPathMap.set(enPath, paths);
}

/**
 * Return the canonical Umami paths for an article. Bilingual posts always use
 * the same Chinese-first order so both locales share one CDN cache key.
 */
export function getArticleViewPaths(articlePath: string): string[] {
  return [...(articleViewPathMap.get(articlePath) ?? [articlePath])];
}
