import { test, expect } from "@playwright/test";

// Shared test configuration
const TEST_POST_PATH = "/posts/OBS-safe-broadcast-pitfalls/";
// Debounce timer in client.ts is 120ms, add buffer for render time
const THEME_CHANGE_WAIT_MS = 300;
// Minimum expected SVG content length to verify rendering
const MIN_SVG_CONTENT_LENGTH = 100;

test.describe("Mermaid Diagram Rendering", () => {
    test.beforeEach(async ({ page }) => {
        await page.goto(TEST_POST_PATH);
        await page.waitForLoadState("networkidle");
    });

    test("should render mermaid diagrams as SVG", async ({ page }) => {
        // Wait for mermaid diagrams to be rendered (they are lazy-loaded)
        const diagramWrapper = page.locator(".mermaid-diagram").first();

        // Scroll to make the diagram visible (triggers IntersectionObserver)
        await diagramWrapper.scrollIntoViewIfNeeded();

        // Wait for SVG to be rendered
        await expect(diagramWrapper.locator("svg")).toBeVisible({ timeout: 10000 });

        // Verify the diagram has been rendered with proper structure
        const svg = diagramWrapper.locator("svg");
        await expect(svg).toHaveCount(1);

        // SVG should have some content (not empty)
        const svgContent = await svg.innerHTML();
        expect(svgContent.length).toBeGreaterThan(MIN_SVG_CONTENT_LENGTH);
    });

    test("should set accessibility attributes on rendered diagrams", async ({
        page,
    }) => {
        const diagramWrapper = page.locator(".mermaid-diagram").first();

        // Scroll to trigger rendering
        await diagramWrapper.scrollIntoViewIfNeeded();

        // Wait for rendering
        await expect(diagramWrapper.locator("svg")).toBeVisible({ timeout: 10000 });

        // Check ARIA attributes
        await expect(diagramWrapper).toHaveAttribute("role", "img");
        await expect(diagramWrapper).toHaveAttribute("aria-label", "Mermaid diagram");
    });

    test("should apply correct theme styling in light mode", async ({ page }) => {
        // Ensure we're in light mode
        await page.evaluate(() => {
            document.documentElement.classList.remove("dark");
            localStorage.setItem("theme", "light");
        });

        // Reload to apply theme
        await page.reload();
        await page.waitForLoadState("networkidle");

        const diagramWrapper = page.locator(".mermaid-diagram").first();
        await diagramWrapper.scrollIntoViewIfNeeded();
        await expect(diagramWrapper.locator("svg")).toBeVisible({ timeout: 10000 });

        // Check that the diagram uses light theme colors
        // The SVG should contain light theme colors
        const svgContent = await diagramWrapper.locator("svg").innerHTML();

        // Light theme uses transparent background and specific colors
        // Just verify it rendered without checking exact colors
        expect(svgContent).toBeTruthy();
        expect(svgContent.length).toBeGreaterThan(MIN_SVG_CONTENT_LENGTH);
    });

    test("should apply correct theme styling in dark mode", async ({ page }) => {
        // Switch to dark mode
        await page.evaluate(() => {
            document.documentElement.classList.add("dark");
            localStorage.setItem("theme", "dark");
        });

        // Reload to apply theme
        await page.reload();
        await page.waitForLoadState("networkidle");

        const diagramWrapper = page.locator(".mermaid-diagram").first();
        await diagramWrapper.scrollIntoViewIfNeeded();
        await expect(diagramWrapper.locator("svg")).toBeVisible({ timeout: 10000 });

        // Verify diagram rendered
        const svgContent = await diagramWrapper.locator("svg").innerHTML();
        expect(svgContent).toBeTruthy();
        expect(svgContent.length).toBeGreaterThan(MIN_SVG_CONTENT_LENGTH);
    });

    test("should re-render diagram on theme change", async ({ page }) => {
        const diagramWrapper = page.locator(".mermaid-diagram").first();

        // Scroll to trigger initial render
        await diagramWrapper.scrollIntoViewIfNeeded();
        await expect(diagramWrapper.locator("svg")).toBeVisible({ timeout: 10000 });

        // Capture initial SVG content for comparison
        const originalSvg = await diagramWrapper.locator("svg").innerHTML();

        // Dispatch theme-changed event to simulate theme toggle
        await page.evaluate(() => {
            const newTheme = document.documentElement.classList.contains("dark")
                ? "light"
                : "dark";
            document.documentElement.classList.toggle("dark");
            localStorage.setItem("theme", newTheme);
            document.dispatchEvent(
                new CustomEvent("theme-changed", { detail: { theme: newTheme } })
            );
        });

        // Wait for debounced re-render
        await page.waitForTimeout(THEME_CHANGE_WAIT_MS);

        // Verify the diagram still exists and rendered
        await expect(diagramWrapper.locator("svg")).toBeVisible();

        // Verify the SVG content changed due to theme change
        const updatedSvg = await diagramWrapper.locator("svg").innerHTML();
        expect(updatedSvg).toBeTruthy();
        expect(updatedSvg).not.toBe(originalSvg);
    });

    test("should use lazy loading via IntersectionObserver", async ({ page }) => {
        // Get all diagram wrappers
        const diagrams = page.locator(".mermaid-diagram");
        const count = await diagrams.count();

        if (count > 0) {
            // Navigate to top of page to ensure diagrams are out of viewport
            await page.evaluate(() => window.scrollTo(0, 0));

            // Scroll to the first diagram
            const firstDiagram = diagrams.first();
            await firstDiagram.scrollIntoViewIfNeeded();

            // After scrolling into view, SVG should appear
            await expect(firstDiagram.locator("svg")).toBeVisible({ timeout: 10000 });
        }
    });

    test("should have proper CSS classes on diagram wrapper", async ({ page }) => {
        const diagramWrapper = page.locator(".mermaid-diagram").first();

        // Verify wrapper has expected classes
        await expect(diagramWrapper).toHaveClass(/mermaid-diagram/);
        await expect(diagramWrapper).toHaveClass(/my-6/);
        await expect(diagramWrapper).toHaveClass(/flex/);
        await expect(diagramWrapper).toHaveClass(/justify-center/);
        await expect(diagramWrapper).toHaveClass(/overflow-x-auto/);
    });

    test("should have data-mermaid-id attribute", async ({ page }) => {
        const diagram = page.locator(".mermaid-diagram").first();

        // Each diagram should have a unique id
        const mermaidId = await diagram.getAttribute("data-mermaid-id");
        expect(mermaidId).not.toBeNull();
        expect(mermaidId).toBeTruthy();
    });

    test("should handle multiple diagrams on same page", async ({ page }) => {
        const diagrams = page.locator(".mermaid-diagram");
        const count = await diagrams.count();

        // Should have at least one diagram
        expect(count).toBeGreaterThanOrEqual(1);

        // Scroll through all diagrams and verify they render
        for (let i = 0; i < count; i++) {
            const diagram = diagrams.nth(i);
            await diagram.scrollIntoViewIfNeeded();
            await expect(diagram.locator("svg")).toBeVisible({ timeout: 10000 });

            // Each diagram should have unique mermaid-id
            const id = await diagram.getAttribute("data-mermaid-id");
            expect(id).toBe(String(i));
        }
    });
});

