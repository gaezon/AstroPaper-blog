import satori from "satori";
import { SITE } from "@/config";
import loadGoogleFonts from "../loadGoogleFont";
import { createOgFrame, createFooter } from "./shared";

export default async () => {
  const mainContent = [
    {
      type: "div",
      props: {
        style: {
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
          height: "90%",
          maxHeight: "90%",
          overflow: "hidden",
          textAlign: "center",
        },
        children: [
          {
            type: "p",
            props: {
              style: { fontSize: 72, fontWeight: "bold" },
              children: SITE.title,
            },
          },
          {
            type: "p",
            props: {
              style: { fontSize: 28 },
              children: SITE.desc,
            },
          },
        ],
      },
    },
    createFooter(new URL(SITE.website).hostname),
  ];

  return satori(createOgFrame(mainContent), {
    width: 1200,
    height: 630,
    embedFont: true,
    fonts: await loadGoogleFonts(SITE.title + SITE.desc + SITE.website),
  });
};
