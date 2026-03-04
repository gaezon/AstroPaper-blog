# Mermaid 构建时渲染

本项目使用 `rehype-mermaid` 在构建时将 Mermaid 代码块渲染为 SVG 图片，避免客户端 JavaScript 依赖。

## 技术方案

### 渲染策略

使用 `img-svg` 策略，在构建时：

1. 解析 Markdown 中的 `mermaid` 代码块
2. 通过 Playwright 调用 Mermaid 库渲染
3. 生成 SVG 并嵌入为 Base64 图片

### 环境检测

构建时 Mermaid 渲染**仅在 GitHub Actions 中启用**，通过检测 `GITHUB_ACTIONS` 环境变量实现：

```typescript
const shouldRenderMermaidAtBuildTime = !!process.env.GITHUB_ACTIONS;
```

在其他环境（本地开发、Vercel Preview 等）中，Mermaid 代码块将保持原样，回退到客户端渲染。

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

主题切换由 [`toggle-theme.js`](../../public/toggle-theme.js) 控制，通过修改 `<source>` 元素的 `media` 属性实现即时切换。

## 配置位置

完整配置位于 [`astro.config.ts`](../../astro.config.ts) 的 `markdown.rehypePlugins` 部分：

```typescript
rehypePlugins: [
  // Build-time Mermaid rendering in CI; falls back to client-side rendering in other environments
  ...mermaidConfig,
],
```

其中 `mermaidConfig` 是一个条件数组，仅在 `GITHUB_ACTIONS` 环境变量存在时才包含 `rehype-mermaid` 插件配置。

## CI 环境配置

### GitHub Actions 工作流

所有 CI 工作流（`ci.yml`、`deploy-preview.yml`、`deploy-production.yml`）都包含 Playwright 浏览器安装步骤：

```yaml
- name: Install Playwright browsers
  run: pnpm exec playwright install --with-deps chromium
```

这会安装 Playwright 自带的 Chromium 浏览器及其系统依赖，Playwright 会自动发现并使用它。

### 为什么不使用系统 Chrome？

早期版本尝试使用 `/usr/bin/google-chrome`，但该路径在 GitHub Actions 的 `ubuntu-latest` 环境中**不存在**。现在改为使用 Playwright 安装的 Chromium，更加可靠。

### Vercel 环境

Vercel 的原生构建环境没有 `GITHUB_ACTIONS` 环境变量，因此会跳过 Mermaid 构建时渲染。生产部署通过 GitHub Actions 预构建后推送到 Vercel，所以生产环境可以正常使用构建时渲染的 SVG 图表。

## 相关文档

- [Remark 插件配置](./remark-plugins.md) - TOC 和折叠功能配置
