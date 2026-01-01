export { ThemeProvider, useTheme, useThemedValue } from "./theme-provider";
export type { ThemeMode, ResolvedTheme } from "./theme-provider";

export { lightTheme } from "./presets/light";
export { darkTheme } from "./presets/dark";
export { highContrastTheme } from "./presets/high-contrast";

export {
  BrandingManager,
  getBrandingManager,
  hexToHSL,
  validateBrandingColors,
} from "./branding";
export type { BrandingConfig, OrganizationBranding } from "./branding";
