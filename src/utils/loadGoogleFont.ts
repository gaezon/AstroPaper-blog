import fs from "node:fs/promises";
import path from "node:path";
import zlib from "node:zlib";

function convertWoffToTtf(buffer: Buffer): Buffer | null {
  if (buffer.length < 44) return null;
  const signature = buffer.toString("ascii", 0, 4);
  if (signature !== "wOFF") return null;

  const flavor = buffer.readUInt32BE(4);
  const numTables = buffer.readUInt16BE(12);
  const totalSfntSize = buffer.readUInt32BE(16);

  const entrySelector = Math.floor(Math.log2(numTables));
  const searchRange = Math.pow(2, entrySelector) * 16;
  const rangeShift = numTables * 16 - searchRange;

  const out = Buffer.alloc(totalSfntSize);
  out.writeUInt32BE(flavor, 0);
  out.writeUInt16BE(numTables, 4);
  out.writeUInt16BE(searchRange, 6);
  out.writeUInt16BE(entrySelector, 8);
  out.writeUInt16BE(rangeShift, 10);

  let tableDirOffset = 12;
  let tableDataOffset = 12 + numTables * 16;
  let offset = 44;

  for (let i = 0; i < numTables; i++) {
    const tag = buffer.toString("ascii", offset, offset + 4);
    const srcOffset = buffer.readUInt32BE(offset + 4);
    const compLength = buffer.readUInt32BE(offset + 8);
    const origLength = buffer.readUInt32BE(offset + 12);
    const checksum = buffer.readUInt32BE(offset + 16);

    const rawTable = buffer.subarray(srcOffset, srcOffset + compLength);
    const inflated =
      compLength === origLength
        ? rawTable
        : zlib.inflateSync(rawTable, { finishFlush: zlib.constants.Z_SYNC_FLUSH });

    if (inflated.length !== origLength) {
      throw new Error(`WOFF inflate length mismatch for ${tag}`);
    }

    out.write(tag, tableDirOffset, 4, "ascii");
    out.writeUInt32BE(checksum, tableDirOffset + 4);
    out.writeUInt32BE(tableDataOffset, tableDirOffset + 8);
    out.writeUInt32BE(origLength, tableDirOffset + 12);

    inflated.copy(out, tableDataOffset);
    tableDirOffset += 16;
    tableDataOffset += origLength;

    const pad = (4 - (origLength % 4)) % 4;
    if (pad) {
      out.fill(0, tableDataOffset, tableDataOffset + pad);
      tableDataOffset += pad;
    }

    offset += 20;
  }

return out;
}

const PREFER_LOCAL_FONTS =
  process.env.OG_ALLOW_LOCAL_FONTS === "true" ||
  process.env.NODE_ENV !== "production";
const ALLOW_LOCAL_FALLBACK = process.env.OG_DISABLE_LOCAL_FALLBACK !== "true";

