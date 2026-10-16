# 写作指南

日常写作从这里开始；环境安装和命令总览见 [README](README.md)，功能实现见 [文档索引](docs/README.md)。本文以中文原文、英文译文的工作流为主，字段定义以 [内容集合 schema](src/content.config.ts) 为准。

## 新建一篇文章

在 `src/data/blog/` 新建 `.md` 或 `.mdx` 文件。新文件建议用小写英文和连字符，例如 `my-first-post.md`，对应 `/posts/my-first-post/`。英文内容放在 `src/data/blog/en/`，对应 `/en/posts/my-first-post/`。

默认由文件名生成 slug，也可通过 frontmatter 的 `slug` 指定。当前文章模板生成 OG 元信息和译文链接时，部分调用未传入自定义 slug，可能指向错误地址；新文章优先使用文件名默认值，已有自定义 slug 的文章需核对实际输出。已发布文章更名或调整 slug 会改变 URL，应先检查已有链接。

当前双语映射生成器只扫描两个语言目录的直接子文件；需要双语互链的文章保持在这两层目录中。

先填写元信息，再写正文：

```yaml
---
title: "为什么我开始写博客"
pubDatetime: 2026-10-16T10:00:00+08:00
description: "用一段准确、自然的摘要说明文章主题，以及读者能从中获得什么。"
tags:
  - 博文
  - 思考
draft: true
---
```

页面会用 `title` 生成 H1；正文从 `##` 主章节开始，子章节用 `###`。当前侧边栏和移动端目录只收录 H2，无需手写目录列表。

运行 `pnpm dev` 后打开 <http://localhost:4321/>。`draft: true` 的文章在开发环境也会被排除；要预览文章页，可临时改为 `false`，提交前按实际发布意图设置。

## 元信息参考

| 字段            | 用途                                                                              |
| --------------- | --------------------------------------------------------------------------------- |
| `title`         | 必填。文章标题；中文标题也是英文译文配对的依据。                                  |
| `pubDatetime`   | 必填。使用带时区的 ISO 日期，`Z` 表示 UTC，`+08:00` 表示北京时间。                |
| `description`   | 必填。页面和分享摘要，建议写成单行字符串。                                        |
| `tags`          | 建议显式填写。中文文章使用中文标签，英文文章使用英文标签；省略时默认为 `others`。 |
| `author`        | 可选，默认使用站点作者。                                                          |
| `modDatetime`   | 可选，文章更新日期。晚于发布时间时页面显示「更新于」，也影响列表排序。            |
| `draft`         | 可选，`true` 时不发布。删除或设为 `false` 后进入发布范围。                        |
| `featured`      | 可选，控制首页精选展示。                                                          |
| `slug`          | 可选，自定义 URL 中的文章段；发布后保持稳定。                                     |
| `locale`        | 按内容集合默认填写：中文为 `zh-CN`，英文为 `en`；文件应放在对应语言目录。         |
| `originalTitle` | 英文译文填写中文原文的完整 `title`，包括标点和空格。                              |
| `timezone`      | 可选，覆盖页面日期显示时区，默认是站点配置的 `Asia/Shanghai`。                    |
| `ogImage`       | 可选，指定分享图，如 `/assets/my-first-post/cover.png`；省略时使用动态 OG。       |
| `canonicalURL`  | 可选，文章的规范 URL；通常省略，由当前文章地址生成。                              |
| `hideEditPost`  | 可选，`true` 时隐藏文章的编辑链接。                                               |

不要保留没有值的可选 YAML 字段。`timezone` 控制显示，不会替代日期值中的时区。

`pnpm validate:meta` 会扫描文章描述，当前长度范围为 120–160 字符、建议约 155 字符；超出范围会报告警告并返回非零退出码。它是项目的摘要检查规则，写作时仍应优先保证内容准确。脚本扫描全部文章，结果中可能包含未改动的内容。

生产构建会根据 `pubDatetime` 筛选文章，目前允许提前 15 分钟进入发布范围。站点为静态输出，未来文章是否上线取决于后续构建；设置日期本身不会触发部署。

## 正文、图片和图表

- 代码块标注语言，例如 `ts`、`bash`；按章节层级组织内容，避免重复文章标题。
- 图片可放在 `public/assets/<slug>/`，正文写 `![说明文字](/assets/<slug>/image.png)`；远程图片使用完整 URL，并提供能说明内容的替代文本。
- Mermaid 使用 `mermaid` 代码块。GitHub Actions 中构建为 SVG；普通本地预览由客户端渲染，主题变量与构建共用。复杂图表应检查亮暗主题和图表的可读性，详见 [Mermaid 渲染](docs/mermaid-rendering.md)。
- 提示块支持 Obsidian 风格的 `NOTE`、`TIP`、`WARNING`，详见 [Markdown 插件](docs/remark-plugins.md)。

