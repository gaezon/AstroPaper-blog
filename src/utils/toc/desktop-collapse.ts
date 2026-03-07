import {
  TOC_DESKTOP_BREAKPOINT_QUERY,
  TOC_IDS,
  TOC_TRANSITION_FALLBACK_SLACK_MS,
} from "@/utils/toc/constants";
import type { ScrollSpyController } from "@/utils/toc/scrollspy";

interface SetupDesktopCollapseOptions {
  scrollSpy: ScrollSpyController;
}

function parseCssTime(time: string): number {
  if (time.endsWith("ms")) {
    return parseFloat(time);
  }

  if (time.endsWith("s")) {
    return parseFloat(time) * 1000;
  }

  return 0;
}

function getTransitionDurationMs(element: HTMLElement): number {
  const styles = getComputedStyle(element);
  const durations = styles.transitionDuration
    .split(",")
    .map(value => value.trim())
    .map(parseCssTime);
  const delays = styles.transitionDelay
    .split(",")
    .map(value => value.trim())
    .map(parseCssTime);
  const totals = durations.map(
    (duration, index) => duration + (delays[index] || 0)
  );

  return Math.max(...totals, 0);
}

export function setupDesktopCollapse({
  scrollSpy,
}: SetupDesktopCollapseOptions): { cleanup: () => void } {
  const aside = document.getElementById(TOC_IDS.sidebar);
  const collapseButton = document.getElementById(TOC_IDS.collapse);
  const openButton = document.getElementById(TOC_IDS.openDesktop);

  if (!aside || !collapseButton || !openButton) {
    return { cleanup: () => {} };
  }

  const isDesktop = window.matchMedia(TOC_DESKTOP_BREAKPOINT_QUERY).matches;
  openButton.style.display = "none";

  if (isDesktop) {
    aside.style.display = "";
    aside.classList.add("xl:block");
    aside.setAttribute("aria-hidden", "false");
  }

  const prefersReducedMotion =
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const effectiveDuration = prefersReducedMotion
    ? 0
    : getTransitionDurationMs(aside);
  let disposed = false;
  let transitionFallbackId: number | null = null;
  let transitionEndHandler: ((event: TransitionEvent) => void) | null = null;
  let showAsideRafId: number | null = null;

  const clearPendingTransition = () => {
    if (showAsideRafId !== null) {
      cancelAnimationFrame(showAsideRafId);
      showAsideRafId = null;
    }

    if (transitionEndHandler) {
      aside.removeEventListener("transitionend", transitionEndHandler);
      transitionEndHandler = null;
    }

    if (transitionFallbackId !== null) {
      window.clearTimeout(transitionFallbackId);
      transitionFallbackId = null;
    }
  };

  const clearAnimationState = () => {
    aside.style.transition = "";
    aside.style.willChange = "";
    aside.style.transform = "";
    aside.style.opacity = "";
    aside.style.pointerEvents = "";
    aside.removeAttribute("data-animating");
  };

  const setTransitionState = (
    state: "entering" | "entered" | "exiting" | "exited"
  ) => {
    aside.classList.remove(
      "toc-entering",
      "toc-entered",
      "toc-exiting",
      "toc-exited"
    );
    aside.classList.add(`toc-${state}`);
    aside.setAttribute("data-toc-state", state);
  };

  const runTransition = (finalize: () => void) => {
    if (disposed) {
      return;
    }

    if (prefersReducedMotion) {
      finalize();
      return;
    }

    let finalized = false;

    const onTransitionEnd = (event: TransitionEvent) => {
      if (
        event.target === aside &&
        (event.propertyName === "opacity" || event.propertyName === "transform")
      ) {
        doFinalize();
      }
    };

    const doFinalize = () => {
      if (finalized || disposed) {
        return;
      }

      finalized = true;
      clearPendingTransition();
      finalize();
    };

    transitionEndHandler = onTransitionEnd;
    transitionFallbackId = window.setTimeout(() => {
      doFinalize();
    }, effectiveDuration + TOC_TRANSITION_FALLBACK_SLACK_MS);

    if (effectiveDuration > 0) {
      aside.addEventListener("transitionend", transitionEndHandler);
    } else {
      doFinalize();
    }
  };

  const hideAside = () => {
    if (disposed || aside.dataset.animating === "true") {
      return;
    }

    const activeElement = document.activeElement;
    const hadFocusInside =
      activeElement instanceof Element && aside.contains(activeElement);

    aside.dataset.animating = "true";
    scrollSpy.pause();
    collapseButton.setAttribute("aria-expanded", "false");
    openButton.setAttribute("aria-expanded", "false");
    aside.setAttribute("aria-hidden", "true");
    aside.setAttribute("inert", "");
    aside.style.pointerEvents = "none";
    setTransitionState("exiting");

    runTransition(() => {
      aside.style.display = "none";
      openButton.style.display = "inline-flex";
      setTransitionState("exited");

      if (hadFocusInside) {
        openButton.focus({ preventScroll: true });
      }

      clearAnimationState();
      scrollSpy.resume();
    });
  };

  const showAside = () => {
    if (disposed || aside.dataset.animating === "true") {
      return;
    }

    aside.dataset.animating = "true";
    scrollSpy.pause();
    aside.style.display = "";
    aside.setAttribute("inert", "");
    collapseButton.setAttribute("aria-expanded", "true");
    openButton.setAttribute("aria-expanded", "true");
    setTransitionState("entering");

    showAsideRafId = requestAnimationFrame(() => {
      showAsideRafId = null;

      if (disposed) {
        return;
      }

      runTransition(() => {
        aside.removeAttribute("inert");
        aside.setAttribute("aria-hidden", "false");
        openButton.style.display = "none";
        collapseButton.focus({ preventScroll: true });
        clearAnimationState();
        scrollSpy.resume();
      });
      setTransitionState("entered");
    });
  };

  collapseButton.addEventListener("click", hideAside);
  openButton.addEventListener("click", showAside);

  return {
    cleanup: () => {
      disposed = true;
      clearPendingTransition();
      clearAnimationState();
      collapseButton.removeEventListener("click", hideAside);
      openButton.removeEventListener("click", showAside);
    },
  };
}
