import { test, expect } from "@playwright/test";

/**
 * Mermaid Build-Time Rendering Tests
 *
 * These tests verify that Mermaid diagrams are correctly rendered at build time
 * using rehype-mermaid with the img-svg strategy and dark mode support via
 * <picture> elements.
 *
 * Key differences from client-side rendering:
 * - No JavaScript required for rendering
 * - Dark mode uses <picture> + <source media="(prefers-color-scheme: dark)">
 * - SVGs are inline data URIs in <img> tags
 */

// Shared test configuration
const TEST_POST_PATH = "/posts/OBS-safe-broadcast-pitfalls/";
// Minimum expected SVG data URI length to verify rendering
const MIN_SVG_DATA_LENGTH = 100;
const shouldRenderMermaidAtBuildTime = !!process.env.GITHUB_ACTIONS;

test.describe("Mermaid Build-Time Rendering", () => {
    test.skip(
        !shouldRenderMermaidAtBuildTime,
        "Build-time Mermaid rendering is disabled outside GitHub Actions."
    );

    test.beforeEach(async ({ page }) => {
        await page.goto(TEST_POST_PATH);
        await page.waitForLoadState("load");
    });

    test("should render mermaid diagrams as <picture> elements with inline SVG", async ({
        page,
    }) => {
        // Find picture elements containing mermaid diagrams
        const pictureElements = page.locator("picture");
        const count = await pictureElements.count();

        // Should have at least one mermaid diagram
        expect(count).toBeGreaterThanOrEqual(1);

        // Check the first picture element
        const picture = pictureElements.first();

        // Should have dark mode source (source elements are not visible in DOM)
        const darkSource = picture.locator('source[media]');
        await expect(darkSource).toHaveCount(1);

        // Source should have SVG data URI
        const srcset = await darkSource.getAttribute("srcset");
        expect(srcset).toContain("data:image/svg+xml");
        expect(srcset?.length).toBeGreaterThan(MIN_SVG_DATA_LENGTH);

        // Should have light mode img as fallback
        const img = picture.locator("img");
        await expect(img).toBeVisible();

        const src = await img.getAttribute("src");
        expect(src).toContain("data:image/svg+xml");
        expect(src?.length).toBeGreaterThan(MIN_SVG_DATA_LENGTH);
    });

    test("should have proper dimensions on mermaid images", async ({ page }) => {
        const picture = page.locator("picture").first();
        const img = picture.locator("img");

        await expect(img).toBeVisible();

        // Should have width and height attributes
        const width = await img.getAttribute("width");
        const height = await img.getAttribute("height");

        expect(width).toBeTruthy();
        expect(height).toBeTruthy();
        expect(parseInt(width!)).toBeGreaterThan(0);
        expect(parseInt(height!)).toBeGreaterThan(0);
    });

    test("should have different SVG content for light and dark sources", async ({
        page,
    }) => {
        const picture = page.locator("picture").first();

        // Get dark mode source (source elements are not visible)
        const darkSource = picture.locator('source[media]');
        await expect(darkSource).toHaveCount(1);
        const darkSrcset = await darkSource.getAttribute("srcset");

        // Get light mode img
        const img = picture.locator("img");
        const lightSrc = await img.getAttribute("src");

        // They should be different (different theme colors)
        expect(darkSrcset).not.toBe(lightSrc);
    });

    test("should display correct SVG based on color scheme preference", async ({
        page,
    }) => {
        // Emulate dark color scheme
        await page.emulateMedia({ colorScheme: "dark" });

        const picture = page.locator("picture").first();
        await expect(picture).toBeVisible();

        // In dark mode, the browser should use the dark source
        // We can verify by checking the picture element is rendered correctly
        const img = picture.locator("img");
        await expect(img).toBeVisible();
    });

    test("should handle light color scheme preference", async ({ page }) => {
        // Emulate light color scheme
        await page.emulateMedia({ colorScheme: "light" });

        const picture = page.locator("picture").first();
        await expect(picture).toBeVisible();

        const img = picture.locator("img");
        await expect(img).toBeVisible();
    });
});

test.describe("Mermaid No Client-Side JavaScript", () => {
    test("should not load mermaid.min.js", async ({ page }) => {
        const mermaidRequests: string[] = [];

        page.on("request", request => {
            if (request.url().includes("mermaid")) {
                mermaidRequests.push(request.url());
            }
        });

        await page.goto(TEST_POST_PATH);
        await page.waitForLoadState("load");

        // Should not have any requests for mermaid JavaScript
        expect(mermaidRequests).toHaveLength(0);
    });

    test("should not have MermaidClient console logs", async ({ page }) => {
        const mermaidLogs: string[] = [];

        page.on("console", msg => {
            if (msg.text().includes("MermaidClient")) {
                mermaidLogs.push(msg.text());
            }
        });

        await page.goto(TEST_POST_PATH);
        await page.waitForLoadState("load");

        // Should not have any MermaidClient logs (no client-side rendering)
        expect(mermaidLogs).toHaveLength(0);
    });
});

test.describe("Mermaid Multiple Diagrams", () => {
    test.skip(
        !shouldRenderMermaidAtBuildTime,
        "Build-time Mermaid rendering is disabled outside GitHub Actions."
    );

    test("should render multiple diagrams on the same page", async ({ page }) => {
        await page.goto(TEST_POST_PATH);
        await page.waitForLoadState("load");

        const pictures = page.locator("picture");
        const count = await pictures.count();

        // Verify each diagram has proper structure
        for (let i = 0; i < count; i++) {
            const picture = pictures.nth(i);

            // Should have dark source (source elements are not visible)
            const darkSource = picture.locator('source[media]');
            await expect(darkSource).toHaveCount(1);

            // Should have img fallback
            const img = picture.locator("img");
            await expect(img).toBeVisible();
        }
    });

    test("should have unique IDs for each mermaid diagram", async ({ page }) => {
        await page.goto(TEST_POST_PATH);
        await page.waitForLoadState("load");

        const pictures = page.locator("picture");
        const count = await pictures.count();

        if (count > 1) {
            const ids: Set<string | null> = new Set();

            for (let i = 0; i < count; i++) {
                const source = pictures.nth(i).locator("source").first();
                const id = await source.getAttribute("id");
                if (id) {
                    expect(ids.has(id)).toBe(false); // Should be unique
                    ids.add(id);
                }
            }
        }
    });
});

test.describe("Mermaid Performance", () => {
    test.skip(
        !shouldRenderMermaidAtBuildTime,
        "Build-time Mermaid rendering is disabled outside GitHub Actions."
    );

    test("should render diagrams without JavaScript blocking", async ({ page }) => {
        // Disable JavaScript
        await page.route("**/*.js", route => route.abort());

        await page.goto(TEST_POST_PATH);
        await page.waitForLoadState("domcontentloaded");

        // Diagrams should still be visible even without JavaScript
        const picture = page.locator("picture").first();
        await expect(picture).toBeVisible({ timeout: 5000 });

        const img = picture.locator("img");
        await expect(img).toBeVisible({ timeout: 5000 });
    });
});
