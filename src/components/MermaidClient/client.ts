// Client-side TypeScript for Mermaid initialization/handling
interface MermaidInstance {
  render(id: string, code: string): Promise<{ svg: string }>;
  initialize(config: Record<string, unknown>): void;
}

interface MermaidEventListeners {
  themeChanged?: EventListener;
  systemThemeChanged?: (this: MediaQueryList, ev: MediaQueryListEvent) => void;
  mediaQuery?: MediaQueryList | null;
}

declare global {
  interface Window {
    __mermaid_last_theme_event?: string;
    mermaidState?: MermaidState;
    mermaidEventListeners?: MermaidEventListeners;
    mermaid?: unknown;
  }
}

interface DiagramMetadata {
  code: string;
  isTimeline: boolean;
}

interface MermaidState {
  instance: MermaidInstance | null;
  diagrams: Map<HTMLElement, DiagramMetadata>;
  renderedElements: Set<HTMLElement>;
  observer: IntersectionObserver | null;
  themeTimer: number | null;
}

const mermaidState: MermaidState = (globalThis as unknown as Window)
  .mermaidState ?? {
  instance: null,
  diagrams: new Map<HTMLElement, DiagramMetadata>(),
  renderedElements: new Set<HTMLElement>(),
  observer: null,
  themeTimer: null,
};

(globalThis as unknown as Window).mermaidState = mermaidState;

// Core lifecycle
function init() {
  // eslint-disable-next-line no-console
  console.info("MermaidClient: Initializing...");
  cleanup();
  setupListeners();
  collectDiagrams();
  if (mermaidState.diagrams.size > 0) setupMermaid();
}

function cleanup() {
  if (mermaidState.observer) {
    mermaidState.observer.disconnect();
    mermaidState.observer = null;
  }
  if (mermaidState.themeTimer) {
    window.clearTimeout(mermaidState.themeTimer);
    mermaidState.themeTimer = null;
  }

  const listeners = (window as unknown as Window).mermaidEventListeners;
  if (listeners?.themeChanged) {
    document.removeEventListener(
      "theme-changed",
      listeners.themeChanged as EventListener
    );
  }

  if (listeners?.mediaQuery && listeners?.systemThemeChanged) {
    if (listeners.mediaQuery.removeEventListener) {
      listeners.mediaQuery.removeEventListener(
        "change",
        listeners.systemThemeChanged as unknown as EventListener
      );
    } else if (listeners.mediaQuery.removeListener) {
      // Safari versions prior to 14 used the deprecated removeListener method
      listeners.mediaQuery.removeListener(
        listeners.systemThemeChanged as unknown as (
          this: MediaQueryList,
          ev: MediaQueryListEvent
        ) => void
      );
    }
  }

  mermaidState.instance = null;
  mermaidState.diagrams.clear();
  mermaidState.renderedElements.clear();
}

async function setupMermaid() {
  // eslint-disable-next-line no-console
  console.info("MermaidClient: setupMermaid");
  if (!mermaidState.instance) {
    try {
      if (typeof window.mermaid === "undefined") {
        await loadMermaidScript();
      }
      // Verify that window.mermaid has required methods
      const mermaid = window.mermaid as Record<string, unknown> | undefined;
      if (
        !mermaid ||
        typeof mermaid.render !== "function" ||
        typeof mermaid.initialize !== "function"
      ) {
        const errMsg =
          "Mermaid script loaded, but window.mermaid is missing required methods.";
        // eslint-disable-next-line no-console
        console.error(errMsg, window.mermaid);
        showMermaidError("load", undefined, new Error(errMsg));
        return;
      }
      mermaidState.instance = mermaid as unknown as MermaidInstance;
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error(err);
      // pass the error object to showMermaidError so callers/developers can see details
      showMermaidError("load", undefined, err);
      return;
    }
  }

  setupIntersectionObserver();
}

function collectDiagrams() {
  const codeBlocks = document.querySelectorAll(
    "pre > code.language-mermaid, code.language-mermaid"
  );
  let idx = 0;
  codeBlocks.forEach(codeElement => {
    // Skip if parent is already a mermaid-diagram wrapper (already processed)
    const parent = codeElement.parentElement;
    if (parent?.classList.contains("mermaid-diagram")) return;
    if (parent?.parentElement?.classList.contains("mermaid-diagram")) return;

    const code = codeElement.textContent;
    if (code && code.trim()) {
      const wrapper = document.createElement("div");
      wrapper.className =
        "mermaid-diagram my-6 flex justify-center overflow-x-auto";
      wrapper.setAttribute("data-mermaid-id", String(idx++));
      const preElement = parent as HTMLElement | null;
      if (preElement?.parentNode)
        preElement.parentNode.replaceChild(wrapper, preElement);
      else if (codeElement.parentNode)
        codeElement.parentNode.replaceChild(wrapper, codeElement);

      const isTimeline = /^\s*timeline/i.test(code);
      mermaidState.diagrams.set(wrapper, {
        code: code.trim(),
        isTimeline,
      });
    }
  });
}

