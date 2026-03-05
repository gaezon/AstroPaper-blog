#!/usr/bin/env tsx
/**
 * 预构建脚本：获取所有远程图片尺寸
 *
 * 扫描所有 Markdown 文件中的远程图片，获取其尺寸并保存到缓存文件
 * 构建时 rehype 插件将读取这些缓存的尺寸信息
 */

import fs from "node:fs/promises";
import path from "node:path";
import probe from "probe-image-size";

const SCRIPT_DIR = import.meta.dirname;
const CACHE_FILE = path.join(
  SCRIPT_DIR,
  "../src/utils/generated/imageSizes.json"
);
const BLOG_DIR = path.join(SCRIPT_DIR, "../src/data/blog");

// 匹配 Markdown 图片语法: ![alt](url "optional title")
const IMAGE_REGEX = /!\[([^\]]*)\]\(([^)]+)\)/g;

/**
 * 从 Markdown 图片目标字符串中提取 URL
 * 支持：
 * - ![alt](https://example.com/a.png)
 * - ![alt](https://example.com/a.png "title")
 * - ![alt](<https://example.com/a.png> "title")
 */
function extractImageUrl(target: string): string | null {
  const trimmed = target.trim();
  if (!trimmed) return null;

  if (trimmed.startsWith("<")) {
    const endIndex = trimmed.indexOf(">");
    if (endIndex === -1) return null;

    const inner = trimmed.slice(1, endIndex).trim();
    if (!inner) return null;
    return inner;
  }

  const firstToken = trimmed.split(/\s+/)[0];
  return firstToken || null;
}

interface ImageSize {
  width: number;
  height: number;
}

interface ImageSizeCache {
  [url: string]: ImageSize;
}

/**
 * 验证 URL 是否安全（防止 SSRF）
 */
