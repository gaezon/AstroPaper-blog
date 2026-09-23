/**
 * Lazy Twikoo comment loader. Triggers on button click, IntersectionObserver
 * proximity, or a scroll fallback; loads the CDN script with SRI and inits
 * Twikoo into the per-page container.
 *
 * Bundled module: state that previously lived on window (dedupe flags, active
 * loader registry, script promise) is module-scoped — the module instance
 * persists across ClientRouter navigations.
 *
 * Config (URLs, SRI, labels, and the locale-specific placeholder) is read from
 * data attributes on the comment root (see Comment.astro).
 */

type TwikooGlobal = {
  init: (config: Record<string, unknown>) => void | Promise<unknown>;
};

declare global {
  interface Window {
    twikoo?: TwikooGlobal;
  }
}

export {};

const COMMENT_ROOT_SELECTOR = "[data-comment-root='true']";

const activeCommentLoaders = new Set<() => void>();
let twikooScriptPromise: Promise<TwikooGlobal> | null = null;

const ensureTwikooScript = (
  twikooCdnUrl: string | undefined,
  twikooSri: string | undefined
): Promise<TwikooGlobal> => {
  if (!twikooCdnUrl) {
    return Promise.reject(new Error("Missing Twikoo CDN URL"));
  }

  if (window.twikoo && typeof window.twikoo.init === "function") {
    return Promise.resolve(window.twikoo);
  }

  if (twikooScriptPromise) {
    return twikooScriptPromise;
  }

  twikooScriptPromise = new Promise((resolve, reject) => {
    const existingScript = document.querySelector(
      'script[data-twikoo-script="true"]'
    );

    if (existingScript) {
      existingScript.remove();
    }

    const script = document.createElement("script");
    script.src = twikooCdnUrl;
    script.async = true;
    script.crossOrigin = "anonymous";
    script.dataset.twikooScript = "true";
    script.dataset.twikooState = "loading";

    if (twikooSri) {
      script.integrity = twikooSri;
    }

    script.onload = () => {
      script.dataset.twikooState = "loaded";

      if (window.twikoo && typeof window.twikoo.init === "function") {
        resolve(window.twikoo);
      } else {
        script.dataset.twikooState = "error";
        script.remove();
        twikooScriptPromise = null;
        reject(new Error("Twikoo loaded but init is unavailable"));
      }
    };

    script.onerror = () => {
      script.dataset.twikooState = "error";
      script.remove();
      twikooScriptPromise = null;
      reject(new Error("Failed to load Twikoo script"));
    };

    document.body.appendChild(script);
  });

  return twikooScriptPromise;
};

