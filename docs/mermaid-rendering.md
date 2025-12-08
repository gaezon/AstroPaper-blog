# Mermaid 构建时渲染

本项目使用 `rehype-mermaid` 在构建时将 Mermaid 代码块渲染为 SVG 图片，避免客户端 JavaScript 依赖。

## 技术方案

### 渲染策略

使用 `img-svg` 策略，在构建时：

1. 解析 Markdown 中的 `mermaid` 代码块
2. 通过 Playwright 调用 Mermaid 库渲染
3. 生成 SVG 并嵌入为 Base64 图片

### 主题支持

支持亮色/暗色双主题，通过 `<picture>` 元素实现：

```html
<picture>
  <source
    id="mermaid-dark-n"
    srcset="..."
    media="(prefers-color-scheme: dark)"
  />
  <img id="mermaid-light-n" src="..." alt="..." />
</picture>
```

主题切换由 [`toggle-theme.js`](file:///Users/leojun/code/AstroPaper-blog/public/toggle-theme.js) 控制，通过修改 `<source>` 元素的 `media` 属性实现即时切换。

## 配置位置

完整配置位于 [`astro.config.ts`](file:///Users/leojun/code/AstroPaper-blog/astro.config.ts) 的 `markdown.rehypePlugins` 部分：

```typescript
rehypePlugins: [
  [
    rehypeMermaid,
    {
      strategy: "img-svg",
      dark: { /* 暗色主题变量 */ },
      mermaidConfig: { /* 亮色主题变量 */ },
      // CI 环境使用系统 Chrome
      ...(process.env.CI ? { launchOptions: { executablePath: "/usr/bin/google-chrome" } } : {}),
    },
  ],
],
```

## CI 环境注意事项

- Vercel 构建使用 GitHub Actions 预构建
- CI 中使用系统 Chrome 而非 Playwright 内置浏览器
- 相关工作流：`.github/workflows/deploy-preview.yml`

## 相关文档

- [Remark 插件配置](./remark-plugins.md) - TOC 和折叠功能配置
