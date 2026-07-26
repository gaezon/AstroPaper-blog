import { setupTocToggleOverlapAvoidance } from "@/utils/toc/avoid-overlap";
import {
  TOC_HEADING_SELECTOR,
  TOC_IDS,
  TOC_INIT_MAX_RETRIES,
  TOC_INIT_RETRY_INTERVAL_MS,
} from "@/utils/toc/constants";
import { setupDesktopCollapse } from "@/utils/toc/desktop-collapse";
import { setupMobileDrawer } from "@/utils/toc/mobile-drawer";
import { setupTocNavigation } from "@/utils/toc/navigation";
import { setupScrollSpy } from "@/utils/toc/scrollspy";
import type { MutableFlag, MutableTimeout } from "@/utils/toc/types";

let activeCleanup: (() => void) | null = null;
let initScheduled = false;
let currentInitId = 0;

function cleanupToc(options: { invalidatePending?: boolean } = {}): void {
  if (options.invalidatePending) {
    currentInitId += 1;
  }

  if (activeCleanup) {
    activeCleanup();
    activeCleanup = null;
  }
}

async function waitForTocElements(
  initId: number,
  maxRetries: number,
  intervalMs: number
): Promise<{ desktopNav: HTMLElement; mobileNav: HTMLElement } | null> {
  const hasTocShell =
    document.getElementById(TOC_IDS.sidebar) !== null ||
    document.getElementById(TOC_IDS.toggle) !== null ||
    document.getElementById(TOC_IDS.openDesktop) !== null;

  if (!hasTocShell) {
    return null;
  }

  let attempt = 0;

  while (attempt < maxRetries) {
    if (initId !== currentInitId) {
      return null;
    }

    const desktopNav = document.getElementById(TOC_IDS.desktopNav);
    const mobileNav = document.getElementById(TOC_IDS.mobileNav);
    const hasHeadings = document.querySelector(TOC_HEADING_SELECTOR) !== null;
    const hasTocLinks =
      desktopNav?.querySelector('a[href^="#"]') instanceof HTMLAnchorElement;

    if (desktopNav && mobileNav && hasHeadings && hasTocLinks) {
      return { desktopNav, mobileNav };
    }

    attempt += 1;
    await new Promise(resolve => window.setTimeout(resolve, intervalMs));
  }

  return null;
}

function updateVisibility(hasToc: boolean): void {
  const sidebar = document.getElementById(TOC_IDS.sidebar);
  const toggle = document.getElementById(TOC_IDS.toggle);
  const openDesktop = document.getElementById(TOC_IDS.openDesktop);

  if (!hasToc) {
    if (sidebar) {
      sidebar.style.display = "none";
    }

    if (toggle) {
      toggle.style.display = "none";
    }

    if (openDesktop) {
      openDesktop.style.display = "none";
    }

    return;
  }

  if (sidebar) {
    sidebar.style.display = "";
    sidebar.classList.add("xl:block");
  }

  if (toggle) {
    toggle.style.display = "";
    toggle.classList.add("xl:hidden");
  }

  if (openDesktop) {
    openDesktop.style.display = "none";
  }
}

async function initializeTocWithRetry(
  initId: number,
  maxRetries: number = TOC_INIT_MAX_RETRIES,
  intervalMs: number = TOC_INIT_RETRY_INTERVAL_MS
): Promise<void> {
  cleanupToc();
  const tocElements = await waitForTocElements(initId, maxRetries, intervalMs);

  if (initId !== currentInitId) {
    return;
  }

  updateVisibility(Boolean(tocElements));

  if (!tocElements) {
    return;
  }

  const { desktopNav, mobileNav } = tocElements;

  const scrollingState: MutableFlag = { value: false };
  const scrollTimeoutRef: MutableTimeout = { value: null };

  const mobileDrawer = setupMobileDrawer();
  const navigation = setupTocNavigation({
    desktopNav,
    mobileNav,
    scrollingState,
    scrollTimeoutRef,
    onMobileNavigate: () => mobileDrawer.close(),
  });
  const scrollSpy = setupScrollSpy({
    scrollingState,
    linkMap: navigation.linkMap,
  });
  const desktopCollapse = setupDesktopCollapse({ scrollSpy });
  const overlapCleanup = setupTocToggleOverlapAvoidance();

  activeCleanup = () => {
    if (scrollTimeoutRef.value !== null) {
      window.clearTimeout(scrollTimeoutRef.value);
      scrollTimeoutRef.value = null;
    }

    overlapCleanup();
    desktopCollapse.cleanup();
    scrollSpy.cleanup();
    navigation.cleanup();
    mobileDrawer.cleanup();
  };
}

function queueInit(): void {
  if (initScheduled) {
    return;
  }

  initScheduled = true;
  window.setTimeout(() => {
    initScheduled = false;
    currentInitId += 1;
    void initializeTocWithRetry(currentInitId);
  }, 0);
}

function registerLifecycle(): void {
  if (
    document.readyState === "complete" ||
    document.readyState === "interactive"
  ) {
    window.setTimeout(queueInit, 0);
  } else {
    document.addEventListener("DOMContentLoaded", queueInit, { once: true });
  }

  document.addEventListener("astro:before-swap", () => {
    cleanupToc({ invalidatePending: true });
  });
  // astro:page-load fires on both initial load and every ClientRouter
  // navigation (after the swap completes), so a separate astro:after-swap
  // listener would only queue a redundant second init.
  document.addEventListener("astro:page-load", queueInit);
}

registerLifecycle();
