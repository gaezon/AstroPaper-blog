import type { ImageTransform, LocalImageService } from "astro";
import sharpService from "astro/assets/services/sharp";
import { MAX_ARTICLE_IMAGE_WIDTH } from "./image-constants";

const MARKDOWN_IMAGE_HOST = "img.gaazeon.com";

function parsePositiveTransformDimension(value: unknown): number | null {
  if (typeof value !== "number" || !Number.isFinite(value) || value <= 0) {
    return null;
  }

  return Math.round(value);
}

function isTargetMarkdownImage(options: ImageTransform): boolean {
  if (typeof options.src !== "string") {
    return false;
  }

  try {
    // 仅按主机名匹配：协议与端口不参与判断。
    return new URL(options.src).hostname === MARKDOWN_IMAGE_HOST;
  } catch {
    return false;
  }
}

function clampResponsiveOptions(options: ImageTransform): void {
  const width = parsePositiveTransformDimension(options.width);
  const height = parsePositiveTransformDimension(options.height);

  if (width == null || height == null) {
    // 此分支依赖 rehypeImageSize 预先补齐尺寸；若无尺寸则不在此层做比例猜测。
    return;
  }

  const renderedWidth = Math.min(width, MAX_ARTICLE_IMAGE_WIDTH);
  const renderedHeight = Math.max(
    1,
    Math.round((height * renderedWidth) / width)
  );
  const maxResponsiveWidth = renderedWidth * 2;

  const existingWidths = (
    Array.isArray(options.widths) ? options.widths : []
  ).filter(
    (candidate): candidate is number =>
      typeof candidate === "number" &&
      Number.isFinite(candidate) &&
      candidate > 0
  );

  options.width = renderedWidth;
  options.height = renderedHeight;
  options.sizes = `(max-width: ${renderedWidth}px) 100vw, ${renderedWidth}px`;
  options.widths = Array.from(
    new Set([...existingWidths, renderedWidth, maxResponsiveWidth])
  )
    .filter(candidate => candidate <= maxResponsiveWidth)
    .sort((a, b) => a - b);
}

const markdownImageService: LocalImageService = {
  ...sharpService,
  async validateOptions(options, imageConfig) {
    const validated = sharpService.validateOptions
      ? await sharpService.validateOptions(options, imageConfig)
      : options;

    if (isTargetMarkdownImage(validated)) {
      clampResponsiveOptions(validated);
    }

    return validated;
  },
};

export default markdownImageService;
