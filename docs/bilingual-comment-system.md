# 双语评论系统自动映射指南

本博客实现了智能的双语评论自动映射系统，支持中英文文章评论的自动同步。

## 功能特性

### 阶段一：基于 originalTitle 的自动映射

- 通过 `originalTitle` 字段建立中英文文章关联
- 零配置，无需手动维护映射表
- 向后兼容现有文章

### 阶段二：构建时智能发现

- 自动扫描和分析双语文章
- 基于文件名和标题相似度智能匹配
- 生成动态映射表，提供匹配置信度

## 使用方法

### 新建双语文章

1. **中文文章**（`src/data/blog/`）：

   ```yaml
   ---
   title: "中文文章标题"
   originalTitle: "中文文章标题" # 重要：用于双语关联
   ---
   ```

2. **英文文章**（`src/data/blog/en/`）：
   ```yaml
   ---
   title: "English Article Title"
   originalTitle: "中文文章标题" # 与中文文章保持一致
   ---
   ```

### 自动生成映射

```bash
# 手动触发映射生成
pnpm run generate:bilingual-mapping

# 完整构建（自动包含映射生成）
pnpm run build
```

## 技术实现

### 映射生成流程

1. **originalTitle 匹配**（优先级：高）
   - 通过 `originalTitle` 字段精确匹配
   - 置信度：1.0

2. **相似度匹配**（优先级：中）
   - 基于 slug 和标题相似度
   - 综合评分算法（slug 70% + 标题 30%）
   - 置信度阈值：0.6

### 输出文件

- **动态映射表**：`src/utils/generated/bilingualMapping.ts`
- **包含内容**：
  - `dynamicSlugMapping`: 英文 slug 到中文 slug 的映射
  - `unifiedCommentPaths`: 统一评论路径信息
  - `mappingMetadata`: 映射统计信息

### 评论路径生成规则

```typescript
// 阶段二：使用动态生成的统一路径
if (unifiedPaths && post.data.originalTitle) {
  const unifiedInfo = unifiedPaths[post.data.originalTitle];
  return unifiedInfo?.unifiedCommentPath;
}

// 阶段一：基于 originalTitle 生成路径
if (post.data.originalTitle) {
  return `/comments/${slugify(originalTitle)}/`;
}

// 兜底策略
return `/comments/${slugify(title || id)}/`;
```

## 匹配报告解读

运行 `pnpm run generate:bilingual-mapping` 后的输出示例：

```
🔍 开始自动发现双语文章配对...
📚 发现 9 篇中文文章，10 篇英文文章
✅ 通过 originalTitle 匹配 7 对文章
🔍 剩余 3 篇英文文章待匹配
🎯 通过相似度匹配 1 对文章

📊 匹配报告:
总共匹配 8 对文章
置信度分布:
  1: 7 对      # originalTitle 匹配
  0.7: 1 对    # 相似度匹配

⚠️ 低置信度匹配（需要人工检查）:
  article-zh <-> article-en (0.74)
```

## 维护指南

### 新文章最佳实践

1. **确保 originalTitle 一致**：中英文版本使用相同的 `originalTitle`
2. **文件命名规范**：建议使用描述性的 slug
3. **运行构建验证**：发布前运行完整构建确保映射正确

### 故障排除

#### 匹配失败

- 检查 `originalTitle` 字段是否一致
- 验证文件名是否包含特殊字符
- 运行 `pnpm run generate:bilingual-mapping` 查看详细报告

#### 低置信度匹配

- 检查文章 slug 和标题是否合理对应
- 可能需要手动调整 `originalTitle`
- 考虑文件重命名以提高相似度

### 向后兼容

- 旧的 `slugMapping.ts` 已移除，不再需要手动维护映射
- 现有文章通过 `originalTitle` 与构建期的动态映射自动兼容
- 如需修复历史文章的关联，请统一 `originalTitle` 字段后重新生成映射

## 开发者指南

### 扩展匹配算法

在 `scripts/auto-discover-bilingual.js` 中：

```javascript
// 调整相似度权重
const combinedScore = slugSimilarity * 0.7 + titleSimilarity * 0.3;

// 修改置信度阈值
if (combinedScore > bestScore && combinedScore > 0.6) {
  // 匹配逻辑
}
```

### 自定义映射规则

可以添加额外的匹配策略：

- 基于发布时间匹配
- 基于标签匹配
- 基于内容相似度匹配

## 性能影响

- **构建时**：增加约 1-2 秒映射生成时间
- **运行时**：无额外性能开销
- **存储**：动态映射文件约 2-3KB

## 版本历史

### 2025-01-10

- 移除历史遗留的 `slugMapping.ts`，不再依赖手工维护的 slug 对应表
- 采用 `originalTitle` + 构建期 `auto-discover-bilingual` 输出的映射作为唯一来源
- 更新 Comment 组件逻辑及相关文档，确保新老文章自动兼容