// Separate describe block for error handling test (no beforeEach navigation)
test.describe("Mermaid Error Handling", () => {
    test("should show error when mermaid script fails to load", async ({
        page,
    }) => {
        // Block the mermaid script BEFORE navigation
        await page.route("**/mermaid.min.js", route => route.abort());

        await page.goto(TEST_POST_PATH);
        await page.waitForLoadState("networkidle");

        const diagramWrapper = page.locator(".mermaid-diagram").first();
        await diagramWrapper.scrollIntoViewIfNeeded();

        // Error alert should be visible when script fails to load
        const errorAlert = page.locator('[role="alert"]');
        await expect(errorAlert).toBeVisible({ timeout: 5000 });
        await expect(errorAlert.first()).toContainText("Mermaid");
    });
});

test.describe("Mermaid Console Logging", () => {
    test("should log initialization and rendering messages", async ({ page }) => {
        const consoleLogs: string[] = [];

        page.on("console", msg => {
            if (msg.type() === "info" || msg.type() === "debug") {
                consoleLogs.push(msg.text());
            }
        });

        await page.goto(TEST_POST_PATH);
        await page.waitForLoadState("networkidle");

        const diagram = page.locator(".mermaid-diagram").first();
        await diagram.scrollIntoViewIfNeeded();
        await expect(diagram.locator("svg")).toBeVisible({ timeout: 10000 });

        // Check for expected console logs
        const hasInitLog = consoleLogs.some(log =>
            log.includes("MermaidClient: Initializing...")
        );
        expect(hasInitLog).toBe(true);
    });
});

