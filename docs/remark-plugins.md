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
- **国际化脚本**: `public/toc-i18n.js` - 多语言支持的客户端脚本
- **Astro 配置**: `astro.config.ts` - 插件在 Astro 中的集成配置

## remark-toc 配置

### 配置选项

```typescript
export const tocConfig = {
  heading: "contents|目录|table of contents", // 支持多语言目录标题
  maxDepth: 3, // 最大目录深度
  tight: true, // 紧凑模式
  ordered: false, // 无序列表
  prefix: "", // 无前缀
};
```

### 功能特性

- 支持中英文目录标题识别
- 限制目录层级避免过于深层
- 使用无序列表保持简洁
- 紧凑模式减少空白空间

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
  test: /目录|Table of contents|目录/i,
  summary: "展开/收起目录",
  open: false,
  class: "toc-collapse",
  attributes: {
    "data-multilingual": "true",
    "data-zh-title": "展开/收起目录",
    "data-en-title": "Toggle TOC",
  },
};
```

### 功能特性

- **多语言支持**: 自动识别中英文目录标题
- **动态文本**: 根据当前页面语言动态更新显示文本
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

### 客户端脚本

`public/toc-i18n.js` 提供以下功能：

1. **语言检测**: 根据 URL 路径自动检测当前语言
2. **动态更新**: 根据语言设置更新折叠组件文本
3. **URL 监听**: 监听页面导航和语言切换
4. **CSS 类管理**: 自动设置 `data-lang` 属性

### 使用方式

```javascript
// 手动更新（通常不需要，脚本会自动处理）
window.TocI18n.updateTocCollapseText();

// 获取当前语言
const currentLang = window.TocI18n.getCurrentLanguage();
```

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

- 客户端脚本延迟执行
- 避免不必要的 DOM 操作
- 使用事件委托减少监听器数量

### 4. 可访问性

- 支持键盘导航
- 提供语义化标记
- 保持屏幕阅读器兼容性

## 故障排除

### 常见问题

1. **目录没有折叠效果**
   - 检查 Markdown 中是否包含目录标题
   - 确认 CSS 样式是否正确加载
   - 验证 JavaScript 脚本是否执行

2. **多语言切换不工作**
   - 检查 URL 路径格式
   - 确认 `toc-i18n.js` 是否加载
   - 验证 HTML 属性是否正确设置

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

维护者：项目开发团队
最后更新：2025年1月
