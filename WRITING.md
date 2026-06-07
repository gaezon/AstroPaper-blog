# 写作指南（AstroPaper-blog）

这是一份面向日常写作的通俗指南，帮你用“中文为主、英文为辅（SEO）”的方式，高效发布与维护博文。

---

## 目录结构与命名

- 中文文章目录：`src/data/blog/`
- 英文文章目录：`src/data/blog/en/`
- 页面路由：文件名（不含扩展名）即为 slug，决定了 URL 路径；支持按需放入子目录。
  - 例如：`src/data/blog/why-switch-from-hapigo-to-raycast.md` → `/posts/why-switch-from-hapigo-to-raycast/`
  - 英文翻译：`src/data/blog/en/welcome-to-my-blog.md` → `/en/posts/welcome-to-my-blog/`

建议文件名使用小写英文、连字符分隔，避免空格与中文字符，便于分享与 SEO。

---

## Frontmatter 规范（中文）

在 Markdown 顶部使用 YAML Frontmatter 描述文章元信息。示例：

```yaml
---
author: "Gaazeon"
pubDatetime: 2025-03-01T10:00:00.000Z
modDatetime: 2025-03-05T12:00:00.000Z # 可选
title: "为什么我开始写博客"
featured: false
draft: false
# 标签按语言独立维护（中文写中文，英文写英文）
tags:
  - 博文
  - 工具
  - 思考
ogImage: 
  # 可选，远程或本地；为空时会走动态 OG（/posts/<slug>/index.png）
description: "简要描述 150–160 字内，便于 SEO 摘要。"
canonicalURL: # 可选
hideEditPost: false # 可选
timezone: Asia/Shanghai # 可选
locale: "zh-CN" # 默认
---
```

字段说明（常用）：
- `title`：标题；
- `description`：页面描述（150–160 字内）；
- `pubDatetime`/`modDatetime`：发布时间/最近修改时间；
- `tags`：按当前文章语言填写标签（中文文章用中文标签，英文文章用英文标签）；
- `draft`：草稿不发布；
- `featured`：是否在首页“精选”展示；
- `timezone`：影响页面显示的本地化日期。

---

## 正文写作建议

- 标题层级：`#` 开始，按层级递进（H1–H3 优先）。页面会自动生成目录（TOC）。
- 代码块：使用三反引号 ` ``` ` 包裹，并标注语言（如 `ts`/`bash`）。
- 图片：建议放在 `public/assets/<slug>/` 或复用远程图；Markdown 内用标准语法 `![alt](url)`，为图片加上描述有助于无障碍与 SEO。
- Mermaid：直接使用 ` ```mermaid ` 代码块。CI（GitHub Actions）会在构建时渲染为 SVG；本地开发环境通常保持代码块原样以便编辑与审阅。
- 折叠/TOC：本站已启用 `remark-toc` 与折叠处理，保持正常标题结构即可。
- Callout：支持 Obsidian 风格提示块，例如 `> [!NOTE]`、`> [!TIP]`、`> [!WARNING]`，适合放置补充说明、操作提示或风险提醒。

---

## 标签管理

- 每种语言独立维护标签：中文文章用中文标签（如 `美股`），英文文章用英文标签（如 `US Stocks`）。
- 标签会自动生成对应的标签页路由：
  - 中文：`/tags/<slugified-tag>/`
  - 英文：`/en/tags/<slugified-tag>/`
- 标签 slug 通过 `slugifyStr()` 自动生成，无需手动维护映射表。

---

## 英文站点（SEO）工作流

目标：中文为主、英文为辅。英文通过翻译提升 SEO 覆盖，但**不改变**文章归属（源始终是中文）。

1) 写完中文后，生成英文草稿
- 命令：`pnpm i18n:scaffold-en`
- 作用：在 `src/data/blog/en/` 下为尚无对应英文的中文文章创建一份**英文草稿**，自动填入：
  - `locale: "en"`, `draft: true`, `originalTitle: "<中文原文标题>"`
  - `title/description` 使用 `TODO: Translate — ...` 占位
  - 正文首行添加翻译提示注释

2) 完善英文草稿
- 将 `title/description/正文` 翻译成英文；
- 保持 `originalTitle` 与中文 `title` 一致（用于语言切换互链配对）；
- 翻译完成后将 `draft: true` 删除或置为 `false`；
- 保存后英文页将出现在 `/en/posts/.../` 并在中文→英文切换时自动对上对应译文。

3) 文章详情的语言切换
- 站点已在文章页头接入“互链覆盖”逻辑：
  - 中文 → 英文：若找到 `originalTitle` 匹配的英文文章，即直达对应 `/en/posts/.../`；否则回落 `/en/posts/` 列表。
  - 英文 → 中文：反查中文 `title`，能匹配则直达 `/posts/.../`；否则回落 `/posts/` 列表。

> 可选增强：未来可引入 `translationKey`（稳定键）避免标题变更导致配对失败。当前方案 `originalTitle` 已能满足日常需求。

---

## 本地预览与发布

- 开发预览：`pnpm dev` → http://localhost:4321/
- 构建发布：`pnpm build`
  - 自动复制 Mermaid、生成静态站点与 Pagefind 索引、拷贝搜索前端资源。
- 代码质量：
  - `pnpm format` / `pnpm format:check`
  - `pnpm lint`
  - `pnpm validate:meta`（可选，校验描述长度等）

---

## 常见问题（FAQ）

- 英文页面 404？
  - 确认英文草稿是否已去掉 `draft: true`；构建后再访问。
- 文章切换语言跳到列表页？
  - 通常是英文文章缺失或 `originalTitle` 未与中文标题匹配；检查英文 frontmatter。
- 新标签在英文站点不规范或不出现？
  - 英文文章需单独维护英文标签，标签 slug 会通过 `slugifyStr()` 自动生成。
- 日期显示不符合预期？
  - 可在文章 frontmatter 填写 `timezone`（如 `Asia/Shanghai`）。
- OG 封面图怎么来？
  - 未手动提供 `ogImage` 时，构建会为每篇文章生成动态 OG（`/posts/<slug>/index.png`；英文同理）。

---

## 术语与用词

- 导航中的“博文”指文章列表（已替代“博客”以避免歧义）。
- 标签尽量简洁、可检索；英文 slug 更应短小清晰。

---

## 附录：英文 Frontmatter（示例）

```yaml
---
author: "Gaazeon"
pubDatetime: 2025-03-01T10:00:00.000Z
modDatetime: 2025-03-05T12:00:00.000Z
# 建议翻译后的英文标题
title: "Why I Started Blogging"
featured: false
# 翻译完成后移除草稿标记
# draft: true 
# 英文文章请填写英文标签（与中文标签独立维护）
tags:
  - blog
  - introduction
  - english
# 英文描述（150–160 字内）
description: "A concise English description for SEO…"
locale: "en"
# 与中文标题匹配；用于中英互链
originalTitle: "为什么我开始写博客"
---
```

---

如需我把现有中文标签批量生成映射草案，或为文章增加 `translationKey` 稳定键，请告诉我，我可以一次性安排。祝写作顺利！
