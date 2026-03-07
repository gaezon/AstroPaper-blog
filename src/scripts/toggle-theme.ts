type Theme = "light" | "dark";

type AstroBeforeSwapEvent = Event & {
  newDocument: Document;
};

const primaryColorScheme: Theme | "" = "";
const storageKey = "theme";
const themeMediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
const themeColorFallback: Record<Theme, string> = {
  light: "#fdfdfd",
  dark: "#212737",
};

function isTheme(value: string | null): value is Theme {
  return value === "light" || value === "dark";
}

function readStoredTheme(): Theme | null {
  try {
    const storedTheme = localStorage.getItem(storageKey);
    return isTheme(storedTheme) ? storedTheme : null;
  } catch {
    return null;
  }
}

function writeStoredTheme(theme: Theme) {
  try {
    localStorage.setItem(storageKey, theme);
  } catch {
    // noop
  }
}

function clearStoredTheme() {
  try {
    localStorage.removeItem(storageKey);
  } catch {
    // noop
  }
}

function getPreferredTheme(): Theme {
  const currentTheme = readStoredTheme();
  if (currentTheme) return currentTheme;

  if (primaryColorScheme === "light" || primaryColorScheme === "dark") {
    return primaryColorScheme;
  }

  return themeMediaQuery.matches ? "dark" : "light";
}

function getDocumentTheme(): Theme {
  const themeValue = document.documentElement.getAttribute("data-theme");
  return isTheme(themeValue) ? themeValue : getPreferredTheme();
}

let themeValue: Theme = getDocumentTheme();

function updateThemeButtonLabel() {
  const themeBtn = document.querySelector<HTMLButtonElement>("#theme-btn");
  if (!themeBtn) return;

  themeBtn.setAttribute(
    "aria-label",
    themeValue === "dark" ? "Switch to light theme" : "Switch to dark theme"
  );
}

function updateThemeColorMeta() {
  const fallbackColor = themeColorFallback[themeValue];
  const bgColor =
    document.body && window.getComputedStyle(document.body).backgroundColor;
  const resolvedColor =
    bgColor && bgColor !== "rgba(0, 0, 0, 0)" ? bgColor : fallbackColor;

  document
    .querySelector<HTMLMetaElement>("meta[name='theme-color']")
    ?.setAttribute("content", resolvedColor);
}

function syncThemeColorAfterPaint() {
  window.requestAnimationFrame(updateThemeColorMeta);
}

function updateMermaidMedia(theme: Theme) {
  document
    .querySelectorAll<HTMLSourceElement>('source[id^="mermaid-dark-"]')
    .forEach(el => {
      el.setAttribute("media", theme === "dark" ? "all" : "none");
    });
}

function reflectPreference() {
  document.documentElement.setAttribute("data-theme", themeValue);
  updateThemeButtonLabel();
  updateThemeColorMeta();
  updateMermaidMedia(themeValue);

  document.dispatchEvent(
    new CustomEvent("theme-changed", {
      detail: { theme: themeValue },
    })
  );
}

function setPreference(persist = true) {
  if (persist) {
    writeStoredTheme(themeValue);
  } else {
    clearStoredTheme();
  }

  reflectPreference();
}

function handleThemeToggleClick() {
  themeValue = themeValue === "light" ? "dark" : "light";
  setPreference();
}

function bindThemeButton() {
  const themeBtn = document.querySelector<HTMLButtonElement>("#theme-btn");
  if (!themeBtn) return;

  if (themeBtn.getAttribute("data-theme-bound") === "true") return;

  themeBtn.setAttribute("data-theme-bound", "true");
  themeBtn.addEventListener("click", handleThemeToggleClick);
}

function initThemeFeature() {
  themeValue = getDocumentTheme();
  reflectPreference();
  bindThemeButton();
  syncThemeColorAfterPaint();
}

initThemeFeature();

document.addEventListener("astro:after-swap", initThemeFeature);

if (document.readyState === "complete") {
  syncThemeColorAfterPaint();
} else {
  window.addEventListener("load", syncThemeColorAfterPaint, { once: true });
}

document.addEventListener("astro:before-swap", event => {
  const { newDocument } = event as AstroBeforeSwapEvent;
  const bgColor = document
    .querySelector<HTMLMetaElement>("meta[name='theme-color']")
    ?.getAttribute("content");

  newDocument
    .querySelector<HTMLMetaElement>("meta[name='theme-color']")
    ?.setAttribute("content", bgColor ?? themeColorFallback[themeValue]);
});

themeMediaQuery.addEventListener("change", event => {
  if (readStoredTheme()) return;

  themeValue = event.matches ? "dark" : "light";
  setPreference(false);
});
