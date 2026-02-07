import fs from "node:fs/promises";
import path from "node:path";
import zlib from "node:zlib";

type FontConfig = {
  name: string;
  font: string;
  weight: number;
  style: string;
};

/**
 * Converts a WOFF (Web Open Font Format) font to TTF (TrueType Font) format.
 *
 * WOFF Header Structure (44 bytes):
 * - UInt32 signature         (0-3): "wOFF" signature
 * - UInt32 flavor           (4-7): Font format (e.g., 0x00010000 for TrueType)
 * - UInt32 length          (8-11): Total file size
 * - UInt16 numTables     (12-13): Number of font tables
 * - UInt16 reserved      (14-15): Reserved, must be 0
 * - UInt32 totalSfntSize (16-19): Uncompressed font data size
 * - UInt16 majorVersion  (20-21): Major version of the font
 * - UInt16 minorVersion  (22-23): Minor version of the font
 * - UInt32 metaOffset    (24-27): Offset to metadata block
 * - UInt32 metaLength    (28-31): Length of compressed metadata
 * - UInt32 metaOrigLength (32-35): Uncompressed metadata length
 * - UInt32 privOffset    (36-39): Offset to private data block
 * - UInt32 privLength    (40-43): Length of private data block
 *
 * @param buffer - The WOFF font buffer to convert
 * @returns The converted TTF font buffer or null if invalid
 */
function convertWoffToTtf(buffer: Buffer): Buffer | null {
  // Minimum WOFF file size is 44 bytes (header size)
  if (buffer.length < 44) return null;

  // Check WOFF signature
  const signature = buffer.toString("ascii", 0, 4);
  if (signature !== "wOFF") return null;

  // Parse WOFF header fields
  const flavor = buffer.readUInt32BE(4); // Font format identifier
  const numTables = buffer.readUInt16BE(12); // Number of font tables
  const totalSfntSize = buffer.readUInt32BE(16); // Uncompressed font data size

  // Calculate table directory search parameters
  const entrySelector = Math.floor(Math.log2(numTables));
  const searchRange = Math.pow(2, entrySelector) * 16;
  const rangeShift = numTables * 16 - searchRange;

  // Allocate buffer for the output TTF font
  const out = Buffer.alloc(totalSfntSize);

  // Write TTF header (same as WOFF flavor field)
  out.writeUInt32BE(flavor, 0);
  out.writeUInt16BE(numTables, 4);
  out.writeUInt16BE(searchRange, 6);
  out.writeUInt16BE(entrySelector, 8);
  out.writeUInt16BE(rangeShift, 10);

  // Initialize offsets for table directory and table data
  let tableDirOffset = 12; // Table directory starts after TTF header
  let tableDataOffset = 12 + numTables * 16; // Table data follows directory
  let offset = 44; // First table record in WOFF

  // Process each font table
  for (let i = 0; i < numTables; i++) {
    // Read table record fields
    const tag = buffer.toString("ascii", offset, offset + 4); // Table identifier
    const srcOffset = buffer.readUInt32BE(offset + 4); // Offset to compressed data
    const compLength = buffer.readUInt32BE(offset + 8); // Compressed data length
    const origLength = buffer.readUInt32BE(offset + 12); // Uncompressed data length
    const checksum = buffer.readUInt32BE(offset + 16); // Checksum of uncompressed data

    // Extract and decompress table data
    const rawTable = buffer.subarray(srcOffset, srcOffset + compLength);
    const inflated =
      compLength === origLength
        ? rawTable // No compression
        : zlib.inflateSync(rawTable, {
            finishFlush: zlib.constants.Z_SYNC_FLUSH,
          });

    // Verify decompressed data length
    if (inflated.length !== origLength) {
      throw new Error(`WOFF inflate length mismatch for ${tag}`);
    }

    // Write table directory entry
    out.write(tag, tableDirOffset, 4, "ascii");
    out.writeUInt32BE(checksum, tableDirOffset + 4);
    out.writeUInt32BE(tableDataOffset, tableDirOffset + 8);
    out.writeUInt32BE(origLength, tableDirOffset + 12);

    // Copy decompressed table data
    inflated.copy(out, tableDataOffset);
    tableDirOffset += 16;
    tableDataOffset += origLength;

    // Pad table data to 4-byte boundary
    const pad = (4 - (origLength % 4)) % 4;
    if (pad) {
      out.fill(0, tableDataOffset, tableDataOffset + pad);
      tableDataOffset += pad;
    }

    // Move to next table record
    offset += 20;
  }

  return out;
}

