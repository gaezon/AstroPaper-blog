import type { CollectionEntry } from "astro:content";

export interface PaginatedPageUrl {
  current: string;
  prev: string | undefined;
  next: string | undefined;
  first: string | undefined;
  last: string | undefined;
}

export interface PaginatedPage<T> {
  data: T[];
  start: number;
  end: number;
  total: number;
  currentPage: number;
  size: number;
  lastPage: number;
  url: PaginatedPageUrl;
}

export type BlogEntry = CollectionEntry<"blog" | "blog-en">;
export type BlogPaginatedPage = PaginatedPage<BlogEntry>;

export interface BlogPaginatedPageProps {
  page: BlogPaginatedPage;
}

export interface BlogTagPaginatedPageProps extends BlogPaginatedPageProps {
  tagName: string;
}
