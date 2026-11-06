# Markdown 插件与文章目录

修改 Markdown 转换、文章目录或 callout 时阅读本文。作者语法见 [WRITING.md](../WRITING.md)，图表渲染见 [Mermaid](mermaid-rendering.md)。

## 转换链与配置入口

[astro.config.ts](../astro.config.ts) 的 `markdown.processor` 是插件接入点。当前处理顺序为：

| 阶段     | 插件                                                                    | 项目配置 / 实现                                                                                 |
| -------- | ----------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------- |
| Rehype   | `rehype-mermaid`（仅 GitHub Actions）→ `rehype-callouts` → 图片属性处理 | [Mermaid 配置](mermaid-rendering.md)、[rehype-image-size.ts](../src/utils/rehype-image-size.ts) |
| 代码高亮 | Shiki 主题与行 / 词高亮、diff、文件名转换                               | `astro.config.ts` 的 `shikiConfig`、[fileName.js](../src/utils/transformers/fileName.js)        |

插件参数以配置源码为准；调整处理顺序时检查后续插件是否仍能识别前一步输出。`mermaid` 被排除在常规代码高亮之外，以保留图表渲染输入。

文章目录不再由 Remark 插件生成。`remark-toc` 和 `remark-collapse` 已移除，正文里的 `## 目录` 只会是普通标题，不会生成目录列表。目录统一由文章布局根据 Astro 渲染返回的 `headings` 生成。

## 文章目录

- [PostToc.astro](../src/components/PostToc.astro) 渲染宽屏侧栏；`>= 80rem` 时显示在正文列右侧，空间不足时自动隐藏。
- [PostFab.astro](../src/components/PostFab.astro) 渲染移动端浮动按钮、popover 列表、回顶入口和阅读进度环。
- [buildTocTree.ts](../src/utils/toc/buildTocTree.ts) 负责过滤与建树：收录 `h2` / `h3`，过滤脚注、`fnref-` / `fn-` 以及作者手写的目录标题；少于 2 个有效标题时不显示目录。
- [toc.ts](../src/scripts/toc.ts) 负责阅读线高亮、当前项自动滚入视野、FAB 显隐、进度环和 popover / 回顶交互。
- [toc.css](../src/styles/components/toc.css) 维护侧栏、popover、FAB 和打印样式。

目录开关由 [src/config.ts](../src/config.ts) 的 `SITE.showToc` 控制；单篇文章可在 frontmatter 用 `hideToc: true` 关闭。默认收录层级为 `h2` / `h3`；若要改变层级，调整 `buildTocTree.ts` 的 `TOC_MAX_DEPTH`，并同时验证桌面侧栏与移动 popover。

目录由 Astro 的 `headings` 驱动，作者不需要手写目录标题。侧栏和 popover 都带 `data-pagefind-ignore`，不会进入搜索索引。

## Callout 与样式

`rehype-callouts` 在构建阶段转换 Obsidian 风格引用块，不需要额外客户端脚本：

```markdown
> [!NOTE]
> 这里是说明文字。
```

[global.css](../src/styles/global.css) 引入 `rehype-callouts/theme/obsidian`；[typography.css](../src/styles/typography.css) 用 `details:not(.callout)` 避免通用折叠样式覆盖 callout。修改 `details`、正文排版或主题样式时，检查普通折叠块与 callout 两种输出。

## 检查与排查

| 现象 / 改动                  | 优先检查                                                                                    |
| ---------------------------- | ------------------------------------------------------------------------------------------- |
| 侧栏或浮层目录没有出现       | 标题是否为 `h2` / `h3`、是否少于 2 个、是否被脚注过滤，以及 `SITE.showToc` / `hideToc` 设置 |
| 目录高亮、popover 或回顶异常 | `pnpm exec playwright test tests/toc.spec.ts tests/mobile-nav-layout.spec.ts`               |
| 目录层级或过滤规则改变       | `pnpm exec vitest run tests/unit/build-toc-tree.spec.ts`，再检查桌面与移动端                |
| Callout 无样式或结构异常     | 检查 `> [!TYPE]` 输入、插件是否启用、主题样式是否引入以及 `details` 选择器                  |
| 中文正文 / Callout 排版改变  | `pnpm exec playwright test tests/chinese-typography.spec.ts`                                |
| 插件、内容或构建配置改变     | `pnpm build:strict`，再根据影响选择上述浏览器检查                                           |

涉及交互时检查键盘焦点、移动端 popover 关闭及亮 / 暗主题；仅文档修改检查链接与 `git diff --check`。
