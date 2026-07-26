import { expect, test } from "@playwright/test";
import { SECURITY_HEADERS } from "../src/utils/http-headers";

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
});
