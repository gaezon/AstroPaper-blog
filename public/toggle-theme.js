const primaryColorScheme = ""; // "light" | "dark"
const storageKey = "theme";
const themeMediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
const themeColorFallback = {
  light: "#fdfdfd",
  dark: "#212737",
};

function readStoredTheme() {
  try {
    return localStorage.getItem(storageKey);
  } catch {
    return null;
  }
}

function writeStoredTheme(theme) {
  try {
    localStorage.setItem(storageKey, theme);
  } catch {
    // noop
  }
}

function getPreferTheme() {
  const currentTheme = readStoredTheme();
  if (currentTheme === "light" || currentTheme === "dark") return currentTheme;

  if (primaryColorScheme === "light" || primaryColorScheme === "dark") {
    return primaryColorScheme;
  }

  return themeMediaQuery.matches ? "dark" : "light";
}

let themeValue = document.documentElement.getAttribute("data-theme");
if (themeValue !== "light" && themeValue !== "dark") {
  themeValue = getPreferTheme();
}

function updateThemeButtonLabel() {
  const themeBtn = document.querySelector("#theme-btn");
  if (!themeBtn) return;

  themeBtn.setAttribute(
    "aria-label",
    themeValue === "dark" ? "Switch to light theme" : "Switch to dark theme"
  );
}

function updateThemeColorMeta() {
  const fallbackColor =
    themeValue === "dark" ? themeColorFallback.dark : themeColorFallback.light;
  const bgColor =
    document.body && window.getComputedStyle(document.body).backgroundColor;
  const resolvedColor =
    bgColor && bgColor !== "rgba(0, 0, 0, 0)" ? bgColor : fallbackColor;

  document
    .querySelector("meta[name='theme-color']")
    ?.setAttribute("content", resolvedColor);
}

function syncThemeColorAfterPaint() {
  window.requestAnimationFrame(updateThemeColorMeta);
}

function updateMermaidMedia(theme) {
  document.querySelectorAll('source[id^="mermaid-dark-"]').forEach(el => {
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

function setPreference() {
  writeStoredTheme(themeValue);
  reflectPreference();
}

function handleThemeToggleClick() {
  themeValue = themeValue === "light" ? "dark" : "light";
  setPreference();
}

function bindThemeButton() {
  const themeBtn = document.querySelector("#theme-btn");
  if (!themeBtn) return;

  if (themeBtn.getAttribute("data-theme-bound") === "true") return;

  themeBtn.setAttribute("data-theme-bound", "true");
  themeBtn.addEventListener("click", handleThemeToggleClick);
}

function initThemeFeature() {
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
  const bgColor = document
    .querySelector("meta[name='theme-color']")
    ?.getAttribute("content");

  event.newDocument
    .querySelector("meta[name='theme-color']")
    ?.setAttribute("content", bgColor);
});

const handleSystemThemeChange = event => {
  themeValue = event.matches ? "dark" : "light";
  setPreference();
};

if (typeof themeMediaQuery.addEventListener === "function") {
  themeMediaQuery.addEventListener("change", handleSystemThemeChange);
} else if (typeof themeMediaQuery.addListener === "function") {
  themeMediaQuery.addListener(handleSystemThemeChange);
}
