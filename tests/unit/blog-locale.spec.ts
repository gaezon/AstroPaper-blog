import { describe, expect, it } from "vitest";
import { isBlogLocale, normalizeBlogLocale } from "../../src/utils/blog-locale";

describe("blog locale helpers", () => {
  describe("isBlogLocale", () => {
    it("accepts supported locales only", () => {
      expect(isBlogLocale("zh-CN")).toBe(true);
      expect(isBlogLocale("en")).toBe(true);
      expect(isBlogLocale("zh")).toBe(false);
      expect(isBlogLocale("fr")).toBe(false);
    });
  });

  describe("normalizeBlogLocale", () => {
    it("returns supported locales unchanged", () => {
      expect(normalizeBlogLocale("zh-CN")).toBe("zh-CN");
      expect(normalizeBlogLocale("en")).toBe("en");
    });

    it("throws for unsupported locales instead of silently falling back", () => {
      expect(() => normalizeBlogLocale("zh")).toThrow(
        "Unsupported blog locale: zh. Expected one of: zh-CN, en."
      );
      expect(() => normalizeBlogLocale("fr")).toThrow(
        "Unsupported blog locale: fr. Expected one of: zh-CN, en."
      );
    });
  });
});
