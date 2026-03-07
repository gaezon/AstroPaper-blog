import { TOC_IDS } from "@/utils/toc/constants";

const FOCUSABLE_SELECTOR = [
  "a[href]",
  "button:not([disabled])",
  "input:not([disabled])",
  "select:not([disabled])",
  "textarea:not([disabled])",
  '[tabindex]:not([tabindex="-1"])',
].join(", ");

export interface MobileDrawerController {
  cleanup: () => void;
  close: () => void;
}

export function setupMobileDrawer(): MobileDrawerController {
  const toggle = document.getElementById(TOC_IDS.toggle);
  const overlay = document.getElementById(TOC_IDS.overlay);
  const closeButton = document.getElementById(TOC_IDS.close);

  if (!toggle || !overlay || !closeButton) {
    return {
      cleanup: () => {},
      close: () => {},
    };
  }

  const slidePanel = overlay.querySelector(".transform");

  const getFocusableElements = (): HTMLElement[] => {
    const focusRoot =
      slidePanel instanceof HTMLElement ? slidePanel : (overlay as HTMLElement);

    return Array.from(
      focusRoot.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR)
    ).filter(
      element => !element.hasAttribute("inert") && element.tabIndex !== -1
    );
  };

  const setClosedA11yState = () => {
    overlay.setAttribute("aria-hidden", "true");
    overlay.setAttribute("inert", "");
    if (slidePanel instanceof HTMLElement) {
      slidePanel.setAttribute("aria-hidden", "true");
    }
  };

  const setOpenA11yState = () => {
    overlay.setAttribute("aria-hidden", "false");
    overlay.removeAttribute("inert");
    if (slidePanel instanceof HTMLElement) {
      slidePanel.setAttribute("aria-hidden", "false");
    }
  };

  setClosedA11yState();

  const open = () => {
    setOpenA11yState();
    overlay.classList.remove("opacity-0", "pointer-events-none");
    overlay.classList.add("opacity-100", "pointer-events-auto");

    if (slidePanel) {
      slidePanel.classList.remove("translate-x-full");
      slidePanel.classList.add("translate-x-0");
    }

    toggle.setAttribute("aria-expanded", "true");
    closeButton.focus({ preventScroll: true });
  };

  const close = () => {
    const activeElement = document.activeElement;
    const shouldRestoreFocus =
      activeElement instanceof Element && overlay.contains(activeElement);

    overlay.classList.add("opacity-0", "pointer-events-none");
    overlay.classList.remove("opacity-100", "pointer-events-auto");

    if (slidePanel) {
      slidePanel.classList.add("translate-x-full");
      slidePanel.classList.remove("translate-x-0");
    }

    toggle.setAttribute("aria-expanded", "false");
    setClosedA11yState();

    if (shouldRestoreFocus && toggle instanceof HTMLElement) {
      toggle.focus({ preventScroll: true });
    }
  };

  const handleOverlayClick = (event: MouseEvent) => {
    if (event.target === overlay) {
      close();
    }
  };

  const handleKeydown = (event: KeyboardEvent) => {
    if (event.key === "Escape" && !overlay.classList.contains("opacity-0")) {
      close();
      return;
    }

    if (event.key !== "Tab" || overlay.classList.contains("opacity-0")) {
      return;
    }

    const focusableElements = getFocusableElements();
    if (focusableElements.length === 0) {
      event.preventDefault();
      closeButton.focus({ preventScroll: true });
      return;
    }

    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];
    const activeElement = document.activeElement;

    if (event.shiftKey) {
      if (activeElement === firstElement || !overlay.contains(activeElement)) {
        event.preventDefault();
        lastElement.focus({ preventScroll: true });
      }
      return;
    }

    if (activeElement === lastElement) {
      event.preventDefault();
      firstElement.focus({ preventScroll: true });
    }
  };

  toggle.addEventListener("click", open);
  closeButton.addEventListener("click", close);
  overlay.addEventListener("click", handleOverlayClick);
  document.addEventListener("keydown", handleKeydown);

  return {
    cleanup: () => {
      toggle.removeEventListener("click", open);
      closeButton.removeEventListener("click", close);
      overlay.removeEventListener("click", handleOverlayClick);
      document.removeEventListener("keydown", handleKeydown);
    },
    close,
  };
}
