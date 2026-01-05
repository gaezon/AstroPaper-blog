import satori from "satori";
// import { html } from "satori-html";
import { SITE } from "@/config";
import loadGoogleFonts from "../loadGoogleFont";

// Font configuration for different locales
// Centralized font configuration to avoid hardcoding font selections in multiple places
// and make it easier to maintain font choices across the application.
const FONT_CONFIG = {
  "zh-CN": "IBM Plex Sans, Noto Sans SC",
  en: "Noto Sans, IBM Plex Sans",
  default: "Noto Sans, IBM Plex Sans",
};

const normalizeOgText = value =>
  (value ?? "")
    // Replace various Unicode space characters with a regular space for font compatibility
    .replace(/[\u00A0\u202F\u2009\u200A\u2002\u2003\u2005]/g, " ")
    // Replace problematic Unicode hyphen/dash characters with standard hyphen-minus
    .replace(/[\u2010\u2011\u2012\u2013\u2014\u2015\u2212]/g, "\u002D")
    // Remove Unicode Variation Selectors (U+FE00..U+FE0F)
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

// const markup = html`<div
//       style={{
//         background: "#fefbfb",
//         width: "100%",
//         height: "100%",
//         display: "flex",
//         alignItems: "center",
//         justifyContent: "center",
//       }}
//     >
//       <div
//         style={{
//           position: "absolute",
//           top: "-1px",
//           right: "-1px",
//           border: "4px solid #000",
//           background: "#ecebeb",
//           opacity: "0.9",
//           borderRadius: "4px",
//           display: "flex",
//           justifyContent: "center",
//           margin: "2.5rem",
//           width: "88%",
//           height: "80%",
//         }}
//       />

//       <div
//         style={{
//           border: "4px solid #000",
//           background: "#fefbfb",
//           borderRadius: "4px",
//           display: "flex",
//           justifyContent: "center",
//           margin: "2rem",
//           width: "88%",
//           height: "80%",
//         }}
//       >
//         <div
//           style={{
//             display: "flex",
//             flexDirection: "column",
//             justifyContent: "space-between",
//             margin: "20px",
//             width: "90%",
//             height: "90%",
//           }}
//         >
//           <p
//             style={{
//               fontSize: 72,
//               fontWeight: "bold",
//               maxHeight: "84%",
//               overflow: "hidden",
//             }}
//           >
//             {post.data.title}
//           </p>
//           <div
//             style={{
//               display: "flex",
//               justifyContent: "space-between",
//               width: "100%",
//               marginBottom: "8px",
//               fontSize: 28,
//             }}
//           >
//             <span>
//               by{" "}
//               <span
//                 style={{
//                   color: "transparent",
//                 }}
//               >
//                 "
//               </span>
//               <span style={{ overflow: "hidden", fontWeight: "bold" }}>
//                 {post.data.author}
//               </span>
//             </span>

//             <span style={{ overflow: "hidden", fontWeight: "bold" }}>
//               {SITE.title}
//             </span>
//           </div>
//         </div>
//       </div>
//     </div>`;

