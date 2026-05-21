---
name: "🐞 Bug report"
about: Report a bug or unexpected behavior in AstroPaper
title: "[BUG]: OG 图像本地硬盘缓存缺乏自动清理/失效机制（Disk Cache Bloat）"
labels: bug
assignees: ""
---

### **Describe the bug**

在生成博文和站点的 OG 图像时，系统通过计算「模版指纹 (Template Fingerprint) + 页面元数据」生成 SHA-256 哈希值来命名本地 PNG 缓存文件（存储在 `tmp/og-image-cache/` 目录下）。

然而，当开发者修改了 `post.js`、`site.js` 或 `shared.js` 等排版文件时：

1. 系统重新计算得出了一个**全新的模版指纹**。
2. 随后生成的 OG 图片将使用新指纹下的全新哈希名称进行存储。
3. 但系统只管「不存在则写入新文件」，完全**没有自动清理历史版本模版生成的旧缓存文件**的机制。这会导致旧的缓存文件无限期堆积在 `tmp/og-image-cache/` 下，造成本地开发空间无谓膨胀。

---

### **To Reproduce**

在本地环境复现该行为：

1. 观察当前的 `tmp/og-image-cache/` 目录，记录当前缓存文件数量。
2. 修改任意 OG 模版文件（例如 `src/utils/og-templates/post.js` 中的某行样式）。
3. 运行项目构建或预览脚本重新渲染 OG 图片：
   ```bash
   pnpm run og:preview "测试博文" zh-CN gaazeon
   ```
4. 再次查看 `tmp/og-image-cache/` 目录，可以发现新增了对应新模版的缓存文件，但**之前的旧版本模版生成的哈希图片文件依旧存在于目录中**，且永远不会被系统再次匹配和调用。

---

### **Expected behavior**

期望在模版文件内容改变、模版指纹失效时，系统应具备缓存逐出/清理（Cache Eviction）逻辑：

- **自动检测与清理**：在 `generateOgImages.ts` 计算出新的 template fingerprint 时，如果检测到本地已有缓存不匹配最新指纹，能够自动或者按配置彻底清空 `tmp/og-image-cache/` 下的冗余缓存文件。
- 或者，在 `package.json` 提供快捷的清理指令，用于一键重置本地构建缓存。

---

### **Suggested Solutions**

1. **代码级别自动清理（推荐）**：
   在 `src/utils/generateOgImages.ts` 的加载初始化阶段，可以在检测到最新 fingerprint 后，对比是否发生指纹漂移。若是，则直接调用 `fs.rm(DISK_CACHE_DIR, { recursive: true })` 将历史缓存一并清空，重新建空目录写入。
2. **构建脚本补充**：
   在 `pnpm run build` 和 `pnpm run dev` 启动链条中，加入对 `tmp/og-image-cache` 目录的清理动作。
