# i18n 语言切换器与移动端指引

## 概览

- 当前语言切换器由以下文件组成：
  - `src/components/LanguageSwitcher.astro` - 主入口组件
  - `src/components/LanguageSwitcher/Dropdown.astro` - 下拉菜单 UI
  - `src/components/LanguageSwitcher/client.ts` - 客户端交互与事件清理
- 语言数据与 URL 生成逻辑位于 `src/i18n/utils.ts`，所有链接最终回落到真实的静态页面，确保 SEO 友好。
- 语言链接带有 `data-astro-reload`，切换语言时使用完整页面导航；客户端代码仍会在站内视图切换后重新绑定事件。
- 文章页会用 `originalTitle` 查找已发布的对应译文。找不到时显示本地化的「暂无译文」页面。

## 快速使用

当前实现为单一 Dropdown 变体，调用方式如下：

常用参数：

```astro
<LanguageSwitcher
  class="mobile-dropdown"
  override={{ en: "/en/about/", "zh-CN": "/about/" }}
/>
```

- `override` 仅在需要自定义目标路径时提供；常规页面无需传入。
- 组件会设置 `hreflang`、`lang`、`aria-current` 和按钮展开状态。

## 扩展语言或新增页面

1. 在 `src/i18n/config.ts` 和 `src/i18n/utils.ts` 中登记新语言的 `code`、`label`、`profile`。
2. 为新语言添加 UI 文案：`src/i18n/locales/<locale>.ts`。
3. 创建对应的内容集合或页面（如 `src/data/blog/<locale>/`）。
4. 按需在 `src/i18n/config.ts` 的 locale `profile.label` 中补充语言简写展示。

## 移动端与可访问性要点

- 桌面端容器：`.lang-switcher-container` 使用 Flex 排版，保持导航对齐。
- 移动端容器：`.lang-switcher-mobile` 在汉堡菜单展开时显示，按钮宽度占满，触摸面积 ≥ 44px。
- `focus-outline`、ARIA 属性、`data-astro-reload` 已内建，更新样式时不要移除。
- 若自定义样式，确保 `/src/components/Header.astro` 内的媒体查询与布局同步调整。

## 自动化与手动测试

### Playwright 覆盖

- `tests/i18n.spec.ts`：回归语言切换、英文导航、URL 保持查询参数等核心流程。
- `tests/language-switcher.spec.ts`：验证视图切换后的下拉可用性与事件监听清理。

按需运行相关用例：

```bash
pnpm exec playwright test tests/i18n.spec.ts
pnpm exec playwright test tests/language-switcher.spec.ts
```

### 手动冒烟

1. 打开 `/` 与 `/en/`，确认导航语言与内容匹配。
2. 桌面端展开语言下拉，检查当前语言勾选与 `hreflang`。
3. 移动端打开汉堡菜单，验证下拉菜单和语言链接可用。
4. 搜索页 `/en/search/?q=astro` 切换语言，查询参数应保留。

## 维护清单

- 调整导航结构时同步检查 `switchOverride` 传入路径。
- 更新语言标签展示或样式时，同时在深色/浅色主题下验证可读性。
- 需要临时关闭语言切换器时，可在 Header 中隐藏容器，保留组件以减少回归成本。