function setupIntersectionObserver() {
  if (mermaidState.observer) mermaidState.observer.disconnect();
  const options = { root: null, rootMargin: "200px", threshold: 0.01 };
  mermaidState.observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      const element = entry.target as HTMLElement;
      const metadata = mermaidState.diagrams.get(element);
      if (metadata) renderDiagram(element, metadata);
      mermaidState.observer?.unobserve(element);
    });
  }, options);
  for (const [element] of mermaidState.diagrams.entries()) {
    if (!mermaidState.renderedElements.has(element)) {
      mermaidState.observer.observe(element);
    }
  }
}

async function renderDiagram(element: HTMLElement, metadata: DiagramMetadata) {
  if (!mermaidState.instance) return;
  try {
    // eslint-disable-next-line no-console
    console.debug("MermaidClient: renderDiagram", element);

    // Initialize with diagram-specific config
    const theme = getInitialTheme();
    initializeMermaidConfig(theme, metadata.isTimeline);

    const id = `mermaid-${Math.random().toString(36).slice(2, 10)}`;
    const normalized = metadata.code
      .replace(/&lt;br\s*\/?&gt;/gi, "\n")
      .replace(/<br\s*\/?>(\s*)/gi, "\n$1");
    const result = await mermaidState.instance.render(id, normalized);
    element.innerHTML = result.svg;
    element.setAttribute("role", "img");
    if (!element.getAttribute("aria-label"))
      element.setAttribute("aria-label", "Mermaid diagram");
    mermaidState.renderedElements.add(element);
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error(err);
    showMermaidError("render", element, err);
  }
}

function initializeMermaidConfig(theme: string, isTimeline = false) {
  if (!mermaidState.instance) return;
  mermaidState.instance.initialize(getMermaidConfig(theme, isTimeline));
}

function getInitialTheme(): "light" | "dark" {
  if (typeof localStorage !== "undefined") {
    const stored = localStorage.getItem("theme");
    if (stored === "light" || stored === "dark") return stored;
  }
  if (document.documentElement.classList.contains("dark")) return "dark";
  if (
    window.matchMedia &&
    window.matchMedia("(prefers-color-scheme: dark)").matches
  )
    return "dark";
  return "light";
}

function getMermaidConfig(theme: string, isTimeline = false) {
  const isDark = theme === "dark";
  const darkThemeConfig = {
    background: "transparent",
    primaryColor: "#2d3548",
    secondaryColor: "#343f60",
    primaryTextColor: "#eaedf3",
    secondaryTextColor: "#eaedf3",
    primaryBorderColor: "#ff6b01",
    lineColor: "#ff6b01",
    clusterBkg: "#343f60",
    titleColor: "#eaedf3",
    tertiaryColor: "#2d3548",
    noteBkgColor: "#ff8534",
    noteTextColor: "#ffffff",
    ...(isTimeline
      ? {
          cScale0: "#2d3548",
          cScale1: "#343f60",
          cScale2: "#2d3548",
          cScale3: "#343f60",
          cScale4: "#2d3548",
          cScale5: "#343f60",
          cScaleLabel0: "#eaedf3",
          cScaleLabel1: "#eaedf3",
          cScaleLabel2: "#eaedf3",
          cScaleLabel3: "#eaedf3",
          cScaleLabel4: "#eaedf3",
          cScaleLabel5: "#eaedf3",
        }
      : {}),
  } as const;
  const lightThemeConfig = {
    background: "transparent",
    primaryColor: "#e6f4fb",
    secondaryColor: "#f0f7fb",
    primaryTextColor: "#282728",
    secondaryTextColor: "#282728",
    primaryBorderColor: "#006cac",
    lineColor: "#006cac",
    clusterBkg: "#f5fafc",
    titleColor: "#282728",
    tertiaryColor: "#ffffff",
    noteBkgColor: "#0088cc",
    noteTextColor: "#ffffff",
    ...(isTimeline
      ? {
          cScale0: "#e6f4fb",
          cScale1: "#f0f7fb",
          cScale2: "#ffffff",
          cScale3: "#e6f4fb",
          cScale4: "#f0f7fb",
          cScale5: "#ffffff",
          cScaleLabel0: "#282728",
          cScaleLabel1: "#282728",
          cScaleLabel2: "#282728",
          cScaleLabel3: "#282728",
          cScaleLabel4: "#282728",
          cScaleLabel5: "#282728",
        }
      : {}),
  } as const;
  return {
    startOnLoad: false,
    securityLevel: "strict",
    htmlLabels: false,
    theme: "base",
    themeVariables: {
      darkMode: isDark,
      fontFamily:
        'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen, Ubuntu, Cantarell, "Open Sans", "Helvetica Neue", sans-serif',
      ...(isDark ? darkThemeConfig : lightThemeConfig),
    },
  } as const;
}

