import {
  TOC_ACTIVE_CLASSES,
  TOC_INACTIVE_CLASSES,
  TOC_SCROLL_RESET_DELAY_MS,
} from "@/utils/toc/constants";

/**
 * Scroll utility functions for consistent scroll behavior across components.
 *
 * This module provides reusable functions for:
 * - RAF-throttled scroll event listeners
 * - Scroll position and percentage calculations
 * - TOC (Table of Contents) click handling
 * - Active state management for navigation links
 */

/**
 * Creates a scroll event listener with requestAnimationFrame throttling.
 *
 * @param target - The event target (document, window, etc.)
 * @param handler - Function to call when scroll event occurs (throttled)
 * @param options - Event listener options (defaults to { passive: true })
 * @returns Cleanup function to remove the event listener
 *
 * @example
 * ```ts
 * const cleanup = createThrottledScrollListener(document, () => {
 *   console.log('Scrolled!');
 * });
 * // Later, to clean up:
 * cleanup();
 * ```
 */
export function createThrottledScrollListener(
  target: EventTarget,
  handler: () => void,
  options: AddEventListenerOptions = { passive: true }
): () => void {
  let ticking = false;

  const scrollHandler = () => {
    if (!ticking) {
      window.requestAnimationFrame(() => {
        handler();
        ticking = false;
      });
      ticking = true;
    }
  };

  target.addEventListener("scroll", scrollHandler as EventListener, options);

  // Return cleanup function
  return () => {
    target.removeEventListener(
      "scroll",
      scrollHandler as EventListener,
      options
    );
  };
}

/**
 * Shared page-scroll dispatcher: one passive, RAF-throttled document scroll
 * listener that fans out to all subscribers (progress bar, back-to-top, TOC
 * overlap avoidance, ...), instead of each feature attaching its own listener
 * and RAF loop.
 *
 * The underlying listener is attached lazily on first subscribe and detached
 * when the last subscriber unsubscribes.
 *
 * @param handler - Called at most once per animation frame while scrolling
 * @returns Cleanup function to unsubscribe
 */
const scrollSubscribers = new Set<() => void>();
let sharedScrollCleanup: (() => void) | null = null;

export function subscribeToPageScroll(handler: () => void): () => void {
  scrollSubscribers.add(handler);

  if (!sharedScrollCleanup) {
    sharedScrollCleanup = createThrottledScrollListener(document, () => {
      for (const subscriber of scrollSubscribers) {
        subscriber();
      }
    });
  }

  return () => {
    scrollSubscribers.delete(handler);

    if (scrollSubscribers.size === 0 && sharedScrollCleanup) {
      sharedScrollCleanup();
      sharedScrollCleanup = null;
    }
  };
}

/**
 * Calculates the absolute scroll position to a target element with offset.
 *
 * @param target - The target HTML element
 * @param offset - Offset in pixels (default: -120px to avoid fixed header)
 * @returns Absolute scroll position in pixels
 *
 * @example
 * ```ts
 * const element = document.getElementById('my-heading');
 * const scrollPosition = calculateScrollPosition(element, -120);
 * window.scrollTo({ top: scrollPosition, behavior: 'smooth' });
 * ```
 */
export function calculateScrollPosition(
  target: HTMLElement,
  offset: number = -120
): number {
  return target.getBoundingClientRect().top + window.pageYOffset + offset;
}

/**
 * Smoothly scrolls to a target element or position.
 *
 * @param targetOrPosition - Target element or absolute position in pixels
 * @param offset - Offset in pixels (only used when first param is an element)
 *
 * @example
 * ```ts
 * // Scroll to element
 * smoothScrollTo(document.getElementById('section1'), -120);
 *
 * // Scroll to position
 * smoothScrollTo(500);
 * ```
 */
export function smoothScrollTo(
  targetOrPosition: HTMLElement | number,
  offset?: number
): void {
  const position =
    typeof targetOrPosition === "number"
      ? targetOrPosition
      : calculateScrollPosition(targetOrPosition, offset);

  window.scrollTo({ top: position, behavior: "smooth" });
}

/**
 * Calculates the current scroll percentage.
 *
 * @param container - Scroll container (defaults to document.documentElement)
 * @returns Scroll percentage (0-100)
 *
 * @example
 * ```ts
 * const percent = calculateScrollPercent();
 * console.log(`Scrolled ${percent}% of the page`);
 * ```
 */
export function calculateScrollPercent(container?: HTMLElement): number {
  const rootElement = container || document.documentElement;
  const scrollTotal = rootElement.scrollHeight - rootElement.clientHeight;
  const scrollTop = rootElement.scrollTop;

  if (scrollTotal === 0) return 0;

  return Math.floor((scrollTop / scrollTotal) * 100);
}

/**
 * Interface for scroll information.
 */
export interface ScrollInfo {
  scrollTop: number;
  scrollHeight: number;
  clientHeight: number;
  scrollPercent: number;
}

/**
 * Gets comprehensive scroll information.
 *
 * @param container - Scroll container (defaults to document.documentElement)
 * @returns Scroll information object
 *
 * @example
 * ```ts
 * const info = getScrollInfo();
 * console.log(`Current scroll: ${info.scrollTop}px`);
 * console.log(`Total height: ${info.scrollHeight}px`);
 * console.log(`Progress: ${info.scrollPercent}%`);
 * ```
 */
