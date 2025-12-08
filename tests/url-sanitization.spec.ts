import { describe, it, expect } from "vitest";
import { sanitizePath } from "../src/utils/url";

describe("sanitizePath", () => {
    describe("valid paths", () => {
        it("should return valid relative paths unchanged", () => {
            expect(sanitizePath("/posts/example")).toBe("/posts/example");
            expect(sanitizePath("/en/")).toBe("/en/");
            expect(sanitizePath("/")).toBe("/");
        });

        it("should trim whitespace from valid paths", () => {
            expect(sanitizePath("  /posts/example  ")).toBe("/posts/example");
        });

        it("should allow paths with query parameters", () => {
            expect(sanitizePath("/search/?q=test")).toBe("/search/?q=test");
        });

        it("should allow paths with fragments", () => {
            expect(sanitizePath("/posts/example#section")).toBe(
                "/posts/example#section"
            );
        });
    });

    describe("invalid or missing paths", () => {
        it("should return '/' for null input", () => {
            expect(sanitizePath(null)).toBe("/");
        });

        it("should return '/' for undefined input", () => {
            expect(sanitizePath(undefined)).toBe("/");
        });

        it("should return '/' for empty string", () => {
            expect(sanitizePath("")).toBe("/");
        });

        it("should return '/' for whitespace-only string", () => {
            expect(sanitizePath("   ")).toBe("/");
        });
    });

    describe("paths not starting with /", () => {
        it("should reject paths without leading slash", () => {
            expect(sanitizePath("posts/example")).toBe("/");
            expect(sanitizePath("example.com")).toBe("/");
        });
    });

    describe("dangerous protocols (XSS prevention)", () => {
        it("should block javascript: protocol", () => {
            expect(sanitizePath("/javascript:alert(1)")).toBe("/");
            expect(sanitizePath("/path?url=javascript:alert(1)")).toBe("/");
        });

        it("should block javascript: protocol (case-insensitive)", () => {
            expect(sanitizePath("/JAVASCRIPT:alert(1)")).toBe("/");
            expect(sanitizePath("/JaVaScRiPt:alert(1)")).toBe("/");
        });

        it("should block data: protocol", () => {
            expect(sanitizePath("/data:text/html,<script>")).toBe("/");
            expect(sanitizePath("/path?content=data:text/html")).toBe("/");
        });

        it("should block vbscript: protocol", () => {
            expect(sanitizePath("/vbscript:msgbox('xss')")).toBe("/");
        });

        it("should block dangerous protocols in URL fragments", () => {
            expect(sanitizePath("/path#javascript:alert(1)")).toBe("/");
            expect(sanitizePath("/path#data:text/html")).toBe("/");
        });
    });

    describe("protocol-relative URLs (open redirect prevention)", () => {
        it("should block protocol-relative URLs", () => {
            expect(sanitizePath("//evil.com")).toBe("/");
            expect(sanitizePath("//example.com/path")).toBe("/");
        });
    });

    describe("false positive prevention", () => {
        it("should NOT block legitimate paths containing protocol-like words", () => {
            // These paths contain "javascript", "data", "vbscript" as part of the path
            // but are NOT dangerous protocols (no colon at protocol position)
            expect(sanitizePath("/posts/javascript-tutorial/")).toBe(
                "/posts/javascript-tutorial/"
            );
            expect(sanitizePath("/posts/learning-data-science/")).toBe(
                "/posts/learning-data-science/"
            );
            expect(sanitizePath("/vbscript-legacy/")).toBe("/vbscript-legacy/");
            expect(sanitizePath("/en/posts/javascript-basics/")).toBe(
                "/en/posts/javascript-basics/"
            );
        });
    });
});
