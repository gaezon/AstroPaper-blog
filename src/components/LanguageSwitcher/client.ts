const PREFERRED_LOCALE_KEY = "preferred-locale";

const cleanupFns: (() => void)[] = [];

// Global listener for view transitions to ensure cleanup runs
if (typeof window !== "undefined") {
  document.addEventListener("astro:before-swap", () => {
    cleanupFns.forEach(fn => fn());
    cleanupFns.length = 0;
  });
}

const LANGUAGE_SWITCHER_SELECTOR =
  ".language-switcher-dropdown a[data-base-href], .language-switcher-compact a[data-base-href], .language-switcher-toggle a[data-base-href]";

/**
 * Persist the user's preferred locale to localStorage
 * @param locale - The locale code to save (e.g., "en", "zh-cn")
 */
export function persistPreferredLocale(locale: string): boolean {
  if (typeof window === "undefined") return false;
  try {
    window.localStorage.setItem(PREFERRED_LOCALE_KEY, locale);
    return true;
  } catch (error) {
    if (import.meta.env.DEV) {
      // eslint-disable-next-line no-console
      console.warn("[LanguageSwitcher] Failed to persist locale:", error);
    }
    return false;
  }
}

/**
 * Bind click event listeners to all links with the data-locale attribute
 * When a user clicks a language switch link, save their preference to localStorage
 *
 * This function prevents duplicate binding by checking data attributes
 * and cleans up listeners on component re-initialization or view transition
 */
function bindLocaleListeners() {
  if (typeof window === "undefined") return;
  const selector = "[data-locale]";

  document.querySelectorAll(selector).forEach(link => {
    const anchor = link as HTMLAnchorElement;
    if (anchor.dataset.localeListener === "true") return;

    const clickHandler = () => {
      const locale = anchor.dataset.locale;
      if (!locale) return;
      persistPreferredLocale(locale);
    };

    anchor.addEventListener("click", clickHandler);
    anchor.dataset.localeListener = "true";

    // Register cleanup to remove the listener on re-initialization or view transition
    cleanupFns.push(() => {
      anchor.removeEventListener("click", clickHandler);
      delete anchor.dataset.localeListener;
    });
  });
}

function setDropdownState(dropdown: Element, isOpen: boolean) {
  dropdown.setAttribute("data-open", String(isOpen));
  const button = dropdown.querySelector("[data-dropdown-toggle]");
  if (button) {
    button.setAttribute("aria-expanded", String(isOpen));
  }
}

function closeDropdowns() {
  const dropdowns = document.querySelectorAll(".language-switcher-dropdown");
  dropdowns.forEach(dropdown => {
    if (dropdown.getAttribute("data-open") === "true") {
      setDropdownState(dropdown, false);
    }
  });
}

function closeOtherDropdowns(current: Element) {
  const dropdowns = document.querySelectorAll(".language-switcher-dropdown");
  dropdowns.forEach(dropdown => {
    if (dropdown !== current && dropdown.getAttribute("data-open") === "true") {
      setDropdownState(dropdown, false);
    }
  });
}

function openDropdown(dropdown: Element) {
  closeOtherDropdowns(dropdown);
  setDropdownState(dropdown, true);
}

function focusMenuItem(menuItems: HTMLElement[], idx: number) {
  if (menuItems.length === 0) return;
  const clampedIdx = Math.max(0, Math.min(idx, menuItems.length - 1));
  try {
    menuItems[clampedIdx].focus();
  } catch (error) {
    if (import.meta.env.DEV) {
      // eslint-disable-next-line no-console
      console.warn(
        "[LanguageSwitcher] Failed to focus menu item:",
        error,
        menuItems[clampedIdx]
      );
    }
  }
}

function handleButtonActivation(event: KeyboardEvent, dropdown: Element) {
  const isOpen = dropdown.getAttribute("data-open") === "true";
  if (isOpen) {
    setDropdownState(dropdown, false);
  } else {
    openDropdown(dropdown);
    // Do not move focus to menu items on Enter/Space, per ARIA best practices
  }
  event.preventDefault();
}

function handleMenuItemActivation(
  event: KeyboardEvent,
  dropdown: Element,
  item: HTMLElement
) {
  // Trigger click for both anchor and button elements
  if (item.tagName === "A" || item.tagName === "BUTTON") {
    item.click();
    setDropdownState(dropdown, false);
    event.preventDefault();
  }
}