async function tryLoadLocalFont(
  fontName: string,
  weight: number,
  force = false
): Promise<ArrayBuffer | null> {
  if (!force && !PREFER_LOCAL_FONTS) return null;

  try {
    const candidates: string[] = [];

    if (fontName.includes("IBM+Plex+Sans")) {
      // Prefer any local TTF/OTF if available (rare in @fontsource), otherwise skip
      candidates.push(
        `node_modules/@fontsource/ibm-plex-sans/files/ibm-plex-sans-latin-${weight}-normal.woff`,
        `node_modules/@fontsource/ibm-plex-sans/files/ibm-plex-sans-${weight}-normal.woff`,
        `public/fonts/ibm-plex-sans-${weight}.woff`,
        `public/fonts/ibm-plex-sans-${weight}.ttf`
      );
    } else if (fontName.includes("Noto+Sans+SC")) {
      candidates.push(
        `node_modules/@fontsource/noto-sans-sc/files/noto-sans-sc-chinese-simplified-${weight}-normal.woff`,
        `public/fonts/noto-sans-sc-${weight}.woff`,
        `public/fonts/noto-sans-sc-${weight}.ttf`
      );
    } else if (fontName.includes("Noto+Sans")) {
      candidates.push(
        `node_modules/@fontsource/noto-sans/files/noto-sans-latin-${weight}-normal.woff`,
        `public/fonts/noto-sans-${weight}.woff`,
        `public/fonts/noto-sans-${weight}.ttf`
      );
    }

    for (const rel of candidates) {
      const fontPath = path.resolve(process.cwd(), rel);
      try {
        await fs.access(fontPath);
        const fontBuffer = await fs.readFile(fontPath);
        const tag = fontBuffer.toString("ascii", 0, 4);
        let usable: Buffer | null = null;

        if (tag === "\x00\x01\x00\x00" || tag === "OTTO") {
          usable = fontBuffer;
        } else if (tag === "wOFF") {
          usable = convertWoffToTtf(fontBuffer);
        }

        if (usable) {
          const view = usable.subarray(0);
          const arrayBuffer = view.buffer.slice(
            view.byteOffset,
            view.byteOffset + view.byteLength
          ) as ArrayBuffer;
          return arrayBuffer;
        }
      } catch {
        // try next
      }
    }

    return null;
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
  const tryLocalFallback = async () =>
    ALLOW_LOCAL_FALLBACK ? await tryLoadLocalFont(font, weight, true) : null;

  if (PREFER_LOCAL_FONTS) {
    const eager = await tryLoadLocalFont(font, weight);
    if (eager) {
      return eager;
    }
  }

  const directSourceKey = `${font}:${weight}`;
  const directSources: Record<string, string> = {
    "IBM+Plex+Sans:400":
      "https://fastly.jsdelivr.net/gh/google/fonts/ofl/ibmplexsans/IBMPlexSans-Regular.ttf",
    "IBM+Plex+Sans:700":
      "https://fastly.jsdelivr.net/gh/google/fonts/ofl/ibmplexsans/IBMPlexSans-Bold.ttf",
    "Noto+Sans:400":
      "https://fastly.jsdelivr.net/gh/google/fonts/ofl/notosans/NotoSans-Regular.ttf",
    "Noto+Sans:700":
      "https://fastly.jsdelivr.net/gh/google/fonts/ofl/notosans/NotoSans-Bold.ttf",
    "Noto+Sans+SC:400":
      "https://fastly.jsdelivr.net/gh/google/fonts/ofl/notosanssc/NotoSansSC-Regular.otf",
    "Noto+Sans+SC:700":
      "https://fastly.jsdelivr.net/gh/google/fonts/ofl/notosanssc/NotoSansSC-Bold.otf",
  };

  const directUrl = directSources[directSourceKey];
  if (directUrl) {
    try {
      const res = await fetch(directUrl);
      if (res.ok) {
        const buffer = await res.arrayBuffer();
        if (buffer.byteLength > 1024) {
          return buffer;
        }
      }
    } catch (e) {
      console.warn(`Direct font fetch failed for ${directSourceKey}:`, e);
    }
  }

  // 如果本地加载失败，尝试从Google加载
  try {
    // Try legacy CSS API first to obtain TrueType
    const legacyAPI = `https://fonts.googleapis.com/css?family=${font}:${weight}&text=${encodeURIComponent(text)}`;
    const headers = {
      "User-Agent":
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Safari/605.1.15",
    };

    let css = await (await fetch(legacyAPI, { headers })).text();

    // Fallback to CSS2 if legacy doesn't return usable sources
    if (!/format\('(opentype|truetype)'\)/.test(css)) {
      const css2API = `https://fonts.googleapis.com/css2?family=${font}:wght@${weight}&text=${encodeURIComponent(text)}`;
      css = await (await fetch(css2API, { headers })).text();
    }

    // Only accept TrueType/OpenType for Satori
    const sources = Array.from(
      css.matchAll(/src:\s*url\(([^)]+)\)\s*format\('(opentype|truetype)'\)/g)
    );

    if (!sources.length) {
      console.warn("No TTF/OTF source in Google CSS; using fallback");
      const local = await tryLocalFallback();
      if (local) return local;
      return await getFallbackFont();
    }

    const picked = sources.find(match => match?.[1]) ?? sources[0];
    if (!picked || !picked[1]) {
      console.warn("Parsed Google CSS but missing URL capture; using fallback");
      const local = await tryLocalFallback();
      if (local) return local;
      return await getFallbackFont();
    }

    const url = picked[1].replace(/^['"]|['"]$/g, "");
    const res = await fetch(url);

    if (!res.ok) {
      console.warn(`Failed to download font: ${res.status}, using fallback`);
      const local = await tryLocalFallback();
      if (local) return local;
      return await getFallbackFont();
    }

    return res.arrayBuffer();
  } catch (e) {
    // 静默失败并回退到最小字体，避免控制台噪音
    console.error("Error loading Google Font:", e);
    const local = await tryLocalFallback();
    if (local) return local;
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
  // 优先使用 IBM Plex Sans（英文/拉丁），并为中文提供 Noto Sans SC 作为补充
  // 注意：传入 Google Fonts 的 family 名称不包含 :wght@，权重由第二参数控制
  const fontsConfig = [
    { name: "IBM Plex Sans", font: "IBM+Plex+Sans", weight: 400, style: "normal" },
    { name: "IBM Plex Sans", font: "IBM+Plex+Sans", weight: 700, style: "normal" },
    { name: "Noto Sans SC", font: "Noto+Sans+SC", weight: 400, style: "normal" },
    { name: "Noto Sans SC", font: "Noto+Sans+SC", weight: 700, style: "normal" },
    { name: "Noto Sans", font: "Noto+Sans", weight: 400, style: "normal" },
    { name: "Noto Sans", font: "Noto+Sans", weight: 700, style: "normal" },
  ];

  // 尝试加载字体；如果某个字体不可用则跳过它，避免注册无效字体导致渲染报错
  try {
    const entries = await Promise.all(
      fontsConfig.map(async ({ name, font, weight, style }) => {
        try {
          const data = await loadGoogleFont(font, text, weight);
          // 简单校验：太小的 buffer 视为无效字体，直接跳过
          if (!(data && data.byteLength && data.byteLength > 1024)) return null;
          return { name, data, weight, style } as const;
        } catch {
          return null;
        }
      })
    );
    const fonts = entries.filter(Boolean) as Array<{
      name: string;
      data: ArrayBuffer;
      weight: number;
      style: string;
    }>;
    return fonts;
  } catch {
    // 忽略详细错误输出，避免控制台噪音
    // 在失败情况下，提供最小的字体数组
    return [];
  }
}

export default loadGoogleFonts;
