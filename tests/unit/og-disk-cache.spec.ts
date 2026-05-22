import {
  afterAll,
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from "vitest";

vi.mock("astro:content", () => ({
  getCollection: vi.fn(),
}));

vi.mock("astro:i18n", () => ({
  getRelativeLocaleUrl: vi.fn(),
}));

import { randomBytes } from "node:crypto";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import {
  ensureCacheInitialized,
  getTemplateFingerprint,
  resetOgImageCache,
} from "../../src/utils/generateOgImages";

const randomSuffix = randomBytes(4).toString("hex");
const TEST_CACHE_DIR = path.resolve(
  os.tmpdir(),
  `astro-paper-og-cache-test-${process.pid}-${randomSuffix}`,
  "og-image-cache"
);
const FINGERPRINT_FILE = path.join(TEST_CACHE_DIR, ".fingerprint");

describe("OG Image Disk Cache Eviction", () => {
  let originalCacheDir: string | undefined;

  beforeAll(async () => {
    // 1. 备份宿主环境原有的环境变量，设置沙箱环境变量，隔离测试环境
    originalCacheDir = process.env.OG_IMAGE_CACHE_DIR;
    process.env.OG_IMAGE_CACHE_DIR = TEST_CACHE_DIR;
    await fs.mkdir(TEST_CACHE_DIR, { recursive: true });
  });

  afterAll(async () => {
    // 2. 彻底销毁包含随机父目录的沙箱测试目录，保持文件系统整洁
    const testSandboxParent = path.dirname(TEST_CACHE_DIR);
    await fs.rm(testSandboxParent, { recursive: true, force: true });

    // 3. 完美恢复宿主环境的环境变量原值，杜绝副作用污染
    if (originalCacheDir === undefined) {
      delete process.env.OG_IMAGE_CACHE_DIR;
    } else {
      process.env.OG_IMAGE_CACHE_DIR = originalCacheDir;
    }
  });

  beforeEach(() => {
    // 在每个测试用例运行前重置 Map 和校验单例，保证测试独立性
    resetOgImageCache();
  });

  it("automatically clears old cache files when fingerprint drifts", async () => {
    // 1. 构造一个包含陈旧指纹和模拟缓存文件的工作区
    await fs.mkdir(TEST_CACHE_DIR, { recursive: true });
    await fs.writeFile(
      FINGERPRINT_FILE,
      "outdated-fingerprint-payload-abc",
      "utf-8"
    );

    const oldFile = path.join(TEST_CACHE_DIR, "old-image-123.png");
    await fs.writeFile(oldFile, "mock-png-data", "utf-8");

    // 验证假缓存文件写入成功
    expect(
      await fs
        .stat(oldFile)
        .then(() => true)
        .catch(() => false)
    ).toBe(true);

    // 2. 纯 I/O 测试：直接调用被导出的缓存初始化方法，避免拉取网络字体或调用 Satori 渲染
    await ensureCacheInitialized();

    // 3. 验证陈旧缓存文件已被成功全量清扫
    const exists = await fs
      .stat(oldFile)
      .then(() => true)
      .catch(() => false);
    expect(exists).toBe(false);

    // 4. 验证全新的正确指纹已被自动写入
    const currentFingerprint = await fs.readFile(FINGERPRINT_FILE, "utf-8");
    const expectedFingerprint = await getTemplateFingerprint();

    expect(currentFingerprint.trim()).toBe(expectedFingerprint);
    expect(currentFingerprint.trim().length).toBe(64); // SHA-256 哈希
  });

  it("prevents race condition when initialized concurrently", async () => {
    // 1. 构造包含陈旧指纹的工作区
    await fs.mkdir(TEST_CACHE_DIR, { recursive: true });
    await fs.writeFile(
      FINGERPRINT_FILE,
      "another-outdated-fingerprint",
      "utf-8"
    );

    const oldFile = path.join(TEST_CACHE_DIR, "old-image-456.png");
    await fs.writeFile(oldFile, "mock-png-data", "utf-8");

    // 2. 并发触发多次初始化，测试在并发竞争下的状态一致性，不应报错或产生死锁
    await Promise.all([
      ensureCacheInitialized(),
      ensureCacheInitialized(),
      ensureCacheInitialized(),
    ]);

    // 3. 验证模拟缓存文件已被清理，且最新指纹正常写入
    const exists = await fs
      .stat(oldFile)
      .then(() => true)
      .catch(() => false);
    expect(exists).toBe(false);

    const currentFingerprint = await fs.readFile(FINGERPRINT_FILE, "utf-8");
    const expectedFingerprint = await getTemplateFingerprint();
    expect(currentFingerprint.trim()).toBe(expectedFingerprint);
  });
});
