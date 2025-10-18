const primaryColorScheme = ""; // "light" | "dark"

// Get theme data from local storage
const currentTheme = localStorage.getItem("theme");

function getPreferTheme() {
  // return theme value in local storage if it is set
  if (currentTheme) return currentTheme;

  // return primary color scheme if it is set
  if (primaryColorScheme) return primaryColorScheme;

  // return user device's prefer color scheme
  return window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
}

let themeValue = getPreferTheme();

function setPreference() {
  localStorage.setItem("theme", themeValue);
  reflectPreference();
}

function reflectPreference() {
  document.firstElementChild.setAttribute("data-theme", themeValue);

  const themeBtn = document.querySelector("#theme-btn");
  if (themeBtn) {
    themeBtn.setAttribute(
      "aria-label",
      themeValue === "dark" ? "Switch to light theme" : "Switch to dark theme"
    );
  }

  // Get a reference to the body element
  const body = document.body;

  // Check if the body element exists before using getComputedStyle
  if (body) {
    // Get the computed styles for the body element
    const computedStyles = window.getComputedStyle(body);

    // Get the background color property
    const bgColor = computedStyles.backgroundColor;

    // Set the background color in <meta theme-color ... />
    document
      .querySelector("meta[name='theme-color']")
      ?.setAttribute("content", bgColor);

    // Sync Mermaid diagram light/dark theme
    updateMermaidMedia(themeValue);
  }
}

// Display corresponding Mermaid assets based on current theme
function updateMermaidMedia(theme) {
  // With dark:true, rehype-mermaid generates <picture> → <source id="mermaid-dark-n">
  document.querySelectorAll('source[id^="mermaid-dark-"]').forEach(el => {
    // Show dark SVGs in dark theme; disable otherwise
    el.setAttribute("media", theme === "dark" ? "all" : "none");
  });
}

// set early so no page flashes / CSS is made aware
reflectPreference();

window.onload = () => {
  function setThemeFeature() {
    // set on load so screen readers can get the latest value on the button
    reflectPreference();

    // now this script can find and listen for clicks on the control
    document.querySelector("#theme-btn")?.addEventListener("click", () => {
      themeValue = themeValue === "light" ? "dark" : "light";
      setPreference();
    });
  }

  setThemeFeature();

  // Runs on view transitions navigation
  document.addEventListener("astro:after-swap", setThemeFeature);
};

// Set theme-color value before page transition
// to avoid navigation bar color flickering in Android dark mode
document.addEventListener("astro:before-swap", event => {
  const bgColor = document
    .querySelector("meta[name='theme-color']")
    ?.getAttribute("content");

  event.newDocument
    .querySelector("meta[name='theme-color']")
    ?.setAttribute("content", bgColor);
});

// sync with system changes
window
  .matchMedia("(prefers-color-scheme: dark)")
  .addEventListener("change", ({ matches: isDark }) => {
    themeValue = isDark ? "dark" : "light";
    setPreference();
  });

const getTheme = () => {
  if (typeof localStorage !== "undefined" && localStorage.getItem("theme")) {
    return localStorage.getItem("theme");
  }
  if (window.matchMedia("(prefers-color-scheme: dark)").matches) {
    return "dark";
  }
  return "light";
};

const theme = getTheme();

if (theme === "light") {
  document.documentElement.classList.remove("dark");
} else {
  document.documentElement.classList.add("dark");
}

window.localStorage.setItem("theme", theme);

const dispatchThemeChangeEvent = newTheme => {
  const event = new CustomEvent("theme-changed", {
    detail: { theme: newTheme },
  });
  document.dispatchEvent(event);
  console.log(`Dispatched theme-changed event: ${newTheme}`);
};

document.addEventListener("DOMContentLoaded", () => {
  const toggleTheme = () => {
    const currentTheme = window.localStorage.getItem("theme");
    const newTheme = currentTheme === "light" ? "dark" : "light";

    window.localStorage.setItem("theme", newTheme);
    document.documentElement.classList.toggle("dark", newTheme === "dark");

    dispatchThemeChangeEvent(newTheme);
  };

  document.getElementById("theme-btn")?.addEventListener("click", toggleTheme);

  // Dispatch initial theme once the page is loaded
  dispatchThemeChangeEvent(getTheme());
});
