import { describe, expect, it } from "vitest";
import enMessages from "../../src/i18n/locales/en";
import zhCNMessages from "../../src/i18n/locales/zh-CN";

function collectLeafKeys(value: unknown, prefix = ""): string[] {
  if (typeof value === "string") {
    return [prefix];
  }

  if (!value || typeof value !== "object") {
    return [];
  }

  return Object.entries(value).flatMap(([key, child]) =>
    collectLeafKeys(child, prefix ? `${prefix}.${key}` : key)
  );
}

describe("i18n message dictionaries", () => {
  it("keeps zh-CN and en leaf keys in sync", () => {
    const zhKeys = collectLeafKeys(zhCNMessages).sort();
    const enKeys = collectLeafKeys(enMessages).sort();

    expect(zhKeys).toEqual(enKeys);
  });
});
