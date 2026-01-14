/**
 * Mermaid theme configuration utilities
 * Provides type definitions and factory functions for Mermaid diagram theming
 */

/**
 * Mermaid theme variables interface
 * Defines the color scheme and styling options for Mermaid diagrams
 */
export interface MermaidThemeVariables {
  background: string;
  primaryColor: string;
  secondaryColor: string;
  primaryTextColor: string;
  secondaryTextColor: string;
  primaryBorderColor: string;
  lineColor: string;
  clusterBkg: string;
  titleColor: string;
  tertiaryColor: string;
  noteBkgColor: string;
  noteTextColor: string;
  fontFamily: string;
  cScale0: string;
  cScale1: string;
  cScale2: string;
  cScale3: string;
  cScale4: string;
  cScale5: string;
  cScaleLabel0: string;
  cScaleLabel1: string;
  cScaleLabel2: string;
  cScaleLabel3: string;
  cScaleLabel4: string;
  cScaleLabel5: string;
}

/** Shared font family configuration across all themes */
export const SHARED_FONT_FAMILY =
  'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen, Ubuntu, Cantarell, "Open Sans", "Helvetica Neue", sans-serif';

/**
 * Creates a complete theme variables object with the specified colors
 * @param colors - Color palette without fontFamily
 * @returns Complete theme variables object with fontFamily applied
 */
export function createThemeVariables(
  colors: Omit<MermaidThemeVariables, "fontFamily">
): MermaidThemeVariables {
  return {
    ...colors,
    fontFamily: SHARED_FONT_FAMILY,
  };
}

/**
 * Dark theme color palette for Mermaid diagrams
 */
export const darkThemeColors: Omit<MermaidThemeVariables, "fontFamily"> = {
  background: "transparent",
  primaryColor: "#2d3548",
  secondaryColor: "#343f60",
  primaryTextColor: "#eaedf3",
  secondaryTextColor: "#eaedf3",
  primaryBorderColor: "#ff6b01",
  lineColor: "#ff6b01",
  clusterBkg: "#343f60",
  titleColor: "#eaedf3",
  tertiaryColor: "#2d3548",
  noteBkgColor: "#ff8534",
  noteTextColor: "#ffffff",
  cScale0: "#2d3548",
  cScale1: "#343f60",
  cScale2: "#2d3548",
  cScale3: "#343f60",
  cScale4: "#2d3548",
  cScale5: "#343f60",
  cScaleLabel0: "#eaedf3",
  cScaleLabel1: "#eaedf3",
  cScaleLabel2: "#eaedf3",
  cScaleLabel3: "#eaedf3",
  cScaleLabel4: "#eaedf3",
  cScaleLabel5: "#eaedf3",
};

/**
 * Light theme color palette for Mermaid diagrams
 */
export const lightThemeColors: Omit<MermaidThemeVariables, "fontFamily"> = {
  background: "transparent",
  primaryColor: "#e6f4fb",
  secondaryColor: "#f0f7fb",
  primaryTextColor: "#282728",
  secondaryTextColor: "#282728",
  primaryBorderColor: "#006cac",
  lineColor: "#006cac",
  clusterBkg: "#f5fafc",
  titleColor: "#282728",
  tertiaryColor: "#ffffff",
  noteBkgColor: "#0088cc",
  noteTextColor: "#ffffff",
  cScale0: "#e6f4fb",
  cScale1: "#f0f7fb",
  cScale2: "#ffffff",
  cScale3: "#e6f4fb",
  cScale4: "#f0f7fb",
  cScale5: "#ffffff",
  cScaleLabel0: "#282728",
  cScaleLabel1: "#282728",
  cScaleLabel2: "#282728",
  cScaleLabel3: "#282728",
  cScaleLabel4: "#282728",
  cScaleLabel5: "#282728",
};
