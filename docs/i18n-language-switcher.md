# i18n 语言切换器与移动端指引

> 最近将多份 AI 自动生成的说明文档合并成这一份实用手册，覆盖语言切换器的主要用法、扩展点、测试和维护要点。

## 概览

- `src/components/LanguageSwitcher/` 目录包含模块化子组件：
  - `LanguageSwitcher.astro` - 主入口（根据 `variant` 属性选择变体）
  - `Dropdown.astro` - 下拉菜单变体（桌面导航、语言 > 2 种时）
  - `Compact.astro` - 紧凑变体（空间有限的导航按钮）
  - `Toggle.astro` - 切换变体（双语或侧边栏局部切换）
  - `client.ts` - 客户端交互逻辑
- 语言数据与 URL 生成逻辑位于 `src/i18n/utils.ts`，所有链接最终回落到真实的静态页面，确保 SEO 友好。
- 导航栏需要完整刷新以恢复事件监听，因此语言链接带有 `data-astro-reload` 属性。

## 快速使用

| 变体       | 推荐场景                | 代码片段                                                            |
| ---------- | ----------------------- | ------------------------------------------------------------------- |
| `dropdown` | 桌面导航、语言 > 2 种时 | `<LanguageSwitcher variant="dropdown" override={switchOverride} />` |
| `compact`  | 空间有限的导航按钮      | `<LanguageSwitcher variant="compact" />`                            |
| `toggle`   | 双语或侧边栏局部切换    | `<LanguageSwitcher variant="toggle" />`                             |

常用参数：

```astro
<LanguageSwitcher
  variant="dropdown"
  class="mobile-dropdown"
  override={{ en: "/en/about/", "zh-CN": "/about/" }}
/>
```

- `override` 仅在需要自定义跳转路径时提供；常规页面无需传入。
- 组件会根据当前语言自动添加 `hreflang`、`lang` 和活跃态样式，保持无障碍友好。

## 扩展语言或新增页面

1. 在 `src/i18n/config.ts` 和 `src/i18n/utils.ts` 中登记新语言的 `code`、`label`、`profile`。
2. 为新语言添加 UI 文案：`src/i18n/locales/<locale>.ts`。
3. 若需要标签映射，更新 `src/i18n/tagMap.ts`。
4. 创建对应的内容集合或页面（如 `src/data/blog/<locale>/`）。
5. 按需在 `LanguageSwitcher.astro` 中补充 `getShortLabel` 的显示符号。

## 移动端与可访问性要点

- 桌面端容器：`.lang-switcher-container` 使用 Flex 排版，保持导航对齐。
- 移动端容器：`.lang-switcher-mobile` 在汉堡菜单展开时显示，按钮宽度占满，触摸面积 ≥ 44px。
- `focus-outline`、ARIA 属性、`data-astro-reload` 已内建，更新样式时不要去掉。
- 若自定义样式，确保 `/src/components/Header.astro` 内的媒体查询与布局同步调整。

## 自动化与手动测试

### Playwright 覆盖

- `tests/i18n.spec.ts`：回归语言切换、英文导航、URL 保持查询参数等核心流程。
- `tests/og-text-normalization.spec.ts`：验证 OG 图标题的 Unicode 归一化逻辑。

运行示例：

```bash
pnpm exec playwright test tests/i18n.spec.ts
pnpm exec playwright test tests/og-text-normalization.spec.ts
```

### 手动冒烟

1. 打开 `/` 与 `/en/`，确认导航语言与内容匹配。
2. 桌面端展开语言下拉，检查当前语言勾选与 `hreflang`。
3. 移动端（Chrome DevTools 设备模式）打开汉堡菜单，验证按钮触摸区域与跳转。
4. 搜索页 `/en/search/?q=astro` 切换语言，查询参数应保留。

## 维护清单

- 调整导航结构时同步检查 `switchOverride` 传入路径。
- 更新 `getShortLabel` 或样式时，同时在深色/浅色主题下验证可读性。
- 新增 Playwright 场景时记得退出本地 dev server 后执行，以免缓存影响。
- 需要临时关闭语言切换器时，可在 Header 中隐藏容器，保留组件以减少回归成本。
