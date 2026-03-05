import { test, expect } from "@playwright/test";
import fs from "node:fs";
import path from "node:path";

/**
 * Sitemap 测试
 *
 * ⚠️ 依赖：此测试依赖构建产物 .vercel/output/static/sitemap-0.xml
 * 运行前请先执行: pnpm build
 * 或使用: pnpm test:sitemap (会自动构建)
 *
 * 验证 sitemap-0.xml 中的 hreflang 标签生成逻辑是否符合预期
 */
test.describe("Sitemap hreflang 验证", () => {
  const sitemapPath = path.resolve(".vercel/output/static/sitemap-0.xml");

  test.beforeAll(() => {
    // 检查 sitemap 文件是否存在
    if (!fs.existsSync(sitemapPath)) {
      throw new Error(
        `Sitemap 文件不存在: ${sitemapPath}\n` +
          `请先运行构建: pnpm build\n` +
          `或使用: pnpm test:sitemap`
      );
    }

    // CI 环境跳过时效性检查（假设刚完成构建）
    // 本地环境检查文件是否在合理时间内生成
    const skipFreshnessCheck =
      process.env.CI || process.env.SKIP_SITEMAP_FRESHNESS_CHECK;

    if (!skipFreshnessCheck) {
      const stats = fs.statSync(sitemapPath);
      const fileAge = Date.now() - stats.mtimeMs;
      // 本地环境使用 30 分钟阈值，避免慢速构建导致误报
      const thresholdMinutes = parseInt(
        process.env.SITEMAP_FRESHNESS_MINUTES || "30",
        10
      );
      const threshold = thresholdMinutes * 60 * 1000;

      if (fileAge > threshold) {
        throw new Error(
          `Sitemap 文件过期（${Math.floor(fileAge / 60000)}分钟前生成）\n` +
            `请重新构建以运行测试: pnpm build\n` +
            `或使用: pnpm test:sitemap\n` +
            `提示：可设置 SKIP_SITEMAP_FRESHNESS_CHECK=1 跳过此检查`
        );
      }
    }
  });

  test("sitemap 文件应存在", async () => {
    expect(fs.existsSync(sitemapPath)).toBe(true);
  });

  test("sitemap 逻辑验证", async () => {
    const content = fs.readFileSync(sitemapPath, "utf-8");

    // 辅助函数：提取特定 <loc> 的 <url> 块内容
    const findUrlBlock = (loc: string) => {
      const escapedLoc = loc.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      const regex = new RegExp(
        `<url>\\s*<loc>${escapedLoc}</loc>(.*?)</url>`,
        "s"
      );
      const match = content.match(regex);
      return match ? match[1] : null;
    };

    // 1. 验证双语文章 (存在于 mapping 中)
    // 示例：Tailscale 文章 (zh: /posts/tailscale-site-to-site-connect/, en: /en/posts/tailscale-site-to-site-openwrt-p2p/)
    const bilingualPost = findUrlBlock(
      "https://blog.gaazeon.com/posts/tailscale-site-to-site-connect/"
    );
    expect(bilingualPost).not.toBeNull();
    if (bilingualPost) {
      expect(bilingualPost).toContain('hreflang="zh-CN"');
      expect(bilingualPost).toContain('hreflang="en"');
      expect(bilingualPost).toContain('hreflang="x-default"');
      expect(bilingualPost).toContain(
        'href="https://blog.gaazeon.com/en/posts/tailscale-site-to-site-openwrt-p2p/"'
      );
    }

    // 2. 验证单语言文章 (不存在于 mapping 中)
    // 示例：Upgrade AstroPaper 文章 (只有中文版)
    const singleLangPost = findUrlBlock(
      "https://blog.gaazeon.com/posts/upgrade-astropaper-git/"
    );
    expect(singleLangPost).not.toBeNull();
    if (singleLangPost) {
      // 不应包含指向不存在的英文版的 alternate 链接
      expect(singleLangPost).not.toContain('hreflang="en"');
    }

    // 3. 验证结构页面 (首页)
    const homeNode = findUrlBlock("https://blog.gaazeon.com/");
    expect(homeNode).not.toBeNull();
    if (homeNode) {
      expect(homeNode).toContain('hreflang="zh-CN"');
      expect(homeNode).toContain('hreflang="en"');
      expect(homeNode).toContain('hreflang="x-default"');
    }

    // 4. 验证标签详情页 (应被过滤，不生成 alternates)
    const tagDetail = findUrlBlock("https://blog.gaazeon.com/tags/thinking/");
    expect(tagDetail).not.toBeNull();
    if (tagDetail) {
      expect(tagDetail).not.toContain('hreflang="en"');
    }

    // 5. 验证标签列表页 (应保留 alternates)
    const tagList = findUrlBlock("https://blog.gaazeon.com/tags/");
    expect(tagList).not.toBeNull();
    if (tagList) {
      expect(tagList).toContain('hreflang="zh-CN"');
      expect(tagList).toContain('hreflang="en"');
    }
  });
});
