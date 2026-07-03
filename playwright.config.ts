import { defineConfig, devices } from "@playwright/test";

const ciChromeChannel = process.env.CI ? ({ channel: "chrome" } as const) : {};

export default defineConfig({
  testDir: "./tests",
  testIgnore: ["**/unit/**", "**/sitemap.spec.ts"], // sitemap 测试需要构建产物，使用 pnpm test:sitemap 运行
  fullyParallel: true,
  retries: 0, // 本地不重试；CI 通过 --retries 参数覆盖
  use: {
    baseURL: "http://127.0.0.1:4321",
    trace: "on-first-retry",
  },
  webServer: {
    command: "pnpm dev --host 127.0.0.1 --port 4321",
    env: { ...process.env, ASTRO_DEV_BACKGROUND: "0" },
    url: "http://127.0.0.1:4321",
    reuseExistingServer: !process.env.CI,
    stdout: "pipe",
    stderr: "pipe",
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"], ...ciChromeChannel },
    },
  ],
});
