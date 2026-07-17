export const UMAMI = {
  origin: "https://umami.gaazeon.com",
  trackerPath: "/umami",
  websiteId: "82ee4d3c-d021-4a8b-94b3-6ce6840b6416",
  articleViewsPath: "/api/public/article-views",
} as const;

export function getUmamiArticleViewsUrl(paths: string[]): string {
  if (paths.length === 0) {
    throw new Error("At least one Umami article path is required");
  }

  const params = new URLSearchParams();

  for (const path of paths) {
    params.append("path", path);
  }

  return `${UMAMI.origin}${UMAMI.articleViewsPath}?${params.toString()}`;
}
