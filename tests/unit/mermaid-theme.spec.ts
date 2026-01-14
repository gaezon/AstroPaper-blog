import { describe, it, expect } from "vitest";
import {
  createThemeVariables,
  darkThemeColors,
  lightThemeColors,
  SHARED_FONT_FAMILY,
  type MermaidThemeVariables,
} from "../../src/utils/mermaidTheme";

describe("mermaidTheme", () => {
  describe("SHARED_FONT_FAMILY", () => {
    it("should contain the expected font family stack", () => {
      expect(SHARED_FONT_FAMILY).toBe(
        'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen, Ubuntu, Cantarell, "Open Sans", "Helvetica Neue", sans-serif'
      );
    });
  });

  describe("createThemeVariables", () => {
    it("should merge color palette with shared font family", () => {
      const mockColors: Omit<MermaidThemeVariables, "fontFamily"> = {
        background: "#000000",
        primaryColor: "#111111",
        secondaryColor: "#222222",
        primaryTextColor: "#ffffff",
        secondaryTextColor: "#eeeeee",
        primaryBorderColor: "#333333",
        lineColor: "#444444",
        clusterBkg: "#555555",
        titleColor: "#666666",
        tertiaryColor: "#777777",
        noteBkgColor: "#888888",
        noteTextColor: "#999999",
        cScale0: "#a0a0a0",
        cScale1: "#a1a1a1",
        cScale2: "#a2a2a2",
        cScale3: "#a3a3a3",
        cScale4: "#a4a4a4",
        cScale5: "#a5a5a5",
        cScaleLabel0: "#b0b0b0",
        cScaleLabel1: "#b1b1b1",
        cScaleLabel2: "#b2b2b2",
        cScaleLabel3: "#b3b3b3",
        cScaleLabel4: "#b4b4b4",
        cScaleLabel5: "#b5b5b5",
      };

      const result = createThemeVariables(mockColors);

      // Verify all color properties are preserved
      expect(result.background).toBe("#000000");
      expect(result.primaryColor).toBe("#111111");
      expect(result.secondaryColor).toBe("#222222");
      expect(result.primaryTextColor).toBe("#ffffff");
      expect(result.secondaryTextColor).toBe("#eeeeee");
      expect(result.primaryBorderColor).toBe("#333333");
      expect(result.lineColor).toBe("#444444");
      expect(result.clusterBkg).toBe("#555555");
      expect(result.titleColor).toBe("#666666");
      expect(result.tertiaryColor).toBe("#777777");
      expect(result.noteBkgColor).toBe("#888888");
      expect(result.noteTextColor).toBe("#999999");
      expect(result.cScale0).toBe("#a0a0a0");
      expect(result.cScale1).toBe("#a1a1a1");
      expect(result.cScale2).toBe("#a2a2a2");
      expect(result.cScale3).toBe("#a3a3a3");
      expect(result.cScale4).toBe("#a4a4a4");
      expect(result.cScale5).toBe("#a5a5a5");
      expect(result.cScaleLabel0).toBe("#b0b0b0");
      expect(result.cScaleLabel1).toBe("#b1b1b1");
      expect(result.cScaleLabel2).toBe("#b2b2b2");
      expect(result.cScaleLabel3).toBe("#b3b3b3");
      expect(result.cScaleLabel4).toBe("#b4b4b4");
      expect(result.cScaleLabel5).toBe("#b5b5b5");

      // Verify fontFamily is added
      expect(result.fontFamily).toBe(SHARED_FONT_FAMILY);
    });

    it("should not mutate the input color palette", () => {
      const mockColors: Omit<MermaidThemeVariables, "fontFamily"> = {
        background: "transparent",
        primaryColor: "#test",
        secondaryColor: "#test2",
        primaryTextColor: "#text",
        secondaryTextColor: "#text2",
        primaryBorderColor: "#border",
        lineColor: "#line",
        clusterBkg: "#cluster",
        titleColor: "#title",
        tertiaryColor: "#tertiary",
        noteBkgColor: "#note",
        noteTextColor: "#noteText",
        cScale0: "#c0",
        cScale1: "#c1",
        cScale2: "#c2",
        cScale3: "#c3",
        cScale4: "#c4",
        cScale5: "#c5",
        cScaleLabel0: "#cl0",
        cScaleLabel1: "#cl1",
        cScaleLabel2: "#cl2",
        cScaleLabel3: "#cl3",
        cScaleLabel4: "#cl4",
        cScaleLabel5: "#cl5",
      };

      const originalColors = { ...mockColors };
      createThemeVariables(mockColors);

      expect(mockColors).toEqual(originalColors);
    });
  });

  describe("darkThemeColors", () => {
    it("should have all required color properties", () => {
      expect(darkThemeColors).toBeDefined();
      expect(darkThemeColors.background).toBe("transparent");
      expect(darkThemeColors.primaryColor).toBe("#2d3548");
      expect(darkThemeColors.secondaryColor).toBe("#343f60");
      expect(darkThemeColors.primaryTextColor).toBe("#eaedf3");
      expect(darkThemeColors.secondaryTextColor).toBe("#eaedf3");
      expect(darkThemeColors.primaryBorderColor).toBe("#ff6b01");
      expect(darkThemeColors.lineColor).toBe("#ff6b01");
      expect(darkThemeColors.clusterBkg).toBe("#343f60");
      expect(darkThemeColors.titleColor).toBe("#eaedf3");
      expect(darkThemeColors.tertiaryColor).toBe("#2d3548");
      expect(darkThemeColors.noteBkgColor).toBe("#ff8534");
      expect(darkThemeColors.noteTextColor).toBe("#ffffff");
    });

    it("should have all cScale properties", () => {
      expect(darkThemeColors.cScale0).toBe("#2d3548");
      expect(darkThemeColors.cScale1).toBe("#343f60");
      expect(darkThemeColors.cScale2).toBe("#2d3548");
      expect(darkThemeColors.cScale3).toBe("#343f60");
      expect(darkThemeColors.cScale4).toBe("#2d3548");
      expect(darkThemeColors.cScale5).toBe("#343f60");
    });

    it("should have all cScaleLabel properties", () => {
      expect(darkThemeColors.cScaleLabel0).toBe("#eaedf3");
      expect(darkThemeColors.cScaleLabel1).toBe("#eaedf3");
      expect(darkThemeColors.cScaleLabel2).toBe("#eaedf3");
      expect(darkThemeColors.cScaleLabel3).toBe("#eaedf3");
      expect(darkThemeColors.cScaleLabel4).toBe("#eaedf3");
      expect(darkThemeColors.cScaleLabel5).toBe("#eaedf3");
    });

    it("should NOT have fontFamily property", () => {
      expect("fontFamily" in darkThemeColors).toBe(false);
    });
  });

  describe("lightThemeColors", () => {
    it("should have all required color properties", () => {
      expect(lightThemeColors).toBeDefined();
      expect(lightThemeColors.background).toBe("transparent");
      expect(lightThemeColors.primaryColor).toBe("#e6f4fb");
      expect(lightThemeColors.secondaryColor).toBe("#f0f7fb");
      expect(lightThemeColors.primaryTextColor).toBe("#282728");
      expect(lightThemeColors.secondaryTextColor).toBe("#282728");
      expect(lightThemeColors.primaryBorderColor).toBe("#006cac");
      expect(lightThemeColors.lineColor).toBe("#006cac");
      expect(lightThemeColors.clusterBkg).toBe("#f5fafc");
      expect(lightThemeColors.titleColor).toBe("#282728");
      expect(lightThemeColors.tertiaryColor).toBe("#ffffff");
      expect(lightThemeColors.noteBkgColor).toBe("#0088cc");
      expect(lightThemeColors.noteTextColor).toBe("#ffffff");
    });

    it("should have all cScale properties", () => {
      expect(lightThemeColors.cScale0).toBe("#e6f4fb");
      expect(lightThemeColors.cScale1).toBe("#f0f7fb");
      expect(lightThemeColors.cScale2).toBe("#ffffff");
      expect(lightThemeColors.cScale3).toBe("#e6f4fb");
      expect(lightThemeColors.cScale4).toBe("#f0f7fb");
      expect(lightThemeColors.cScale5).toBe("#ffffff");
    });

    it("should have all cScaleLabel properties", () => {
      expect(lightThemeColors.cScaleLabel0).toBe("#282728");
      expect(lightThemeColors.cScaleLabel1).toBe("#282728");
      expect(lightThemeColors.cScaleLabel2).toBe("#282728");
      expect(lightThemeColors.cScaleLabel3).toBe("#282728");
      expect(lightThemeColors.cScaleLabel4).toBe("#282728");
      expect(lightThemeColors.cScaleLabel5).toBe("#282728");
    });

    it("should NOT have fontFamily property", () => {
      expect("fontFamily" in lightThemeColors).toBe(false);
    });
  });

  describe("integration tests", () => {
    it("should create complete dark theme matching original inline config", () => {
      const darkTheme = createThemeVariables(darkThemeColors);

      // Verify it's a complete MermaidThemeVariables object
      expect(darkTheme.fontFamily).toBeDefined();
      expect(darkTheme.fontFamily).toBe(SHARED_FONT_FAMILY);
      expect(darkTheme.primaryBorderColor).toBe("#ff6b01");
      expect(darkTheme.lineColor).toBe("#ff6b01");
    });

    it("should create complete light theme matching original inline config", () => {
      const lightTheme = createThemeVariables(lightThemeColors);

      // Verify it's a complete MermaidThemeVariables object
      expect(lightTheme.fontFamily).toBeDefined();
      expect(lightTheme.fontFamily).toBe(SHARED_FONT_FAMILY);
      expect(lightTheme.primaryBorderColor).toBe("#006cac");
      expect(lightTheme.lineColor).toBe("#006cac");
    });
  });
});
