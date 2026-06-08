import fs from "node:fs";
import path from "node:path";
import { validateAndGetDiskCacheDir } from "../src/utils/og-cache-validator";

const rawDir =
  process.env.OG_IMAGE_CACHE_DIR ||
  path.resolve(process.cwd(), "tmp", "og-image-cache");
const logPrefix = "clean-og:";

try {
  const safeDir = validateAndGetDiskCacheDir(rawDir);

  if (fs.existsSync(safeDir)) {
    fs.rmSync(safeDir, { recursive: true, force: true });
    console.log(
      `${logPrefix} Successfully cleaned OG image cache directory: ${safeDir}`
    );
  } else {
    console.log(
      `${logPrefix} OG image cache directory does not exist, no action needed: ${safeDir}`
    );
  }
} catch (err) {
  console.error(`${logPrefix} Aborted: ${(err as Error).message}`);
  process.exit(1);
}
