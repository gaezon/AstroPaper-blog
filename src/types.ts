export interface Site {
  website: string;
  author: string;
  desc: string;
  profile?: string;
  title: string;
  ogImage?: string;
  lightAndDarkMode: boolean;
  postPerIndex: number;
  postPerPage: number;
  scheduledPostMargin: number;
  showArchives: boolean;
  showBackButton: boolean;
  editPost: {
    enabled: boolean;
    text: string;
    url: string;
  };
  dynamicOgImage: boolean;
  lang?: string;
  timezone: string;
  dir?: "ltr" | "rtl" | "auto";
}

export type SocialObjects = {
  name: string;
  href: string;
  icon: string;
  linkTitle: string;
}[]; 