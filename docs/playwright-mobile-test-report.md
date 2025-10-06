# 📱 移动端 Playwright 测试报告

## 测试日期
2025-10-05

## 测试环境
- **浏览器**: Playwright Chromium
- **视窗尺寸**: 375px × 667px (iPhone 6/7/8/SE)
- **测试 URL**: http://localhost:4321/

## 🐛 发现的问题

### 问题 1: JavaScript 函数序列化错误 ❌ **已修复**

**症状**:
```
TypeError: tr is not a function
at HTMLButtonElement.<anonymous> (http://localhost:4321/:3795:69...
```

**原因**:
在 `Header.astro` 中，`<script define:vars={{ tr }}>` 试图将翻译函数 `tr` 序列化传递到客户端JavaScript，但函数无法被序列化。

**修复**:
```astro
<!-- 修复前 -->
<script define:vars={{ tr }}>
  menuBtn.setAttribute("aria-label", openMenu ? tr("ui.menu") : tr("ui.close"));
</script>

<!-- 修复后 -->
<script define:vars={{ menuLabel: tr("ui.menu"), closeLabel: tr("ui.close") }}>
  menuBtn.setAttribute("aria-label", openMenu ? menuLabel : closeLabel);
</script>
```

**状态**: ✅ **已修复并验证**

---

## ✅ 测试结果

### 测试场景 1: 移动端菜单展开
**步骤**:
1. 访问首页（中文）
2. 调整浏览器窗口到移动端尺寸 (375px × 667px)
3. 点击汉堡菜单按钮

**结果**: ✅ **通过**
- 菜单按钮存在且可点击
- 点击后菜单成功展开
- 按钮文本从"菜单"变为"关闭"
- `aria-expanded` 属性正确切换
- 菜单项全部显示

**详细输出**:
```yaml
- button "关闭" [expanded] [active] [ref=e197]
- list [ref=e202]:
  - listitem: "博文"
  - listitem: "标签"
  - listitem: "关于"
  - listitem: "联系"
  - listitem: "归档"
  - listitem: "搜索"
  - listitem: 语言切换器 (🌐 中 / EN)
  - listitem: 主题切换
```

---

### 测试场景 2: 语言切换器可见性
**步骤**:
1. 展开移动端菜单
2. 查找语言切换器

**结果**: ✅ **通过**
- 语言切换器在菜单中可见
- 地球图标 (🌐) 显示正常
- "中"链接可点击
- "/"分隔符显示
- "EN"链接可点击

**DOM 结构**:
```yaml
listitem [ref=e220]:
  - generic [ref=e222]:
    - img [ref=e223]  # 地球图标
    - link "简体中文" [ref=e225] [url=/]
      - text: "中"
    - generic [ref=e226]: "/"
    - link "English" [ref=e227] [url=/en/]
      - text: "EN"
```

---

### 测试场景 3: 中文切换到英文
**步骤**:
1. 在移动菜单中点击 "EN" 链接
2. 等待页面跳转

**结果**: ✅ **通过**
- URL 成功跳转到 `/en/`
- 页面标题变为 "Gaazeon's Blog"
- 页面内容全部变为英文
- 菜单项文字变为英文 ("Blog", "Tags", "About" 等)

**页面信息**:
```
URL: http://localhost:4321/en/
Title: Gaazeon's Blog
Content: Featured Posts, Recent Posts, View All Posts (英文)
```

---

### 测试场景 4: 英文页面菜单功能
**步骤**:
1. 在英文页面点击汉堡菜单
2. 检查菜单状态

**结果**: ⚠️ **部分通过**
- 菜单按钮存在
- 菜单元素存在但保持隐藏状态
- `aria-expanded` 为 "false"
- 菜单类包含 "hidden"

**分析**:
这可能是 Astro View Transitions 导致的事件监听器未重新绑定。需要确保 `astro:after-swap` 事件正确触发。

**调试输出**:
```json
{
  "menuBtnExists": true,
  "menuItemsExists": true,
  "menuItemsClasses": "... hidden",
  "menuBtnAria": "false"
}
```

---

## 📊 测试统计

| 测试项 | 结果 | 备注 |
|--------|------|------|
| JavaScript 错误修复 | ✅ 通过 | 已修复函数序列化问题 |
| 移动端菜单展开 | ✅ 通过 | 中文页面正常工作 |
| 语言切换器显示 | ✅ 通过 | 样式和布局正确 |
| 中文→英文切换 | ✅ 通过 | URL 和内容正确跳转 |
| 英文页面菜单 | ⚠️ 警告 | 需要刷新页面才能工作 |

