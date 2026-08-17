import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import {
  TWIKOO_EMOTION_CDN,
  TWIKOO_UPSTREAM_EMOTION_CDN,
} from "../../src/config/twikoo";
import { rewriteTwikooEmotionCdnUrl } from "../../src/utils/twikoo-emotion-cdn";

const catalogPath = join(
  dirname(fileURLToPath(import.meta.url)),
  "../../public/twikoo/owo.json"
);

describe("rewriteTwikooEmotionCdnUrl", () => {
  it("rewrites the Twikoo 1.7.19 upstream catalog to the same-origin copy", () => {
    expect(rewriteTwikooEmotionCdnUrl(TWIKOO_UPSTREAM_EMOTION_CDN)).toBe(
      TWIKOO_EMOTION_CDN
    );
    expect(rewriteTwikooEmotionCdnUrl("/twikoo/owo.json")).toBe(
      "/twikoo/owo.json"
    );
    expect(rewriteTwikooEmotionCdnUrl("https://comment.gaazeon.com/")).toBe(
      "https://comment.gaazeon.com/"
    );
  });
});

describe("vendored Twikoo OwO catalog", () => {
  it("is valid OwO JSON whose image icons stay on the upstream image host", () => {
    const catalog = JSON.parse(readFileSync(catalogPath, "utf8")) as Record<
      string,
      { type?: string; container?: { icon?: string }[] }
    >;

    expect(Object.keys(catalog)).toEqual(["颜文字", "Emoji", "Bilibili"]);

    const imageIcons =
      catalog.Bilibili?.container
        ?.map(item => item.icon ?? "")
        .filter(icon => icon.includes("<img")) ?? [];

    expect(imageIcons.length).toBeGreaterThan(0);
    expect(
      imageIcons.every(icon => /src="https:\/\/owo\.imaegoo\.com\//.test(icon))
    ).toBe(true);
    expect(JSON.stringify(catalog)).not.toMatch(
      /https?:\/\/(?!owo\.imaegoo\.com)/
    );
  });
});
