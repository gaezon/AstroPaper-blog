# Remark 插件配置文档

本文档描述了项目中使用的 remark 插件及其配置。

## 概述

本博客项目使用 remark 生态系统来处理 Markdown 内容，主要包括以下插件：

- **remark-toc**: 生成目录（Table of Contents）
- **remark-collapse**: 为目录添加折叠功能

## 配置文件位置

- **主配置**: `src/config/remark.ts` - 插件配置常量和工具函数
- **类型定义**: `remark-collapse.d.ts` - remark-collapse 插件的 TypeScript 类型定义
- **样式文件**: `src/styles/components/toc-collapse.css` - TOC 折叠组件样式
- **Astro 配置**: `astro.config.ts` - 插件在 Astro 中的集成配置

## remark-toc 配置

### 配置选项

```typescript
export const tocConfig = {
  heading: "contents|目录|table of contents", // 支持多语言目录标题
  maxDepth: 2, // 博客默认只保留主章节层级
  tight: true, // 紧凑模式
  ordered: false, // 无序列表
  prefix: "", // 无前缀
};
```

### 功能特性

- 支持中英文目录标题识别
- 默认限制为更克制的博客目录层级，避免侧边导航过长
- 使用无序列表保持简洁
- 紧凑模式减少空白空间

### 当前博客中的 TOC 策略

- Markdown 中的 `## Table of contents` 仍会在构建阶段由 `remark-toc` 与 `remark-collapse` 处理，主要作为内容层的兼容输入。
- 文章页真正展示给读者的导航是 `src/components/TableOfContents.astro` 提供的侧边栏 / 移动抽屉 TOC。
- 当前站点默认仅将主章节标题纳入文章 TOC，以保持博客阅读场景下的扫读效率，避免把过细的小标题全部暴露到侧边栏。
- 为避免重复导航，正文中的折叠 TOC 在文章样式里默认隐藏，保留侧边栏与移动端抽屉作为主要入口。

## remark-collapse 配置

### 类型定义

```typescript
export interface RemarkCollapseOptions {
  test?: string | RegExp; // 匹配要折叠的标题
  summary?: string; // 折叠组件的摘要文本
  open?: boolean; // 默认是否展开
  class?: string; // CSS 类名
  attributes?: Record<string, string>; // 额外的 HTML 属性
}
```

### 国际化配置

#### 特定语言配置

```typescript
export const collapseConfigs = {
  zh: {
    test: "目录",
    summary: "展开/收起目录",
    open: false,
    class: "toc-collapse-zh",
    attributes: { "data-locale": "zh-CN" },
  },
  en: {
    test: "Table of contents",
    summary: "Toggle TOC",
    open: false,
    class: "toc-collapse-en",
    attributes: { "data-locale": "en" },
  },
};
```

#### 通用多语言配置

```typescript
export const universalCollapseConfig = {
  test: /目录|目錄|table of contents|contents/i,
  summary: heading => {
    const text = heading.toLowerCase();
    if (/table\s+of\s+contents|contents/.test(text)) {
      return "Toggle TOC";
    }
    if (/目录|目錄/.test(heading)) {
      return "展开/收起目录";
    }
    return "Toggle TOC";
  },
  open: false,
  class: "toc-collapse",
};
```

### 功能特性

- **多语言支持**: 自动识别中英文目录标题
- **构建期文本生成**: 根据标题内容在构建阶段生成对应语言的折叠摘要
- **可配置性**: 支持自定义样式和行为
- **无障碍性**: 支持键盘导航和屏幕阅读器

## 样式系统

### CSS 变量

项目使用 CSS 变量支持主题切换：

```css
:root,
html[data-theme="light"] {
  --theme-bg: #ffffff;
  --theme-bg-secondary: #f8f9fa;
  --theme-bg-hover: #f1f3f4;
  --theme-text: #282728;
  --theme-border: #e1e5e9;
  --theme-accent-blue: #006cac;
  --theme-accent-green: #28a745;
}

html[data-theme="dark"] {
  --theme-bg: #1a1f2e;
  --theme-bg-secondary: #212737;
  --theme-bg-hover: #2d3748;
  --theme-text: #eaedf3;
  --theme-border: #4a5568;
  --theme-accent-blue: #4299e1;
  --theme-accent-green: #48bb78;
}
```

### 响应式设计

- 移动端优化：较小的间距和字体
- 平板适配：适中的尺寸和布局
- 桌面端：完整的交互体验

## 国际化实现

### 构建期自动判定语言

`universalCollapseConfig.summary` 定义为函数，会在构建阶段根据目录标题（如 "目录"、"Table of Contents"、"Contents" 等）返回对应语言的提示文案，从而生成无闪烁的最终 HTML。

### 样式配合

- 统一使用 `.toc-collapse` 类控制外观。
- 语言专属的配色可通过额外类（如 `.toc-collapse-zh`、`.toc-collapse-en`）在需要时定制。

通过在 Markdown 转换阶段完成语言判断，客户端无需额外脚本即可获得正确的折叠摘要文案。

## 工具函数

### 配置验证

```typescript
function validateCollapseConfig(config: RemarkCollapseOptions): boolean;
```

验证配置参数的有效性，输出警告信息。

### 配置合并

```typescript
function mergeCollapseConfig(
  userConfig: Partial<RemarkCollapseOptions>,
  defaultConfig: RemarkCollapseOptions
): RemarkCollapseOptions;
```

合并用户配置和默认配置，确保所有必需的选项都有值。

### 配置获取

```typescript
function getCollapseConfig(locale: string): RemarkCollapseOptions;
function getI18nCollapseConfig(): RemarkCollapseOptions;
```

根据语言或获取通用配置。

## 最佳实践

### 1. 配置管理

- 使用常量文件集中管理配置
- 提供类型安全的方法
- 验证输入参数的有效性

### 2. 国际化

- 支持动态语言切换
- 保持配置的一致性
- 使用语义化的属性名

### 3. 性能优化

- 在构建阶段生成 TOC 结构，客户端只做交互增强
- 避免不必要的 DOM 操作
- 将正文 TOC 与侧边 TOC 分工，减少重复渲染与重复导航

### 4. 可访问性

- 支持键盘导航
- 提供语义化标记
- 保持屏幕阅读器兼容性

## 故障排除

### 常见问题

1. **目录没有折叠效果**
   - 检查 Markdown 中是否包含目录标题
   - 确认 CSS 样式是否正确加载
   - 验证 remark-collapse 插件是否在构建链中启用

2. **多语言切换不工作**
   - 检查 URL 路径格式
   - 确认目录标题是否命中 `summary` 函数中的匹配规则
   - 必要时在 `summary` 函数中补充新的语言分支

3. **样式显示异常**
   - 检查 CSS 变量是否定义
   - 确认主题切换功能正常
   - 验证响应式断点

### 调试方法

1. 打开浏览器开发者工具
2. 检查控制台错误信息
3. 验证 DOM 结构和 CSS 类
4. 查看网络请求是否成功加载资源

## 更新日志

### v1.0.0 (当前版本)

- 添加 remark-collapse 多语言支持
- 实现动态文本切换功能
- 增强样式系统和主题支持
- 添加完整的 TypeScript 类型定义
- 提供配置验证和工具函数

---

## 相关文档

- [Mermaid 构建时渲染](./mermaid-rendering.md) - Mermaid 图表的构建时渲染配置

---

维护者：项目开发团队
最后更新：2026 年 3 月