const setupCommentLoader = (commentsContainer: Element) => {
  if (!(commentsContainer instanceof HTMLElement)) {
    return;
  }

  if (commentsContainer.dataset.commentLoaderBound === "true") {
    return;
  }

  commentsContainer.dataset.commentLoaderBound = "true";

  if (!commentsContainer.id) {
    commentsContainer.id = "tcomment";
  }

  if (
    commentsContainer.id === "tcomment" &&
    document.querySelectorAll("#tcomment").length > 1
  ) {
    const uniqueSuffix = Math.random().toString(36).slice(2, 8);
    commentsContainer.id = `tcomment-${Date.now().toString(36)}-${uniqueSuffix}`;
  }

  const twikooElementSelector = `#${commentsContainer.id}`;

  const langTag = commentsContainer.dataset.langTag || "zh-CN";
  const commentId = commentsContainer.dataset.commentId;
  const commentPath = commentsContainer.dataset.commentPath;
  const loadingMessage =
    commentsContainer.dataset.commentLoading || "Loading comments...";
  const observerOffset = Number(
    commentsContainer.dataset.twikooObserverOffset || 400
  );
  const prefetchDistance = Math.min(500, Math.max(300, observerOffset));

  const loadErrorMessage =
    langTag === "zh-CN"
      ? "评论系统加载失败，请稍后重试。"
      : "Failed to load the comment system. Please try again later.";

  const triggerUi = commentsContainer.querySelector(
    "[data-comment-trigger-ui]"
  );
  const loadButton = commentsContainer.querySelector(
    "[data-comment-load-trigger]"
  );

  let hasStarted = false;
  let isDisposed = false;
  let observer: IntersectionObserver | null = null;
  let cleanupFallbackListener: (() => void) | null = null;

  const showCommentLoadError = () => {
    commentsContainer.removeAttribute("aria-busy");
    commentsContainer.setAttribute("role", "status");
    commentsContainer.textContent = loadErrorMessage;
  };

  const showLoadingState = () => {
    commentsContainer.setAttribute("aria-busy", "true");
    if (triggerUi) {
      triggerUi.setAttribute("role", "status");
      triggerUi.textContent = loadingMessage;
    } else {
      commentsContainer.setAttribute("role", "status");
      commentsContainer.textContent = loadingMessage;
    }
  };

  const cleanupTriggers = () => {
    if (observer) {
      observer.disconnect();
      observer = null;
    }

    if (cleanupFallbackListener) {
      cleanupFallbackListener();
      cleanupFallbackListener = null;
    }
  };

  const startLoadingTwikoo = () => {
    if (hasStarted) {
      return;
    }

    hasStarted = true;
    cleanupTriggers();

    if (loadButton instanceof HTMLButtonElement) {
      loadButton.disabled = true;
    }

    showLoadingState();

    // Read load-time attributes after the trigger fires. This keeps SRI and
    // locale-specific options in sync if the page updates them before loading.
    const twikooCdnUrl = commentsContainer.dataset.twikooCdn;
    const twikooSri = commentsContainer.dataset.twikooSri;
    const twikooPlaceholder = commentsContainer.dataset.twikooPlaceholder;

    ensureTwikooScript(twikooCdnUrl, twikooSri)
      .then(() => {
        if (isDisposed || !commentsContainer.isConnected) {
          return;
        }

        const twikooConfig: Record<string, unknown> = {
          envId: "https://comment.gaazeon.com/",
          el: twikooElementSelector,
          lang: langTag,
          placeholder: twikooPlaceholder,
        };

        if (commentId && commentPath) {
          twikooConfig.id = commentId;
          twikooConfig.path = commentPath;
        }

        const twikoo = window.twikoo;
        if (twikoo && typeof twikoo.init === "function") {
          Promise.resolve()
            .then(() => twikoo.init(twikooConfig))
            .then(() => {
              if (isDisposed || !commentsContainer.isConnected) {
                return;
              }

              if (triggerUi) {
                triggerUi.remove();
              }

              commentsContainer.removeAttribute("role");
              commentsContainer.removeAttribute("aria-busy");
            })
            .catch(() => {
              if (isDisposed || !commentsContainer.isConnected) {
                return;
              }

              showCommentLoadError();
            });
        } else {
          showCommentLoadError();
        }
      })
      .catch(() => {
        if (isDisposed || !commentsContainer.isConnected) {
          return;
        }

        showCommentLoadError();
      });
  };

  const setupScrollFallbackTrigger = () => {
    let scrollRafId: number | null = null;

    const maybeLoadByScroll = () => {
      const distanceToViewport =
        commentsContainer.getBoundingClientRect().top - window.innerHeight;

      if (distanceToViewport <= prefetchDistance) {
        startLoadingTwikoo();
      }
    };

    const scheduleMaybeLoadByScroll = () => {
      if (scrollRafId !== null) {
        return;
      }

      scrollRafId = window.requestAnimationFrame(() => {
        scrollRafId = null;
        maybeLoadByScroll();
      });
    };

    const onScroll = () => {
      scheduleMaybeLoadByScroll();
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll, { passive: true });
    scheduleMaybeLoadByScroll();

    cleanupFallbackListener = () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);

      if (scrollRafId !== null) {
        window.cancelAnimationFrame(scrollRafId);
        scrollRafId = null;
      }
    };
  };

  const clickTriggerHandler = () => {
    startLoadingTwikoo();
  };

  const disposeCommentLoader = () => {
    if (isDisposed) {
      return;
    }

    isDisposed = true;
    cleanupTriggers();

    if (loadButton instanceof HTMLButtonElement) {
      loadButton.removeEventListener("click", clickTriggerHandler);
    }

    delete commentsContainer.dataset.commentLoaderBound;

    activeCommentLoaders.delete(disposeCommentLoader);
  };

  activeCommentLoaders.add(disposeCommentLoader);

  if (loadButton instanceof HTMLButtonElement) {
    loadButton.addEventListener("click", clickTriggerHandler, { once: true });
  }

  if ("IntersectionObserver" in window) {
    observer = new IntersectionObserver(
      entries => {
        if (entries.some(entry => entry.isIntersecting)) {
          startLoadingTwikoo();
        }
      },
      {
        rootMargin: `0px 0px ${prefetchDistance}px 0px`,
        threshold: 0,
      }
    );

    observer.observe(commentsContainer);
  }

  setupScrollFallbackTrigger();
};

const initCommentLoaders = () => {
  const commentRoots = document.querySelectorAll(COMMENT_ROOT_SELECTOR);
  for (const commentRoot of commentRoots) {
    setupCommentLoader(commentRoot);
  }
};

document.addEventListener("astro:before-swap", () => {
  for (const disposeLoader of Array.from(activeCommentLoaders)) {
    disposeLoader();
  }

  activeCommentLoaders.clear();
});

document.addEventListener("astro:page-load", initCommentLoaders);
document.addEventListener("astro:after-swap", initCommentLoaders);

initCommentLoaders();
