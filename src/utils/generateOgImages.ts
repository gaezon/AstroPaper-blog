import { Resvg } from "@resvg/resvg-js";
import { type CollectionEntry } from "astro:content";
import { createHash } from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";
import { SITE } from "@/config";
import type { BlogLocale } from "@/utils/blog-locale";
import {
  getLocalizedSiteDescription,
  getLocalizedSiteTitle,
} from "@/utils/i18n-pages";
import postOgImage from "./og-templates/post";
import siteOgImage from "./og-templates/site";
import { validateAndGetDiskCacheDir } from "./og-cache-validator";

const TRANSPARENT_PNG_FALLBACK = new Uint8Array([
  0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0x00, 0x00, 0x0d, 0x49,
  0x48, 0x44, 0x52, 0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01, 0x08, 0x06,
  0x00, 0x00, 0x00, 0x1f, 0x15, 0xc4, 0x89, 0x00, 0x00, 0x00, 0x0a, 0x49, 0x44,
  0x41, 0x54, 0x78, 0x9c, 0x63, 0x00, 0x01, 0x00, 0x00, 0x05, 0x00, 0x01, 0x0d,
  0x0a, 0x2d, 0xb4, 0x00, 0x00, 0x00, 0x00, 0x49, 0x45, 0x4e, 0x44, 0xae, 0x42,
  0x60, 0x82,
]);

const OG_CACHE_VERSION = 1;

let memoizedCacheDir: string | null = null;

export function getDiskCacheDir(): string {
  if (memoizedCacheDir) {
    return memoizedCacheDir;
  }
  const rawDir = process.env.OG_IMAGE_CACHE_DIR
    ? path.resolve(process.env.OG_IMAGE_CACHE_DIR)
    : path.resolve(process.cwd(), "tmp", "og-image-cache");

  try {
    memoizedCacheDir = validateAndGetDiskCacheDir(rawDir);
  } catch (err) {
    console.warn(`${(err as Error).message} Falling back to safe default.`);
    memoizedCacheDir = path.resolve(process.cwd(), "tmp", "og-image-cache");
  }
  return memoizedCacheDir;
}

const CURRENT_DIR = import.meta.dirname;
const TEMPLATE_FILES = [
  path.resolve(CURRENT_DIR, "og-templates/post.js"),
  path.resolve(CURRENT_DIR, "og-templates/site.js"),
  path.resolve(CURRENT_DIR, "og-templates/shared.js"),
  path.resolve(CURRENT_DIR, "loadGoogleFont.ts"),
  path.resolve(CURRENT_DIR, "generateOgImages.ts"),
];
const PNG_SIGNATURE = new Uint8Array([
  0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a,
]);
const MIN_PNG_BYTES = 24;

const postOgImageCache = new Map<string, Promise<Uint8Array>>();
const siteOgImageCache = new Map<BlogLocale, Promise<Uint8Array>>();
let templateFingerprintPromise: Promise<string> | null = null;
let initCachePromise: Promise<void> | null = null;

export async function ensureCacheInitialized() {
  if (initCachePromise) return initCachePromise;

  initCachePromise = (async () => {
    try {
      const diskCacheDir = getDiskCacheDir();
      const fingerprintFilePath = path.join(diskCacheDir, ".fingerprint");

      let savedFingerprint = "";
      try {
        savedFingerprint = await fs.readFile(fingerprintFilePath, "utf-8");
        savedFingerprint = savedFingerprint.trim();
      } catch {
        // file or directory doesn't exist
      }

      // 1. Perform fingerprint validation
      const fingerprint = await getTemplateFingerprint();

      if (savedFingerprint !== fingerprint) {
        // template fingerprint drifted! Clear cache and update fingerprint on disk.
        // If we are in a read-only or restricted filesystem, this is best-effort.
        try {
          await fs.rm(diskCacheDir, { recursive: true, force: true });
          await fs.mkdir(diskCacheDir, { recursive: true });
          await fs.writeFile(fingerprintFilePath, fingerprint, "utf-8");
        } catch (err) {
          console.warn(
            "Failed to update fingerprint on disk (possibly read-only filesystem):",
            err
          );
        }
      }
    } catch (error) {
      console.error(
        "Failed to initialize OG disk cache (falling back to memory-only):",
        error
      );
      initCachePromise = null; // Reset promise so subsequent requests can retry
      // No re-throw! Disk cache failure should be best-effort and transparently fall back.
    }
  })();

  return initCachePromise;
}

function createDigest(input: string) {
  return createHash("sha256").update(input).digest("hex");
}

function buildCacheFilePath(hash: string) {
  return path.join(getDiskCacheDir(), `${hash}.png`);
}

function toUint8Array(buffer: Uint8Array | ArrayBuffer) {
  return buffer instanceof Uint8Array ? buffer : new Uint8Array(buffer);
}

function isValidPng(data: Uint8Array) {
  if (data.length < MIN_PNG_BYTES) return false;

  for (let i = 0; i < PNG_SIGNATURE.length; i++) {
    if (data[i] !== PNG_SIGNATURE[i]) {
      return false;
    }
  }

  return true;
}

