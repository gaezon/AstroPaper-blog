# Mermaid 构建时渲染

本项目使用 `rehype-mermaid` 在构建阶段将 Mermaid 代码块转换为 SVG 图片，以减少运行时依赖。

## 当前行为

- 在 GitHub Actions 中启用构建时 Mermaid 渲染
  - 判断条件：`GITHUB_ACTIONS` 环境变量
  - 产物为 `<picture>` 元素，通过亮/暗双 SVG 支持主题切换，客户端零 Mermaid JS
- 在非 GitHub Actions 环境（本地开发、`pnpm preview`、其他 CI 等）不启用该插件，
  改为注入客户端回退渲染脚本 `src/scripts/mermaid-dev-preview.ts`：
  - 在浏览器中把残留的 ` ```mermaid ` 代码块渲染为 SVG
  - 复用 `src/utils/mermaidTheme.ts` 中与构建时完全相同的主题变量，本地预览与生产视觉一致
  - 监听 `theme-changed` 事件（由 `src/scripts/toggle-theme.ts` 派发），切换亮/暗主题时重新渲染
  - 渲染失败时展示错误信息和原始代码块，便于写作时即时发现语法错误
- GitHub Actions 构建中，`Layout.astro` 不会输出该脚本标签，Mermaid 库不会进入生产 bundle

## 配置位置

- `astro.config.ts`
  - `shouldRenderMermaidAtBuildTime`
  - `markdown.rehypePlugins` 中的 `mermaidConfig`
- `src/layouts/Layout.astro`：按 `GITHUB_ACTIONS` 条件注入回退脚本
- `src/scripts/mermaid-dev-preview.ts`：客户端回退渲染实现

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
