import type { Site } from "./types";

export const SITE: Site = {
  website: "https://blog.gaazeon.com/", // replace this with your deployed domain
  author: "Gaazeon",
  desc: "Gaazeon 的技术博客，专注分享软件开发、Web 前端技术、编程工具使用心得和开发经验。以及实用的开发工具推荐和使用技巧，助力自我与广大开发者共同提升技能。",
  descEn: "Gaazeon's tech blog, focusing on software development, web frontend technologies, programming tools, and development experience. Practical development tool recommendations and usage tips to help developers improve their skills together.",
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
  adsenseID: "ca-pub-4340594748765829", // Your AdSense Publisher ID
} as const;
