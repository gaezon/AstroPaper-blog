import os from "node:os";
import path from "node:path";

/**
 * 校验并返回安全的磁盘缓存目录绝对路径。
 * 强力安全保障：
 * 1. 最后一级目录名称必须严格为 'og-image-cache'
 * 2. 绝对不能是系统根目录 '/' 或项目工作目录
 * 3. 该目录必须位于项目 'tmp' 目录或系统临时目录范围内
 *
 * @param rawDir 输入的待清洗路径
 * @returns 经过安全核验的绝对路径
 */
export function validateAndGetDiskCacheDir(rawDir: string): string {
  const normalizedDir = path.resolve(rawDir);
  const allowedParents = [
    path.resolve(process.cwd(), "tmp"),
    path.resolve(os.tmpdir()),
  ];

  const isWithinAllowedParent = allowedParents.some(parent => {
    const relative = path.relative(parent, normalizedDir);
    return !relative.startsWith("..") && !path.isAbsolute(relative);
  });

  const isUnsafe =
    normalizedDir === path.resolve("/") ||
    normalizedDir === path.resolve(process.cwd()) ||
    path.basename(normalizedDir) !== "og-image-cache" ||
    !isWithinAllowedParent;

  if (isUnsafe) {
    throw new Error(
      `Unsafe OG cache directory: ${normalizedDir}. The target directory name must be strictly 'og-image-cache' and must be located under the project 'tmp' or system 'tmp' directory.`
    );
  }
  return normalizedDir;
}
