export type TocHeading = {
  depth: number;
  slug: string;
  text: string;
};

export type TocItem = TocHeading & {
  children: TocItem[];
};
