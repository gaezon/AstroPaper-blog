export interface Site {
  website: string;
  author: string;
  desc: string;
  descEn?: string; // 英文网站描述
  profile?: string;
  title: string;
  titleEn?: string; // 英文网站标题
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
