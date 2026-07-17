import { describe, expect, it } from "vitest";
import { getArticleViewPaths } from "../../src/utils/article-view-paths";

describe("article view paths", () => {
  const zhPath = "/posts/hoarder-app-replace-cubox/";
  const enPath = "/en/posts/self-host-hoarder-replace-cubox/";

  it("returns the same Chinese-first pair for both locales", () => {
    expect(getArticleViewPaths(zhPath)).toEqual([zhPath, enPath]);
    expect(getArticleViewPaths(enPath)).toEqual([zhPath, enPath]);
  });

  it("returns only the current path for an unpaired article", () => {
    const path = "/posts/upgrade-astropaper-git/";
    expect(getArticleViewPaths(path)).toEqual([path]);
  });
});
