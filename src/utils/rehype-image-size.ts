/**
 * 自定义 rehype 插件：为图片添加 width/height 属性
 *
 * 从预生成的缓存中读取图片尺寸，避免构建时网络请求
 * 解决 CLS (Cumulative Layout Shift) 问题
 */

import type { Root, Element } from "hast";
import { visit } from "unist-util-visit";
import imageSizes from "./generated/imageSizes.json";

interface ImageSize {
  width: number;
  height: number;
}

// 类型断言：将导入的 JSON 转换为正确的类型
const sizeCache: Record<string, ImageSize> = imageSizes;

/**
 * rehype 插件：为 img 标签添加 width/height 属性
 */
const rehypeImageSize = () => {
  return (tree: Root) => {
    visit(tree, "element", (node: Element) => {
      if (node.tagName !== "img") return;

      const src = node.properties?.src;

      // 类型守卫：确保 src 是字符串
      if (typeof src !== "string" || !src) return;

      // 从缓存中获取图片尺寸
      const size = sizeCache[src];
      if (!size) {
        // 如果缓存中没有，可以在这里添加警告日志
        // console.warn(`[rehype-image-size] 未找到图片尺寸: ${src}`);
        return;
      }

      // 分别在缺失时添加 width/height 属性，避免覆盖已有设置
      const props = node.properties;
      const nextProps: typeof props = { ...props };

      if (props.width == null) {
        nextProps.width = size.width;
      }

      if (props.height == null) {
        nextProps.height = size.height;
      }

      node.properties = nextProps;
    });
  };
};

export default rehypeImageSize;
