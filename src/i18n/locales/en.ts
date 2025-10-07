export default {
  // Site basic information
  site: {
    title: "Gaazeon's Blog",
    description:
      "Gaazeon's technical blog, focusing on software development, web frontend technologies, programming tools, and development experiences.",
    author: "Gaazeon",
  },

  // Navigation related
  nav: {
    home: "Home",
    about: "About",
    blog: "Blog",
    archives: "Archives",
    search: "Search",
    tags: "Tags",
    milestones: "Milestones",
  },

  // Homepage
  index: {
    title: "Latest Posts",
    featuredPosts: "Featured Posts",
    recentPosts: "Recent Posts",
    readMore: "Read More",
    viewAllPosts: "View All Posts",
    noPosts: "No posts yet",
  },

  // Post related
  post: {
    publishedOn: "Published on",
    updatedOn: "Updated on",
    tags: "Tags",
    readTime: "min read",
    tableOfContents: "Table of Contents",
    backToTop: "Back to Top",
    sharePost: "Share Post",
    relatedPosts: "Related Posts",
    previousPost: "Previous Post",
    nextPost: "Next Post",
    editPost: "Suggest Changes",
    draft: "Draft",
    featured: "Featured",
    listTitle: "All Posts",
    listDescription: "Browse every article published on Gaazeon's blog.",
  },

  // About page
  about: {
    title: "About",
    description: "Learn more about me",
  },

  // Milestones page
  milestones: {
    title: "Blog Milestones",
    description: "Record important milestones in the blog's development",
  },

  // Archives page
  archives: {
    title: "Post Archives",
    description: "All posts organized by date",
    noPosts: "No archived posts",
  },

  // Search related
  search: {
    title: "Search",
    placeholder: "Search posts...",
    metaDescription:
      "Search Gaazeon's blog to quickly find technical articles, tutorials, and development insights.",
    noResults: "No posts found",
    searchResults: "Search Results",
    searching: "Searching...",
    clearSearch: "Clear Search",
  },

  // Tags related
  tags: {
    title: "Tags",
    allTags: "All Tags",
    description:
      "Explore every topic covered on Gaazeon's blog, from web development to tooling and productivity.",
    postsWithTag: "Posts with this tag",
    noTags: "No tags yet",
  },

  // Pagination related
  pagination: {
    previous: "Previous",
    prev: "Prev",
    next: "Next",
    page: "Page {{current}} of {{total}}",
    pageOnly: "Page {{page}}",
    goTo: "Go to",
  },

  // Language switching
  language: {
    switch: "Switch Language",
    currentLanguage: "Current Language",
    selectLanguage: "Select Language",
    default: "(default)",
    translationNotFound: "Translation Not Found",
    translationNotFoundDescription:
      '"{{title}}" is not yet available in {{targetLanguage}}.',
    viewOtherPosts: "View {{targetLanguage}} Posts",
  },

  // Theme switching
  theme: {
    toggle: "Toggle Theme",
    light: "Light Theme",
    dark: "Dark Theme",
    system: "System",
  },

  // Footer
  footer: {
    copyright: "© {{year}} {{author}}. All rights reserved.",
    poweredBy: "Powered by {{framework}}",
  },

  // Common UI text
  ui: {
    loading: "Loading...",
    error: "Error",
    success: "Success",
    warning: "Warning",
    info: "Info",
    close: "Close",
    cancel: "Cancel",
    confirm: "Confirm",
    save: "Save",
    delete: "Delete",
    edit: "Edit",
    view: "View",
    back: "Back",
    menu: "Menu",
    home: "Home",
    about: "About",
    contact: "Contact",
    rss: "RSS",
    skipToContent: "Skip to content",
    readArticle: "Read article: {{title}}",
    updated: "Updated:",
    privacyPolicy: "Privacy Policy",
    cookiePolicy: "Cookie Policy",
    termsOfService: "Terms of Service",
    tableOfContents: "Table of Contents",
    openToc: "Open Table of Contents",
    closeToc: "Close Table of Contents",
    expandToc: "Expand Table of Contents",
    collapseToc: "Collapse Table of Contents",
    collapse: "Collapse",
    socialLinks: "Social Links:",
    sharePostOn: "Share this post on:",
    cookie: {
      consentText: "We use cookies to improve your experience. View our",
      accept: "Accept",
      reject: "Reject",
      settings: "Cookie Settings",
      saveSettings: "Save Settings",
      cancel: "Cancel",
      title: "Cookie Settings",
      description: "Select the types of cookies you want to allow:",
      essential: {
        title: "Essential Cookies",
        description:
          "These cookies are necessary for the website to function, including theme settings and basic functionality.",
      },
      analytics: {
        title: "Analytics Cookies",
        description:
          "Used for other potential analytics tools. Note: The currently used Umami does not require this consent.",
      },
      advertising: {
        title: "Advertising Cookies",
        description:
          "Used to display personalized ads and measure ad effectiveness.",
      },
    },
  },

  // Time and date
  datetime: {
    formats: {
      short: "YYYY-MM-DD",
      long: "MMMM DD, YYYY",
      time: "HH:mm",
      full: "MMMM DD, YYYY [at] HH:mm",
    },
    relative: {
      justNow: "Just now",
      minutesAgo: "{{count}} minutes ago",
      hoursAgo: "{{count}} hours ago",
      daysAgo: "{{count}} days ago",
      weeksAgo: "{{count}} weeks ago",
      monthsAgo: "{{count}} months ago",
      yearsAgo: "{{count}} years ago",
    },
  },

  // SEO related
  seo: {
    defaultTitle: "Gaazeon's Blog",
    defaultDescription:
      "Gaazeon's technical blog, focusing on software development, web front-end technologies, programming tools, and development experiences.",
    keywords:
      "tech blog, front-end development, web development, programming, Astro, JavaScript, TypeScript",
  },

  // Error pages
  error: {
    notFound: {
      title: "Page Not Found",
      description: "Sorry, the page you're looking for doesn't exist.",
      backHome: "Back to Home",
    },
    serverError: {
      title: "Server Error",
      description: "Sorry, something went wrong on the server.",
      tryAgain: "Try Again",
    },
  },
};
