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
