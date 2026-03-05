# Mermaid 构建时渲染

本项目使用 `rehype-mermaid` 在构建阶段将 Mermaid 代码块转换为 SVG 图片，以减少运行时依赖。

## 当前行为

- 在 GitHub Actions 中启用构建时 Mermaid 渲染
  - 判断条件：`GITHUB_ACTIONS` 环境变量
- 在非 GitHub Actions 环境（本地开发、Vercel 原生构建、其他 CI 等）默认不启用该插件
- 主题支持通过 `<picture>` 实现亮色/暗色资源切换

> 说明：当前配置在非 GitHub Actions 环境下不自动回退到客户端 Mermaid 渲染脚本，通常会保留原始 `mermaid` 代码块用于编辑与审阅。

## 配置位置

- `astro.config.ts`
  - `shouldRenderMermaidAtBuildTime`
  - `markdown.rehypePlugins` 中的 `mermaidConfig`

关键片段：

```ts
const shouldRenderMermaidAtBuildTime = !!process.env.GITHUB_ACTIONS;

const mermaidConfig = shouldRenderMermaidAtBuildTime
  ? [
      [
        rehypeMermaid,
        {
          strategy: "img-svg",
          dark: {
            /* ... */
          },
          mermaidConfig: {
            /* ... */
          },
        },
      ],
    ]
  : [];
```

## CI 环境要求

GitHub Actions 工作流中需要安装 Playwright Chromium：

```yaml
- name: Install Playwright browsers
  run: pnpm exec playwright install --with-deps chromium
```

当前相关工作流：

- `.github/workflows/ci.yml`
- `.github/workflows/deploy-preview.yml`
- `.github/workflows/deploy-production.yml`

## 验证建议

- CI 中运行 `tests/mermaid-rendering.spec.ts`
- 在本地若需验证构建时渲染行为，需先安装 Playwright Chromium（`pnpm exec playwright install --with-deps chromium`），再临时注入 `GITHUB_ACTIONS=1` 后执行构建测试

## 相关文档

- `docs/remark-plugins.md`
