export type TagInfo = { enSlug: string; enName: string };

// Canonical: Chinese tag -> English slug + display name
export const TAG_MAP: Record<string, TagInfo> = {
  // 示例映射，按需扩充
  "美股": { enSlug: "us-stocks", enName: "US Stocks" },
  "股息再投资": { enSlug: "dividend-reinvestment", enName: "Dividend Reinvestment" },
  "延时直播": { enSlug: "delayed-streaming", enName: "Delayed Streaming" },
  "安全播出": { enSlug: "safe-broadcast", enName: "Safe Broadcast" },
  "青龙面板": { enSlug: "qinglong-panel", enName: "Qinglong Panel" },
  "自建服务": { enSlug: "selfhost", enName: "Selfhost" },
  "数字囤积": { enSlug: "digital-hoarding", enName: "Digital Hoarding" },
  "投资": { enSlug: "investment", enName: "Investment" },
  "网络": { enSlug: "networking", enName: "Networking" },
  "直播": { enSlug: "streaming", enName: "Streaming" },
  "mac os 启动器": { enSlug: "macos-launcher", enName: "macOS Launcher" },
  "cubox替代": { enSlug: "cubox-alternative", enName: "Cubox Alternative" },
  "隐私保护": { enSlug: "privacy-protection", enName: "Privacy Protection" },
};

// Reverse index: English slug -> Chinese canonical tag
export const EN_SLUG_TO_ZH: Record<string, string> = Object.entries(TAG_MAP).reduce(
  (acc, [zh, { enSlug }]) => {
    acc[enSlug] = zh;
    return acc;
  },
  {} as Record<string, string>
);

export function getEnglishTag(zhTag: string): TagInfo {
  return TAG_MAP[zhTag] || { enSlug: zhTag, enName: zhTag };
}

export function resolveZhFromEnSlug(enSlug: string): string | undefined {
  return EN_SLUG_TO_ZH[enSlug] || undefined;
}

