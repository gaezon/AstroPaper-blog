import {
  TOC_DEFAULT_TOGGLE_BOTTOM_PX,
  TOC_DESKTOP_SAFE_BOTTOM_PX,
  TOC_IDS,
  TOC_MOBILE_BREAKPOINT_PX,
  TOC_MOBILE_SAFE_BOTTOM_PX,
} from "@/utils/toc/constants";

export function setupTocToggleOverlapAvoidance(): () => void {
  const toggle = document.getElementById(TOC_IDS.toggle);

  if (!toggle) {
    return () => {};
  }

  let overlapRafId: number | null = null;
  let overlapNeedsUpdate = false;
  let mutationObserver: MutationObserver | null = null;

  const resetOverlapState = () => {
    if (overlapRafId !== null) {
      cancelAnimationFrame(overlapRafId);
      overlapRafId = null;
    }

    overlapNeedsUpdate = false;
  };

  const avoidOverlap = () => {
    if (overlapRafId === null) {
      overlapRafId = requestAnimationFrame(() => {
        let bottom = TOC_DEFAULT_TOGGLE_BOTTOM_PX;
        const backToTopContainer = document.getElementById(
          TOC_IDS.backToTopContainer
        );
        const isMobile = window.innerWidth < TOC_MOBILE_BREAKPOINT_PX;

        if (isMobile) {
          bottom = TOC_MOBILE_SAFE_BOTTOM_PX;
        } else if (backToTopContainer) {
          const toggleRect = toggle.getBoundingClientRect();
          const backToTopRect = backToTopContainer.getBoundingClientRect();
          const isBackToTopVisible =
            !backToTopContainer.classList.contains("opacity-0") &&
            !backToTopContainer.classList.contains("translate-y-14");

          if (isBackToTopVisible) {
            const overlap = !(
              toggleRect.right < backToTopRect.left ||
              toggleRect.left > backToTopRect.right ||
              toggleRect.bottom < backToTopRect.top ||
              toggleRect.top > backToTopRect.bottom
            );

            if (overlap) {
              bottom = TOC_DESKTOP_SAFE_BOTTOM_PX;
            }
          }
        }

        toggle.style.bottom = `${bottom}px`;
        overlapRafId = null;

        if (overlapNeedsUpdate) {
          overlapNeedsUpdate = false;
          avoidOverlap();
        }
      });
    } else {
      overlapNeedsUpdate = true;
    }
  };

  avoidOverlap();

  const handleResize = () => {
    avoidOverlap();
  };
  const handleScroll = () => {
    avoidOverlap();
  };

  window.addEventListener("resize", handleResize);
  window.addEventListener("scroll", handleScroll, { passive: true });

  const backToTopContainer = document.getElementById(
    TOC_IDS.backToTopContainer
  );
  if (window.MutationObserver && backToTopContainer) {
    mutationObserver = new MutationObserver(() => {
      avoidOverlap();
    });
    mutationObserver.observe(backToTopContainer, {
      attributes: true,
      attributeFilter: ["class"],
      childList: false,
      subtree: false,
    });
  }

  return () => {
    window.removeEventListener("resize", handleResize);
    window.removeEventListener("scroll", handleScroll);
    mutationObserver?.disconnect();
    mutationObserver = null;
    resetOverlapState();
  };
}
