import satori from "satori";
import loadGoogleFonts from "../loadGoogleFont";
import { createOgFrame, createFooter } from "./shared";

export default async ({ title, description, website }) => {
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
              children: title,
            },
          },
          {
            type: "p",
            props: {
              style: { fontSize: 28 },
              children: description,
            },
          },
        ],
      },
    },
    createFooter(new URL(website).hostname),
  ];

  return satori(createOgFrame(mainContent), {
    width: 1200,
    height: 630,
    embedFont: true,
    fonts: await loadGoogleFonts(title + description + website),
  });
};
