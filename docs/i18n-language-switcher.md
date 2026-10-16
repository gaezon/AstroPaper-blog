# 语言切换器与本地化导航

修改语言链接、下拉交互或移动导航时阅读本文。文章翻译字段与评论映射见[双语文章映射](bilingual-comment-system.md)。

## 实现入口

| 文件                                                                                                                                    | 职责                                                 |
| --------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------- |
| [i18n/config.ts](../src/i18n/config.ts)、[i18n/locales/](../src/i18n/locales/)                                                          | `zh-CN` / `en` 配置、展示标签和翻译文案              |
| [i18n/utils.ts](../src/i18n/utils.ts)                                                                                                   | 当前语言、翻译读取、默认语言切换 URL                 |
| [LanguageSwitcher.astro](../src/components/LanguageSwitcher.astro)、[Dropdown.astro](../src/components/LanguageSwitcher/Dropdown.astro) | 单一下拉变体及语言链接的服务端输出                   |
| [LanguageSwitcher/client.ts](../src/components/LanguageSwitcher/client.ts)                                                              | 开关状态、焦点处理、URL 参数补全、语言偏好和事件清理 |
| [Header.astro](../src/components/Header.astro)                                                                                          | 桌面与移动端容器，向切换器传递页面覆盖路径           |

中文页面无语言前缀，英文页面使用 `/en/`。语言链接带 `data-astro-reload`，执行完整页面导航；站内其他视图切换后，组件通过 `astro:after-swap` 重新绑定事件，并在 `astro:before-swap` 清理旧监听。

## 目标路径的选择

常规页面使用默认 URL 规则，需要特殊目标时传入 `override`；页面通常通过 Header 的 `switchOverride` 传递：

```astro
<LanguageSwitcher override={{ en: "/en/about/", "zh-CN": "/about/" }} />
```

- 文章页：[PostDetails.astro](../src/layouts/PostDetails.astro) 按 `originalTitle` 查找非草稿译文并覆盖目标；未命中时，默认逻辑指向目标语言的「暂无译文」页面。该查找不单独检查发布时间，仍需确认目标页面实际可用。
- 标签详情页：[getTagSwitchOverride.ts](../src/utils/getTagSwitchOverride.ts) 处理已翻译 / 共享标签；不存在对应标签时回退到目标语言标签索引。
- 默认 URL 逻辑不检查目标页面是否存在。新增页面、列表分页或路径规则时，应确认对应静态路由及需要的 `switchOverride`，不能只替换语言前缀。
- 当前查询参数与 hash 会在目标 URL 未自带相应部分时补全；「暂无译文」页的目标参数应保持其自身语义。

点击语言链接会保存 `preferred-locale`。首页语言跳转由 [LocaleRedirect.astro](../src/components/LocaleRedirect.astro) 实现，由 [HomePage.astro](../src/components/HomePage.astro) 经 Layout 仅在中文首页启用；修改时同时检查首次打开 `/` 与站内返回首页的行为。

## 交互约束

保留按钮的可访问名称、`aria-expanded`、链接的 `lang` / `hreflang` / `aria-current` 与焦点样式。Escape 应关闭菜单并把焦点还给按钮；移出焦点或点击外部应关闭菜单。

移动端必须让链接点击完成导航后再处理失焦关闭。当前客户端通过 pointer 状态和微任务协调这一顺序；修改 `focusout`、pointer 事件或隐藏菜单的时机时，检查实际触摸导航。布局入口位于 [Header.astro](../src/components/Header.astro)，与桌面下拉共用组件。

新增语言会影响 Astro 路由、内容集合、locale 类型、SEO、映射及本地化文案，不能仅在下拉菜单中添加选项。当前项目支持范围为 `zh-CN` 与 `en`。

## 检查范围

使用项目工具链，按改动运行相关检查：

```bash
pnpm exec playwright test tests/i18n.spec.ts tests/language-switcher.spec.ts
```

- [i18n.spec.ts](../tests/i18n.spec.ts)：英文导航、查询参数、标签目标和首页语言偏好。
- [language-switcher.spec.ts](../tests/language-switcher.spec.ts)：站内视图切换后的可用性、监听清理、可访问名称、缺失译文文案及移动点击。
- 翻译字典 / SEO 变更：补充运行 [i18n-key-parity.spec.ts](../tests/unit/i18n-key-parity.spec.ts) 与 [i18n-seo.spec.ts](../tests/unit/i18n-seo.spec.ts) 对应单元测试。

涉及实际文章配对时，再检查该对中英文页面相互切换，以及无译文文章的回退页；涉及样式时，在桌面 / 移动端和亮 / 暗主题下检查焦点、展开状态与可读性。仅文档修改无需启动应用测试。
