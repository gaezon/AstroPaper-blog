import { defineConfig } from '@playwright/test';

/**
 * Sitemap 专用测试配置
 * 
 * Sitemap 是构建时生成的静态产物，不需要 dev server。
 * 这个配置文件用于运行依赖构建产物的测试。
 * 
 * 使用方式：
 * 1. 先构建: pnpm build
 * 2. 运行测试: npx playwright test --config=playwright.sitemap.config.ts
 * 或使用快捷命令: pnpm test:sitemap
 */
export default defineConfig({
    testDir: './tests',
    testMatch: '**/sitemap.spec.ts',
    fullyParallel: true,
    retries: 0,
    use: {
        trace: 'on-first-retry',
    },
    // Sitemap 测试不需要 webServer
});
