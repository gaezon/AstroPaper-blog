import { describe, expect, it } from "vitest";
import { getUmamiArticleViewsUrl, UMAMI } from "../../src/config/umami";

describe("Umami public article views configuration", () => {
  it("keeps bilingual paths ordered and encoded as repeated parameters", () => {
    const url = new URL(
      getUmamiArticleViewsUrl([
        "/posts/中文文章/",
        "/en/posts/english-article/",
      ]),
      "https://blog.example.com"
    );

    expect(url.origin).toBe("https://blog.example.com");
    expect(UMAMI.articleViewsProxyPath).toBe("/api/article-views/");
    expect(url.pathname).toBe(UMAMI.articleViewsProxyPath);
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
