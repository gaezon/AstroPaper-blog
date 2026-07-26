/**
 * Mobile navigation dialog: open/close, focus trap, viewport sync.
 * I18n labels are read from data attributes on #menu-btn (see Header.astro).
 */

type NavWithCleanup = HTMLElement & { __headerNavCleanup?: () => void };

function toggleNav() {
  const menuBtn = document.querySelector<HTMLButtonElement>("#menu-btn");
  const menuNav = document.querySelector<NavWithCleanup>("#nav-menu");
  const menuPanel = document.querySelector<HTMLElement>("#menu-panel");
  const menuClose = document.querySelector<HTMLButtonElement>("#menu-close");

  if (!menuBtn || !menuNav || !menuPanel || !menuClose) return;

  const menuLabel = menuBtn.dataset.menuLabel ?? "Menu";
  const closeLabel = menuBtn.dataset.closeLabel ?? "Close";

  menuNav.__headerNavCleanup?.();

  const mobileQuery = window.matchMedia("(max-width: 639px)");
  let restoreFocus = false;
  const focusableSelector = [
    "a[href]",
    "button:not([disabled])",
    "input:not([disabled])",
    "select:not([disabled])",
    "textarea:not([disabled])",
    '[tabindex]:not([tabindex="-1"])',
  ].join(", ");

  const setClosedMobileA11y = () => {
    menuNav.setAttribute("aria-hidden", "true");
    menuNav.setAttribute("inert", "");
    menuNav.removeAttribute("role");
    menuNav.removeAttribute("aria-modal");
    menuNav.removeAttribute("aria-labelledby");
  };

  const setOpenMobileA11y = () => {
    menuNav.setAttribute("role", "dialog");
    menuNav.setAttribute("aria-modal", "true");
    menuNav.setAttribute("aria-labelledby", "menu-panel-title");
    menuNav.setAttribute("aria-hidden", "false");
    menuNav.removeAttribute("inert");
  };

  const unlockScroll = () => {
    document.documentElement.classList.remove("overflow-hidden");
  };

  const openMenu = () => {
    if (!mobileQuery.matches) return;

    restoreFocus = true;
    setOpenMobileA11y();
    menuNav.classList.remove("hidden");
    menuNav.classList.add("flex");
    document.documentElement.classList.add("overflow-hidden");
    menuBtn.setAttribute("aria-expanded", "true");
    menuBtn.setAttribute("aria-label", closeLabel);
    menuClose.focus({ preventScroll: true });
  };

  const closeMenu = () => {
    menuNav.classList.add("hidden");
    menuNav.classList.remove("flex");
    unlockScroll();
    menuBtn.setAttribute("aria-expanded", "false");
    menuBtn.setAttribute("aria-label", menuLabel);
    setClosedMobileA11y();

    if (restoreFocus) {
      restoreFocus = false;
      menuBtn.focus({ preventScroll: true });
    }
  };

  const syncViewport = () => {
    if (mobileQuery.matches) {
      if (menuBtn.getAttribute("aria-expanded") === "true") {
        setOpenMobileA11y();
        menuNav.classList.remove("hidden");
        menuNav.classList.add("flex");
      } else {
        closeMenu();
      }
      return;
    }

    restoreFocus = false;
    unlockScroll();
    menuNav.classList.remove("hidden", "flex");
    menuNav.removeAttribute("aria-hidden");
    menuNav.removeAttribute("inert");
    menuNav.removeAttribute("role");
    menuNav.removeAttribute("aria-modal");
    menuNav.removeAttribute("aria-labelledby");
    menuBtn.setAttribute("aria-expanded", "false");
    menuBtn.setAttribute("aria-label", menuLabel);
  };

  const handleMenuButtonClick = () => {
    const isOpen = menuBtn.getAttribute("aria-expanded") === "true";
    if (isOpen) {
      closeMenu();
    } else {
      openMenu();
    }
  };

  const handleOverlayClick = (event: MouseEvent) => {
    if (
      mobileQuery.matches &&
      menuBtn.getAttribute("aria-expanded") === "true" &&
      event.target === menuNav
    ) {
      closeMenu();
    }
  };

  const isVisibleFocusable = (element: Element) => {
    if (!(element instanceof HTMLElement)) return false;
    if (
      element.hasAttribute("disabled") ||
      element.getAttribute("aria-hidden") === "true"
    ) {
      return false;
    }

    if (typeof element.checkVisibility === "function") {
      return element.checkVisibility({
        checkOpacity: false,
        checkVisibilityCSS: true,
      });
    }

    const style = window.getComputedStyle(element);
    return (
      style.display !== "none" &&
      style.visibility !== "hidden" &&
      element.getClientRects().length > 0
    );
  };

  const getFocusableElements = () =>
    Array.from(
      menuPanel.querySelectorAll<HTMLElement>(focusableSelector)
    ).filter(isVisibleFocusable);

  const isMenuOpen = () =>
    mobileQuery.matches && menuBtn.getAttribute("aria-expanded") === "true";

  const trapMenuFocus = (event: KeyboardEvent) => {
    if (event.key !== "Tab") return;

    const focusableElements = getFocusableElements();
    if (!focusableElements.length) {
      event.preventDefault();
      menuClose.focus({ preventScroll: true });
      return;
    }

    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];
    const activeElement = document.activeElement;

    if (event.shiftKey) {
      if (
        activeElement === firstElement ||
        !menuPanel.contains(activeElement)
      ) {
        event.preventDefault();
        lastElement.focus({ preventScroll: true });
      }
      return;
    }

    if (activeElement === lastElement || !menuPanel.contains(activeElement)) {
      event.preventDefault();
      firstElement.focus({ preventScroll: true });
    }
  };

  const handleKeydown = (event: KeyboardEvent) => {
    if (!isMenuOpen()) return;

    if (event.key === "Escape") {
      closeMenu();
      return;
    }

    trapMenuFocus(event);
  };

  const handleMediaChange = () => {
    syncViewport();
  };

  menuBtn.addEventListener("click", handleMenuButtonClick);
  menuClose.addEventListener("click", closeMenu);
  menuNav.addEventListener("click", handleOverlayClick);
  document.addEventListener("keydown", handleKeydown);
  mobileQuery.addEventListener("change", handleMediaChange);

  syncViewport();

  menuNav.__headerNavCleanup = () => {
    menuBtn.removeEventListener("click", handleMenuButtonClick);
    menuClose.removeEventListener("click", closeMenu);
    menuNav.removeEventListener("click", handleOverlayClick);
    document.removeEventListener("keydown", handleKeydown);
    mobileQuery.removeEventListener("change", handleMediaChange);
    unlockScroll();
  };
}

toggleNav();

// Runs on view transitions navigation
document.addEventListener("astro:after-swap", toggleNav);