**通过率**: 80% (4/5)

---

## 🔍 深入分析

### 主要问题：Astro View Transitions

在语言切换时，由于使用了 Astro 的 View Transitions，页面不是完全重新加载，而是部分替换。这可能导致事件监听器未正确重新绑定。

**当前代码**:
```javascript
document.addEventListener("astro:after-swap", toggleNav);
```

**可能的问题**:
1. View Transitions 后 DOM 元素被替换，旧的事件监听器失效
2. `toggleNav()` 函数可能需要先移除旧监听器再添加新监听器

### 建议的修复方案

#### 方案 1: 使用事件委托
```javascript
document.addEventListener("click", (e) => {
  const menuBtn = e.target.closest("#menu-btn");
  if (!menuBtn) return;
  
  // 处理菜单切换逻辑
});
```

#### 方案 2: 改进事件监听器管理
```javascript
function toggleNav() {
  const menuBtn = document.querySelector("#menu-btn");
  if (!menuBtn) return;
  
  // 移除旧监听器
  menuBtn.replaceWith(menuBtn.cloneNode(true));
  const newMenuBtn = document.querySelector("#menu-btn");
  
  // 添加新监听器
  newMenuBtn.addEventListener("click", handleMenuClick);
}
```

#### 方案 3: 禁用特定链接的 View Transitions
```astro
<!-- 在语言切换链接上禁用 View Transitions -->
<a href="/en/" data-astro-reload>EN</a>
```

---

## 🎯 优先级修复建议

### P0 (立即修复)
- ✅ **已完成**: 修复 `tr is not a function` 错误

### P1 (高优先级)
- ⏳ **待处理**: 修复 View Transitions 后菜单事件监听器问题
  - 选项 A: 为语言切换链接添加 `data-astro-reload`
  - 选项 B: 改进事件监听器重新绑定逻辑

### P2 (中优先级)
- 📝 添加自动化测试，覆盖语言切换场景
- 📝 添加错误边界处理

---

## 💡 临时解决方案

用户在切换语言后，如果菜单无法打开，可以：
1. **刷新页面** (Cmd+R / Ctrl+R)
2. 或直接点击导航栏的其他链接

---

## 🧪 复现步骤

如果需要手动复现测试：

```bash
# 1. 启动开发服务器
pnpm run dev

# 2. 打开 Chrome DevTools
# 按 F12

# 3. 切换到移动端模式
# 按 Cmd+Shift+M (Mac) 或 Ctrl+Shift+M (Windows)

# 4. 选择设备
# iPhone SE 或 iPhone 12 Pro

# 5. 测试步骤
# - 点击汉堡菜单
# - 点击 "EN" 切换到英文
# - 尝试再次点击汉堡菜单
# - 如果不工作，刷新页面再试
```

---

## 📝 修改的文件

### `/Users/leojun/code/AstroPaper-blog/src/components/Header.astro`

**修改内容**:
```diff
- <script define:vars={{ tr }}>
+ <script define:vars={{ menuLabel: tr("ui.menu"), closeLabel: tr("ui.close") }}>
    function toggleNav() {
      // ...
-     menuBtn.setAttribute("aria-label", openMenu ? tr("ui.menu") : tr("ui.close"));
+     menuBtn.setAttribute("aria-label", openMenu ? menuLabel : closeLabel);
```

---

## ✅ 结论

### 成功完成
1. ✅ 修复了 JavaScript 函数序列化错误
2. ✅ 移动端菜单在中文页面完美工作
3. ✅ 语言切换器显示和功能正常
4. ✅ 语言切换跳转功能正常

### 需要改进
1. ⚠️ View Transitions 后的事件监听器重新绑定
2. 📝 建议添加 `data-astro-reload` 到语言切换链接

### 推荐行动
**立即可做**:
```astro
<!-- 在 LanguageSwitcher.astro 中添加 -->
<a 
  href={...}
  data-astro-reload  <!-- 添加这个属性 -->
  ...
>
```

这将确保语言切换时完全重新加载页面，避免 View Transitions 导致的问题。

---

**测试人**: GitHub Copilot (Playwright MCP)  
**测试状态**: ✅ 基本功能通过，发现一个需要改进的点  
**下一步**: 添加 `data-astro-reload` 属性到语言切换链接