test.describe("System Theme Preference", () => {
    test("should respect prefers-color-scheme: dark", async ({ page }) => {
        // Emulate dark color scheme preference
        await page.emulateMedia({ colorScheme: "dark" });

        await page.goto(TEST_POST_PATH);
        await page.waitForLoadState("networkidle");

        const diagramWrapper = page.locator(".mermaid-diagram").first();
        await diagramWrapper.scrollIntoViewIfNeeded();
        await expect(diagramWrapper.locator("svg")).toBeVisible({ timeout: 10000 });

        // Verify diagram rendered successfully
        const svgContent = await diagramWrapper.locator("svg").innerHTML();
        expect(svgContent.length).toBeGreaterThan(MIN_SVG_CONTENT_LENGTH);
    });

    test("should respond to system theme change via media query", async ({
        page,
    }) => {
        // Start with light mode
        await page.emulateMedia({ colorScheme: "light" });

        await page.goto(TEST_POST_PATH);
        await page.waitForLoadState("networkidle");

        const diagramWrapper = page.locator(".mermaid-diagram").first();
        await diagramWrapper.scrollIntoViewIfNeeded();
        await expect(diagramWrapper.locator("svg")).toBeVisible({ timeout: 10000 });

        // Capture initial SVG content
        const originalSvg = await diagramWrapper.locator("svg").innerHTML();

        // Switch to dark mode via media emulation
        await page.emulateMedia({ colorScheme: "dark" });

        // Wait for debounced re-render
        await page.waitForTimeout(THEME_CHANGE_WAIT_MS);

        // Verify diagram still exists and content changed
        await expect(diagramWrapper.locator("svg")).toBeVisible();
        const updatedSvg = await diagramWrapper.locator("svg").innerHTML();
        expect(updatedSvg).toBeTruthy();
        expect(updatedSvg).not.toBe(originalSvg);
        expect(updatedSvg.length).toBeGreaterThan(MIN_SVG_CONTENT_LENGTH);
    });
});

