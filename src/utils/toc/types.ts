import type { TocItem } from "@/utils/extractToc";

export type { TocItem };

export interface TocLinkPair {
  desktop?: HTMLAnchorElement;
  mobile?: HTMLAnchorElement;
}

export interface MutableFlag {
  value: boolean;
}

export interface MutableTimeout {
  value: number | null;
}
