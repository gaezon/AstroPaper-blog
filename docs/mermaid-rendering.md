# Mermaid 渲染

修改图表渲染、主题或构建环境时阅读本文。Markdown 插件链见 [Remark / Rehype](remark-plugins.md)，文章语法见 [WRITING.md](../WRITING.md)。

## 两种渲染路径

| 条件                      | 输出与运行方式                                                                                                                            |
| ------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------- |
| `GITHUB_ACTIONS` 为非空值 | `rehype-mermaid` 以 `img-svg` 策略在构建 / Markdown 处理阶段生成 `<picture>`，包含亮 / 暗 SVG data URI；页面不注入客户端 Mermaid 渲染脚本 |
| 未设置 `GITHUB_ACTIONS`   | 保留原始 Mermaid 代码块，由客户端回退脚本按需加载 Mermaid 并渲染 SVG                                                                      |

判断依据是环境变量，不是构建命令或托管平台名称。当前 GitHub Actions 的预览与生产部署上传预构建产物，因此走第一条路径；本地构建及其他构建环境默认走第二条路径。预览已有产物时，其渲染方式由构建产物决定。

## 修改入口

- [astro.config.ts](../astro.config.ts)：构建期条件、`rehype-mermaid` 配置和浏览器启动参数。`MERMAID_CHROMIUM_EXECUTABLE_PATH` 可指定 Chrome / Chromium 可执行文件。
- [Layout.astro](../src/layouts/Layout.astro)：按相同环境条件注入 [mermaid-dev-preview.ts](../src/scripts/mermaid-dev-preview.ts)。
- [mermaidTheme.ts](../src/utils/mermaidTheme.ts)：两条路径共享的主题变量。
- [toggle-theme.ts](../src/scripts/toggle-theme.ts)：同步页面主题与构建期图片的 `media` 条件，并派发 `theme-changed`。
- [global.css](../src/styles/global.css)：图表尺寸和回退容器样式。

构建期输出初始使用 `<source media="(prefers-color-scheme: dark)">`；主题脚本随后将暗色 source 的 `media` 改为 `all` 或 `none`，跟随站内主题。客户端回退读取页面 `data-theme`，监听 `theme-changed` 重新渲染，并串行处理快速主题切换。两者共享配色，分别通过图片选择和重新渲染响应主题；检查时同时覆盖系统色彩偏好与站内主题按钮。

回退脚本在 `astro:page-load` 收集代码块；没有图表时不加载 Mermaid。渲染失败会保留错误信息与原始图表源码，便于定位语法问题。

## 环境与验证

构建期路径需要可启动的浏览器。当前 [ci.yml](../.github/workflows/ci.yml)、[deploy-preview.yml](../.github/workflows/deploy-preview.yml) 和 [deploy-production.yml](../.github/workflows/deploy-production.yml) 使用 runner 的 `/usr/bin/google-chrome`，并在构建前检查可执行文件。调整 runner 时同步检查浏览器路径，不要假定已安装 Playwright 自带浏览器。

[mermaid-rendering.spec.ts](../tests/mermaid-rendering.spec.ts) 按相同环境变量选择测试分支：构建期分支检查 SVG 图片、尺寸、暗色资源和客户端 Mermaid 请求；本地分支检查回退渲染与主题切换。

本地默认检查：

```bash
pnpm exec playwright test tests/mermaid-rendering.spec.ts
```

需要验证 GitHub Actions 路径时，先确认浏览器可用，再对构建和浏览器测试同时设置 `GITHUB_ACTIONS=1`；自定义浏览器时同时提供 `MERMAID_CHROMIUM_EXECUTABLE_PATH`。默认 Playwright 配置启动开发服务器，验证的是 Markdown 渲染路径；`pnpm build:strict` 另行验证站点产物构建。不要把本地回退测试当作构建期路径的证明。

只调整配色工具函数时，可先运行 `pnpm test:unit tests/unit/mermaid-theme.spec.ts`，再按视觉影响检查相应图表。仅文档修改无需运行浏览器或构建。
