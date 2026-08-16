# GitHub Copilot：仓库自定义指令

你正在协助维护一个基于 **Astro 7 + TypeScript + Tailwind CSS** 的双语博客站点。请优先遵循仓库现有模式，并以最小改动完成任务。

## 先看哪里

- `README.md`：环境要求与命令
- `AGENTS.md`：仓库约定、架构边界、测试预期
- `WRITING.md`：文章写作与 frontmatter 规范

## 生成建议时的核心约束

- 先搜索并复用现有组件、工具函数和模式，避免引入无必要的新抽象
- 新增或重构优先使用 TypeScript，并保持共享工具类型严格
- 路由、多语言、主题、TOC、Mermaid、OG 这类跨页面能力，优先沿用已有实现方式
- `src/utils/generated/` 属于自动生成内容；除非任务明确要求，否则不要手改
- 构建与校验使用 pnpm；如当前 shell 未切到 Node `24.x`，先执行 `fnm use`

## 需要特别注意的仓库事实

- 中文路由无前缀，英文路由统一使用 `/en/`
- 双语文章通过 frontmatter 的 `originalTitle` 关联
- 浏览器端运行时代码优先放在 `src/scripts/`
- 修改导航、i18n、Mermaid、OG、分页等关键链路时，应同步考虑测试与可访问性影响

## 输出偏好

- 保持 KISS，优先可维护性
- 不确定时先基于仓库事实说明风险，不要臆造结构或 API
- Copilot code review 评论请使用简体中文
