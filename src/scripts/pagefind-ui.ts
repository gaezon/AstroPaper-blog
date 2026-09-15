/**
 * Load Pagefind UI CSS as a hashed `?url` asset and inject it at runtime.
 * A side-effect CSS import is pulled into Astro's shared page stylesheet
 * graph (homepage, tags, 404, etc.). `?url` keeps it off that graph.
 */
import pagefindCssUrl from "@pagefind/default-ui/css/ui.css?url";

const STYLE_ATTR = "data-pagefind-ui-css";

export function loadPagefindStylesheet(): Promise<void> {
  const existing = document.querySelector<HTMLLinkElement>(
    `link[${STYLE_ATTR}="true"]`
  );

  if (existing) {
    if (existing.sheet) return Promise.resolve();

    return new Promise((resolve, reject) => {
      existing.addEventListener("load", () => resolve(), { once: true });
      existing.addEventListener(
        "error",
        () => reject(new Error("Failed to load Pagefind CSS")),
        { once: true }
      );
    });
  }

  return new Promise((resolve, reject) => {
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = pagefindCssUrl;
    link.setAttribute(STYLE_ATTR, "true");
    link.addEventListener("load", () => resolve(), { once: true });
    link.addEventListener(
      "error",
      () => reject(new Error("Failed to load Pagefind CSS")),
      { once: true }
    );
    document.head.appendChild(link);
  });
}
