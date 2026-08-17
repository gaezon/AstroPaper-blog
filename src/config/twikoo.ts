export const TWIKOO_VERSION = "1.7.19";
export const TWIKOO_CDN_URL = `https://cdn.jsdelivr.net/npm/twikoo@${TWIKOO_VERSION}/dist/twikoo.min.js`;
export const TWIKOO_CSS_URL = `https://cdn.jsdelivr.net/npm/twikoo@${TWIKOO_VERSION}/dist/twikoo.css`;
// Same-origin catalog. Twikoo 1.7.19 XHRs EMOTION_CDN and parses it into the DOM.
export const TWIKOO_EMOTION_CDN = "/twikoo/owo.json";
// Upstream fallback in Twikoo 1.7.19 when the server leaves EMOTION_CDN empty.
export const TWIKOO_UPSTREAM_EMOTION_CDN = "https://owo.imaegoo.com/owo.json";
