import { test, expect } from "@playwright/test";
import postOgImage from "../src/utils/og-templates/post.js";

test.describe("OG text normalization", () => {
  const baseData = {
    author: "Gaazeon",
    locale: "en",
  } as const;

  test("replaces non-breaking hyphen with standard hyphen", async () => {
    const titleWithNonBreakingHyphen = "OBS\u2011live streaming pitfalls";

    const svg = await postOgImage({
      data: {
        ...baseData,
        title: titleWithNonBreakingHyphen,
      },
    });

    expect(svg).not.toContain("\u2011");
    expect(svg).toContain("OBS\u2010live streaming pitfalls");
  });

  test("does not render fallback squares for normalized hyphen", async () => {
    const svg = await postOgImage({
      data: {
        ...baseData,
        title: "OBS\u2011live streaming pitfalls",
      },
    });

    expect(svg).not.toContain("□");
  });

  test("strips variation selectors and preserves ASCII hyphen", async () => {
    const titleWithVariationSelector = "New\uFE0F Post - Update";

    const svg = await postOgImage({
      data: {
        ...baseData,
        title: titleWithVariationSelector,
      },
    });

    expect(svg).not.toContain("\uFE0F");
    expect(svg).toContain("New Post - Update");
  });
});