export default async post => {
  // Derive locale from post data; default to zh-CN
  const locale = (post?.data?.locale || "zh-CN").toString();

  // Select a readable font size based on title length
  const rawTitle = post?.data?.title;
  const titleText = normalizeOgText(rawTitle);
  const authorText = normalizeOgText(post?.data?.author);
  const siteTitleText = normalizeOgText(SITE.title);
  const len = titleText.length;
  let computedSize = 58; // base size
  if (len > 80) computedSize = 38;
  else if (len > 60) computedSize = 44;
  else if (len > 40) computedSize = 50;

  // Locale-aware title style with IBM Plex Sans preference and fallbacks
  const titleStyle = {
    fontSize: computedSize,
    fontWeight: "700",
    lineHeight: 1.15,
    maxHeight: "84%",
    overflow: "hidden",
    // Use configured font family based on locale
    fontFamily: getFontFamily(locale),
  };

  const svg = await satori(
    {
      type: "div",
      props: {
        style: {
          background: "#fefbfb",
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        },
        children: [
          {
            type: "div",
            props: {
              style: {
                position: "absolute",
                top: "-1px",
                right: "-1px",
                border: "4px solid #000",
                background: "#ecebeb",
                opacity: "0.9",
                borderRadius: "4px",
                display: "flex",
                justifyContent: "center",
                margin: "2.5rem",
                width: "88%",
                height: "80%",
              },
            },
          },
          {
            type: "div",
            props: {
              style: {
                border: "4px solid #000",
                background: "#fefbfb",
                borderRadius: "4px",
                display: "flex",
                justifyContent: "center",
                margin: "2rem",
                width: "88%",
                height: "80%",
              },
              children: {
                type: "div",
                props: {
                  style: {
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "space-between",
                    margin: "20px",
                    width: "90%",
                    height: "90%",
                  },
                  children: [
                    {
                      type: "p",
                      props: {
                        style: titleStyle,
                        children: titleText,
                      },
                    },
                    {
                      type: "div",
                      props: {
                        style: {
                          display: "flex",
                          justifyContent: "space-between",
                          width: "100%",
                          marginBottom: "8px",
                          fontSize: 28,
                        },
                        children: [
                          {
                            type: "span",
                            props: {
                              children: [
                                "by ",
                                {
                                  type: "span",
                                  props: {
                                    style: { color: "transparent" },
                                    children: '"',
                                  },
                                },
                                {
                                  type: "span",
                                  props: {
                                    style: {
                                      overflow: "hidden",
                                      fontWeight: "bold",
                                    },
                                    children: authorText,
                                  },
                                },
                              ],
                            },
                          },
                          {
                            type: "span",
                            props: {
                              style: {
                                display: "flex",
                                alignItems: "center",
                                overflow: "hidden",
                                fontWeight: "bold",
                              },
                              children: [
                                {
                                  type: "svg",
                                  props: {
                                    style: {
                                      width: "50px",
                                      height: "50px",
                                      marginRight: "10px",
                                    },
                                    viewBox: "0 0 512 512",
                                    xmlns: "http://www.w3.org/2000/svg",
                                    version: "1.1",
                                    children: [
                                      {
                                        type: "g",
                                        props: {
                                          children: [
                                            {
                                              type: "path",
                                              props: {
                                                style: { opacity: 1 },
                                                fill: "#e5e4e2",
                                                d: "M 478.5,259.5 C 475.137,333.737 443.804,392.903 384.5,437C 307.652,490.255 227.318,495.922 143.5,454C 114.708,438.096 90.041,417.263 69.5,391.5C 69.2624,389.596 68.2624,388.262 66.5,387.5C 65.0256,386.564 64.0256,385.23 63.5,383.5C 63.573,381.973 62.9063,380.973 61.5,380.5C 61.573,378.973 60.9063,377.973 59.5,377.5C 59.2503,375.326 58.2503,373.659 56.5,372.5C 56.573,370.973 55.9063,369.973 54.5,369.5C 53.6618,369.158 53.3284,368.492 53.5,367.5C 26.9346,317.046 18.7679,263.713 29,207.5C 34.3975,185.974 41.3975,164.974 50,144.5C 61.7636,122.727 76.5969,103.227 94.5,86C 125.433,56.7835 161.766,37.4502 203.5,28C 274.716,16.0995 338.716,32.0995 395.5,76C 402.399,81.9007 408.232,88.734 413,96.5C 456.144,141.892 477.977,196.225 478.5,259.5 Z",
                                              },
                                            },
                                          ],
                                        },
                                      },
                                      {
                                        type: "g",
                                        props: {
                                          children: [
                                            {
                                              type: "path",
                                              props: {
                                                style: { opacity: 0.996 },
                                                fill: "#62b8e2",
                                                d: "M 386.5,109.5 C 435.379,155.964 456.879,212.964 451,280.5C 445.95,319.926 430.117,354.259 403.5,383.5C 402.675,384.386 401.675,384.719 400.5,384.5C 398.218,383.511 396.551,381.844 395.5,379.5C 393.057,377.945 390.39,377.278 387.5,377.5C 383.211,361.261 374.211,348.261 360.5,338.5C 359.567,321.777 351.567,309.944 336.5,303C 333.568,302.047 330.568,301.547 327.5,301.5C 312.532,298.9 301.699,304.567 295,318.5C 293.763,322.06 293.263,325.727 293.5,329.5C 276.511,329.664 260.677,333.997 246,342.5C 228.135,328.349 211.135,329.349 195,345.5C 185.754,359.044 185.087,373.044 193,387.5C 195.705,390.036 198.205,392.703 200.5,395.5C 197.927,401.894 196.094,408.561 195,415.5C 194.667,425.167 194.333,434.833 194,444.5C 193.612,445.428 192.945,446.095 192,446.5C 163.965,437.409 139.131,423.076 117.5,403.5C 74.654,363.784 52.3207,314.451 50.5,255.5C 54.7459,173.808 92.7459,113.641 164.5,75C 230.583,45.4193 294.583,49.4193 356.5,87C 367.226,93.5626 377.226,101.063 386.5,109.5 Z",
                                              },
                                            },
                                          ],
                                        },
                                      },
                                      {
                                        type: "g",
                                        props: {
                                          children: [
                                            {
                                              type: "path",
                                              props: {
                                                style: { opacity: 0.996 },
                                                fill: "#1c9ed5",
                                                d: "M 408.5,124.5 C 407.504,124.414 406.671,124.748 406,125.5C 399.5,120.333 393.667,114.5 388.5,108C 387.184,107.472 386.517,107.972 386.5,109.5C 377.226,101.063 367.226,93.5626 356.5,87C 294.583,49.4193 230.583,45.4193 164.5,75C 92.7459,113.641 54.7459,173.808 50.5,255.5C 49.8826,255.611 49.3826,255.944 49,256.5C 48.8772,262.414 48.0439,268.081 46.5,273.5C 43.5785,182.67 81.5785,115.17 160.5,71C 230.698,38.8219 298.365,43.4886 363.5,85C 380.497,95.8265 395.497,108.993 408.5,124.5 Z",
                                              },
                                            },
                                          ],
                                        },
                                      },
                                      {
                                        type: "g",
                                        props: {
                                          children: [
                                            {
                                              type: "path",
                                              props: {
                                                style: { opacity: 0.996 },
                                                fill: "#1898d6",
                                                d: "M 50.5,255.5 C 52.3207,314.451 74.654,363.784 117.5,403.5C 116.475,403.897 116.308,404.563 117,405.5C 120.448,408.464 123.948,411.297 127.5,414C 126.663,415.011 126.33,416.178 126.5,417.5C 80.0958,380.711 53.4292,332.711 46.5,273.5C 48.0439,268.081 48.8772,262.414 49,256.5C 49.3826,255.944 49.8826,255.611 50.5,255.5 Z",
                                              },
                                            },
                                          ],
                                        },
                                      },
                                    ],
                                  },
                                },
                                siteTitleText,
                              ],
                            },
                          },
                        ],
                      },
                    },
                  ],
                },
              },
            },
          },
        ],
      },
    },
    {
      width: 1200,
      height: 630,
      embedFont: true,
      fonts: await loadGoogleFonts(
        titleText + authorText + siteTitleText + "by"
      ),
    }
  );
  return injectTitleMetadata(svg, titleText);
};
