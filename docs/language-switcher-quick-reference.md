# 🚀 语言切换器快速参考

## 当前实现

✅ **使用变体**: `compact` (紧凑模式)  
✅ **位置**: Header 导航栏  
✅ **SEO**: 完全优化  
✅ **移动端**: 完美适配  

## 三种变体一句话总结

| 变体 | 一句话描述 | 使用代码 |
|------|-----------|---------|
| 🔽 **Dropdown** | 专业下拉菜单，适合多语言 | `variant="dropdown"` |
| ⚡ **Compact** | 极简紧凑，导航栏首选 | `variant="compact"` |
| 🔘 **Toggle** | 直观按钮，双语切换 | `variant="toggle"` |

## 快速切换

### 方法 1: 修改 Header.astro
```astro
<!-- 文件: src/components/Header.astro -->
<!-- 第 154 行左右 -->

<!-- 改为下拉菜单 -->
<LanguageSwitcher variant="dropdown" override={switchOverride} />

<!-- 改为切换按钮 -->
<LanguageSwitcher variant="toggle" override={switchOverride} />

<!-- 改回紧凑模式 (当前) -->
<LanguageSwitcher variant="compact" override={switchOverride} />
```

### 方法 2: 在其他位置使用
```astro
<!-- Footer.astro -->
<LanguageSwitcher variant="dropdown" />

<!-- Sidebar.astro -->
<LanguageSwitcher variant="toggle" />

<!-- 任意页面 -->
<LanguageSwitcher variant="compact" />
```

## 关键特性

### ✅ SEO 优化
- 真实的 `<a>` 链接（非 JavaScript）
- 正确的 `hreflang` 属性
- 符合 W3C 标准

### ✅ 用户体验
- 🎨 现代扁平化设计
- 📱 移动端优化
- ⌨️ 键盘导航 (ESC 关闭)
- ♿ 无障碍支持

### ✅ 性能
- ⚡ 零外部依赖
- 📦 极小体积 (~4KB total)
- 🚀 快速渲染 (<50ms)

## 视觉预览

### Compact (当前使用)
```
[🌐 中 / EN]
```
- 最小空间
- 地球图标 + 语言代码
- 当前语言蓝色高亮

### Dropdown
```
[🌐 简体中文 ▼] → 点击 → [简体中文 ✓]
                           [English   ]
```
- 优雅下拉
- 完整语言名
- 勾选标记

### Toggle
```
[中文] [EN]
 蓝色  灰色
```
- 独立按钮
- 清晰状态
- 直观切换

## 常见问题

### Q: 如何添加新语言？
A: 在 `src/i18n/config.ts` 中添加语言配置，更新 `getShortLabel` 函数。

### Q: 如何自定义样式？
A: 添加自定义类名：
```astro
<LanguageSwitcher variant="compact" class="my-custom-class" />
```

### Q: 是否支持深色模式？
A: ✅ 自动适配，使用主题的 CSS 变量。

### Q: 移动端表现如何？
A: ✅ 完美优化，compact 模式专为移动端设计。

### Q: 会影响 SEO 吗？
A: ✅ 完全不会，反而优化了 SEO（使用标准 HTML 链接）。

## 技术支持

- 📖 完整文档: `/LANGUAGE_SWITCHER.md`
- 🔍 变体对比: `/docs/language-switcher-comparison.md`
- 📊 优化总结: `/docs/i18n-switcher-optimization-summary.md`

## 更新日志

**v1.0.0** (2025-10-05)
- ✨ 新增三种显示变体
- 🎨 重新设计视觉效果
- ♿ 增强无障碍支持
- 📱 优化移动端体验
- ⚡ 性能优化

---

💡 **提示**: 当前使用的 `compact` 模式在导航栏中效果最佳，如需在其他位置使用，可以考虑 `dropdown` 或 `toggle` 变体。
