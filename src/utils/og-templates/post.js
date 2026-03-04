import satori from "satori";
import { SITE } from "@/config";
import loadGoogleFonts from "../loadGoogleFont";
import { createOgFrame, createPostFooter } from "./shared";

const FONT_CONFIG = {
  "zh-CN": "IBM Plex Sans, Noto Sans SC",
  en: "Noto Sans, IBM Plex Sans",
  default: "Noto Sans, IBM Plex Sans",
};

const normalizeOgText = value =>
  (value ?? "")
    .replace(/[\u00A0\u202F\u2009\u200A\u2002\u2003\u2005]/g, " ")
    .replace(/[\u2010\u2011\u2012\u2013\u2014\u2015\u2212]/g, "\u002D")
    .replace(/[\uFE00-\uFE0F]/g, "");

const escapeSvgText = value =>
  value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

const injectTitleMetadata = (svg, title) => {
  if (!title) return svg;
  const metadata = `<metadata>${escapeSvgText(title)}</metadata>`;
  return svg.includes("</svg>")
    ? svg.replace("</svg>", `${metadata}</svg>`)
    : `${svg}${metadata}`;
};

const getFontFamily = locale => {
  if (!locale) return FONT_CONFIG.default;
  const rawLocale = locale.toString();
  if (FONT_CONFIG[rawLocale]) {
    return FONT_CONFIG[rawLocale];
  }
  const normalized = rawLocale.toLowerCase();
  if (FONT_CONFIG[normalized]) {
    return FONT_CONFIG[normalized];
  }
  if (normalized.startsWith("en")) {
    return FONT_CONFIG.en;
  }
  return FONT_CONFIG.default;
};

export default async post => {
  const locale = (post?.data?.locale || "zh-CN").toString();

  const rawTitle = post?.data?.title;
  const titleText = normalizeOgText(rawTitle);
  const authorText = normalizeOgText(post?.data?.author);
  const siteTitleText = normalizeOgText(SITE.title);
  const len = titleText.length;
  let computedSize = 58;
  if (len > 80) computedSize = 38;
  else if (len > 60) computedSize = 44;
  else if (len > 40) computedSize = 50;

  const titleStyle = {
    fontSize: computedSize,
    fontWeight: "700",
    lineHeight: 1.15,
    maxHeight: "84%",
    overflow: "hidden",
    fontFamily: getFontFamily(locale),
  };

  const mainContent = [
    {
      type: "p",
      props: {
        style: titleStyle,
        children: titleText,
      },
    },
    createPostFooter(authorText, siteTitleText),
  ];

  const svg = await satori(createOgFrame(mainContent), {
    width: 1200,
    height: 630,
    embedFont: true,
    fonts: await loadGoogleFonts(titleText + authorText + siteTitleText + "by"),
  });
  return injectTitleMetadata(svg, titleText);
};
