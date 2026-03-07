import { createTocClickHandler } from "@/utils/scroll";
import { TOC_IDS, TOC_SCROLL_OFFSET } from "@/utils/toc/constants";
import type {
  MutableFlag,
  MutableTimeout,
  TocLinkPair,
} from "@/utils/toc/types";

interface SetupTocNavigationOptions {
  desktopNav: HTMLElement;
  mobileNav: HTMLElement;
  scrollingState: MutableFlag;
  scrollTimeoutRef: MutableTimeout;
  onMobileNavigate: () => void;
}

export interface TocNavigationController {
  cleanup: () => void;
  linkMap: Map<string, TocLinkPair>;
}

function getAnchorId(link: HTMLAnchorElement): string | null {
  const href = link.getAttribute("href");
  if (!href || !href.startsWith("#")) {
    return null;
  }

  return href.slice(1);
}

function buildLinkMap(
  desktopNav: HTMLElement,
  mobileNav: HTMLElement
): Map<string, TocLinkPair> {
  const linkMap = new Map<string, TocLinkPair>();

  desktopNav
    .querySelectorAll<HTMLAnchorElement>('a[href^="#"]')
    .forEach(link => {
      const id = getAnchorId(link);
      if (!id) {
        return;
      }

      linkMap.set(id, { ...(linkMap.get(id) || {}), desktop: link });
    });

  mobileNav
    .querySelectorAll<HTMLAnchorElement>('a[href^="#"]')
    .forEach(link => {
      const id = getAnchorId(link);
      if (!id) {
        return;
      }

      linkMap.set(id, { ...(linkMap.get(id) || {}), mobile: link });
    });

  return linkMap;
}

export function setupTocNavigation({
  desktopNav,
  mobileNav,
  scrollingState,
  scrollTimeoutRef,
  onMobileNavigate,
}: SetupTocNavigationOptions): TocNavigationController {
  const cleanups: Array<() => void> = [];
  const linkMap = buildLinkMap(desktopNav, mobileNav);
  const desktopClickHandler = createTocClickHandler({
    desktopNavId: TOC_IDS.desktopNav,
    mobileNavId: TOC_IDS.mobileNav,
    offset: TOC_SCROLL_OFFSET,
    scrollingFlag: scrollingState,
    timeoutRef: scrollTimeoutRef,
  });
  const mobileClickHandler = createTocClickHandler({
    desktopNavId: TOC_IDS.desktopNav,
    mobileNavId: TOC_IDS.mobileNav,
    offset: TOC_SCROLL_OFFSET,
    onClick: onMobileNavigate,
    scrollingFlag: scrollingState,
    timeoutRef: scrollTimeoutRef,
  });

  const createDelegatedClickListener = (
    container: HTMLElement,
    clickHandler: ReturnType<typeof createTocClickHandler>
  ) => {
    return (event: MouseEvent) => {
      const target = event.target;
      if (!(target instanceof Element)) {
        return;
      }

      const link = target.closest<HTMLAnchorElement>('a[href^="#"]');
      if (!link || !container.contains(link)) {
        return;
      }

      clickHandler(event, link);
    };
  };

  const desktopClickListener = createDelegatedClickListener(
    desktopNav,
    desktopClickHandler
  );
  const mobileClickListener = createDelegatedClickListener(
    mobileNav,
    mobileClickHandler
  );

  desktopNav.addEventListener("click", desktopClickListener);
  mobileNav.addEventListener("click", mobileClickListener);
  cleanups.push(() => {
    desktopNav.removeEventListener("click", desktopClickListener);
  });
  cleanups.push(() => {
    mobileNav.removeEventListener("click", mobileClickListener);
  });

  return {
    cleanup: () => {
      cleanups.forEach(cleanup => cleanup());
    },
    linkMap,
  };
}
