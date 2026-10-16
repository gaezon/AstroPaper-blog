# 文档索引

按任务进入对应文档，无需通读整套资料。环境与快速启动见 [README](../README.md)，文章作者从 [WRITING](../WRITING.md) 开始。

## 开发与维护

| 任务                           | 文档                              | 主要事实来源                                           |
| ------------------------------ | --------------------------------- | ------------------------------------------------------ |
| 定位模块、调整共享逻辑         | [架构与目录职责](architecture.md) | `src/`、`astro.config.ts`                              |
| 选择检查、运行生成器、维护缓存 | [开发与验证](development.md)      | `package.json`、`scripts/`、`tests/`                   |
| 修改 CI、Vercel 路由或准备部署 | [部署与交付](deployment.md)       | `.github/workflows/`、`scripts/apply-vercel-routes.ts` |
| 写文章、配对译文、预览图片     | [写作指南](../WRITING.md)         | `src/content.config.ts`、内容脚本                      |
| 报告漏洞                       | [安全政策](../SECURITY.md)        | 维护者约定                                             |

## 功能参考

| 改动范围                         | 文档                                    |
| -------------------------------- | --------------------------------------- |
| 语言按钮、文章配对、缺失译文回退 | [语言切换](i18n-language-switcher.md)   |
| 双语映射、共享评论路径、Twikoo   | [双语评论](bilingual-comment-system.md) |
| 图表构建、浏览器回退、主题       | [Mermaid 渲染](mermaid-rendering.md)    |
| Markdown 目录、折叠和提示块      | [Remark / Rehype](remark-plugins.md)    |

## 文档维护约定

入口文件负责导航，专题文档解释边界、命令和限制；代码与配置是实现事实的来源。行为变化时更新所属文档，其他入口保留链接，避免复制多份容易漂移的说明。`AGENTS.md` 保存简短的常驻约束，Copilot 指令只补充工具特有信息。

这套组织方式参考 OpenAI 的 [Rethinking skills and prompts for GPT-6 Astra](https://developers.openai.com/blog/rethinking-skills-and-prompts-for-gpt-6-astra)：资料按任务加载，规则描述适用边界，验证规模与改动相称。仓库当前没有受版本管理的项目 Skill；重复执行的专门流程确有需要时再增加。

历史问题草稿放在 `docs/history/`，不作为当前实现说明：[OG 缓存清理旧报告](history/og-cache-cleanup.md)。
