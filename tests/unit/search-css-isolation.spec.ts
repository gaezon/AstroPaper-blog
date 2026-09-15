import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const searchPageSource = readFileSync(
  resolve(__dirname, "../../src/pages/search.astro"),
  "utf8"
);
const pagefindUiSource = readFileSync(
  resolve(__dirname, "../../src/scripts/pagefind-ui.ts"),
  "utf8"
);

describe("search page CSS loading", () => {
  it("does not side-effect import Pagefind CSS into the page stylesheet graph", () => {
    expect(searchPageSource).not.toMatch(
      /import ["']@pagefind\/default-ui\/css\/ui\.css["']/
    );
    expect(pagefindUiSource).not.toMatch(
      /^import ["']@pagefind\/default-ui\/css\/ui\.css["'];?$/m
    );
  });

  it("starts hashed Pagefind CSS on module eval and waits for it with JS on idle", () => {
    expect(pagefindUiSource).toMatch(
      /@pagefind\/default-ui\/css\/ui\.css\?url/
    );
    expect(searchPageSource).toMatch(/Promise\.all\(/);
    expect(searchPageSource).toMatch(/import\(["']@pagefind\/default-ui["']\)/);
    expect(searchPageSource).toMatch(/loadPagefindStylesheet\(/);
  });

  it("keeps search UI theme overrides inline so they cannot leak into other routes", () => {
    expect(searchPageSource).toMatch(/<style is:inline>/);
    expect(searchPageSource).not.toMatch(/<style is:global>/);
  });
});
