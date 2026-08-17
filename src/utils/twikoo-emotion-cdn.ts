import {
  TWIKOO_EMOTION_CDN,
  TWIKOO_UPSTREAM_EMOTION_CDN,
} from "@/config/twikoo";

let emotionCdnRewriteInstalled = false;

export const rewriteTwikooEmotionCdnUrl = (url: string): string => {
  return url === TWIKOO_UPSTREAM_EMOTION_CDN ? TWIKOO_EMOTION_CDN : url;
};

export const installTwikooEmotionCdnRewrite = (): void => {
  if (emotionCdnRewriteInstalled || typeof XMLHttpRequest === "undefined") {
    return;
  }

  emotionCdnRewriteInstalled = true;

  const originalOpen = XMLHttpRequest.prototype.open;

  XMLHttpRequest.prototype.open = function (
    this: XMLHttpRequest,
    method: string,
    url: string | URL,
    async?: boolean,
    username?: string | null,
    password?: string | null
  ) {
    const nextUrl =
      typeof url === "string" ? rewriteTwikooEmotionCdnUrl(url) : url;

    if (async === undefined) {
      return originalOpen.call(this, method, nextUrl);
    }

    return originalOpen.call(this, method, nextUrl, async, username, password);
  } as typeof XMLHttpRequest.prototype.open;
};
