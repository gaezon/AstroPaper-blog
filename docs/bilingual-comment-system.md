# 双语评论映射指南

本项目通过构建期脚本自动建立中英文文章映射，用于统一评论路径与双语页面关联。

## 当前机制（推荐理解）

- 核心字段：`originalTitle`
  - 中文文章与英文文章使用同一个 `originalTitle` 值
  - 优先按 `originalTitle` 精确匹配
- 兜底策略：相似度匹配
  - 当仍有未被 `originalTitle` 成功配对的英文文章时，脚本会基于 slug/title 相似度为其寻找最佳中文候选
  - 默认阈值：`0.6`
- 产物文件：`src/utils/generated/bilingualMapping.ts`
  - `dynamicSlugMapping`: 英文 slug 到中文 slug
  - `unifiedCommentPaths`: 中英文文章到统一评论路径的关系
  - `mappingMetadata`: 生成统计信息

## 相关文件

- 生成脚本：`scripts/auto-discover-bilingual.ts`
- 生成命令：`pnpm generate:bilingual-mapping`
- 构建流程：`pnpm build` / `pnpm build:strict`（已自动包含映射生成）

## 使用方式

### 1) 维护 frontmatter

中文文章（`src/data/blog/`）：

```yaml
---
title: "中文文章标题"
originalTitle: "中文文章标题"
---
```

英文文章（`src/data/blog/en/`）：

```yaml
---
title: "English Article Title"
originalTitle: "中文文章标题"
---
```

### 2) 生成映射

```bash
pnpm generate:bilingual-mapping
```

### 3) 发布前检查

- 运行 `pnpm build:strict`
- 查看脚本输出中是否出现「低置信度匹配」

## 常见问题

### 匹配失败

- 检查中英文文章的 `originalTitle` 是否一致
- 确认英文文章不处于 `draft: true`
- 重新执行 `pnpm generate:bilingual-mapping`

### 出现低置信度匹配

- 优先补齐或修正 `originalTitle`
- 如确有必要，再调整 slug 以提高相似度可读性

## 维护建议

- 以 `originalTitle` 作为唯一人工维护入口，不手写映射文件
- 不要手动编辑 `src/utils/generated/bilingualMapping.ts`
- 新增双语文章后，养成执行 `pnpm generate:bilingual-mapping` 的习惯
