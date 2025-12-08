const SUFFIX_PATTERN = /([?#].*)$/;

function splitPathAndSuffix(input: string): [string, string] {
  const match = input.match(SUFFIX_PATTERN);
  if (!match) {
    return [input, ""];
  }
  const suffix = match[1];
  const path = input.slice(0, -suffix.length);
  return [path, suffix];
}

export function ensureLeadingSlash(path: string): string {
  if (!path) return "/";
  return path.startsWith("/") ? path : `/${path}`;
}

export function ensureTrailingSlash(input: string): string {
  if (!input) return "/";

  const [path, suffix] = splitPathAndSuffix(input);

  if (path === "" || path === "/") {
    return `/${suffix}`;
  }

  const normalizedPath = path.endsWith("/") ? path : `${path}/`;
  return `${normalizedPath}${suffix}`;
}

export function normalizePathWithLocale(
  path: string,
  localePrefix = ""
): string {
  const normalized = ensureTrailingSlash(ensureLeadingSlash(path));

  if (!localePrefix) {
    return normalized;
  }

  const prefix = ensureLeadingSlash(localePrefix).replace(/\/$/, "");
  return `${prefix}${normalized}`;
}

/**
 * Sanitize a path from untrusted input (e.g., query parameters).
 * Prevents XSS via javascript: URLs and open redirect attacks.
 * Returns "/" if the path is invalid or potentially dangerous.
 */
export function sanitizePath(path: string | null | undefined): string {
  if (!path) return "/";

  const trimmed = path.trim();

  // Must start with "/" (relative path only)
  if (!trimmed.startsWith("/")) return "/";

  // Block dangerous protocols (case-insensitive)
  const lowerPath = trimmed.toLowerCase();
  const dangerousProtocols = ["javascript:", "data:", "vbscript:"];
  if (dangerousProtocols.some(proto => lowerPath.includes(proto))) {
    return "/";
  }

  // Block protocol-relative URLs (//example.com)
  if (trimmed.startsWith("//")) return "/";

  return trimmed;
}
