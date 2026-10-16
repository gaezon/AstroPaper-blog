# 开发与验证

环境安装与常用命令见 [README](../README.md)。[`package.json`](../package.json) 定义脚本，Node/pnpm 约束同时由 `.node-version` 和 [`scripts/check-toolchain.mjs`](../scripts/check-toolchain.mjs) 维护。

## 验证选择

按改动选择最小且有意义的检查，出现失败或跨模块影响时再扩大范围。无需为修正文档运行完整应用测试。

| 改动                              | 合适的本地检查                                                        |
| --------------------------------- | --------------------------------------------------------------------- |
| 开发文档、协作指令或模板          | 检查链接、锚点和源码引用；对修改文件运行 Prettier；`git diff --check` |
| 独立工具函数                      | 对应 `tests/unit/` 的 Vitest 用例；必要时 `pnpm lint`                 |
| 导航、主题、语言、TOC、评论等交互 | 对应 Playwright 流程，覆盖中英文、首次加载与页面切换                  |
| 文章内容、schema、图片或构建配置  | `pnpm build:strict`；配对变化另检查双语导航                           |
| sitemap 或 hreflang               | 严格构建后运行 sitemap 专用测试，复用该构建                           |
| Vercel 路由、响应头、缓存         | 对应单元测试、严格构建；部署验证另见 [部署指南](deployment.md)        |

局部命令示例：

```bash
pnpm exec vitest run tests/unit/url-sanitization.spec.ts
pnpm exec playwright test tests/language-switcher.spec.ts
pnpm build:strict
pnpm exec playwright test --config=playwright.sitemap.config.ts
```

`pnpm test:unit` 运行全部单元测试。`pnpm test:sitemap` 会先执行一次 `pnpm build`；已有新鲜构建时使用上面的专用 Playwright 命令，避免重复构建。

[`playwright.config.ts`](../playwright.config.ts) 自动启动本地开发服务器，本地可以复用已有服务器，CI 使用系统 Chrome。首次在本机运行需要可用的 Playwright Chromium，可用 `pnpm exec playwright install chromium` 安装。[`playwright.sitemap.config.ts`](../playwright.sitemap.config.ts) 只读取 `.vercel/output/static/sitemap-0.xml`，不启动服务器；本地默认检查构建是否在 30 分钟内生成。

浏览器检查中的接口 mock 只能证明前端行为；评论、CDN 和统计后端的真实可用性需要单独观察。CI 的完整检查顺序见 [部署指南](deployment.md#工作流职责)。

## 格式与修改范围

`pnpm format:check` 使用仓库的 [Prettier 配置](../.prettierrc.mjs) 和 [忽略规则](../.prettierignore)。检查指定文档可使用 `pnpm exec prettier --check <files>`；根目录部分指令文件默认被忽略，显式检查它们时加 `--ignore-path /dev/null`。`pnpm format` 会格式化整个允许范围，局部任务优先只格式化修改文件。

## 生成器与维护工具

| 命令                                   | 输入与输出                                                   | 使用边界                                                                      |
| -------------------------------------- | ------------------------------------------------------------ | ----------------------------------------------------------------------------- |
| `pnpm generate:bilingual-mapping`      | 文章 frontmatter → `src/utils/generated/bilingualMapping.ts` | 配对变更后运行，详见 [双语评论](bilingual-comment-system.md)                  |
| `pnpm fetch:image-sizes`               | 文章图片 URL → `src/utils/generated/imageSizes.json`         | 本地可能访问缺失尺寸的远程图片；CI 禁止该任务发起网络请求，缺缓存会失败       |
| `pnpm twikoo:sri:check`                | CDN 脚本与 `twikooSRI.ts` 比较                               | 访问配置的 CDN，不写生成文件；网络失败与哈希不符是不同问题                    |
| `pnpm twikoo:sri:update`               | 配置的 Twikoo 版本 → `src/utils/generated/twikooSRI.ts`      | 访问 CDN 并更新哈希，版本来源是 `src/config/twikoo.ts`                        |
| `pnpm i18n:scaffold-en`                | 批量中文文章 → 英文草稿                                      | 会写入内容文件，`--force` 会覆盖已有英文稿；按 [写作指南](../WRITING.md) 使用 |
| `pnpm validate:meta`                   | 检查文章 description                                         | 检查长度与缺失等问题；不能代替 frontmatter 构建校验                           |
| `pnpm og:preview "标题" zh-CN Gaazeon` | OG 模板 → `tmp/og-preview-zh-CN.png`                         | 本地图片预览，字体优先读本地，缺失时可能访问网络                              |
| `pnpm clean:og`                        | 删除 OG 磁盘缓存目录                                         | 默认 `tmp/og-image-cache/`；自定义 `OG_IMAGE_CACHE_DIR` 必须通过路径校验      |

三个 `src/utils/generated/` 文件均受版本管理，相关变更应审查并提交；构建、预览、缓存与测试产物不提交。

## 构建与缓存

`pnpm build:strict` 按顺序执行图片尺寸缓存、双语映射、`astro check`、Astro 构建、Vercel 路由补丁和 Pagefind 索引。`pnpm build` 只省去 `astro check`，两者都可能更新受版本管理的生成文件。本地构建可能访问远程图片或缺失字体，不应笼统视为纯离线检查。

OG 磁盘缓存由 [`src/utils/generateOgImages.ts`](../src/utils/generateOgImages.ts) 管理。模板指纹变化时按 `.fingerprint` 自动清理；手动排查才需要 `pnpm clean:og`，无需每次构建前清空。`og:preview` 直接渲染模板，不经过这层磁盘缓存。历史缺陷草稿已 [归档](history/og-cache-cleanup.md)。

本地构建与检查不发布站点。`smoke:article-views` 则需要显式 `PREVIEW_URL`，会读取部署后的接口；使用方式和证据限制见 [部署指南](deployment.md#部署验证边界)。
