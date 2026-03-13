import { describe, expect, it } from "vitest";
import {
  applyLocalized404Routes,
  LOCALIZED_NOT_FOUND_ROUTES,
} from "../../scripts/apply-vercel-routes";

describe("applyLocalized404Routes", () => {
  it("inserts the English 404 route before the default fallback", () => {
    const config = {
      version: 3,
      routes: [
        { handle: "filesystem" },
        {
          src: "^/_astro/(.*)$",
          headers: {
            "cache-control": "public, max-age=31536000, immutable",
          },
          continue: true,
        },
        { src: "^/.*$", dest: "/404.html", status: 404 },
      ],
    };

    expect(applyLocalized404Routes(config).routes).toEqual([
      { handle: "filesystem" },
      {
        src: "^/_astro/(.*)$",
        headers: {
          "cache-control": "public, max-age=31536000, immutable",
        },
        continue: true,
      },
      ...LOCALIZED_NOT_FOUND_ROUTES,
    ]);
  });

  it("stays idempotent when routes are already patched", () => {
    const config = {
      version: 3,
      routes: [{ handle: "filesystem" }, ...LOCALIZED_NOT_FOUND_ROUTES],
    };

    expect(applyLocalized404Routes(config).routes).toEqual(config.routes);
  });
});
