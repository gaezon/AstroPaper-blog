import { expect, test } from "@playwright/test";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import {
  SECURITY_HEADERS,
  WELL_KNOWN_CONTENT_TYPES,
} from "../src/utils/http-headers";

test.describe("Dev-Prod Parity Middleware", () => {
  test("injects security and discovery headers into regular page responses", async ({
    request,
  }) => {
    const response = await request.get("/");
    expect(response.ok()).toBe(true);

    const headers = response.headers();

    // Verify CSP
    expect(headers["content-security-policy"]).toBe(
      SECURITY_HEADERS["Content-Security-Policy"]
    );

    // Verify Discovery Link Header
    expect(headers["link"]).toBe(SECURITY_HEADERS["Link"]);

    // Verify other security headers
    expect(headers["referrer-policy"]).toBe(
      SECURITY_HEADERS["Referrer-Policy"]
    );
    expect(headers["x-content-type-options"]).toBe(
      SECURITY_HEADERS["X-Content-Type-Options"]
    );
    expect(headers["permissions-policy"]).toBe(
      SECURITY_HEADERS["Permissions-Policy"]
    );
  });

  test("serves correct Content-Type for well-known discovery resources", async ({
    request,
  }) => {
    for (const [route, expectedContentType] of Object.entries(
      WELL_KNOWN_CONTENT_TYPES
    )) {
      const response = await request.get(`/.well-known${route}`);
      expect(response.ok()).toBe(true);

      const headers = response.headers();
      expect(headers["content-type"]).toBe(expectedContentType);

      // Verify that security headers are also injected on well-known endpoints
      expect(headers["content-security-policy"]).toBe(
        SECURITY_HEADERS["Content-Security-Policy"]
      );
    }
  });

  test("returns JSON-formatted 404 for missing API routes", async ({
    request,
  }) => {
    const response = await request.get("/api/non-existent-endpoint/");
    expect(response.status()).toBe(404);

    const headers = response.headers();
    expect(headers["content-type"]).toBe("application/json; charset=utf-8");

    // Read the baseline error response
    const errorJsonPath = join(process.cwd(), "public", "api-error.json");
    const expectedJson = JSON.parse(readFileSync(errorJsonPath, "utf-8"));

    const body = await response.json();
    expect(body).toEqual(expectedJson);
  });

  test("performs Markdown content negotiation when Accept header is sent", async ({
    request,
  }) => {
    const response = await request.get("/", {
      headers: {
        Accept: "text/markdown",
      },
    });

    expect(response.status()).toBe(200);

    const headers = response.headers();
    expect(headers["content-type"]).toBe("text/markdown; charset=utf-8");
    expect(headers["vary"]).toContain("Accept");

    const text = await response.text();
    // Validate it contains the markdown header or content from public/index.md
    expect(text).toContain("# Gaazeon's Blog");
  });
});