function isSafeURL(urlString: string): boolean {
  try {
    const url = new URL(urlString);

    // 仅允许 http/https 协议
    if (!["http:", "https:"].includes(url.protocol)) {
      return false;
    }

    // 规范化 hostname：转小写并去除尾随点（防止 localhost. 绕过）
    const hostname = url.hostname.toLowerCase().replace(/\.+$/, "");

    // 检测十进制/十六进制 IP 表示（如 2130706433 = 127.0.0.1）
    if (/^\d+$/.test(hostname) || /^0x[0-9a-f]+$/i.test(hostname)) {
      const num = hostname.startsWith("0x")
        ? parseInt(hostname, 16)
        : parseInt(hostname, 10);

      // 检查是否为私有/本地 IP 段（简化版）
      const byte1 = (num >>> 24) & 0xff;
      const byte2 = (num >>> 16) & 0xff;

      if (
        byte1 === 127 || // 127.0.0.0/8 loopback
        byte1 === 10 || // 10.0.0.0/8 private
        (byte1 === 172 && byte2 >= 16 && byte2 <= 31) || // 172.16.0.0/12 private
        (byte1 === 192 && byte2 === 168) || // 192.168.0.0/16 private
        (byte1 === 169 && byte2 === 254) || // 169.254.0.0/16 link-local
        num === 0 // 0.0.0.0
      ) {
        return false;
      }
    }

    // 阻止本地和私有地址（正则检测）
    const privatePatterns = [
      // IPv4 localhost 和私有网段
      /^localhost$/i,
      /^127\./,
      /^10\./,
      /^172\.(1[6-9]|2[0-9]|3[01])\./,
      /^192\.168\./,
      /^169\.254\./, // link-local
      /\.local$/i,

      // IPv6 loopback 和私有地址
      /^\[?::1\]?$/i, // loopback ::1
      /^\[?::\]?$/i, // unspecified ::
      /^\[?fe80:/i, // link-local fe80::/10
      /^\[?fc00:/i, // unique local fc00::/7
      /^\[?fd00:/i, // unique local fd00::/8
      // IPv4-mapped IPv6 私有/本地地址（::ffff:127.x.x.x 等）
      /^\[?::ffff:(127\.|10\.|172\.(1[6-9]|2[0-9]|3[01])\.|192\.168\.|169\.254\.)/i,

      // 特殊 IPv4 地址
      /^0\.0\.0\.0$/, // 0.0.0.0
      /^0$/, // 单个 0
    ];

    if (privatePatterns.some(pattern => pattern.test(hostname))) {
      return false;
    }

    return true;
  } catch {
    return false;
  }
}

/**
 * 扫描单个 Markdown 文件中的图片
 */
async function scanMarkdownFile(filePath: string): Promise<string[]> {
  const content = await fs.readFile(filePath, "utf-8");
  const urls: string[] = [];

  // 重置 lastIndex 防止全局正则状态泄漏
  IMAGE_REGEX.lastIndex = 0;
  let match: RegExpExecArray | null = null;

  while ((match = IMAGE_REGEX.exec(content)) !== null) {
    const url = extractImageUrl(match[2] ?? "");
    if (!url) continue;

    // 只处理安全的远程图片
    if (url.startsWith("http://") || url.startsWith("https://")) {
      if (isSafeURL(url)) {
        urls.push(url);
      }
    }
  }

  return urls;
}

/**
 * 递归扫描目录中的所有 Markdown 文件
 */
async function scanDirectory(dir: string): Promise<string[]> {
  const files: string[] = [];
  const entries = await fs.readdir(dir, { withFileTypes: true });

  // 确保遍历顺序在不同平台/文件系统上一致
  entries.sort((a, b) => a.name.localeCompare(b.name));

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      const subFiles = await scanDirectory(fullPath);
      files.push(...subFiles);
    } else if (entry.name.endsWith(".md")) {
      files.push(fullPath);
    }
  }

  // 返回排序后的文件列表，以获得稳定的处理顺序
  files.sort();
  return files;
}

/**
 * 获取图片尺寸
 */
async function fetchImageSize(url: string): Promise<ImageSize | null> {
  try {
    console.log(`  📏 获取尺寸: ${url}`);
    const result = await probe(url, { timeout: 10000 });
    return { width: result.width, height: result.height };
  } catch (error) {
    console.error(`  ❌ 获取失败: ${url}`);
    if (error instanceof Error) {
      console.error(`     错误: ${error.message}`);
    }
    return null;
  }
}

/**
 * 主函数
 */
async function main() {
  console.log("🖼️  开始获取远程图片尺寸...\n");

  // 确保输出目录存在
  const cacheDir = path.dirname(CACHE_FILE);
  await fs.mkdir(cacheDir, { recursive: true });

  // 读取现有缓存（如果存在）
  let existingCache: ImageSizeCache = {};
  try {
    const cacheContent = await fs.readFile(CACHE_FILE, "utf-8");
    existingCache = JSON.parse(cacheContent);
    console.log(
      `📦 已加载现有缓存: ${Object.keys(existingCache).length} 张图片\n`
    );
  } catch {
    console.log("📦 无现有缓存，将创建新缓存\n");
  }

  const isCI = !!process.env.CI || !!process.env.GITHUB_ACTIONS;

  // 扫描所有 Markdown 文件
  console.log("🔍 扫描 Markdown 文件...");
  const mdFiles = await scanDirectory(BLOG_DIR);
  console.log(`   找到 ${mdFiles.length} 个 Markdown 文件\n`);

  // 收集所有唯一的图片 URL
  const allUrls = new Set<string>();
  for (const file of mdFiles) {
    const urls = await scanMarkdownFile(file);
    urls.forEach(url => allUrls.add(url));
  }

  const urlsArray = Array.from(allUrls);
  console.log(`🌐 发现 ${urlsArray.length} 个唯一远程图片\n`);

  const missingCacheEntries = urlsArray.filter(
    url => !existingCache[url]?.width || !existingCache[url]?.height
  );

  // 仅在非 CI 下允许 mtime 快速跳过；但若缓存存在缺失项仍继续补齐
  if (!isCI && Object.keys(existingCache).length > 0) {
    try {
      const cacheStat = await fs.stat(CACHE_FILE);
      let latestMTimeMs = 0;
      for (const file of mdFiles) {
        const stat = await fs.stat(file);
        latestMTimeMs = Math.max(latestMTimeMs, stat.mtimeMs);
      }
      const count = mdFiles.length;

      if (count > 0 && latestMTimeMs <= cacheStat.mtimeMs) {
        if (missingCacheEntries.length === 0) {
          console.log("⏭️  Markdown 未更新，且缓存完整，跳过远程图片尺寸扫描");
          return;
        }

        console.log(
          `⚠️  检测到 ${missingCacheEntries.length} 张图片缓存缺失，将继续补齐`
        );
      }
    } catch {
      // 忽略 stat 失败并继续完整扫描流程
    }
  }

  // CI 环境检查：禁止网络请求
  if (isCI && missingCacheEntries.length > 0) {
    console.error(`\n❌ CI 环境禁止网络请求！`);
    console.error(`\n检测到 ${missingCacheEntries.length} 张未缓存的图片：`);
    missingCacheEntries.forEach(url => console.error(`  - ${url}`));
    console.error(`\n请在本地运行以下命令后提交更新的缓存文件：`);
    console.error(`  pnpm fetch:image-sizes\n`);
    process.exit(1);
  }

  // 获取图片尺寸
  const newCache: ImageSizeCache = { ...existingCache };
  let fetched = 0;
  let skipped = 0;
  let failed = 0;

  for (const url of urlsArray) {
    // 如果缓存中已存在且有效，跳过
    if (existingCache[url]?.width && existingCache[url]?.height) {
      console.log(`  ⏭️  跳过（已缓存）: ${url}`);
      skipped++;
      continue;
    }

    const size = await fetchImageSize(url);
    if (size) {
      newCache[url] = size;
      fetched++;
    } else {
      failed++;
    }

    // 添加延迟以避免请求过快
    await new Promise(resolve => setTimeout(resolve, 200));
  }

  // 保存缓存（按 URL 排序以获得稳定的 JSON 输出）
  const sortedCache: ImageSizeCache = {};
  Object.keys(newCache)
    .sort()
    .forEach(key => {
      sortedCache[key] = newCache[key];
    });

  const newCacheContent = JSON.stringify(sortedCache, null, 2);

  // 检查缓存是否有变更
  let cacheChanged = true;
  try {
    const existingContent = await fs.readFile(CACHE_FILE, "utf-8");
    cacheChanged = existingContent.trim() !== newCacheContent.trim();
  } catch {
    // 文件不存在，视为有变更
    cacheChanged = true;
  }

  if (cacheChanged) {
    await fs.writeFile(CACHE_FILE, newCacheContent);
    console.log("\n✅ 完成！");
    console.log(`   新获取: ${fetched} 张`);
    console.log(`   已缓存: ${skipped} 张`);
    console.log(`   失败: ${failed} 张`);
    console.log(`   总计: ${Object.keys(newCache).length} 张`);
    console.log(`\n💾 缓存已保存到: ${CACHE_FILE}`);
  } else {
    console.log("\n✅ 完成！");
    console.log(`   所有 ${Object.keys(newCache).length} 张图片已缓存`);
    console.log(`\n⏭️  跳过写入（缓存内容未变更）`);
  }

  // 在 CI 环境或严格模式下，获取失败应报错
  if (isCI && failed > 0) {
    console.error(`\n⚠️  CI 环境检测到 ${failed} 张图片获取失败，构建中止`);
    process.exit(1);
  }
}

main().catch(error => {
  console.error("❌ 脚本执行失败:", error);
  process.exit(1);
});