```markdown
> [!TIP]
> 在这里写补充建议。
```

标签按语言独立维护，会自动生成 `/tags/<标签 slug>/` 和 `/en/tags/<标签 slug>/` 页面。标签 slug 由代码生成，无需手写映射表；同一语言中尽量复用已有标签，避免近义标签分散内容。

## 添加英文译文

只翻译一篇时，可直接在 `src/data/blog/en/` 新建文件，并使用下面的元信息。中文标题发生变化时，同步修改对应译文的 `originalTitle`。

```yaml
---
title: "Why I Started Blogging"
pubDatetime: 2026-10-16T10:00:00+08:00
description: "Describe the article in natural English, including its subject and the practical value for readers."
tags:
  - blog
  - writing
locale: "en"
originalTitle: "为什么我开始写博客"
draft: true
---
```

需要批量准备译文时，运行 `pnpm i18n:scaffold-en`。它按文件名为缺少目标文件的中文文章创建英文草稿，并复制原文正文，不会自动翻译：

- 生成 `locale: en`、`draft: true` 和 `originalTitle`，标题、描述及正文带翻译提示。
- 扫描中文目录及其一层子目录，把结果写到 `en/` 根目录；不是按当前文章或配对关系单独生成。
- 默认保留已存在的同名英文文件。脚本的 `--force` 参数会覆盖它们，只在明确需要重新生成时使用。

翻译标题、摘要、正文和标签后，检查复制过来的 `ogImage`、`canonicalURL` 等字段是否适合英文页面。英文译文通常不需要设置 `canonicalURL`，避免沿用指向中文页的规范地址。确认完成再将 `draft` 改为 `false`。

修改配对文章后运行 `pnpm generate:bilingual-mapping`，并查看生成结果的差异；不要手改 [生成的双语映射](src/utils/generated/bilingualMapping.ts)。构建也会自动执行这一步。

文章页语言切换依赖 `originalTitle` 与中文 `title` 的精确匹配。中文与英文标题可以不同，文件名也不必相同；找不到匹配的非草稿文章时会进入「暂无译文」页面。当前译文查找仅排除草稿，不检查发布时间，因此未来译文尚未生成文章页时也可能被链接；安排延后发布的译文时，应保持草稿状态直到准备上线。双语评论、阅读量路径和 sitemap 也使用生成映射，详见 [语言切换](docs/i18n-language-switcher.md) 和 [双语评论](docs/bilingual-comment-system.md)。

## 预览与交付

写作过程中用 `pnpm dev` 检查文章排版、图片和日期；涉及翻译时，从两种语言的文章页分别验证切换。发布前运行 `pnpm build:strict`，检查内容 schema、类型和静态产物。

构建会更新图片尺寸缓存和双语映射，生成 Astro 静态页面、Vercel 路由配置及 Pagefind 搜索索引。检查这些生成文件的差异，只保留与本次内容相关的变化。构建完成不等于已部署，发布流程见 [部署指南](docs/deployment.md)。

当前开启动态 OG，未填写 `ogImage` 的文章会生成分享图；例如默认 slug 的中文文章对应 `/posts/my-first-post/index.png`，英文对应 `/en/posts/my-first-post/index.png`。有自定义 slug、长标题或自选封面时，检查文章输出的 `og:image` 和目标图片。只想预览标题排版时，可运行：

```sh
pnpm og:preview "文章标题" zh-CN
pnpm og:preview "Article title" en
```

预览图片写到 `tmp/og-preview-<locale>.png`，用于检查模板排版；最终分享地址以文章构建结果为准。

| 现象                     | 优先检查                                                                   |
| ------------------------ | -------------------------------------------------------------------------- |
| 页面没有生成             | `draft`、`pubDatetime`，以及严格构建的错误信息。                           |
| 切换语言出现「暂无译文」 | 两篇文章的发布状态、`originalTitle` 是否精确匹配，以及映射是否已重新生成。 |
| 英文标签不符合预期       | 英文文件是否仍保留中文标签，是否与现有英文标签重复或近义。                 |
| 日期不符合预期           | 日期值的时区、`modDatetime` 是否晚于发布时间，以及 `timezone`。            |
| 分享图不正确             | `ogImage`、文章输出的 `og:image`，以及该 URL 是否存在；不要只看模板预览。  |
