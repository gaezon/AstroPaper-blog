export const CONTENT_SECURITY_POLICY = [
  "default-src 'self'",
  "base-uri 'self'",
  "object-src 'none'",
  "frame-ancestors 'none'",
  "form-action 'self'",
  "script-src 'self' 'unsafe-inline' 'wasm-unsafe-eval' https://umami.gaazeon.com https://cdn.jsdelivr.net",
  "style-src 'self' 'unsafe-inline' https://cdn.jsdelivr.net",
  "img-src 'self' data: blob: https:",
  "font-src 'self' data:",
  "connect-src 'self' https://umami.gaazeon.com https://comment.gaazeon.com",
  "worker-src 'self' blob:",
  "manifest-src 'self'",
  "upgrade-insecure-requests",
].join("; ");

export const DISCOVERY_LINK_HEADER = [
  '</sitemap-index.xml>; rel="sitemap"; type="application/xml"',
  '</llms.txt>; rel="describedby"; type="text/markdown"',
  '</index.md>; rel="alternate"; type="text/markdown"',
].join(", ");

export const SECURITY_HEADERS = {
  "Content-Security-Policy": CONTENT_SECURITY_POLICY,
  Link: DISCOVERY_LINK_HEADER,
  "Referrer-Policy": "strict-origin-when-cross-origin",
  "X-Content-Type-Options": "nosniff",
  "Permissions-Policy":
    "camera=(), microphone=(), geolocation=(), payment=(), usb=(), magnetometer=(), accelerometer=(), gyroscope=()",
} as const;
