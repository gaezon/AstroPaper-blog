import type { LocaleProfile } from "../types";

export default {
  // 网站基本信息
  site: {
    title: "Gaazeon 的博客",
    description: "Gaazeon 的技术博客，专注分享软件开发、Web 前端技术、编程工具使用心得和开发经验。",
    author: "Gaazeon",
  },

  // 导航相关
  nav: {
    home: "首页",
    about: "关于",
    blog: "博文",
    archives: "归档",
    search: "搜索",
    tags: "标签",
  },

  // 首页
  index: {
    title: "最新文章",
    featuredPosts: "精选文章",
    recentPosts: "最新文章",
    readMore: "阅读全文",
    viewAllPosts: "查看所有文章",
    noPosts: "暂无文章",
  },

  // 文章相关
  post: {
    publishedOn: "发布于",
    updatedOn: "更新于",
    tags: "标签",
    readTime: "分钟阅读",
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

  // 关于页面
  about: {
    title: "关于我",
    description: "了解更多关于我的信息",
  },

  // 归档页面
  archives: {
    title: "文章归档",
    description: "所有文章按时间归档",
    noPosts: "暂无归档文章",
  },

  // 搜索相关
  search: {
    title: "搜索",
    placeholder: "搜索文章...",
    metaDescription: "在 Gaazeon 博客中搜索技术文章与教程，快速找到所需的编程知识、工具指南和开发经验。",
    noResults: "没有找到相关文章",
    searchResults: "搜索结果",
    searching: "搜索中...",
    clearSearch: "清除搜索",
  },

  // 标签相关
  tags: {
    title: "标签",
    allTags: "所有标签",
    description: "探索 Gaazeon 博客涵盖的所有主题，从 Web 开发到工具使用与效率提升。",
    postsWithTag: "包含此标签的文章",
    noTags: "暂无标签",
  },

  // 分页相关
  pagination: {
    previous: "上一页",
    prev: "上一页",
    next: "下一页",
    page: "第 {{current}} 页，共 {{total}} 页",
    pageOnly: "第 {{page}} 页",
    goTo: "跳转到",
  },

  // 语言切换
  language: {
    switch: "切换语言",
    currentLanguage: "当前语言",
    selectLanguage: "选择语言",
    default: "(默认)",
  },

  // 主题切换
  theme: {
    toggle: "切换主题",
    light: "浅色主题",
    dark: "深色主题",
    system: "跟随系统",
  },

  // 页脚
  footer: {
    copyright: "© {{year}} {{author}}. 保留所有权利。",
    poweredBy: "基于 {{framework}} 构建",
  },

  // 通用 UI 文案
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
    skipToContent: "跳转到内容",
    readArticle: "阅读文章：{{title}}",
    updated: "更新于：",
    privacyPolicy: "隐私政策",
    cookiePolicy: "Cookie 政策",
    termsOfService: "服务条款",
    tableOfContents: "目录",
    openToc: "打开文章目录",
    closeToc: "关闭目录",
    expandToc: "展开目录",
    collapseToc: "收起目录",
    collapse: "收起",
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
        description: "这些 Cookies 对于网站正常运行是必需的，包括主题设置和基本功能。",
      },
      analytics: {
        title: "分析 Cookies",
        description: "用于其他可能的分析工具。注：当前使用的 Umami 不需要此同意。",
      },
      advertising: {
        title: "广告 Cookies",
        description: "用于显示个性化广告和衡量广告效果。",
      },
    },
  },

  // 时间和日期
  datetime: {
    formats: {
      short: "YYYY-MM-DD",
      long: "YYYY年MM月DD日",
      time: "HH:mm",
      full: "YYYY年MM月DD日 HH:mm",
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

  // SEO 相关
  seo: {
    defaultTitle: "Gaazeon 的博客",
    defaultDescription: "Gaazeon 的技术博客，专注分享软件开发、Web 前端技术、编程工具使用心得和开发经验。",
    keywords: "技术博客,前端开发,Web开发,编程,Astro,JavaScript,TypeScript",
  },

  // 错误页面
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
