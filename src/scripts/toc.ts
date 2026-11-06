import { subscribeToPageScroll } from "@/utils/scroll";

const READING_LINE = 96;
const REDUCED_MOTION_QUERY = "(prefers-reduced-motion: reduce)";

let cleanup: (() => void) | undefined;

function initToc() {
  cleanup?.();
  cleanup = undefined;

  const fab = document.getElementById("post-fab");
  const button = fab?.querySelector<HTMLButtonElement>("button");
  const progress = fab?.querySelector<HTMLElement>(".post-fab-progress");
  const popover = document.getElementById("toc-popover");
  const sideNav = document.querySelector<HTMLElement>(".toc-side > nav");
  const menuButton = document.getElementById("menu-btn");

  if (!fab || !button || !progress) return;

  const root = document.documentElement;
  const supportsPopover = "showPopover" in HTMLElement.prototype;
  const sideTocStickyTop = sideNav
    ? Number.parseFloat(getComputedStyle(sideNav).top) || 0
    : 0;
  const hasTocButton = button.hasAttribute("data-has-toc");
  const opensToc = hasTocButton && supportsPopover;
  const openLabel =
    button.dataset.openLabel ?? button.getAttribute("aria-label") ?? "";
  const closeLabel = button.dataset.closeLabel ?? openLabel;
  const backLabel = button.dataset.backLabel ?? openLabel;

  // Without popover support, keep a useful button on small screens instead of
  // leaving a dead TOC control (the side TOC still works at >= 80rem).
  if (hasTocButton && !supportsPopover) {
    button.setAttribute("data-no-popover", "");
    button.removeAttribute("popovertarget");
    button.removeAttribute("aria-controls");
    button.removeAttribute("aria-expanded");
    button.setAttribute("aria-label", backLabel);
  }

  const links = Array.from(
    document.querySelectorAll<HTMLAnchorElement>("[data-toc-nav] a[href^='#']")
  );
  const headings = [
    ...new Set(links.map(link => decodeURIComponent(link.hash.slice(1)))),
  ]
    .map(id => document.getElementById(id))
    .filter((heading): heading is HTMLElement => heading !== null);

  const scrollToTop = () => {
    root.scrollTop = 0;
    document.body.scrollTop = 0;
  };

  const closePopover = () => {
    if (!supportsPopover || !popover) return;
    if (popover.matches(":popover-open")) {
      popover.hidePopover();
    }
  };

  const setPopoverState = (open: boolean) => {
    if (!opensToc) return;
    button.setAttribute("aria-expanded", String(open));
    button.setAttribute("aria-label", open ? closeLabel : openLabel);
  };

  const onButtonClick = () => {
    if (!opensToc) scrollToTop();
  };

  const onDocumentClick = (event: Event) => {
    const target = event.target;
    if (!(target instanceof Element)) return;

    if (target.closest("[data-back-to-top]")) {
      scrollToTop();
      closePopover();
    } else if (target.closest(".toc-popover a")) {
      closePopover();
    }
  };

  const onPopoverToggle = (event: Event) => {
    const open = (event as Event & { newState?: string }).newState === "open";
    setPopoverState(open);
    if (!open) return;

    const list = popover?.querySelector<HTMLElement>("nav > ol");
    if (!list) return;

    const active = list.querySelector<HTMLElement>("[aria-current]");
    if (active && list.scrollHeight > list.clientHeight) {
      list.scrollTop = active.offsetTop - list.clientHeight / 2;
    }
  };

  const onMenuClick = () => closePopover();

  let activeId: string | null = null;
  let frame = 0;
  let lastVisible: boolean | null = null;

  const update = () => {
    // Hide the FAB while the side TOC is both present and in view. Once the
    // article (and its sticky TOC) scrolls away, show it again so wide screens
    // keep a back-to-top / TOC entry near the comments. A nav left as a sliver
    // above the sticky line no longer counts as usable.
    const sideTocOutOfView = sideNav
      ? sideNav.offsetWidth === 0 ||
        sideNav.getBoundingClientRect().bottom <= sideTocStickyTop
      : true;
    fab.toggleAttribute("data-side-toc-hidden", sideTocOutOfView);
    // A popover left open would outlive the button that closes it.
    if (fab.offsetWidth === 0) closePopover();

    const scrollTotal = root.scrollHeight - root.clientHeight;
    const ratio = scrollTotal > 0 ? root.scrollTop / scrollTotal : 0;
    progress.style.setProperty("--progress", `${ratio * 100}%`);

    // A TOC button is useful from the start; back to top only once scrolled.
    const isVisible = opensToc || ratio > 0.3;
    if (isVisible !== lastVisible) {
      fab.toggleAttribute("data-visible", isVisible);
      lastVisible = isVisible;
    }

    // The active section is the last heading that has scrolled above this line.
    const atBottom = root.scrollTop + innerHeight >= root.scrollHeight - 2;
    let current: HTMLElement | null = null;
    for (const heading of headings) {
      if (heading.getBoundingClientRect().top > READING_LINE) break;
      current = heading;
    }
    if (atBottom) current = headings[headings.length - 1] ?? current;

    const id = current?.id ?? null;
    if (id === activeId) return;
    activeId = id;

    for (const link of links) {
      const isActive = decodeURIComponent(link.hash.slice(1)) === id;
      if (isActive) link.setAttribute("aria-current", "true");
      else link.removeAttribute("aria-current");

      // Keep the active item in view when the TOC itself scrolls.
      const list = link.closest<HTMLElement>(
        ":is(.toc-side, .toc-popover) nav > ol"
      );
      if (isActive && list && list.scrollHeight > list.clientHeight) {
        const top = link.offsetTop - list.clientHeight / 2;
        const reduced = matchMedia(REDUCED_MOTION_QUERY).matches;
        list.scrollTo({ top, behavior: reduced ? "auto" : "smooth" });
      }
    }
  };

  const schedule = () => {
    if (!frame) {
      frame = requestAnimationFrame(() => {
        frame = 0;
        update();
      });
    }
  };

  button.addEventListener("click", onButtonClick);
  document.addEventListener("click", onDocumentClick);
  popover?.addEventListener("toggle", onPopoverToggle);
  menuButton?.addEventListener("click", onMenuClick);
  const unsubscribeScroll = subscribeToPageScroll(update);
  addEventListener("resize", schedule);
  update();

  cleanup = () => {
    closePopover();
    unsubscribeScroll();
    button.removeEventListener("click", onButtonClick);
    document.removeEventListener("click", onDocumentClick);
    popover?.removeEventListener("toggle", onPopoverToggle);
    menuButton?.removeEventListener("click", onMenuClick);
    removeEventListener("resize", schedule);
    cancelAnimationFrame(frame);
    frame = 0;
  };
}

document.addEventListener("astro:page-load", initToc);
document.addEventListener("astro:before-swap", () => cleanup?.());
