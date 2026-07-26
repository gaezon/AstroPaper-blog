/**
 * Post page enhancements: heading anchor links, copy-code buttons, and an
 * accessible image lightbox. Previously an is:inline script duplicated into
 * every post's HTML; now bundled once and re-initialized per navigation.
 *
 * I18n labels are read from data attributes on the #article element
 * (see PostDetails.astro).
 */

type LightboxLabels = {
  zoomImage: string;
  imagePreview: string;
  closeImagePreview: string;
};

const prefersReducedMotion = () =>
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/** Attaches links to headings in the document,
 *  allowing sharing of sections easily */
function addHeadingLinks() {
  const headings = Array.from(document.querySelectorAll("h2, h3, h4, h5, h6"));
  for (const heading of headings) {
    if (heading.querySelector(".heading-link")) continue;
    heading.classList.add("group");
    const link = document.createElement("a");
    link.className =
      "heading-link ms-2 no-underline opacity-75 md:opacity-0 md:group-hover:opacity-100 md:focus:opacity-100";
    link.href = "#" + heading.id;

    const span = document.createElement("span");
    span.ariaHidden = "true";
    span.innerText = "#";
    link.appendChild(span);
    heading.appendChild(link);
  }
}

/** Attaches copy buttons to code blocks in the document,
 * allowing users to copy code easily. */
function attachCopyButtons(copyCodeLabel: string, copiedCodeLabel: string) {
  const codeBlocks = Array.from(document.querySelectorAll("pre"));

  const copyCode = async (block: HTMLPreElement, button: HTMLButtonElement) => {
    const code = block.querySelector("code");
    const text = code?.innerText;

    await navigator.clipboard.writeText(text ?? "");

    // visual feedback that task is completed
    button.innerText = copiedCodeLabel;

    setTimeout(() => {
      button.innerText = copyCodeLabel;
    }, 700);
  };

  for (const codeBlock of codeBlocks) {
    if (codeBlock.querySelector(".copy-code")) continue;

    const wrapper = document.createElement("div");
    wrapper.style.position = "relative";

    // Check if --file-name-offset custom property exists
    const computedStyle = getComputedStyle(codeBlock);
    const hasFileNameOffset =
      computedStyle.getPropertyValue("--file-name-offset").trim() !== "";

    // Determine the top positioning class
    const topClass = hasFileNameOffset ? "top-(--file-name-offset)" : "-top-3";

    const copyButton = document.createElement("button");
    copyButton.className = `copy-code absolute end-3 ${topClass} rounded bg-muted border border-muted px-2 py-1 text-xs leading-4 text-foreground font-medium`;
    copyButton.innerHTML = copyCodeLabel;
    codeBlock.setAttribute("tabindex", "0");
    codeBlock.appendChild(copyButton);

    // wrap codebock with relative parent element
    codeBlock?.parentNode?.insertBefore(wrapper, codeBlock);
    wrapper.appendChild(codeBlock);

    copyButton.addEventListener("click", async () => {
      await copyCode(codeBlock, copyButton);
    });
  }
}

/** Module-scoped close handle so a lightbox opened on the previous page can be
 * torn down before a view-transition swap. */
let closeActiveLightbox: (() => void) | null = null;

