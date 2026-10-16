# 双语文章映射与评论路径

维护中英文文章配对、共享评论或排查译文链接时阅读本文。文章 frontmatter 的完整规范见 [WRITING.md](../WRITING.md)，语言切换交互见 [语言切换器](i18n-language-switcher.md)。

## 配对与评论如何关联

英文文章的 `originalTitle` 应精确等于中文原文的 `title`。中文文章无需为此重复填写 `originalTitle`：

```yaml
# src/data/blog/example.md
title: "中文原文标题"
```

```yaml
# src/data/blog/en/example.md
title: "English article title"
originalTitle: "中文原文标题"
```

当前有两条独立的处理链：

| 用途         | 来源与行为                                                                                                                  |
| ------------ | --------------------------------------------------------------------------------------------------------------------------- |
| 构建期映射   | [auto-discover-bilingual.ts](../scripts/auto-discover-bilingual.ts) 优先按 `originalTitle` 匹配，再以 slug/title 相似度兜底 |
| 文章语言切换 | [PostDetails.astro](../src/layouts/PostDetails.astro) 直接查找非草稿文章，使用 `en.originalTitle === zh.title` 生成目标链接 |

因此，相似度配对成功不能证明文章语言切换正确。页面查找只过滤 `draft`，不单独检查 `pubDatetime`；维护内容时使用明确的 `originalTitle`，并确认译文目标路由实际可用。

生成器扫描 `src/data/blog/` 与 `src/data/blog/en/` 的直接 `.md`、`.mdx` 文件，忽略以下划线开头的文件；当前不会过滤 `draft`。相似度得分为 slug 的 70% 加标题的 30%，须大于 `0.6` 才匹配。得分低于 `0.8` 的结果会在普通本地运行中提示人工检查；CI / production 模式会抑制这些日志。

## 生成产物与兼容路径

[bilingualMapping.ts](../src/utils/generated/bilingualMapping.ts) 由脚本生成，包含：

- `dynamicSlugMapping`：英文 slug 到中文 slug。
- `unifiedCommentPaths`：配对页面路径、共享评论路径、匹配类型与置信度。
- `mappingMetadata`：生成时间与配对统计。

不要手工修改产物。修改文章标题、slug 或配对逻辑后运行：

```bash
pnpm generate:bilingual-mapping
```

`pnpm build` 与 `pnpm build:strict` 已包含此步骤。审阅生成差异时，确认配对、大小写和尾部斜杠符合现有页面路径。

[Comment.astro](../src/components/Comment.astro) 为兼容历史评论，优先使用映射中的中文文章路径 `zhPath`，其次为 `enPath`，最后才使用 `unifiedCommentPath`。未命中映射时，组件按 `originalTitle`，或标题 / 内容 ID 生成 `/comments/<slug>/`。已有评论的文章改名或改 slug 时，需要核对最终 `data-comment-path`，避免把评论指向新的讨论串。

同一映射还被 [astro.config.ts](../astro.config.ts)、[Layout.astro](../src/layouts/Layout.astro) 和 [article-view-paths.ts](../src/utils/article-view-paths.ts) 用于站点地图、页面关联及浏览量路径归并，变更时应检查这些使用方。

## 评论加载与验证

[Comment.astro](../src/components/Comment.astro) 输出评论路径与本地化文案；[comment-loader.ts](../src/scripts/comment-loader.ts) 在点击或滚动接近评论区时加载 Twikoo，并处理页面切换后的初始化与清理。前端资源版本位于 [twikoo.ts](../src/config/twikoo.ts)，SRI 由 [manage-twikoo-sri.ts](../scripts/manage-twikoo-sri.ts) 维护。后端服务地址由加载器指定，其部署和管理配置不由本仓库的前端构建维护。

按改动选择检查：

| 改动                     | 检查                                                                                                                 |
| ------------------------ | -------------------------------------------------------------------------------------------------------------------- |
| 内容配对、slug、生成逻辑 | 重新生成并审阅映射；运行 `pnpm build:strict`；检查对应中英文文章的译文链接和 `data-comment-path`                     |
| 映射路径规范             | `pnpm test:unit tests/unit/bilingual-mapping-locale.spec.ts`，此测试检查路径与 locale 约束，不验证每对文章的语义关系 |
| 评论加载或文案           | `pnpm exec playwright test tests/comment-lazy-load.spec.ts`                                                          |
| 文章语言切换             | 参考[语言切换器的检查范围](i18n-language-switcher.md#检查范围)                                                       |

浏览器评论测试使用受控的 Twikoo 响应，不能证明线上后端、历史评论数据或真实评论提交正常。仅文档修改时检查链接与 `git diff --check` 即可。
