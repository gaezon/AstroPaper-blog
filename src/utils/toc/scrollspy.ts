import { updateTocActiveState } from "@/utils/scroll";
import {
  TOC_HEADING_SELECTOR,
  TOC_IDS,
  TOC_SCROLL_OFFSET,
} from "@/utils/toc/constants";
import type { MutableFlag, TocLinkPair } from "@/utils/toc/types";

interface SetupScrollSpyOptions {
  scrollingState: MutableFlag;
  linkMap: Map<string, TocLinkPair>;
}

export interface ScrollSpyController {
  cleanup: () => void;
  pause: () => void;
  resume: () => void;
}

export function setupScrollSpy({
  scrollingState,
  linkMap,
}: SetupScrollSpyOptions): ScrollSpyController {
  const headings = Array.from(
    document.querySelectorAll<HTMLElement>(TOC_HEADING_SELECTOR)
  ).filter(heading => linkMap.has(heading.id));
  let observer: IntersectionObserver | null = null;

  const connect = () => {
    if (headings.length === 0) {
      return;
    }

    observer?.disconnect();
    observer = new IntersectionObserver(
      entries => {
        if (scrollingState.value) {
          return;
        }

        entries.forEach(entry => {
          if (!entry.isIntersecting) {
            return;
          }

          const id = (entry.target as HTMLElement).id;
          const linkPair = linkMap.get(id);
          const activeLink = linkPair?.desktop || linkPair?.mobile;

          if (activeLink) {
            updateTocActiveState(activeLink, {
              desktopNavId: TOC_IDS.desktopNav,
              mobileNavId: TOC_IDS.mobileNav,
              clearAll: true,
            });
          }
        });
      },
      {
        rootMargin: `${TOC_SCROLL_OFFSET}px 0px -60% 0px`,
        threshold: [0, 0.1, 0.5],
      }
    );

    headings.forEach(heading => observer?.observe(heading));
  };

  connect();

  return {
    cleanup: () => {
      observer?.disconnect();
      observer = null;
    },
    pause: () => {
      observer?.disconnect();
    },
    resume: () => {
      connect();
    },
  };
}
