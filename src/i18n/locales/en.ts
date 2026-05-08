export default {
  // Site basic information
  site: {
    title: "Gaazeon's Blog",
    description:
      "Welcome to Gaazeon's Tech Blog! Dive into modern web development, frontend frameworks, programming tools, and software development best practices. Discover practical insights and tips to enhance your coding skills and boost productivity.",
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
    listDescription:
      "Browse all technical articles and tutorials published on Gaazeon's blog.",
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
      "Search Gaazeon's blog for technical articles, tutorials, programming guides, and development insights. Quickly find the knowledge and tools you need.",
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
      "Explore all topics covered on Gaazeon's blog, from web development and frontend frameworks to productivity tools and efficiency tips.",
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
    translationNotFound: "Translation Not Available",
    translationNotFoundDescription:
      '"{{title}}" is not yet available in {{targetLanguage}}.',
    viewOtherPosts: "View {{targetLanguage}} Posts",
  },

  // Theme switching
  theme: {
    toggle: "Toggle Theme",
    switchToLight: "Switch to light theme",
    switchToDark: "Switch to dark theme",
    light: "Light Mode",
    dark: "Dark Mode",
    system: "System Default",
  },

  // Footer
  footer: {
    copyright: "© {{year}} {{author}}. All rights reserved.",
    builtWithPrefix: "Built with ",
    builtWithSuffix: "",
    themeCreditPrefix: "Refined from ",
    themeCreditSuffix: "",
    openSourceThanks: "Thanks to open source.",
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
    termsOfService: "Terms of Service",
    tableOfContents: "Table of Contents",
    openToc: "Open Table of Contents",
    closeToc: "Close Table of Contents",
    expandToc: "Expand Table of Contents",
    collapseToc: "Collapse Table of Contents",
    collapse: "Collapse",
    socialLinks: "Connect with us:",
    sharePostOn: "Share this article on:",
    cookie: {
      consentText:
        "We use cookies to enhance your browsing experience. Read our",
      accept: "Accept",
      reject: "Reject",
      settings: "Cookie Settings",
      saveSettings: "Save Settings",
      cancel: "Cancel",
      title: "Cookie Settings",
      description: "Choose which types of cookies you'd like to allow:",
      essential: {
        title: "Essential Cookies",
        description:
          "These cookies are required for the website to function properly, including theme preferences and core features.",
      },
      analytics: {
        title: "Analytics Cookies",
        description:
          "Used for potential analytics tools. Note: Our current Umami analytics does not require cookie consent.",
      },
      advertising: {
        title: "Advertising Cookies",
        description:
          "Used to deliver personalized advertisements and measure campaign performance.",
      },
      status: {
        accepted: "Currently enabled cookies accepted",
        rejected: "Only essential cookies accepted",
        saved: "Cookie settings saved",
      },
    },
  },

  // Time and date
  datetime: {
    formats: {
      short: "YYYY-MM-DD",
      long: "MMMM DD, YYYY",
      time: "HH:mm",
      full: "MMMM DD, YYYY at HH:mm",
    },
    months: {
      january: "January",
      february: "February",
      march: "March",
      april: "April",
      may: "May",
      june: "June",
      july: "July",
      august: "August",
      september: "September",
      october: "October",
      november: "November",
      december: "December",
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
      "Gaazeon's Tech Blog - Expert insights on software development, web frontend technologies, programming tools, and best practices for modern developers.",
    keywords:
      "tech blog, frontend development, web development, programming, software engineering, Astro, JavaScript, TypeScript, developer tools",
  },

  // Error pages
  error: {
    notFound: {
      title: "Page Not Found",
      description: "Sorry, the page you're looking for doesn't exist.",
      backHome: "Return to Home",
    },
    serverError: {
      title: "Server Error",
      description: "Oops! Something went wrong on our end.",
      tryAgain: "Try Again",
    },
  },
};
