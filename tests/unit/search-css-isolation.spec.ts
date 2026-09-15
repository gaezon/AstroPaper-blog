import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const searchPageSource = readFileSync(
  resolve(__dirname, "../../src/pages/search.astro"),
  "utf8"
);

describe("search page CSS loading", () => {
  it("does not statically import Pagefind CSS at the top of the page", () => {
    expect(searchPageSource).not.toMatch(
      /^import ["']@pagefind\/default-ui\/css\/ui\.css["']/m
    );
  });

  it("loads Pagefind CSS from the idle-time search initializer", () => {
    expect(searchPageSource).toMatch(
      /import\(["']@pagefind\/default-ui\/css\/ui\.css["']\)/
    );
  });

  it("keeps search UI theme overrides inline so they cannot leak into other routes", () => {
    expect(searchPageSource).toMatch(/<style is:inline>/);
    expect(searchPageSource).not.toMatch(/<style is:global>/);
  });
});
