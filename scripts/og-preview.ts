import { Resvg } from "@resvg/resvg-js";
import fs from "node:fs/promises";
import path from "node:path";
import postOgImage from "../src/utils/og-templates/post.js";

function svgToPng(svg: string): Uint8Array {
  const resvg = new Resvg(svg, { fitTo: { mode: "width", value: 1200 } });
  return resvg.render().asPng();
}

async function main() {
  const [titleArg, localeArg = "zh-CN", authorArg = "Gaazeon"] =
    process.argv.slice(2);
  const title = titleArg ?? "Preview: IBM Plex Sans 渲染测试";
  const locale = localeArg;
  const author = authorArg;

  const fakePost = {
    data: {
      title,
      author,
      locale,
    },
  };

  const svg = await postOgImage(fakePost);
  const png = svgToPng(svg);

  const outDir = path.resolve(process.cwd(), "tmp");
  const outPath = path.join(outDir, `og-preview-${locale}.png`);
  await fs.mkdir(outDir, { recursive: true });
  await fs.writeFile(outPath, png);
  console.log(`OG preview written to: ${outPath}`);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
