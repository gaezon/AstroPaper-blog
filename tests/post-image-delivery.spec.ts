import { expect, test } from "@playwright/test";

const ARTICLE_PATHS = [
  "/posts/hoarder-app-replace-cubox/",
  "/en/posts/self-host-hoarder-replace-cubox/",
];

function getSrcsetWidths(srcset: string | null): number[] {
  expect(srcset).toBeTruthy();

  const entries = (srcset ?? "")
    .split(",")
    .map(item => item.trim())
    .filter(Boolean);

  expect(entries.length).toBeGreaterThan(1);

  const widths: number[] = [];

  for (const entry of entries) {
    expect(entry).toMatch(/\s\d+w$/);

    const width = Number(entry.match(/(\d+)w$/)?.[1]);
    expect(Number.isInteger(width)).toBe(true);
    widths.push(width);
  }

  return widths;
}

function getMaxSlotWidthFromSizes(sizes: string | null): number | null {
  if (!sizes) {
    return null;
  }

  const matches = [...sizes.matchAll(/(\d+)px/g)];
  if (matches.length === 0) {
    return null;
  }

  return Math.max(...matches.map(match => Number(match[1])));
}

function parseDimension(value: string | null): number {
  expect(value).toBeTruthy();

  const parsed = Number(value);
  expect(Number.isInteger(parsed)).toBe(true);
  expect(parsed).toBeGreaterThan(0);

  return parsed;
}

for (const path of ARTICLE_PATHS) {
  test(`markdown images use responsive delivery on ${path}`, async ({
    page,
  }) => {
    await page.goto(path);

    const images = page.locator("#article img");
    const imageCount = await images.count();

    expect(imageCount).toBeGreaterThan(0);

    let priorityImageCount = 0;

    for (let index = 0; index < imageCount; index += 1) {
      const image = images.nth(index);
      const loading = await image.getAttribute("loading");
      const fetchpriority = await image.getAttribute("fetchpriority");
      const isPriorityImage = loading === "eager" || fetchpriority === "high";
      const sizes = await image.getAttribute("sizes");
      const width = parseDimension(await image.getAttribute("width"));
      const height = parseDimension(await image.getAttribute("height"));
      const maxSlotWidth = getMaxSlotWidthFromSizes(sizes);
      const srcsetWidths = getSrcsetWidths(await image.getAttribute("srcset"));
      const maxSrcsetWidth = Math.max(...srcsetWidths);

      await expect(image).toHaveAttribute("decoding", "async");
      expect(sizes).toContain("100vw");
      expect(maxSlotWidth).not.toBeNull();
      expect(maxSlotWidth ?? Number.POSITIVE_INFINITY).toBeLessThanOrEqual(768);
      expect(width).toBeLessThanOrEqual(768);
      expect(height).toBeGreaterThan(0);
      expect(maxSrcsetWidth).toBeLessThanOrEqual(1536);

      if (isPriorityImage) {
        priorityImageCount += 1;
        expect(loading).toBe("eager");
        expect(fetchpriority).toBe("high");
      } else {
        expect(loading).toBe("lazy");
        expect(fetchpriority).toBe("auto");
      }
    }

    expect(priorityImageCount).toBe(1);
  });
}
