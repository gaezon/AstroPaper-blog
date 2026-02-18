/**
 * 自定义 rehype 插件：为 Markdown 图片补充性能属性和尺寸兜底
 *
 * - 默认注入 loading/decoding/fetchpriority
 * - 支持通过 title="lcp|priority|hero" 标记首屏关键图
 * - 从预生成缓存读取尺寸作为兜底，避免构建时额外网络请求
 */

import type { Root, Element } from "hast";
import { visit } from "unist-util-visit";
import imageSizes from "./generated/imageSizes.json";

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
// NOTE: 这里的 768px 需要和文章内容容器最大宽度保持一致
// 当前对应 `src/styles/global.css` 中的 `.max-w-app`（Tailwind `max-w-3xl`）
// 如果未来调整文章内容区域宽度，请同时更新下面两个常量
const ARTICLE_IMAGE_SIZES = "(max-width: 768px) 100vw, 768px";
const MAX_ARTICLE_IMAGE_WIDTH = 768;

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

/**
 * rehype 插件：为 Markdown 图片补充性能属性与尺寸信息
 *
 * - 默认为 <img> 注入 loading / decoding / fetchpriority / sizes 等属性
 * - 支持通过 title="lcp|priority|hero" 标记首屏关键图并提升优先级
 * - 基于预生成尺寸缓存补全 width/height，避免构建阶段额外网络请求
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

      if (props.loading == null) {
        nextProps.loading = isPriorityImage ? "eager" : "lazy";
      }

      if (props.decoding == null) {
        nextProps.decoding = "async";
      }

      if (props.fetchpriority == null) {
        nextProps.fetchpriority = isPriorityImage ? "high" : "auto";
      }

      if (props.sizes == null) {
        nextProps.sizes = ARTICLE_IMAGE_SIZES;
      }

      // 使用 title="lcp|priority|hero" 作为优先级标记，不作为 tooltip 输出
      if (hasPriorityMarker(node)) {
        delete nextProps.title;
      }

      // 从缓存中获取图片尺寸
      const size = sizeCache[src];

      // 分别在缺失时添加 width/height 属性，避免覆盖已有设置
      if (size && size.width > 0 && size.height > 0) {
        const renderedWidth = Math.min(size.width, MAX_ARTICLE_IMAGE_WIDTH);
        const renderedHeight = Math.round(
          (size.height * renderedWidth) / size.width
        );

        if (props.width == null) {
          nextProps.width = renderedWidth;
        }

        if (props.height == null) {
          nextProps.height = renderedHeight;
        }
      }

      node.properties = nextProps;
    });
  };
};

export default rehypeImageSize;
