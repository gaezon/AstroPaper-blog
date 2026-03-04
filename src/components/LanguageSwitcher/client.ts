const PREFERRED_LOCALE_KEY = "preferred-locale";
const cleanupFns: (() => void)[] = [];

if (typeof window !== "undefined") {
  document.addEventListener("astro:before-swap", () => {
    cleanupFns.forEach(fn => fn());
    cleanupFns.length = 0;
  });
}

export function persistPreferredLocale(locale: string): boolean {
  if (typeof window === "undefined") return false;
  try {
    window.localStorage.setItem(PREFERRED_LOCALE_KEY, locale);
    return true;
  } catch {
    return false;
  }
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

function openDropdown(dropdown: Element) {
  closeDropdowns();
  setDropdownState(dropdown, true);
}

function preserveCurrentUrlParts(dropdown: Element) {
  if (typeof window === "undefined") return;

  const links = dropdown.querySelectorAll<HTMLAnchorElement>(
    ".lang-dropdown-item[data-base-href]"
  );

  links.forEach(link => {
    const baseHref = link.dataset.baseHref;
    if (!baseHref) return;

    const nextUrl = new URL(baseHref, window.location.origin);

    if (!nextUrl.search && window.location.search) {
      nextUrl.search = window.location.search;
    }

    if (!nextUrl.hash && window.location.hash) {
      nextUrl.hash = window.location.hash;
    }

    link.href = `${nextUrl.pathname}${nextUrl.search}${nextUrl.hash}`;
  });
}

export function initLanguageSwitcher() {
  cleanupFns.forEach(fn => fn());
  cleanupFns.length = 0;

  const dropdowns = document.querySelectorAll(".language-switcher-dropdown");

  dropdowns.forEach(dropdown => {
    preserveCurrentUrlParts(dropdown);

    const button = dropdown.querySelector(
      "[data-dropdown-toggle]"
    ) as HTMLElement;
    if (!button) return;

    const localeLinks = dropdown.querySelectorAll<HTMLAnchorElement>(
      ".lang-dropdown-item[data-locale]"
    );

    localeLinks.forEach(link => {
      const locale = link.dataset.locale;
      if (!locale) return;

      const localeClickHandler = () => {
        persistPreferredLocale(locale);
      };

      link.addEventListener("click", localeClickHandler);
      cleanupFns.push(() => {
        link.removeEventListener("click", localeClickHandler);
      });
    });

    const clickHandler = (e: Event) => {
      e.stopPropagation();
      const isOpen = dropdown.getAttribute("data-open") === "true";
      if (!isOpen) {
        openDropdown(dropdown);
      } else {
        setDropdownState(dropdown, false);
      }
    };

    button.addEventListener("click", clickHandler);
    cleanupFns.push(() => {
      button.removeEventListener("click", clickHandler);
    });

    const focusoutHandler = (e: FocusEvent) => {
      const nextFocused = e.relatedTarget as Node | null;
      if (!nextFocused || !dropdown.contains(nextFocused)) {
        setDropdownState(dropdown, false);
      }
    };

    const keydownHandler = (e: Event) => {
      const keyboardEvent = e as KeyboardEvent;
      if (
        keyboardEvent.key === "Escape" &&
        dropdown.getAttribute("data-open") === "true"
      ) {
        setDropdownState(dropdown, false);
        button.focus();
        keyboardEvent.preventDefault();
      }
    };

    dropdown.addEventListener("focusout", focusoutHandler as EventListener);
    dropdown.addEventListener("keydown", keydownHandler as EventListener);
    cleanupFns.push(() => {
      dropdown.removeEventListener(
        "focusout",
        focusoutHandler as EventListener
      );
      dropdown.removeEventListener("keydown", keydownHandler as EventListener);
    });
  });

  document.addEventListener("click", closeDropdowns);
  cleanupFns.push(() => {
    document.removeEventListener("click", closeDropdowns);
  });
}
