export interface Site {
  website: string;
  author: string;
  desc: string;
  descEn?: string; // English site description
  profile?: string;
  title: string;
  titleEn?: string; // English site title
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
   * Document writing direction; default 'ltr'. Options: 'ltr' | 'rtl' | 'auto'
   */
  dir?: string;
}

export type SocialObjects = {
  name: string;
  href: string;
  icon: string;
  linkTitle: string;
}[];
