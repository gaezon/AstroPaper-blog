/**
 * Back-to-top button: visibility toggle and conic-gradient scroll progress
 * ring, driven by the shared page-scroll dispatcher. Re-initialized on
 * view-transition navigation.
 */
import { subscribeToPageScroll } from "@/utils/scroll";

let cleanupScrollListener: (() => void) | null = null;

function backToTop() {
  cleanupScrollListener?.();
  cleanupScrollListener = null;

  const rootElement = document.documentElement;
  const btnContainer =
    document.querySelector<HTMLElement>("#btt-btn-container");
  const backToTopBtn = document.querySelector<HTMLButtonElement>(
    "[data-button='back-to-top']"
  );
  const progressIndicator = document.querySelector<HTMLElement>(
    "#progress-indicator"
  );

  if (!rootElement || !btnContainer || !backToTopBtn || !progressIndicator)
    return;

  // Attach click event handler for back-to-top button
  backToTopBtn.addEventListener("click", () => {
    document.body.scrollTop = 0; // For Safari
    document.documentElement.scrollTop = 0; // For Chrome, Firefox, IE and Opera
  });

  // Handle button visibility according to scroll position
  let lastVisible: boolean | null = null;
  function handleScroll() {
    const scrollTotal = rootElement.scrollHeight - rootElement.clientHeight;
    const scrollTop = rootElement.scrollTop;
    const scrollPercent = Math.floor((scrollTop / scrollTotal) * 100);

    progressIndicator!.style.setProperty(
      "background-image",
      `conic-gradient(var(--accent), var(--accent) ${scrollPercent}%, transparent ${scrollPercent}%)`
    );

    const isVisible = scrollTop / scrollTotal > 0.3;

    if (isVisible !== lastVisible) {
      btnContainer!.classList.toggle("opacity-100", isVisible);
      btnContainer!.classList.toggle("translate-y-0", isVisible);
      btnContainer!.classList.toggle("opacity-0", !isVisible);
      btnContainer!.classList.toggle("translate-y-14", !isVisible);
      lastVisible = isVisible;
    }
  }

  cleanupScrollListener = subscribeToPageScroll(handleScroll);

  handleScroll();
}

backToTop();
document.addEventListener("astro:page-load", backToTop);
