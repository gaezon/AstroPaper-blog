import { test, expect, type Page } from "@playwright/test";

const TEST_PATH = "/";
const STORAGE_KEYS = {
  CONSENT: "cookie-consent",
  SETTINGS: "cookie-settings",
  TIMESTAMP: "cookie-consent-timestamp",
  VERSION: "cookie-consent-version",
} as const;
const CONSENT_VERSION = "v1";

const clearConsent = async (page: Page) => {
  await page.addInitScript(keys => {
    keys.forEach(key => localStorage.removeItem(key));
  }, Object.values(STORAGE_KEYS));
};

const clearConsentAfterLoad = async (page: Page) => {
  await page.evaluate(keys => {
    keys.forEach(key => localStorage.removeItem(key));
  }, Object.values(STORAGE_KEYS));
};

const seedConsent = async (page: Page, status: string, version = CONSENT_VERSION) => {
  await page.addInitScript(
    ({ statusValue, versionValue, keys }) => {
      localStorage.setItem(keys.CONSENT, statusValue);
      localStorage.setItem(
        keys.SETTINGS,
        JSON.stringify({ essential: true, analytics: false, advertising: false })
      );
      localStorage.setItem(keys.TIMESTAMP, new Date().toISOString());
      localStorage.setItem(keys.VERSION, versionValue);
    },
    { statusValue: status, versionValue: version, keys: STORAGE_KEYS }
  );
};

test.describe("cookie consent", () => {
  test("shows banner on first visit and persists accept", async ({ page }) => {
    await page.goto(TEST_PATH);
    await clearConsentAfterLoad(page);
    await page.reload();

    const banner = page.locator("#cookie-consent-banner");
    const fab = page.locator("#cookie-settings-fab");

    await expect(banner).toBeVisible();
    await page.locator("#cookie-accept-btn").click();

    await expect(banner).toHaveClass(/hidden/);
    await expect(fab).toBeVisible();

    const consentValue = await page.evaluate(key => localStorage.getItem(key), STORAGE_KEYS.CONSENT);
    expect(consentValue).toBe("accepted");

    await page.reload();
    await expect(banner).toHaveClass(/hidden/);
    await expect(fab).toBeVisible();
  });

  test("reject hides banner and persists state", async ({ page }) => {
    await clearConsent(page);
    await page.goto(TEST_PATH);

    const banner = page.locator("#cookie-consent-banner");
    const fab = page.locator("#cookie-settings-fab");

    await page.locator("#cookie-reject-btn").click();
    await expect(banner).toHaveClass(/hidden/);
    await expect(fab).toBeVisible();

    const consentValue = await page.evaluate(key => localStorage.getItem(key), STORAGE_KEYS.CONSENT);
    expect(consentValue).toBe("rejected");
  });

  test("opens and closes modal from FAB", async ({ page }) => {
    await seedConsent(page, "accepted");
    await page.goto(TEST_PATH);

    const modal = page.locator("#cookie-settings-modal");
    const fab = page.locator("#cookie-settings-fab");

    await fab.click();
    await expect(modal).toHaveClass(/flex/);
    await expect(modal).not.toHaveClass(/hidden/);

    await page.locator("#close-cookie-settings").click();
    await expect(modal).toHaveClass(/hidden/);

    await fab.click();
    await expect(modal).toHaveClass(/flex/);
    await modal.click({ position: { x: 1, y: 1 } });
    await expect(modal).toHaveClass(/hidden/);
  });

  test("footer link opens modal", async ({ page }) => {
    await seedConsent(page, "accepted");
    await page.goto(TEST_PATH);

    await page.evaluate(() => {
      document.querySelector("astro-dev-toolbar")?.remove();
    });

    const modal = page.locator("#cookie-settings-modal");
    const footerTrigger = page.locator(
      ".legal-links a[data-cookie-settings-trigger]"
    );

    await footerTrigger.scrollIntoViewIfNeeded();
    await footerTrigger.click({ force: true });
    await expect(modal).toHaveClass(/flex/);
  });

  test("saves settings and persists custom consent", async ({ page }) => {
    await clearConsent(page);
    await page.goto(TEST_PATH);

    const modal = page.locator("#cookie-settings-modal");
    const banner = page.locator("#cookie-consent-banner");
    const fab = page.locator("#cookie-settings-fab");

    await page.locator("#cookie-settings-btn").click();
    await expect(modal).toHaveClass(/flex/);
    await page.locator("#analytics-cookies").check();
    await page.locator("#save-cookie-settings").click();

    await expect(modal).toHaveClass(/hidden/);
    await expect(banner).toHaveClass(/hidden/);
    await expect(fab).toBeVisible();

    const consentValue = await page.evaluate(key => localStorage.getItem(key), STORAGE_KEYS.CONSENT);
    expect(consentValue).toBe("custom");
  });

  test("escape closes modal and restores focus", async ({ page }) => {
    await seedConsent(page, "accepted");
    await page.goto(TEST_PATH);

    const modal = page.locator("#cookie-settings-modal");
    const fab = page.locator("#cookie-settings-fab");

    await fab.click();
    await expect(modal).toHaveClass(/flex/);

    await page.keyboard.press("Escape");
    await expect(modal).toHaveClass(/hidden/);
    await expect(fab).toBeFocused();
  });

  test("version mismatch triggers re-consent", async ({ page }) => {
    await seedConsent(page, "accepted", "v0");
    await page.goto(TEST_PATH);

    const banner = page.locator("#cookie-consent-banner");
    const fab = page.locator("#cookie-settings-fab");

    await expect(banner).toBeVisible();
    await expect(fab).toHaveClass(/hidden/);
  });
});
