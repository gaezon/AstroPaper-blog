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
  adsenseID?: string;
  /**
   * 文档书写方向，默认为 ltr，可选值 'ltr' | 'rtl' | 'auto'
   */
  dir?: string;
}

export type SocialObjects = {
  name: string;
  href: string;
  icon: string;
  linkTitle: string;
}[]; 