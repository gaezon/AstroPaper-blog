import { describe, expect, it } from "vitest";
import { getUmamiArticleViewsUrl, UMAMI } from "../../src/config/umami";

describe("Umami public article views configuration", () => {
  it("keeps bilingual paths ordered and encoded as repeated parameters", () => {
    const url = new URL(
      getUmamiArticleViewsUrl([
        "/posts/中文文章/",
        "/en/posts/english-article/",
      ])
    );

    expect(url.origin).toBe(UMAMI.origin);
    expect(url.pathname).toBe("/api/public/article-views");
    expect(url.searchParams.getAll("path")).toEqual([
      "/posts/中文文章/",
      "/en/posts/english-article/",
    ]);
  });

  it("rejects an empty article path list", () => {
    expect(() => getUmamiArticleViewsUrl([])).toThrow(
      "At least one Umami article path is required"
    );
  });
});
