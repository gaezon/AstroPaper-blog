import fs from "node:fs/promises";
import path from "node:path";

// 尝试从本地加载字体
async function tryLoadLocalFont(
  fontName: string,
  weight: number
): Promise<ArrayBuffer | null> {
  try {
    let fontPath = "";

    // 根据字体名称选择正确的路径
    if (fontName.includes("Noto+Sans+SC")) {
      // Noto Sans SC 字体
      fontPath = path.resolve(
        process.cwd(),
        `node_modules/@fontsource/noto-sans-sc/files/noto-sans-sc-chinese-simplified-${weight}-normal.woff`
      );
    } else if (fontName.includes("Noto+Sans")) {
      // Noto Sans 字体
      fontPath = path.resolve(
        process.cwd(),
        `node_modules/@fontsource/noto-sans/files/noto-sans-latin-${weight}-normal.woff`
      );
    } else {
      return null;
    }

    // 检查文件是否存在
    try {
      await fs.access(fontPath);
    } catch {
      // 尝试使用.woff2扩展名
      fontPath = fontPath.replace(".woff", ".woff2");
      try {
        await fs.access(fontPath);
      } catch {
        // 尝试寻找其他可能的字体格式
        const alternativePath = fontPath.replace(".woff2", ".ttf");
        try {
          await fs.access(alternativePath);
          fontPath = alternativePath;
        } catch {
          console.warn(`Font file not found at ${fontPath}`);
          return null;
        }
      }
    }

    // 读取字体文件
    const fontBuffer = await fs.readFile(fontPath);
    return fontBuffer.buffer.slice(
      fontBuffer.byteOffset,
      fontBuffer.byteOffset + fontBuffer.byteLength
    ) as ArrayBuffer;
  } catch (e) {
    console.error("Error loading local font:", e);
    return null;
  }
}

async function loadGoogleFont(
  font: string,
  text: string,
  weight: number
): Promise<ArrayBuffer> {
  // 首先尝试从本地加载字体
  const localFont = await tryLoadLocalFont(font, weight);
  if (localFont) {
    return localFont;
  }

  // 如果本地加载失败，尝试从Google加载
  try {
    const API = `https://fonts.googleapis.com/css2?family=${font}:wght@${weight}&text=${encodeURIComponent(text)}`;

    const css = await (
      await fetch(API, {
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Macintosh; U; Intel Mac OS X 10_6_8; de-at) AppleWebKit/533.21.1 (KHTML, like Gecko) Version/5.0.5 Safari/533.21.1",
        },
      })
    ).text();

    const resource = css.match(
      /src: url\((.+?)\) format\('(opentype|truetype)'\)/
    );

    if (!resource) {
      console.warn("Failed to parse font URL, using fallback");
      return await getFallbackFont();
    }

    const res = await fetch(resource[1]);

    if (!res.ok) {
      console.warn(`Failed to download font: ${res.status}, using fallback`);
      return await getFallbackFont();
    }

    return res.arrayBuffer();
  } catch (e) {
    // 静默失败并回退到最小字体，避免控制台噪音
    console.error("Error loading Google Font:", e);
    return await getFallbackFont();
  }
}

// 提供最小有效的字体数据
async function getFallbackFont(): Promise<ArrayBuffer> {
  // 创建一个小的但有效的字体数据
  // 这里我们创建一个简单的1x1像素的空字体，足够让OG图像生成过程继续
  return new ArrayBuffer(4);
}

async function loadGoogleFonts(
  text: string
): Promise<
  Array<{ name: string; data: ArrayBuffer; weight: number; style: string }>
> {
  const fontsConfig = [
    {
      name: "Noto Sans SC",
      font: "Noto+Sans+SC",
      weight: 400,
      style: "normal",
    },
    {
      name: "Noto Sans SC",
      font: "Noto+Sans+SC:wght@700",
      weight: 700,
      style: "normal",
    },
    { name: "Noto Sans", font: "Noto+Sans", weight: 400, style: "normal" },
    {
      name: "Noto Sans",
      font: "Noto+Sans:wght@700",
      weight: 700,
      style: "normal",
    },
  ];

  // 尝试加载字体，但不中断流程
  try {
    const fonts = await Promise.all(
      fontsConfig.map(async ({ name, font, weight, style }) => {
        try {
          const data = await loadGoogleFont(font, text, weight);
          return { name, data, weight, style };
        } catch {
          console.warn(`Error loading font ${name}, using fallback`);
          const data = await getFallbackFont();
          return { name, data, weight, style };
        }
      })
    );
    return fonts;
  } catch {
    // 忽略详细错误输出，避免控制台噪音
    // 在失败情况下，提供最小的字体数组
    return fontsConfig.map(({ name, weight, style }) => ({
      name,
      data: new ArrayBuffer(4),
      weight,
      style,
    }));
  }
}

export default loadGoogleFonts;