export async function getTemplateFingerprint() {
  if (!templateFingerprintPromise) {
    templateFingerprintPromise = (async () => {
      const hasher = createHash("sha256");
      hasher.update(`v${OG_CACHE_VERSION}`);

      for (const filePath of TEMPLATE_FILES) {
        const stableTemplateId = path
          .relative(CURRENT_DIR, filePath)
          .split(path.sep)
          .join("/");
        hasher.update(stableTemplateId);
        try {
          const content = await fs.readFile(filePath);
          hasher.update(content);
        } catch {
          // 针对构建后的生产/Serverless环境，.ts 源码文件被剥离不复存在，
          // 尝试动态解析并读取其编译后对应的 .js 物理产物以捕获真实的字体与渲染逻辑哈希变动。
          if (filePath.endsWith(".ts")) {
            const fallbackJsPath = filePath.slice(0, -3) + ".js";
            try {
              const content = await fs.readFile(fallbackJsPath);
              hasher.update(content);
            } catch {
              hasher.update("missing");
            }
          } else {
            hasher.update("missing");
          }
        }
      }

      return hasher.digest("hex");
    })();
  }

  return await templateFingerprintPromise;
}

async function buildPostDiskCacheKey(
  post: CollectionEntry<"blog" | "blog-en">
) {
  const templateFingerprint = await getTemplateFingerprint();
  const payload = JSON.stringify({
    templateFingerprint,
    type: "post",
    collection: post.collection,
    id: post.id,
    slug: post.data.slug ?? "",
    title: post.data.title ?? "",
    author: post.data.author ?? "",
    locale: post.data.locale ?? "",
    siteTitle: SITE.title,
  });

  return createDigest(payload);
}

async function buildSiteDiskCacheKey(
  locale: BlogLocale,
  title: string,
  description: string
) {
  const templateFingerprint = await getTemplateFingerprint();
  const payload = JSON.stringify({
    templateFingerprint,
    type: "site",
    locale,
    title,
    desc: description,
    website: SITE.website,
    lang: locale,
  });

  return createDigest(payload);
}

async function readCachedPng(hash: string) {
  await ensureCacheInitialized();
  const filePath = buildCacheFilePath(hash);
  try {
    const data = new Uint8Array(await fs.readFile(filePath));
    if (!isValidPng(data)) {
      await fs.unlink(filePath).catch(() => {});
      return null;
    }

    return data;
  } catch {
    return null;
  }
}

async function writeCachedPng(hash: string, png: Uint8Array) {
  await ensureCacheInitialized();
  const filePath = buildCacheFilePath(hash);
  const tempFilePath = `${filePath}.${process.pid}.${Date.now()}.${Math.random().toString(16).slice(2)}.tmp`;
  try {
    await fs.mkdir(getDiskCacheDir(), { recursive: true });
    await fs.writeFile(tempFilePath, png);
    await fs.rename(tempFilePath, filePath);
  } catch {
    await fs.unlink(tempFilePath).catch(() => {});
    // Best-effort cache write; rendering should not fail on cache errors.
  }
}

function svgBufferToPngBuffer(svg: string) {
  try {
    const resvg = new Resvg(svg);
    const pngData = resvg.render();
    return pngData.asPng();
  } catch (error) {
    console.error("Error converting SVG to PNG:", error);
    return TRANSPARENT_PNG_FALLBACK;
  }
}

export async function generateOgImageForPost(
  post: CollectionEntry<"blog" | "blog-en">
) {
  const requestKey = `${post.collection}:${post.id}`;

  let job = postOgImageCache.get(requestKey);
  if (!job) {
    job = (async () => {
      try {
        const diskKey = await buildPostDiskCacheKey(post);
        const diskCached = await readCachedPng(diskKey);
        if (diskCached) return diskCached;

        const svg = await postOgImage(post);
        const rendered = toUint8Array(svgBufferToPngBuffer(svg));

        if (rendered !== TRANSPARENT_PNG_FALLBACK) {
          await writeCachedPng(diskKey, rendered);
        }

        return rendered;
      } catch (error) {
        console.error("Error generating OG image for post:", error);
        return TRANSPARENT_PNG_FALLBACK;
      }
    })();
    postOgImageCache.set(requestKey, job);
  }

  try {
    const cachedImage = await job;
    return cachedImage.slice();
  } finally {
    postOgImageCache.delete(requestKey);
  }
}

export async function generateOgImageForSite(locale: BlogLocale = "zh-CN") {
  let job = siteOgImageCache.get(locale);
  if (!job) {
    const title = getLocalizedSiteTitle(locale);
    const description = getLocalizedSiteDescription(locale);

    job = (async () => {
      try {
        const diskKey = await buildSiteDiskCacheKey(locale, title, description);
        const diskCached = await readCachedPng(diskKey);
        if (diskCached) return diskCached;

        const svg = await siteOgImage({
          title,
          description,
          website: SITE.website,
        });
        const rendered = toUint8Array(svgBufferToPngBuffer(svg));

        if (rendered !== TRANSPARENT_PNG_FALLBACK) {
          await writeCachedPng(diskKey, rendered);
        }

        return rendered;
      } catch (error) {
        console.error("Error generating OG image for site:", error);
        return TRANSPARENT_PNG_FALLBACK;
      }
    })();
    siteOgImageCache.set(locale, job);
  }

  try {
    const cachedImage = await job;
    if (cachedImage === TRANSPARENT_PNG_FALLBACK) {
      siteOgImageCache.delete(locale);
    }

    return cachedImage.slice();
  } catch (error) {
    console.error("Error awaiting site OG image cache:", error);
    siteOgImageCache.delete(locale);
    return TRANSPARENT_PNG_FALLBACK.slice();
  }
}

export function resetOgImageCache() {
  postOgImageCache.clear();
  siteOgImageCache.clear();
  templateFingerprintPromise = null;
  initCachePromise = null;
  memoizedCacheDir = null;
}