function handleThemeChange(theme: string) {
  if (mermaidState.themeTimer) window.clearTimeout(mermaidState.themeTimer);
  mermaidState.themeTimer = window.setTimeout(() => {
    // eslint-disable-next-line no-console
    console.info("MermaidClient: handleThemeChange", theme);
    // expose to window for debug visibility
    try {
      (window as unknown as Window).__mermaid_last_theme_event = theme;
    } catch {
      // Ignore - unable to set debug property, likely in a restricted context
    }
    for (const element of mermaidState.renderedElements) {
      if (document.body.contains(element)) {
        // eslint-disable-next-line no-console
        console.info("MermaidClient: re-rendering element", element);
        const metadata = mermaidState.diagrams.get(element);
        if (metadata) renderDiagram(element, metadata);
      } else {
        // Clean up renderedElements and diagrams to prevent memory leak
        mermaidState.renderedElements.delete(element);
        mermaidState.diagrams.delete(element);
      }
    }
  }, 120);
}

function onThemeChanged(e: Event) {
  // theme-changed custom event dispatched by toggle-theme.js
  const theme = (e as CustomEvent).detail?.theme ?? getInitialTheme();
  handleThemeChange(theme);
}

function onSystemThemeChanged(this: MediaQueryList, e: MediaQueryListEvent) {
  const theme = e.matches ? "dark" : "light";
  handleThemeChange(theme);
}

// Track the loading state of the Mermaid script to prevent concurrent loads
let mermaidScriptPromise: Promise<void> | null = null;

function loadMermaidScript(): Promise<void> {
  // If script is already loaded, resolve immediately
  if (typeof window.mermaid !== "undefined") {
    return Promise.resolve();
  }

  // If a loading Promise exists, return it (share the same loading process)
  if (mermaidScriptPromise) {
    return mermaidScriptPromise;
  }

  // Create and store a new Promise for concurrent callers to share
  mermaidScriptPromise = new Promise((resolve, reject) => {
    const existing = document.querySelector('script[src="/mermaid.min.js"]');
    if (existing) {
      // Check again in case script finished loading between first check and now
      if (typeof window.mermaid !== "undefined") {
        resolve();
        mermaidScriptPromise = null;
        return;
      }
      existing.addEventListener(
        "load",
        () => {
          resolve();
          mermaidScriptPromise = null;
        },
        { once: true }
      );
      existing.addEventListener(
        "error",
        () => {
          reject(new Error("Failed to load script: /mermaid.min.js"));
          mermaidScriptPromise = null;
        },
        { once: true }
      );

      // Re-check in case script loaded between previous check and listener attachment
      if (typeof window.mermaid !== "undefined") {
        resolve();
        mermaidScriptPromise = null;
        return;
      }
      return;
    }
    const script = document.createElement("script");
    script.src = "/mermaid.min.js";
    script.async = true;
    script.onload = () => {
      resolve();
      mermaidScriptPromise = null;
    };
    script.onerror = () => {
      reject(new Error("Failed to load script: /mermaid.min.js"));
      mermaidScriptPromise = null;
    };
    document.head.appendChild(script);
  });

  return mermaidScriptPromise;
}

