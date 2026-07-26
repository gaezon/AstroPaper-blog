import type { Site } from "./types";

export const SITE: Site = {
  website: "https://blog.gaazeon.com/", // replace this with your deployed domain
  author: "Gaazeon",
  desc: "Gaazeon 的个人技术博客，记录软件开发、自托管服务、开发工具与网络配置的第一手实践笔记，也偶尔写写踩过的坑和折腾的过程。",
  descEn:
    "Gaazeon's personal blog: first-hand notes on software development, self-hosted services, developer tools, and networking — including the mistakes made along the way.",
  profile: "",
  title: "Gaazeon's blog.",
  titleEn: "Gaazeon's Blog",
  ogImage: "astropaper-og.jpg",
  lightAndDarkMode: true,
  postPerIndex: 4,
  postPerPage: 4,
  scheduledPostMargin: 15 * 60 * 1000, // 15 minutes
  showArchives: true,
  showBackButton: true, // show back button in post detail
  editPost: {
    enabled: false,
    text: "Suggest Changes",
    url: "https://github.com/satnaing/astro-paper/edit/main/",
  },
  dynamicOgImage: true,
  dir: "ltr", // "rtl" | "auto"
  lang: "zh-CN", // html lang code. Set this empty and default will be "en"
  timezone: "Asia/Shanghai", // Default global timezone (IANA format) https://en.wikipedia.org/wiki/List_of_tz_database_time_zones
} as const;
