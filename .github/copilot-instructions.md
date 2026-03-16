# GitHub Copilot：仓库自定义指令（Repository Instructions）

你正在协助维护一个基于 **Astro 6 + TypeScript + TailwindCSS** 的双语博客站点（中文 `zh-CN` / English `en`），并使用 **Playwright** 做端到端测试。请在生成代码、修改建议、测试、以及文档/PR 文案时遵循以下约定。

## 总体原则

- **KISS & 可维护性优先**：优先最小改动与清晰可读，避免过度工程化。
- **事实为本**：不确定时先说明不确定并提出澄清问题；不要臆造项目结构或 API。
- **尽量复用现有模式**：先搜索并沿用仓库中的既有组件/工具/写法，再考虑引入新方案。
- **语言**：Copilot code review 评论请使用简体中文。

## 目录与模块约定

- 路由页面：`src/pages/`（页面级资源请就近放在同名目录下）。
- 可复用 UI：`src/components/`、`src/layouts/`。
- 全局样式与 Tailwind 工具：`src/styles/`。
- 内容与元数据：`src/content.config.ts`、`src/data/`、静态资源在 `public/`。
- i18n/OG 辅助脚本：`scripts/`。
- 自动生成内容：`src/utils/generated/`（除非任务明确要求，否则不要手改；应通过脚本生成）。
- 测试：`tests/`（Playwright），产物在 `test-results/`。
- 构建产物：`dist/`（不要在 PR 中手工编辑构建产物）。

## 包管理与常用命令（优先使用 pnpm）

- 开发：`pnpm dev`
- 构建：`pnpm build`
- 预览：`pnpm preview`
- 规范：`pnpm lint`、`pnpm format`、`pnpm format:check`
- E2E：`pnpm exec playwright test`（调试可加 `--headed`）
- SEO：`pnpm validate:meta`
- 双语映射：`pnpm generate:bilingual-mapping`
- 英文草稿：`pnpm i18n:scaffold-en`
- OG 预览：`pnpm og:preview`
- 如当前 shell 未自动切到 `.node-version` 指定的 Node `24.x`，先执行 `fnm use`

## 代码风格与约束

- 新增/重构优先用 **TypeScript**，共享工具放在 `src/utils/` 并保持类型严格。
- **Prettier + Astro/Tailwind 插件**：2 空格缩进、统一引号、尾逗号等遵循现有配置与文件风格。
- 命名：组件/布局用 **PascalCase**；函数/变量用 **camelCase**；slug/文件名用 **kebab-case**。
- Tailwind class 建议按 **layout → spacing → color** 分组；避免未使用的 class。

## 国际化（i18n）约定

- 英文路由统一加前缀：`/en/...`；中文路由不加前缀：`/...`。
- 双语文章通过 frontmatter 的 `originalTitle` 关联。
- Locale 相关组件需同时处理 `zh-CN` 与 `en`。
- 新增/修改双语内容后，记得更新映射（`pnpm generate:bilingual-mapping`）并检查 SEO 描述（`pnpm validate:meta`）。

## 测试与可访问性

- 修改导航、语言切换、TOC、Mermaid、OG 等关键链路时，优先补充/更新 `tests/` 中对应 Playwright 用例。
- 所有可交互元素应具备合适的 ARIA（语言切换、主题切换、TOC 键盘可用性等）。
- 需要时同时验证深色/浅色主题与中英文版本行为一致。

## 提交与 PR 习惯（如需生成建议）

- 遵循 Conventional Commits：`feat|fix|chore|docs`（可加 scope，如 `feat(toc): ...`）。
- PR 描述应包含：变更摘要、测试方式（含命令）、以及必要的截图/对比说明（仅当 UI 有意变更时）。