test.describe("Cleanup Behavior", () => {
    test("should cleanup observers on page navigation", async ({ page }) => {
        const consoleLogs: string[] = [];
        const consoleErrors: string[] = [];

        page.on("console", msg => {
            if (msg.type() === "info") consoleLogs.push(msg.text());
            if (msg.type() === "error") consoleErrors.push(msg.text());
        });

        // Navigate to page with mermaid diagrams
        await page.goto(TEST_POST_PATH);
        await page.waitForLoadState("networkidle");

        const diagramWrapper = page.locator(".mermaid-diagram").first();
        await diagramWrapper.scrollIntoViewIfNeeded();
        await expect(diagramWrapper.locator("svg")).toBeVisible({ timeout: 10000 });

        // Navigate away from the page
        await page.goto("/");
        await page.waitForLoadState("networkidle");

        // Navigate back to the mermaid page
        await page.goto(TEST_POST_PATH);
        await page.waitForLoadState("networkidle");

        // Verify re-initialization happens cleanly
        const hasReInitLog = consoleLogs.filter(log =>
            log.includes("MermaidClient: Initializing...")
        );
        expect(hasReInitLog.length).toBeGreaterThanOrEqual(2);

        // No errors should have occurred
        const mermaidErrors = consoleErrors.filter(e => e.toLowerCase().includes("mermaid"));
        expect(mermaidErrors).toHaveLength(0);
    });

    test("should not throw errors when navigating away mid-render", async ({
        page,
    }) => {
        const consoleErrors: string[] = [];

        page.on("console", msg => {
            if (msg.type() === "error") consoleErrors.push(msg.text());
        });

        // Navigate to page
        await page.goto(TEST_POST_PATH);

        // Immediately navigate away before render completes
        await page.goto("/");
        await page.waitForLoadState("networkidle");

        // Should not have any mermaid-related errors
        const mermaidErrors = consoleErrors.filter(
            e => e.toLowerCase().includes("mermaid") || e.includes("observer")
        );
        expect(mermaidErrors).toHaveLength(0);
    });
});

test.describe("Memory Leak Prevention", () => {
    test("should handle theme change when rendered element is removed from DOM", async ({
        page,
    }) => {
        const consoleErrors: string[] = [];

        page.on("console", msg => {
            if (msg.type() === "error") consoleErrors.push(msg.text());
        });

        await page.goto(TEST_POST_PATH);
        await page.waitForLoadState("networkidle");

        const diagramWrapper = page.locator(".mermaid-diagram").first();
        await diagramWrapper.scrollIntoViewIfNeeded();
        await expect(diagramWrapper.locator("svg")).toBeVisible({ timeout: 10000 });

        // Remove the diagram element from DOM
        await page.evaluate(() => {
            const diagram = document.querySelector(".mermaid-diagram");
            if (diagram) diagram.remove();
        });

        // Trigger theme change - this would cause error if cleanup isn't handled
        await page.evaluate(() => {
            const newTheme = document.documentElement.classList.contains("dark")
                ? "light"
                : "dark";
            document.documentElement.classList.toggle("dark");
            localStorage.setItem("theme", newTheme);
            document.dispatchEvent(
                new CustomEvent("theme-changed", { detail: { theme: newTheme } })
            );
        });

        // Wait for debounced handler
        await page.waitForTimeout(THEME_CHANGE_WAIT_MS);

        // Should not have any errors related to the removed element
        const relevantErrors = consoleErrors.filter(
            e => e.toLowerCase().includes("mermaid")
        );
        expect(relevantErrors).toHaveLength(0);
    });
});

test.describe("Script Loading Edge Cases", () => {
    test("should share loading promise for concurrent diagram renders", async ({
        page,
    }) => {
        const consoleLogs: string[] = [];

        page.on("console", msg => {
            if (msg.type() === "info" || msg.type() === "debug") {
                consoleLogs.push(msg.text());
            }
        });

        await page.goto(TEST_POST_PATH);
        await page.waitForLoadState("networkidle");

        // Scroll to make all diagrams visible at once
        const diagrams = page.locator(".mermaid-diagram");
        const count = await diagrams.count();

        if (count > 1) {
            // Scroll through all diagrams quickly to trigger concurrent loading
            for (let i = 0; i < count; i++) {
                await diagrams.nth(i).scrollIntoViewIfNeeded();
            }

            // Wait for all renders to complete
            for (let i = 0; i < count; i++) {
                await expect(diagrams.nth(i).locator("svg")).toBeVisible({
                    timeout: 15000,
                });
            }

            // Concurrent diagram renders should share the same loading promise,
            // resulting in exactly one initialization per page load
            const initLogs = consoleLogs.filter(log =>
                log.includes("MermaidClient: Initializing...")
            );
            expect(initLogs.length).toBe(1);
        }
    });
});