function getFallbackHref(baseHref: string, search: string, hash: string) {
  // fallback: careful string concatenation
  const sanitized = baseHref.replace(/[?#].*$/, "");

  // Preserves existing path structure (including trailing slashes) by only stripping query params and hash.
  // ("/path/" + "?query=1" should become "/path/?query=1")

  let newFallbackHref = sanitized;
  if (search) {
    newFallbackHref += search;
  }
  if (hash) {
    newFallbackHref += hash;
  }
  if (import.meta.env.DEV) {
    // eslint-disable-next-line no-console
    console.warn(
      `[LanguageSwitcher] Fallback produced href "${newFallbackHref}" for baseHref "${baseHref}".`
    );
  }
  return newFallbackHref;
}

function syncQueryParams() {
  if (typeof window === "undefined") return;
  const search = window.location.search;
  const hash = window.location.hash;
  if (!search && !hash) return;

  const selector = LANGUAGE_SWITCHER_SELECTOR;
  document.querySelectorAll(selector).forEach(link => {
    const anchor = link as HTMLAnchorElement;
    const baseHref = anchor.getAttribute("data-base-href");
    if (
      !baseHref ||
      baseHref.startsWith("http") ||
      baseHref.startsWith("mailto:")
    ) {
      return;
    }

    let newHref: string;
    try {
      // Use the URL API to parse and reconstruct the URL
      // Use window.location.href as base to correctly handle both root-relative and relative paths
      const url = new URL(baseHref, window.location.href);

      url.search = search;
      url.hash = hash;

      // Always return relative path format for consistency
      newHref = url.pathname + url.search + url.hash;
    } catch (err) {
      // Fallback to previous behavior if URL parsing fails
      // Log a warning to help debug potential inconsistencies
      if (import.meta.env.DEV) {
        // eslint-disable-next-line no-console
        console.warn(
          `[LanguageSwitcher] Failed to parse baseHref "${baseHref}" with error:`,
          err
        );
      }
      newHref = getFallbackHref(baseHref, search, hash);
    }
    anchor.setAttribute("href", newHref);
  });
}

/**
 * Initialize all interactive features of the language switcher component
 *
 * This function is responsible for:
 * - Syncing URL query parameters to all language switch links
 * - Setting up click toggling for dropdown menus
 * - Adding keyboard navigation support (ArrowDown/ArrowUp to open and navigate; Tab handled via focusout)
 * - Handling outside clicks to close dropdowns
 * - Registering cleanup logic for Astro view transitions
 *
 * This function automatically cleans up previous listeners and is safe to call multiple times
 */
export function initLanguageSwitcher() {
  // Clear any existing cleanup functions from previous runs
  // Prevent unbounded growth by limiting cleanupFns size (though we clear it here)
  const cleanupFnsLength = cleanupFns.length;
  cleanupFns.forEach(fn => fn());
  cleanupFns.length = 0;

  if (cleanupFnsLength > 100) {
    if (import.meta.env.DEV) {
      // eslint-disable-next-line no-console
      console.warn(
        `[LanguageSwitcher] cleanupFns grew unexpectedly large (${cleanupFnsLength}), clearing.`
      );
      // eslint-disable-next-line no-console
      console.trace("[LanguageSwitcher] cleanupFns growth stack trace");
    }
  }

  // Handle dropdown menus
  const dropdowns = document.querySelectorAll(".language-switcher-dropdown");

  dropdowns.forEach(dropdown => {
    const button = dropdown.querySelector(
      "[data-dropdown-toggle]"
    ) as HTMLElement;
    if (!button) return;

    const clickHandler = (e: Event) => {
      e.stopPropagation();
      const isOpen = dropdown.getAttribute("data-open") === "true";

      // Toggle the current dropdown
      if (!isOpen) {
        openDropdown(dropdown);
      } else {
        setDropdownState(dropdown, false);
      }
    };

    button.addEventListener("click", clickHandler);

    // Add cleanup function
    cleanupFns.push(() => {
      button.removeEventListener("click", clickHandler);
    });
  });

  // Close dropdown when clicking outside
  // Note: This listener is not capturing, but button click handlers stop propagation.
  // This is intentional: clicking a button toggles it explicitly, so we don't want this listener to interfere.
  document.addEventListener("click", closeDropdowns);

  // Register cleanup to always remove the global click listener
  cleanupFns.push(() => {
    document.removeEventListener("click", closeDropdowns);
  });

  // Keyboard navigation support
  dropdowns.forEach(dropdown => {
    const button = dropdown.querySelector(
      "[data-dropdown-toggle]"
    ) as HTMLElement;
    const menu = dropdown.querySelector(".lang-dropdown-menu");

    if (!button || !menu) return;

    // Prevent duplicate listeners
    // We attach to the dropdown container to capture events from both button and menu items
    const container = dropdown as HTMLElement;

    // Handle focusout to close dropdown when tabbing away
    const focusoutHandler = (event: FocusEvent) => {
      const isMenuOpen = dropdown.getAttribute("data-open") === "true";
      if (!isMenuOpen) return;

      // Use relatedTarget to reliably detect where focus is moving
      if (
        !event.relatedTarget ||
        !container.contains(event.relatedTarget as Node)
      ) {
        setDropdownState(dropdown, false);
      }
    };

    const keydownHandler = (event: KeyboardEvent) => {
      const isMenuOpen = dropdown.getAttribute("data-open") === "true";

      // Only recalculate menuItems for navigation-related keys when menu is open,
      // or for ArrowDown/ArrowUp (which may open the menu)

      // If menu is not open and key is not ArrowDown/ArrowUp/Enter/Space, do nothing
      if (
        !isMenuOpen &&
        event.key !== "ArrowDown" &&
        event.key !== "ArrowUp" &&
        event.key !== "Enter" &&
        event.key !== " "
      ) {
        return;
      }

      // Helper to get menu items only when needed
      const getMenuItems = () =>
        Array.from(
          menu.querySelectorAll("a, button, [tabindex]:not([tabindex='-1'])")
        ) as HTMLElement[];

      switch (event.key) {
        case "Escape":
          if (isMenuOpen) {
            setDropdownState(dropdown, false);
            button.focus();
            event.preventDefault();
          }
          break;

        case "Tab":
          // Tab key uses default browser focus movement.
          // Menu remains open when tabbing between menu items.
          // Menu closes only when focus moves outside the dropdown container, handled by the focusout event.
          break;

        case "ArrowDown": {
          const items = getMenuItems();
          if (!isMenuOpen) {
            openDropdown(dropdown);
            // If opening via keyboard, focus first item
            if (items.length > 0) focusMenuItem(items, 0);
          } else if (items.length > 0) {
            const currentIdx = items.findIndex(
              item => item === document.activeElement
            );
            if (currentIdx === -1) {
              focusMenuItem(items, 0);
            } else {
              // Clamp to end, do not wrap
              focusMenuItem(items, Math.min(currentIdx + 1, items.length - 1));
            }
          }
          event.preventDefault();
          break;
        }

        case "ArrowUp": {
          const items = getMenuItems();
          if (!isMenuOpen) {
            openDropdown(dropdown);
            // If opening via keyboard, focus last item
            if (items.length > 0) focusMenuItem(items, items.length - 1);
          } else if (items.length > 0) {
            const currentIdx = items.findIndex(
              item => item === document.activeElement
            );
            if (currentIdx === -1) {
              focusMenuItem(items, items.length - 1);
            } else {
              // Clamp to start, do not wrap
              focusMenuItem(items, Math.max(currentIdx - 1, 0));
            }
          }
          event.preventDefault();
          break;
        }

        case "Home": {
          const items = getMenuItems();
          if (isMenuOpen && items.length > 0) {
            focusMenuItem(items, 0);
            event.preventDefault();
          }
          break;
        }

        case "End": {
          const items = getMenuItems();
          if (isMenuOpen && items.length > 0) {
            focusMenuItem(items, items.length - 1);
            event.preventDefault();
          }
          break;
        }

        case "Enter":
        case " ": {
          // If focus is on the button, toggle
          if (document.activeElement === button) {
            handleButtonActivation(event, dropdown);
          }
          // Handle menu items: activate on Enter or Space
          else {
            const items = getMenuItems();
            const currentIdx = items.findIndex(
              item => item === document.activeElement
            );
            if (currentIdx !== -1 && items[currentIdx]) {
              handleMenuItemActivation(event, dropdown, items[currentIdx]);
            }
          }
          break;
        }

        default:
          break;
      }
    };

    // Attach keydown listener
    container.addEventListener("keydown", keydownHandler);
    cleanupFns.push(() => {
      container.removeEventListener("keydown", keydownHandler);
    });

    // Attach focusout listener
    container.addEventListener("focusout", focusoutHandler as EventListener);
    cleanupFns.push(() => {
      container.removeEventListener(
        "focusout",
        focusoutHandler as EventListener
      );
    });
  });

  syncQueryParams();
  bindLocaleListeners();
}