const localFontCache = new Map<string, Promise<ArrayBuffer | null>>();

async function tryLoadLocalFont(
  fontName: string,
  weight: number
): Promise<ArrayBuffer | null> {
  const cacheKey = `${fontName}:${weight}`;
  let loadPromise = localFontCache.get(cacheKey);
  if (!loadPromise) {
    loadPromise = (async () => {
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
    })();
    localFontCache.set(cacheKey, loadPromise);
  }

  return await loadPromise;
}

async function loadGoogleFont(
  font: string,
  text: string,
  weight: number
): Promise<ArrayBuffer> {
  const tryLocalFallback = async () => {
    return await tryLoadLocalFont(font, weight);
  };

  const eager = await tryLoadLocalFont(font, weight);
  if (eager) {
    return eager;
  }

  const directSourceKey = `${font}:${weight}`;
  const directSources: Record<string, string> = {
    "IBM+Plex+Sans:400":
      "https://github.com/google/fonts/raw/main/ofl/ibmplexsans/IBMPlexSans-Regular.ttf",
    "IBM+Plex+Sans:700":
      "https://github.com/google/fonts/raw/main/ofl/ibmplexsans/IBMPlexSans-Bold.ttf",
    "Noto+Sans:400":
      "https://github.com/google/fonts/raw/main/ofl/notosans/NotoSans-Regular.ttf",
    "Noto+Sans:700":
      "https://github.com/google/fonts/raw/main/ofl/notosans/NotoSans-Bold.ttf",
    "Noto+Sans+SC:400":
      "https://github.com/google/fonts/raw/main/ofl/notosanssc/NotoSansSC-Regular.otf",
    "Noto+Sans+SC:700":
      "https://github.com/google/fonts/raw/main/ofl/notosanssc/NotoSansSC-Bold.otf",
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

  // If local loading fails, try Google
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
    // Fail silently and fall back to a minimal font to avoid console noise
    console.error("Error loading Google Font:", e);
    const local = await tryLocalFallback();
    if (local) return local;
    return await getFallbackFont();
  }
}

// Provide minimal valid font data
async function getFallbackFont(): Promise<ArrayBuffer> {
  // Create a tiny yet valid font data
  // Here we create a simple 1x1 pixel empty font, enough to keep OG image generation going
  return new ArrayBuffer(4);
}

async function loadGoogleFonts(
  text: string
): Promise<
  Array<{ name: string; data: ArrayBuffer; weight: number; style: string }>
> {
  // Prefer IBM Plex Sans (Latin) and add Noto Sans SC for Chinese
  // Note: the Google Fonts family name excludes :wght@; control weight via the second parameter
  const fontsConfig: FontConfig[] = [
    {
      name: "IBM Plex Sans",
      font: "IBM+Plex+Sans",
      weight: 400,
      style: "normal",
    },
    {
      name: "IBM Plex Sans",
      font: "IBM+Plex+Sans",
      weight: 700,
      style: "normal",
    },
    {
      name: "Noto Sans SC",
      font: "Noto+Sans+SC",
      weight: 400,
      style: "normal",
    },
    {
      name: "Noto Sans SC",
      font: "Noto+Sans+SC",
      weight: 700,
      style: "normal",
    },
    { name: "Noto Sans", font: "Noto+Sans", weight: 400, style: "normal" },
    { name: "Noto Sans", font: "Noto+Sans", weight: 700, style: "normal" },
  ];

  // Try loading fonts; skip any unavailable to avoid registering invalid fonts that cause render errors
  try {
    const entries = await Promise.all(
      fontsConfig.map(async ({ name, font, weight, style }) => {
        try {
          const data = await loadGoogleFont(font, text, weight);
          // Simple validation: very small buffers are treated as invalid and skipped
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
    if (fonts.length === 0) {
      console.warn("No fonts loaded; falling back to minimal font set");
      return await buildFallbackFonts(fontsConfig);
    }
    return fonts;
  } catch {
    // Suppress verbose errors to avoid console noise
    // On failure, provide a minimal font set
    return await buildFallbackFonts(fontsConfig);
  }
}

async function buildFallbackFonts(
  configs: FontConfig[]
): Promise<
  Array<{ name: string; data: ArrayBuffer; weight: number; style: string }>
> {
  return Promise.all(
    configs.map(async ({ name, weight, style }) => ({
      name,
      data: await getFallbackFont(),
      weight,
      style,
    }))
  );
}

export default loadGoogleFonts;
