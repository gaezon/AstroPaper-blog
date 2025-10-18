/**
 * TOC 折叠组件国际化支持
 * 根据当前页面的语言设置动态更新折叠组件的显示文本
 */

(function () {
  "use strict";

  // 获取当前页面语言
  function getCurrentLanguage() {
    // 检查 URL 路径判断语言
    const path = window.location.pathname;
    if (path.startsWith("/en/")) {
      return "en";
    }
    return "zh-CN";
  }

  // 更新 TOC 折叠组件的显示文本
  function updateTocCollapseText() {
    const language = getCurrentLanguage();
    const tocElements = document.querySelectorAll(
      '.toc-collapse[data-multilingual="true"]'
    );

    tocElements.forEach(element => {
      const summary = element.querySelector("summary");
      if (summary) {
        // 根据语言设置 summary 的 text content
        if (language === "en") {
          const enTitle = element.getAttribute("data-en-title");
          if (enTitle) {
            // 保持原有的展开/收起图标，只更改提示文本
            const currentText = summary.childNodes[0]; // 获取第一个文本节点
            if (currentText && currentText.nodeType === Node.TEXT_NODE) {
              currentText.textContent = enTitle + " ";
            }
          }
        } else {
          const zhTitle = element.getAttribute("data-zh-title");
          if (zhTitle) {
            const currentText = summary.childNodes[0]; // 获取第一个文本节点
            if (currentText && currentText.nodeType === Node.TEXT_NODE) {
              currentText.textContent = zhTitle + " ";
            }
          }
        }
      }
    });

    // 设置 html 的 data-lang 属性，用于 CSS 样式切换
    document.documentElement.setAttribute("data-lang", language);
  }

  // 监听页面语言变化（如果使用语言切换器）
  function observeLanguageChanges() {
    // 监听 URL 变化
    let currentUrl = window.location.href;

    const checkUrlChange = () => {
      if (window.location.href !== currentUrl) {
        currentUrl = window.location.href;
        setTimeout(updateTocCollapseText, 100); // 延迟执行确保 DOM 更新完成
      }
    };

    // 使用多种方式监听 URL 变化
    window.addEventListener("popstate", checkUrlChange);

    // 监听 pushState 和 replaceState
    const originalPushState = history.pushState;
    const originalReplaceState = history.replaceState;

    history.pushState = function (...args) {
      originalPushState.apply(history, args);
      setTimeout(checkUrlChange, 100);
    };

    history.replaceState = function (...args) {
      originalReplaceState.apply(history, args);
      setTimeout(checkUrlChange, 100);
    };
  }

  // DOM 加载完成后初始化
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", () => {
      updateTocCollapseText();
      observeLanguageChanges();
    });
  } else {
    // DOM 已经加载完成
    updateTocCollapseText();
    observeLanguageChanges();
  }

  // 导出函数供其他脚本使用
  window.TocI18n = {
    updateTocCollapseText,
    getCurrentLanguage,
  };
})();
