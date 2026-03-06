import { beforeEach, describe, expect, it, vi } from "vitest";

const { mockSatori, mockLoadGoogleFonts, mockCreateOgFrame, mockCreateFooter } =
  vi.hoisted(() => ({
    mockSatori: vi.fn(),
    mockLoadGoogleFonts: vi.fn(),
    mockCreateOgFrame: vi.fn(),
    mockCreateFooter: vi.fn(),
  }));

vi.mock("satori", () => ({
  default: mockSatori,
}));

vi.mock("../../src/utils/loadGoogleFont", () => ({
  default: mockLoadGoogleFonts,
}));

vi.mock("../../src/utils/og-templates/shared", () => ({
  createOgFrame: mockCreateOgFrame,
  createFooter: mockCreateFooter,
}));

import renderSiteOg from "../../src/utils/og-templates/site";

describe("site OG template", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    mockCreateFooter.mockImplementation(siteName => ({
      type: "footer",
      siteName,
    }));

    mockCreateOgFrame.mockImplementation(children => ({
      type: "frame",
      children,
    }));

    mockSatori.mockResolvedValue("<svg />");
  });

  it("renders localized content and uses website hostname in footer", async () => {
    const fonts = [
      {
        name: "Mock Sans",
        data: new ArrayBuffer(8),
        weight: 400,
        style: "normal",
      },
    ];
    mockLoadGoogleFonts.mockResolvedValue(fonts);

    const result = await renderSiteOg({
      title: "AstroPaper",
      description: "Bilingual blog",
      website: "https://example.com/blog",
    });

    expect(result).toBe("<svg />");
    expect(mockCreateFooter).toHaveBeenCalledWith("example.com");
    expect(mockLoadGoogleFonts).toHaveBeenCalledWith(
      "AstroPaperBilingual bloghttps://example.com/blog"
    );

    const [mainContent] = mockCreateOgFrame.mock.calls[0];
    expect(mainContent[0].props.children[0].props.children).toBe("AstroPaper");
    expect(mainContent[0].props.children[1].props.children).toBe(
      "Bilingual blog"
    );
    expect(mainContent[1]).toEqual({ type: "footer", siteName: "example.com" });

    expect(mockSatori).toHaveBeenCalledWith(
      { type: "frame", children: mainContent },
      {
        width: 1200,
        height: 630,
        embedFont: true,
        fonts,
      }
    );
  });

  it("throws for a non-absolute website URL", async () => {
    await expect(
      renderSiteOg({
        title: "AstroPaper",
        description: "Bilingual blog",
        website: "example.com/blog",
      })
    ).rejects.toThrow("Invalid URL");

    expect(mockCreateFooter).not.toHaveBeenCalled();
    expect(mockSatori).not.toHaveBeenCalled();
  });
});
