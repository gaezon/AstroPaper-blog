# 架构与目录职责

用于定位共享逻辑和修改边界。启动方式见 [README](../README.md)，具体检查见 [开发与验证](development.md)。

## 目录边界

| 位置                                                         | 职责                                                                                             |
| ------------------------------------------------------------ | ------------------------------------------------------------------------------------------------ |
| [`src/pages/`](../src/pages/)                                | Astro 路由及静态端点；英文镜像位于 `en/`                                                         |
| [`src/components/`](../src/components/)                      | 共享页面、交互组件；列表页和语言路由复用此处实现                                                 |
| [`src/layouts/`](../src/layouts/)                            | 页面外壳、文章布局、SEO 元数据与运行时入口                                                       |
| [`src/scripts/`](../src/scripts/)                            | 需要打包的浏览器模块，例如主题、导航、评论懒加载                                                 |
| [`src/utils/`](../src/utils/)                                | 路径、语言、SEO、TOC、图片和构建辅助逻辑                                                         |
| [`src/i18n/`](../src/i18n/)、[`src/config/`](../src/config/) | 语言字典及功能配置；站点元数据在 [`src/config.ts`](../src/config.ts)                             |
| [`src/data/blog/`](../src/data/blog/)                        | 中文文章；英文文章位于 `en/`，集合 schema 在 [`src/content.config.ts`](../src/content.config.ts) |
| [`src/styles/`](../src/styles/)                              | Tailwind 入口、主题和组件样式                                                                    |
| [`public/`](../public/)、[`assets/fonts/`](../assets/fonts/) | 原样发布的静态资源、本地 OG 字体；构建处理的资源位于 `src/assets/`                               |
| [`scripts/`](../scripts/)                                    | 内容生成、构建后处理和维护命令                                                                   |
| [`tests/`](../tests/)                                        | Playwright 用户流程与 `unit/` 下的 Vitest 检查                                                   |

保持中英文路由薄而共享实现集中，避免修复一侧后另一侧漂移。优先沿用已有组件和工具；新共享代码使用 TypeScript，组件使用 PascalCase，辅助函数使用 camelCase，文章文件名使用 kebab-case。

## 内容到页面

1. `src/content.config.ts` 分别加载中文 `blog` 和英文 `blog-en` 集合，读取 `.md` / `.mdx` 并验证 frontmatter。
2. `src/utils/blog-locale.ts`、`postFilter.ts`、`getSortedPosts.ts` 等处理语言归属、发布状态和排序；路由交给共享页面组件或文章布局渲染。
3. 中文 URL 无语言前缀，英文 URL 以 `/en/` 开头，页面 URL 保持尾部 `/`。文章路径通过 `src/utils/getPath.ts` 生成，避免手工拼接。
4. 英文 `originalTitle` 与中文标题关联译文。构建映射服务于评论、SEO 等；文章切换直接查找非草稿译文，未独立检查发布时间。修改配对时同时关注 [语言切换](i18n-language-switcher.md) 与 [双语评论](bilingual-comment-system.md)。

## 页面导航与可访问性

文章列表与文章页的「上一篇 / 下一篇」共用 `getSortedPosts` 的倒序结果：上一篇指向更早的文章，下一篇指向更新的文章。`modDatetime` 参与排序，因此修改它也会改变这两个链接。

所有页面外壳的 `<main>` 必须带 `id="main-content" tabindex="-1"`，Header 的「跳至正文」才能把焦点移入正文；新增页面或布局时沿用该结构。文章与标签的 `view-transition-name` 由 [`toTransitionName`](../src/utils/toTransitionName.ts) 生成，分别使用内容 id 和 `tag-` 前缀；同一页面出现重复名称会让浏览器静默放弃整页转场。

## 构建与浏览器

[`astro.config.ts`](../astro.config.ts) 使用静态输出和 Vercel adapter。文章与站点 OG 路由在构建阶段生成图片，Pagefind 索引在 Astro 构建后写入 `.vercel/output/static/`。

[`Layout.astro`](../src/layouts/Layout.astro) 负责全站元数据和 ClientRouter。主题保留最小的首次绘制内联脚本，后续行为交给浏览器模块；修改交互时考虑首次加载和页面切换后的初始化。现有语言下拉框有就近放置的 `src/components/LanguageSwitcher/client.ts`，保留其组织方式；新增需要打包的浏览器模块放在 `src/scripts/`。

Mermaid 在 GitHub Actions 中构建为 SVG 图片；其他环境使用浏览器回退，详见 [渲染说明](mermaid-rendering.md)。Markdown 转换由构建配置和 `src/config/remark.ts` 管理，详见 [插件说明](remark-plugins.md)。

## 生成文件与输出

| 文件或目录                                    | 由谁产生                                 | 是否提交           |
| --------------------------------------------- | ---------------------------------------- | ------------------ |
| `src/utils/generated/bilingualMapping.ts`     | `scripts/auto-discover-bilingual.ts`     | 是，通过生成器更新 |
| `src/utils/generated/imageSizes.json`         | `scripts/fetch-image-sizes.ts`           | 是，通过生成器更新 |
| `src/utils/generated/twikooSRI.ts`            | `scripts/manage-twikoo-sri.ts`           | 是，通过生成器更新 |
| `.astro/`、`.vercel/`、`dist/`                | Astro、Vercel adapter、后处理和 Pagefind | 否                 |
| `tmp/`、`test-results/`、`playwright-report/` | OG 缓存、预览工具和测试                  | 否                 |

生成命令与副作用见 [开发与验证](development.md#生成器与维护工具)。修改源数据或生成器后重新生成，避免直接修补产物。

## 外部服务与响应边界

- 评论：[`Comment.astro`](../src/components/Comment.astro)、`src/scripts/comment-loader.ts` 与 `src/config/twikoo.ts` 管理客户端接入；服务端配置另有部署归属，见 [双语评论](bilingual-comment-system.md)。
- 统计：[`src/config/umami.ts`](../src/config/umami.ts) 定义追踪和阅读量端点；`ArticleViews.astro` 请求同源 `/api/article-views/`，由 Vercel 转发到外部 Umami 服务。
- 响应头：[`src/utils/http-headers.ts`](../src/utils/http-headers.ts) 是安全与发现头的共同来源，开发期由 [`src/middleware.ts`](../src/middleware.ts) 应用，部署产物由 [`scripts/apply-vercel-routes.ts`](../scripts/apply-vercel-routes.ts) 补齐。
- 路由与缓存：后处理还处理本地化 404、HTML/静态资源缓存及阅读量转发。修改这些行为应检查构建产物和 [部署验证边界](deployment.md#部署验证边界)，不能只依赖开发服务器。
