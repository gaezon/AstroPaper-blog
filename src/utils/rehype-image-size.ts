/**
 * 自定义 rehype 插件：为 Markdown 图片补充性能属性并收敛响应式尺寸
 *
 * - 默认注入 loading/decoding/fetchpriority
 * - 支持通过 title="lcp|priority|hero" 标记首屏关键图
 * - 统一将文章图片渲染宽度限制在容器上限，避免大图候选被错误下载
 * - 从预生成缓存读取尺寸作为兜底，避免构建时额外网络请求
 */

import type { Root, Element } from "hast";
import { visit } from "unist-util-visit";
import imageSizes from "./generated/imageSizes.json";
import { MAX_ARTICLE_IMAGE_WIDTH } from "./image-constants";

interface ImageSize {
  width: number;
  height: number;
}

interface ImageNodeInfo {
  node: Element;
  src: string;
}

// 类型断言：将导入的 JSON 转换为正确的类型
const sizeCache: Record<string, ImageSize> = imageSizes;

const PRIORITY_MARKERS = new Set(["lcp", "priority", "hero"]);
// NOTE: MAX_ARTICLE_IMAGE_WIDTH 需要和文章内容容器最大宽度保持一致
// 当前对应 `src/styles/global.css` 中的 `.max-w-app`（Tailwind `max-w-3xl`）

function isImgElement(node: Element): boolean {
  return node.tagName === "img";
}

function getSrc(node: Element): string | null {
  const src = node.properties?.src;
  if (typeof src !== "string" || !src) return null;
  if (src.startsWith("data:")) return null;
  return src;
}

function hasPriorityMarker(node: Element): boolean {
  const title = node.properties?.title;
  if (typeof title !== "string") return false;
  return PRIORITY_MARKERS.has(title.trim().toLowerCase());
}

function determinePriorityIndex(
  explicitIndex: number,
  totalImages: number
): number {
  if (explicitIndex >= 0) {
    return explicitIndex;
  }

  if (totalImages > 0) {
    return 0;
  }

  return -1;
}

function parsePositiveHastDimension(value: unknown): number | null {
  const parsed =
    typeof value === "number"
      ? value
      : typeof value === "string"
        ? Number(value)
        : NaN;

  if (!Number.isFinite(parsed) || parsed <= 0) {
    return null;
  }

  return Math.round(parsed);
}

function resolveImageDimensions(node: Element, src: string): ImageSize | null {
  const widthFromProps = parsePositiveHastDimension(node.properties?.width);
  const heightFromProps = parsePositiveHastDimension(node.properties?.height);

  if (widthFromProps != null && heightFromProps != null) {
    return {
      width: widthFromProps,
      height: heightFromProps,
    };
  }

  const cached = sizeCache[src];
  if (!cached || cached.width <= 0 || cached.height <= 0) {
    return null;
  }

  if (widthFromProps != null) {
    return {
      width: widthFromProps,
      height: Math.max(
        1,
        Math.round((cached.height * widthFromProps) / cached.width)
      ),
    };
  }

  if (heightFromProps != null) {
    return {
      width: Math.max(
        1,
        Math.round((cached.width * heightFromProps) / cached.height)
      ),
      height: heightFromProps,
    };
  }

  return cached;
}

function getRenderedDimensions(size: ImageSize): ImageSize {
  const renderedWidth = Math.min(size.width, MAX_ARTICLE_IMAGE_WIDTH);
  const renderedHeight = Math.max(
    1,
    Math.round((size.height * renderedWidth) / size.width)
  );

  return {
    width: renderedWidth,
    height: renderedHeight,
  };
}

function buildSizesAttr(maxWidth: number): string {
  return `(max-width: ${maxWidth}px) 100vw, ${maxWidth}px`;
}

/**
 * rehype 插件：为 Markdown 图片补充性能属性并约束响应式尺寸
 *
 * - 默认为 <img> 注入 loading / decoding / fetchpriority / sizes 等属性
 * - 支持通过 title="lcp|priority|hero" 标记首屏关键图并提升优先级
 * - 根据容器宽度上限重写 sizes 与 width/height，避免超大资源候选被选择
 * - 基于预生成尺寸缓存兜底，避免构建阶段额外网络请求
 */
const rehypeImageSize = () => {
  return (tree: Root) => {
    const imageNodes: ImageNodeInfo[] = [];

    visit(tree, "element", (node: Element) => {
      if (!isImgElement(node)) return;

      const src = getSrc(node);
      if (!src) return;

      imageNodes.push({ node, src });
    });

    // 多个优先级标记同时存在时，仅首个标记生效
    const explicitPriorityIndex = imageNodes.findIndex(({ node }) =>
      hasPriorityMarker(node)
    );
    const priorityIndex = determinePriorityIndex(
      explicitPriorityIndex,
      imageNodes.length
    );

    imageNodes.forEach(({ node, src }, index) => {
      const props = node.properties ?? {};
      const nextProps: typeof props = { ...props };
      const isPriorityImage = index === priorityIndex;
      const sourceSize = resolveImageDimensions(node, src);
      const renderedSize = sourceSize
        ? getRenderedDimensions(sourceSize)
        : null;

      if (props.loading == null) {
        nextProps.loading = isPriorityImage ? "eager" : "lazy";
      }

      if (props.decoding == null) {
        nextProps.decoding = "async";
      }

      if (props.fetchpriority == null) {
        nextProps.fetchpriority = isPriorityImage ? "high" : "auto";
      }

      nextProps.sizes = buildSizesAttr(
        renderedSize?.width ?? MAX_ARTICLE_IMAGE_WIDTH
      );

      // 使用 title="lcp|priority|hero" 作为优先级标记，不作为 tooltip 输出
      if (hasPriorityMarker(node)) {
        delete nextProps.title;
      }

      if (renderedSize) {
        nextProps.width = renderedSize.width;
        nextProps.height = renderedSize.height;
      }

      node.properties = nextProps;
    });
  };
};

export default rehypeImageSize;
