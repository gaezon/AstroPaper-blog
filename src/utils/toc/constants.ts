export const TOC_HEADING_SELECTOR = "#article h2";

export const TOC_IDS = {
  sidebar: "toc-sidebar",
  toggle: "toc-toggle",
  openDesktop: "toc-open-desktop",
  desktopNav: "toc-nav",
  mobileNav: "toc-nav-mobile",
  overlay: "toc-overlay",
  close: "toc-close",
  collapse: "toc-collapse",
  backToTopContainer: "btt-btn-container",
} as const;

export const TOC_ACTIVE_CLASSES = [
  "active",
  "text-accent",
  "bg-muted/40",
  "border-accent",
  "font-semibold",
] as const;

export const TOC_INACTIVE_CLASSES = [
  "text-muted",
  "border-transparent",
] as const;

export const TOC_SCROLL_OFFSET = -120;
export const TOC_SCROLL_RESET_DELAY_MS = 1200;
export const TOC_TRANSITION_FALLBACK_SLACK_MS = 120;
export const TOC_INIT_MAX_RETRIES = 20;
export const TOC_INIT_RETRY_INTERVAL_MS = 100;

export const TOC_MOBILE_BREAKPOINT_PX = 640;
export const TOC_DESKTOP_BREAKPOINT_QUERY = "(min-width: 1280px)";
export const TOC_DEFAULT_TOGGLE_BOTTOM_PX = 24;
export const TOC_MOBILE_SAFE_BOTTOM_PX = 112;
export const TOC_DESKTOP_SAFE_BOTTOM_PX = 96;
