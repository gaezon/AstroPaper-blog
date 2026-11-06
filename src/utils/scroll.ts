/**
 * Scroll utility functions for consistent scroll behavior across components.
 */

/**
 * Creates a scroll event listener with requestAnimationFrame throttling.
 *
 * @param target - The event target (document, window, etc.)
 * @param handler - Function to call when scroll event occurs (throttled)
 * @param options - Event listener options (defaults to { passive: true })
 * @returns Cleanup function to remove the event listener
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
 * listener that fans out to all subscribers (TOC, back-to-top, ...), instead
 * of each feature attaching its own listener and RAF loop.
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