/** Accessible image lightbox for article images. */
function initLightbox(article: HTMLElement, labels: LightboxLabels) {
  if (article.dataset.lightboxBound === "true") return;
  article.dataset.lightboxBound = "true";

  let overlay: HTMLDivElement | null = null;
  let lastFocused: HTMLElement | null = null;

  requestAnimationFrame(() => {
    const images = Array.from(article.querySelectorAll("img"));
    for (const image of images) {
      if (image.closest("a")) continue;
      image.setAttribute("role", "button");
      image.setAttribute("tabindex", "0");
      image.setAttribute("aria-haspopup", "dialog");
      image.setAttribute(
        "aria-label",
        image.alt ? `${labels.zoomImage}: ${image.alt}` : labels.zoomImage
      );
    }
  });

  function open(src: string, alt: string, trigger: HTMLElement | null) {
    if (overlay) return;
    lastFocused =
      trigger ??
      (document.activeElement instanceof HTMLElement
        ? document.activeElement
        : null);

    overlay = document.createElement("div");
    overlay.setAttribute("role", "dialog");
    overlay.setAttribute("aria-modal", "true");
    overlay.setAttribute(
      "aria-label",
      alt ? `${labels.imagePreview}: ${alt}` : labels.imagePreview
    );
    overlay.className =
      "fixed inset-0 z-50 flex cursor-zoom-out items-center justify-center bg-black/70 opacity-0 backdrop-blur-sm transition-opacity duration-200 motion-reduce:transition-none";

    const closeButton = document.createElement("button");
    closeButton.type = "button";
    closeButton.setAttribute("aria-label", labels.closeImagePreview);
    closeButton.className =
      "absolute end-4 top-4 rounded p-2 text-3xl leading-none text-white";
    closeButton.innerHTML = "&#10005;";
    closeButton.addEventListener("click", close);

    const image = document.createElement("img");
    image.src = src;
    image.alt = "";
    image.className =
      "max-h-[90dvh] max-w-[90dvw] cursor-default object-contain";

    let currentScale = 1;
    let translateX = 0;
    let translateY = 0;
    let initialDist = 0;
    let initialScale = 1;
    let panStartX = 0;
    let panStartY = 0;
    let panStartTranslateX = 0;
    let panStartTranslateY = 0;
    let lastTapTime = 0;

    function applyTransform() {
      image.style.transform = `scale(${currentScale}) translate(${translateX}px, ${translateY}px)`;
    }

    function resetTransform() {
      currentScale = 1;
      translateX = 0;
      translateY = 0;
      image.style.transform = "";
    }

    overlay.append(closeButton, image);
    overlay.addEventListener("click", e => {
      if (e.target === overlay && currentScale <= 1) close();
    });

    overlay.addEventListener(
      "touchstart",
      e => {
        const touches = e.touches;
        if (touches.length === 2) {
          initialDist = Math.hypot(
            touches[1].clientX - touches[0].clientX,
            touches[1].clientY - touches[0].clientY
          );
          initialScale = currentScale;
        } else if (touches.length === 1) {
          const now = Date.now();
          if (now - lastTapTime < 300) {
            e.preventDefault();
            if (currentScale > 1) {
              resetTransform();
            } else {
              currentScale = 2;
              translateX = 0;
              translateY = 0;
              applyTransform();
            }
            lastTapTime = 0;
            panStartX = touches[0].clientX;
            panStartY = touches[0].clientY;
            panStartTranslateX = translateX;
            panStartTranslateY = translateY;
          } else {
            lastTapTime = now;
            if (currentScale > 1) {
              panStartX = touches[0].clientX;
              panStartY = touches[0].clientY;
              panStartTranslateX = translateX;
              panStartTranslateY = translateY;
            }
          }
        }
      },
      { passive: false }
    );

    overlay.addEventListener(
      "touchmove",
      e => {
        if (!overlay) return;
        const touches = e.touches;
        if (touches.length === 2) {
          e.preventDefault();
          const dist = Math.hypot(
            touches[1].clientX - touches[0].clientX,
            touches[1].clientY - touches[0].clientY
          );
          currentScale = Math.min(
            4,
            Math.max(1, initialScale * (dist / initialDist))
          );
          applyTransform();
        } else if (touches.length === 1) {
          if (currentScale > 1) {
            e.preventDefault();
            translateX =
              panStartTranslateX +
              (touches[0].clientX - panStartX) / currentScale;
            translateY =
              panStartTranslateY +
              (touches[0].clientY - panStartY) / currentScale;
            const maxX = Math.max(
              0,
              (image.clientWidth - overlay.clientWidth / currentScale) / 2
            );
            const maxY = Math.max(
              0,
              (image.clientHeight - overlay.clientHeight / currentScale) / 2
            );
            translateX = Math.min(maxX, Math.max(-maxX, translateX));
            translateY = Math.min(maxY, Math.max(-maxY, translateY));
            applyTransform();
          } else {
            e.preventDefault();
          }
        }
      },
      { passive: false }
    );

    overlay.addEventListener("touchend", e => {
      if (e.touches.length === 0 && currentScale <= 1.05) {
        resetTransform();
      }
    });

    overlay.addEventListener("touchcancel", e => {
      if (e.touches.length === 0 && currentScale <= 1.05) {
        resetTransform();
      }
    });

    document.body.appendChild(overlay);
    document.body.style.overflow = "hidden";
    document.addEventListener("keydown", onKeyDown);
    closeActiveLightbox = close;

    requestAnimationFrame(() => overlay?.classList.add("opacity-100"));
    closeButton.focus();
  }

  function close() {
    if (!overlay) return;
    const el = overlay;
    overlay = null;
    closeActiveLightbox = null;

    document.removeEventListener("keydown", onKeyDown);
    document.body.style.overflow = "";
    lastFocused?.focus();
    lastFocused = null;

    if (prefersReducedMotion()) {
      el.remove();
      return;
    }

    const remove = () => el.remove();
    el.addEventListener("transitionend", remove, { once: true });
    setTimeout(remove, 250);
    el.classList.remove("opacity-100");
  }

  function onKeyDown(e: KeyboardEvent) {
    if (e.key === "Escape") {
      close();
    } else if (e.key === "Tab") {
      trapFocus(e);
    }
  }

  function trapFocus(e: KeyboardEvent) {
    if (!overlay) return;
    const focusables = overlay.querySelectorAll<HTMLElement>(
      'a[href], button, [tabindex]:not([tabindex="-1"])'
    );
    if (focusables.length === 0) return;
    const first = focusables[0];
    const last = focusables[focusables.length - 1];
    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first.focus();
    }
  }

  function triggerFromEvent(e: Event): HTMLImageElement | null {
    const target = e.target instanceof Element ? e.target : null;
    const image = target?.closest("img");
    if (!image || !article.contains(image) || image.closest("a")) return null;
    return image;
  }

  function activate(image: HTMLImageElement) {
    open(image.currentSrc || image.src, image.alt, image);
  }

  article.addEventListener("click", e => {
    const image = triggerFromEvent(e);
    if (!image) return;
    e.preventDefault();
    activate(image);
  });

  article.addEventListener("keydown", e => {
    if (e.key !== "Enter" && e.key !== " " && e.key !== "Spacebar") return;
    const image = triggerFromEvent(e);
    if (!image) return;
    e.preventDefault();
    activate(image);
  });
}

function initPostDetails() {
  const article = document.getElementById("article");
  if (!article) return;

  const {
    copyCodeLabel = "Copy",
    copiedCodeLabel = "Copied",
    zoomImageLabel = "Zoom image",
    imagePreviewLabel = "Image preview",
    closeImagePreviewLabel = "Close image preview",
  } = article.dataset;

  addHeadingLinks();
  attachCopyButtons(copyCodeLabel, copiedCodeLabel);
  initLightbox(article, {
    zoomImage: zoomImageLabel,
    imagePreview: imagePreviewLabel,
    closeImagePreview: closeImagePreviewLabel,
  });
}

initPostDetails();
document.addEventListener("astro:page-load", initPostDetails);
document.addEventListener("astro:before-swap", () => {
  closeActiveLightbox?.();
});