function showMermaidError(
  type: string,
  element?: HTMLElement,
  error?: unknown
) {
  const isDark = document.documentElement.classList.contains("dark");
  const container = document.createElement("div");
  container.className = `${isDark ? "bg-red-900/20 border-red-800 text-red-200" : "bg-red-50 border-red-200 text-red-800"} border rounded-lg p-4 my-4`;
  container.setAttribute("role", "alert");

  // Title
  const title = document.createElement("strong");
  title.textContent = `Mermaid ${type} error`;
  container.appendChild(title);

  // Guidance message depending on type
  const guidance = document.createElement("div");
  guidance.style.marginTop = "0.25em";
  if (type === "render") {
    guidance.textContent =
      "Failed to render diagram. Please check the diagram syntax and try again. If you're authoring this content, validate the Mermaid syntax and reload the page.";
  } else if (type === "load") {
    guidance.textContent =
      "Failed to load the Mermaid library. Ensure /mermaid.min.js is present and reachable, and check your network connection.";
  } else {
    guidance.textContent = "An unknown Mermaid error occurred.";
  }
  container.appendChild(guidance);

  // Developer-focused details: add a preformatted block with the error message/stack if available
  if (error) {
    // eslint-disable-next-line no-console
    console.error(error);
    const pre = document.createElement("pre");
    pre.style.whiteSpace = "pre-wrap";
    pre.style.wordBreak = "break-word";
    pre.style.marginTop = "0.5em";
    pre.style.maxHeight = "240px";
    pre.style.overflow = "auto";

    function stringifyErr(e: unknown): string {
      if (!e) return "";
      try {
        if (e instanceof Error) {
          return `${e.name}: ${e.message}\n${e.stack ?? ""}`;
        }
        // attempt to pretty-print objects
        return typeof e === "object"
          ? JSON.stringify(e, Object.getOwnPropertyNames(e), 2)
          : String(e);
      } catch {
        return String(e);
      }
    }
    pre.textContent = stringifyErr(error);
    container.appendChild(pre);
  }

  // Optionally offer a link to report an issue if this persists. Keep the URL relative to the repo.
  const link = document.createElement("div");
  link.style.marginTop = "0.5em";
  const issueLink = document.createElement("a");
  issueLink.href =
    "https://github.com/gz4zzxc/AstroPaper-blog/issues/new/choose";
  issueLink.textContent = "Report an issue on GitHub";
  issueLink.target = "_blank";
  issueLink.rel = "noopener noreferrer";
  issueLink.className = "underline";
  link.appendChild(issueLink);
  container.appendChild(link);

  if (element) {
    element.replaceWith(container);
  } else {
    // If no element provided (e.g. library failed to load), show container near the main content
    const mainEl = document.querySelector("main");
    if (mainEl && mainEl.parentNode)
      mainEl.parentNode.insertBefore(container, mainEl);
    else document.body.appendChild(container);
  }
}

function setupListeners() {
  // Ensure a global listeners bag exists and attach handlers thread-safely
  if (!(window as unknown as Window).mermaidEventListeners) {
    const mediaQuery = window.matchMedia
      ? window.matchMedia("(prefers-color-scheme: dark)")
      : null;
    (window as unknown as Window).mermaidEventListeners = {
      themeChanged: onThemeChanged,
      systemThemeChanged: onSystemThemeChanged,
      mediaQuery,
    } as MermaidEventListeners;
  } else {
    const listeners = (window as unknown as Window)
      .mermaidEventListeners as MermaidEventListeners;
    document.removeEventListener(
      "theme-changed",
      listeners.themeChanged as EventListener
    );

    if (listeners.mediaQuery && listeners.systemThemeChanged) {
      if (listeners.mediaQuery.removeEventListener) {
        listeners.mediaQuery.removeEventListener(
          "change",
          listeners.systemThemeChanged as unknown as EventListener
        );
      } else if (listeners.mediaQuery.removeListener) {
        // Safari < 14 fallback
        listeners.mediaQuery.removeListener(
          listeners.systemThemeChanged as unknown as (
            this: MediaQueryList,
            ev: MediaQueryListEvent
          ) => void
        );
      }
    }
    // Keep the existing mediaQuery if available; otherwise, create a new one.
    const mediaQuery =
      listeners.mediaQuery ||
      (window.matchMedia
        ? window.matchMedia("(prefers-color-scheme: dark)")
        : null);

    listeners.themeChanged = onThemeChanged;
    listeners.systemThemeChanged = onSystemThemeChanged;
    listeners.mediaQuery = mediaQuery;
  }

  // Register listeners
  document.addEventListener(
    "theme-changed",
    (window as unknown as Window).mermaidEventListeners!
      .themeChanged as EventListener
  );

  if ((window as unknown as Window).mermaidEventListeners!.mediaQuery) {
    (
      window as unknown as Window
    ).mermaidEventListeners!.mediaQuery!.addEventListener(
      "change",
      (window as unknown as Window).mermaidEventListeners!
        .systemThemeChanged as unknown as EventListener
    );
  }
}

export function initMermaid() {
  init();
}

export function cleanupMermaid() {
  cleanup();
}
