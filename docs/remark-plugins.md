# Markdown 插件与目录导航

修改 Markdown 转换、文章目录或 callout 时阅读本文。作者语法见 [WRITING.md](../WRITING.md)，图表渲染见 [Mermaid](mermaid-rendering.md)。

## 转换链与配置入口

[astro.config.ts](../astro.config.ts) 的 `markdown.processor` 是插件接入点。当前处理顺序为：

| 阶段     | 插件                                                                    | 项目配置 / 实现                                                                                 |
| -------- | ----------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------- |
| Remark   | `remark-toc` → `remark-collapse`                                        | [src/config/remark.ts](../src/config/remark.ts)                                                 |
| Rehype   | `rehype-mermaid`（仅 GitHub Actions）→ `rehype-callouts` → 图片属性处理 | [Mermaid 配置](mermaid-rendering.md)、[rehype-image-size.ts](../src/utils/rehype-image-size.ts) |
| 代码高亮 | Shiki 主题与行 / 词高亮、diff、文件名转换                               | `astro.config.ts` 的 `shikiConfig`、[fileName.js](../src/utils/transformers/fileName.js)        |

插件参数以配置源码为准；调整处理顺序时检查后续插件是否仍能识别前一步输出。`mermaid` 被排除在常规代码高亮之外，以保留图表渲染输入。

## 两类目录的分工

Markdown 中的目录标题由 `remark-toc` 识别，当前 `heading` 为 `contents|目录|table of contents`，`maxDepth` 为 `2`。随后 `remark-collapse` 使用通用配置，根据标题生成中文或英文摘要，并输出默认关闭的 `.toc-collapse`。

读者实际使用的文章导航来自 [TableOfContents.astro](../src/components/TableOfContents.astro)：

- 服务端优先使用 Astro 提供的 `headings`，必要时从内容提取。
- [extractToc.ts](../src/utils/extractToc.ts) 当前只收录 `h2`，过滤目录标题和脚注条目。
- [TocClient.astro](../src/components/TocClient.astro) 与 [utils/toc/](../src/utils/toc/) 提供桌面收折、移动抽屉、滚动定位与当前章节状态。
- [toc-collapse.css](../src/styles/components/toc-collapse.css) 隐藏正文 `#article .toc-collapse`，避免出现重复目录，同时维护侧栏 / 抽屉样式。

因此，修改 `tocConfig.maxDepth` 只会改变正文插件输出。若需求是改变读者看到的目录层级，还需调整 `extractToc.ts` 并验证桌面和移动导航。

`RemarkCollapseOptions` 的声明位于 [src/remark-collapse.d.ts](../src/remark-collapse.d.ts)，本地配置模块也导出对应接口。`summary` 可为字符串或构建期函数；`validateCollapseConfig` 校验失败会抛错，`mergeCollapseConfig` 合并属性后调用校验。调整这些接口时保持声明、实现和调用方一致。

## Callout 与样式

`rehype-callouts` 在构建阶段转换 Obsidian 风格引用块，不需要额外客户端脚本：

```markdown
> [!NOTE]
> 这里是说明文字。
```

[global.css](../src/styles/global.css) 引入 `rehype-callouts/theme/obsidian`；[typography.css](../src/styles/typography.css) 用 `details:not(.callout)` 避免通用折叠样式覆盖 callout。修改 `details`、正文排版或主题样式时，检查普通折叠块与 callout 两种输出。

## 检查与排查

| 现象 / 改动                  | 优先检查                                                                                             |
| ---------------------------- | ---------------------------------------------------------------------------------------------------- |
| 正文目录没有显示             | 先确认是否被 `.toc-collapse` 的预期隐藏规则覆盖；侧栏无需依赖正文目录标题                            |
| 侧栏缺少标题                 | 查看是否为 `h2`，是否有锚点，是否被 `extractToc.ts` 的过滤规则排除                                   |
| 目录滚动、收折或移动抽屉改变 | `pnpm exec playwright test tests/toc-animation-optimization.spec.ts tests/mobile-nav-layout.spec.ts` |
| Callout 无样式或结构异常     | 检查 `> [!TYPE]` 输入、插件是否启用、主题样式是否引入以及 `details` 选择器                           |
| 中文正文 / Callout 排版改变  | `pnpm exec playwright test tests/chinese-typography.spec.ts`                                         |
| 插件、内容或构建配置改变     | `pnpm build:strict`，再根据影响选择上述浏览器检查                                                    |

涉及交互时检查键盘焦点、移动抽屉关闭及亮 / 暗主题；仅文档修改检查链接与 `git diff --check`。
