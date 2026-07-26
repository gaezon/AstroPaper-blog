export default {
  // Site meta
  site: {
    title: "Gaazeon 的博客",
    description:
      "Gaazeon 的个人技术博客，记录软件开发、自托管服务、开发工具与网络配置的第一手实践笔记，也偶尔写写踩过的坑和折腾的过程。",
    author: "Gaazeon",
  },

  // Navigation
  nav: {
    home: "首页",
    about: "关于",
    blog: "文章",
    archives: "归档",
    search: "搜索",
    tags: "标签",
    milestones: "里程碑",
  },

  // Home
  index: {
    title: "最新文章",
    featuredPosts: "精选文章",
    recentPosts: "最新文章",
    readMore: "阅读全文",
    viewAllPosts: "查看所有文章",
    noPosts: "暂无文章",
  },

  // Post
  post: {
    publishedOn: "发布于",
    updatedOn: "更新于",
    tags: "标签",
    readTime: "分钟阅读",
    views: "次阅读",
    tableOfContents: "目录",
    backToTop: "返回顶部",
    sharePost: "分享文章",
    relatedPosts: "相关文章",
    previousPost: "上一篇",
    nextPost: "下一篇",
    editPost: "建议修改",
    draft: "草稿",
    featured: "精选",
    listTitle: "所有文章",
    listDescription: "浏览 Gaazeon 博客发布的全部技术文章与教程。",
  },

  // About page
  about: {
    title: "关于",
    description: "了解更多关于我的信息",
  },

  // Milestones page
  milestones: {
    title: "博客里程碑",
    description: "记录博客发展过程中的重要里程碑",
  },

  // Archives page
  archives: {
    title: "文章归档",
    description: "所有文章按时间归档",
    noPosts: "暂无归档文章",
  },

  // Search
  search: {
    title: "搜索",
    placeholder: "搜索文章...",
    metaDescription:
      "在 Gaazeon 博客中搜索技术文章与教程，快速找到所需的编程知识、工具指南和开发经验。",
    noResults: "没有找到相关文章",
    searchResults: "搜索结果",
    searching: "搜索中...",
    clearSearch: "清空搜索",
    pagefind: {
      placeholder: "搜索文章",
      clearSearch: "清空",
      loadMore: "加载更多结果",
      searchLabel: "站内搜索",
      filtersLabel: "筛选",
      zeroResults: "未找到与 [SEARCH_TERM] 相关的文章",
      manyResults: "找到 [COUNT] 篇与 [SEARCH_TERM] 相关的文章",
      oneResult: "找到 [COUNT] 篇与 [SEARCH_TERM] 相关的文章",
      totalZeroResults: "暂无搜索结果",
      totalOneResult: "[COUNT] 篇结果",
      totalManyResults: "[COUNT] 篇结果",
      altSearch:
        "未找到与 [SEARCH_TERM] 相关的文章，正在显示与 [DIFFERENT_TERM] 相关的结果",
      searchSuggestion:
        "未找到与 [SEARCH_TERM] 相关的文章。可以尝试以下搜索词。",
      searching: "正在搜索 [SEARCH_TERM]...",
      resultsLabel: "搜索结果",
      keyboardNavigate: "导航",
      keyboardSelect: "选择",
      keyboardClear: "清空",
      keyboardClose: "关闭",
      keyboardSearch: "搜索",
      errorSearch: "搜索失败",
      filterSelectedOne: "已选择 [COUNT] 项",
      filterSelectedMany: "已选择 [COUNT] 项",
      inputHint: "输入关键词后将显示搜索结果",
      loading: "加载中",
    },
  },

  // Tags
  tags: {
    title: "标签",
    allTags: "所有标签",
    description:
      "探索 Gaazeon 博客涵盖的所有主题，从 Web 开发到工具使用与效率提升。",
    postsWithTag: "包含此标签的文章",
    noTags: "暂无标签",
  },

  // Pagination
  pagination: {
    previous: "上一页",
    prev: "上一页",
    next: "下一页",
    page: "第 {{current}}/{{total}} 页",
    pageOnly: "第 {{page}} 页",
    goTo: "跳转到",
  },

  // Language switcher
  language: {
    switch: "切换语言",
    currentLanguage: "当前语言",
    selectLanguage: "选择语言",
    default: "(默认)",
    translationNotFound: "暂无对应译文",
    missing: {
      chinese: "中文",
      english: "英文",
      currentArticleFallback: "本文",
      title: "暂无{{language}}译文",
      description: "文章「{{title}}」暂无{{language}}译文。",
      back: "返回上一页",
      readAvailable: "阅读{{language}}原文",
      browseAll: "浏览全部{{language}}文章",
    },
  },

  // Theme switcher
  theme: {
    toggle: "切换主题",
    switchToLight: "切换到浅色模式",
    switchToDark: "切换到深色模式",
    light: "浅色模式",
    dark: "深色模式",
    system: "跟随系统设置",
  },

  // Footer
  footer: {
    copyright: "© {{year}} {{author}}. 保留所有权利。",
    builtWithPrefix: "由 ",
    builtWithSuffix: " 驱动",
    themeCreditPrefix: "基于 ",
    themeCreditSuffix: " 主题打磨",
    openSourceThanks: "感谢开源社区。",
  },

  // Generic UI copy
  ui: {
    loading: "加载中...",
    error: "出错了",
    success: "成功",
    warning: "警告",
    info: "信息",
    close: "关闭",
    cancel: "取消",
    confirm: "确认",
    save: "保存",
    delete: "删除",
    edit: "编辑",
    view: "查看",
    back: "返回",
    menu: "菜单",
    home: "首页",
    about: "关于",
    contact: "联系",
    rss: "RSS",
    skipToContent: "跳至正文",
    readArticle: "阅读文章：{{title}}",
    updated: "更新于：",
    privacyPolicy: "隐私政策",
    termsOfService: "服务条款",
    tableOfContents: "目录",
    openToc: "打开文章目录",
    closeToc: "关闭目录",
    expandToc: "展开目录",
    collapseToc: "收起目录",
    collapse: "收起",
    socialLinks: "联系方式：",
    sharePostOn: "分享到：",
    copyCode: "复制",
    copiedCode: "已复制",
    zoomImage: "查看图片",
    imagePreview: "图片预览",
    closeImagePreview: "关闭图片预览",
    emailMe: "发送邮件",
    emailService: "电子邮件",
    sharePostVia: "通过{{service}}分享文章",
    cookie: {
      consentText: "我们使用 Cookies 来改善体验。查看",
      accept: "接受",
      reject: "拒绝",
      settings: "Cookie 设置",
      saveSettings: "保存设置",
      cancel: "取消",
      title: "Cookie 设置",
      description: "选择您希望允许的 Cookie 类型：",
      essential: {
        title: "必要 Cookies",
        description:
          "这些 Cookies 对于网站正常运行是必需的，包括主题设置和基本功能。",
      },
      analytics: {
        title: "分析 Cookies",
        description:
          "用于其他可能的分析工具。注：当前使用的 Umami 不需要此同意。",
      },
      advertising: {
        title: "广告 Cookies",
        description: "用于显示个性化广告和衡量广告效果。",
      },
      status: {
        accepted: "已接受当前启用的 Cookies",
        rejected: "仅接受必要 Cookies",
        saved: "Cookie 设置已保存",
      },
    },
  },

  // Date and time
  datetime: {
    formats: {
      short: "YYYY-MM-DD",
      long: "YYYY年MM月DD日",
      time: "HH:mm",
      full: "YYYY年MM月DD日 HH:mm",
    },
    months: {
      january: "一月",
      february: "二月",
      march: "三月",
      april: "四月",
      may: "五月",
      june: "六月",
      july: "七月",
      august: "八月",
      september: "九月",
      october: "十月",
      november: "十一月",
      december: "十二月",
    },
    relative: {
      justNow: "刚刚",
      minutesAgo: "{{count}} 分钟前",
      hoursAgo: "{{count}} 小时前",
      daysAgo: "{{count}} 天前",
      weeksAgo: "{{count}} 周前",
      monthsAgo: "{{count}} 个月前",
      yearsAgo: "{{count}} 年前",
    },
  },

  // SEO related
  seo: {
    defaultTitle: "Gaazeon 的博客",
    defaultDescription:
      "Gaazeon 的技术博客，专注分享软件开发、Web 前端技术、编程工具使用心得和开发经验。",
    keywords: "技术博客,前端开发,Web开发,编程,Astro,JavaScript,TypeScript",
  },

  // Error pages
  error: {
    notFound: {
      title: "页面未找到",
      description: "抱歉，您访问的页面不存在。",
      backHome: "返回首页",
    },
    serverError: {
      title: "服务器错误",
      description: "抱歉，服务器出现了问题。",
      tryAgain: "重试",
    },
  },
};
