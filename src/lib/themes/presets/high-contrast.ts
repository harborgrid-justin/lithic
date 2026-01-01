export const highContrastTheme = {
  name: "high-contrast",
  colors: {
    background: "0 0% 0%",
    foreground: "0 0% 100%",
    card: "0 0% 0%",
    "card-foreground": "0 0% 100%",
    popover: "0 0% 0%",
    "popover-foreground": "0 0% 100%",
    primary: "210 100% 50%",
    "primary-foreground": "0 0% 100%",
    secondary: "0 0% 20%",
    "secondary-foreground": "0 0% 100%",
    muted: "0 0% 20%",
    "muted-foreground": "0 0% 85%",
    accent: "60 100% 50%",
    "accent-foreground": "0 0% 0%",
    destructive: "0 100% 50%",
    "destructive-foreground": "0 0% 100%",
    border: "0 0% 100%",
    input: "0 0% 100%",
    ring: "210 100% 50%",
    // Additional healthcare-specific colors (high contrast)
    success: "120 100% 40%",
    "success-foreground": "0 0% 0%",
    warning: "60 100% 50%",
    "warning-foreground": "0 0% 0%",
    info: "200 100% 50%",
    "info-foreground": "0 0% 0%",
    clinical: "210 100% 50%",
    "clinical-foreground": "0 0% 100%",
    // Status colors for healthcare (high contrast)
    "status-critical": "0 100% 50%",
    "status-urgent": "60 100% 50%",
    "status-routine": "200 100% 50%",
    "status-completed": "120 100% 40%",
  },
  radius: "0.25rem", // Sharper borders for high contrast
} as const;

export type ThemeColors = typeof highContrastTheme.colors;