export function getScrollInfo(container?: HTMLElement): ScrollInfo {
  const rootElement = container || document.documentElement;

  const scrollTop = rootElement.scrollTop;
  const scrollHeight = rootElement.scrollHeight;
  const clientHeight = rootElement.clientHeight;
  const scrollPercent = calculateScrollPercent(rootElement);

  return { scrollTop, scrollHeight, clientHeight, scrollPercent };
}

/**
 * Updates TOC active state for both desktop and mobile navigation.
 *
 * @param activeLink - The link element to activate
 * @param options - Configuration options
 *
 * @example
 * ```ts
 * updateTocActiveState(clickedLink, {
 *   desktopNavId: 'toc-nav',
 *   mobileNavId: 'toc-nav-mobile',
 *   clearAll: true
 * });
 * ```
 */
export function updateTocActiveState(
  activeLink: HTMLAnchorElement,
  options?: {
    desktopNavId?: string;
    mobileNavId?: string;
    clearAll?: boolean;
  }
): void {
  const {
    desktopNavId = "toc-nav",
    mobileNavId = "toc-nav-mobile",
    clearAll = true,
  } = options || {};

  const activeClasses = [...TOC_ACTIVE_CLASSES];
  const inactiveClasses = [...TOC_INACTIVE_CLASSES];

  if (clearAll) {
    // Clear all active states from both navs
    const allActiveLinks = document.querySelectorAll(
      `#${desktopNavId} a.active, #${mobileNavId} a.active`
    );

    allActiveLinks.forEach(el => {
      el.classList.remove(...activeClasses);
      el.classList.add(...inactiveClasses);
      el.removeAttribute("aria-current");
    });
  }

  // Activate the new link
  activeLink.classList.remove(...inactiveClasses);
  activeLink.classList.add(...activeClasses);
  activeLink.setAttribute("aria-current", "true");

  // Find and activate the corresponding link in the other nav
  const href = activeLink.getAttribute("href");
  if (href) {
    const otherNavId =
      activeLink.closest(`#${desktopNavId}`) !== null
        ? mobileNavId
        : desktopNavId;
    const otherLink = document.querySelector(
      `#${otherNavId} a[href="${href}"]`
    );

    if (otherLink instanceof HTMLAnchorElement) {
      otherLink.classList.remove(...inactiveClasses);
      otherLink.classList.add(...activeClasses);
      otherLink.setAttribute("aria-current", "true");
    }
  }
}

/**
 * Options for creating a TOC click handler.
 */
export interface CreateTocClickHandlerOptions {
  /** Desktop navigation container ID */
  desktopNavId?: string;
  /** Mobile navigation container ID */
  mobileNavId?: string;
  /** Scroll offset in pixels (default: -120) */
  offset?: number;
  /** Callback to execute after click (e.g., close mobile drawer) */
  onClick?: () => void;
  /** Reference to scrolling flag (for IO coordination) */
  scrollingFlag: { value: boolean };
  /** Reference to timeout ID */
  timeoutRef: { value: number | null };
}

/**
 * Creates a TOC (Table of Contents) click handler.
 *
 * This function handles:
 * - Calculating scroll position with offset
 * - Updating active states for both desktop and mobile TOC
 * - Smooth scrolling to target
 * - Managing scroll flag to prevent IntersectionObserver interference
 *
 * @param options - Configuration options
 * @returns Click event handler function
 *
 * @example
 * ```ts
 * const scrollingState = { value: false };
 * const scrollTimeout = { value: null };
 *
 * link.addEventListener('click', (e) => {
 *   const handler = createTocClickHandler({
 *     desktopNavId: 'toc-nav',
 *     mobileNavId: 'toc-nav-mobile',
 *     offset: -120,
 *     scrollingFlag: scrollingState,
 *     timeoutRef: scrollTimeout,
 *     onClick: () => console.log('Clicked!')
 *   });
 *   handler(e, link);
 * });
 * ```
 */
export function createTocClickHandler(
  options: CreateTocClickHandlerOptions
): (e: MouseEvent, link: HTMLAnchorElement) => void {
  const {
    desktopNavId = "toc-nav",
    mobileNavId = "toc-nav-mobile",
    offset = -120,
    onClick,
    scrollingFlag,
    timeoutRef,
  } = options;

  return (e: MouseEvent, link: HTMLAnchorElement) => {
    e.preventDefault();

    const href = link.getAttribute("href");
    if (!href) return;

    const target = document.querySelector(href);
    if (!(target instanceof HTMLElement)) return;

    // Set scrolling flag to prevent IntersectionObserver interference
    scrollingFlag.value = true;

    // Clear any existing timeout
    if (timeoutRef.value !== null) {
      window.clearTimeout(timeoutRef.value);
    }

    // Calculate scroll position with offset
    const y = calculateScrollPosition(target, offset);

    // Update active state for both desktop and mobile TOC
    updateTocActiveState(link, {
      desktopNavId,
      mobileNavId,
      clearAll: true,
    });

    // Smooth scroll to target
    window.scrollTo({ top: y, behavior: "smooth" });

    // Execute optional callback (e.g., close mobile drawer)
    if (onClick) {
      onClick();
    }

    // Reset scrolling flag after scroll completes
    timeoutRef.value = window.setTimeout(() => {
      scrollingFlag.value = false;
      timeoutRef.value = null;
    }, TOC_SCROLL_RESET_DELAY_MS);
  };
}
