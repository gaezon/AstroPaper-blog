/**
 * Client-side Mermaid fallback renderer.
 *
 * Build-time Mermaid rendering (rehype-mermaid) only runs in GitHub Actions,
 * so everywhere else raw ```mermaid code blocks survive into the HTML. This
 * script renders those blocks in the browser with the exact same theme
 * variables as the build-time pipeline, so local preview matches production.
 *
 * Layout.astro only renders this <script> tag when the fallback is enabled
 * (!GITHUB_ACTIONS), so CI-built pages never load any Mermaid JavaScript.
 */
import {
  createThemeVariables,
  darkThemeColors,
  lightThemeColors,
} from "@/utils/mermaidTheme";

type Theme = "light" | "dark";
type MermaidModule = typeof import("mermaid").default;

const CONTAINER_CLASS = "mermaid-dev-preview";
const SOURCE_ATTR = "data-mermaid-source";

let mermaidModule: MermaidModule | null = null;
let activeTheme: Theme | null = null;
let renderSeq = 0;
let renderChain: Promise<void> = Promise.resolve();

function getCurrentTheme(): Theme {
  return document.documentElement.getAttribute("data-theme") === "dark"
    ? "dark"
    : "light";
}

async function loadMermaid(): Promise<MermaidModule> {
  if (!mermaidModule) {
    mermaidModule = (await import("mermaid")).default;
  }
  return mermaidModule;
}

/** Replace raw mermaid code blocks with placeholder containers holding the source. */
function collectContainers(): HTMLElement[] {
  const codes = document.querySelectorAll<HTMLElement>(
    'pre > code.language-mermaid, pre[data-language="mermaid"] > code'
  );

  for (const code of codes) {
    const pre = code.closest("pre");
    const source = code.textContent ?? "";
    if (!pre || !source.trim()) continue;

    const container = document.createElement("div");
    container.className = CONTAINER_CLASS;
    container.setAttribute(SOURCE_ATTR, source);
    pre.replaceWith(container);
  }

  return [...document.querySelectorAll<HTMLElement>(`.${CONTAINER_CLASS}`)];
}

function buildErrorNode(source: string, error: unknown): HTMLElement {
  const wrapper = document.createElement("div");
  wrapper.className = `${CONTAINER_CLASS}-error`;

  const message = document.createElement("p");
  message.textContent = `Mermaid render failed: ${
    error instanceof Error ? error.message : String(error)
  }`;

  const pre = document.createElement("pre");
  const code = document.createElement("code");
  code.textContent = source;
  pre.append(code);

  wrapper.append(message, pre);
  return wrapper;
}

async function renderOne(container: HTMLElement, mermaid: MermaidModule) {
  const source = container.getAttribute(SOURCE_ATTR) ?? "";
  const id = `mermaid-dev-${renderSeq++}`;

  try {
    const { svg, bindFunctions } = await mermaid.render(id, source);
    container.innerHTML = svg;
    bindFunctions?.(container);
  } catch (error) {
    // mermaid.render leaves a temporary #d{id} element behind on failure
    document.getElementById(`d${id}`)?.remove();
    container.replaceChildren(buildErrorNode(source, error));
  }
}

async function renderAll(theme: Theme) {
  const containers = document.querySelectorAll<HTMLElement>(
    `.${CONTAINER_CLASS}`
  );
  if (containers.length === 0) return;

  const mermaid = await loadMermaid();
  mermaid.initialize({
    startOnLoad: false,
    theme: "base",
    themeVariables: createThemeVariables(
      theme === "dark" ? darkThemeColors : lightThemeColors
    ),
  });

  for (const container of containers) {
    await renderOne(container, mermaid);
  }

  activeTheme = theme;
}

/** Serialize renders so a fast theme toggle can't interleave mermaid.initialize calls. */
function scheduleRender(theme: Theme) {
  renderChain = renderChain.then(() => renderAll(theme)).catch(() => {});
}

document.addEventListener("astro:page-load", () => {
  activeTheme = null;
  if (collectContainers().length === 0) return;
  scheduleRender(getCurrentTheme());
});

document.addEventListener("theme-changed", event => {
  const theme = (event as CustomEvent<{ theme?: Theme }>).detail?.theme;
  if (theme !== "light" && theme !== "dark") return;
  if (theme === activeTheme) return;
  if (!document.querySelector(`.${CONTAINER_CLASS}`)) return;
  scheduleRender(theme);
});
