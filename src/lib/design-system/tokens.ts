/**
 * Lithic Enterprise Design System Tokens
 *
 * Comprehensive design tokens for the enterprise healthcare platform.
 * Supports light/dark modes, accessibility, and organizational branding.
 */

// Color Palette - Semantic Healthcare Colors
export const colors = {
  // Brand Colors
  brand: {
    primary: {
      50: 'hsl(210, 100%, 97%)',
      100: 'hsl(210, 100%, 94%)',
      200: 'hsl(210, 100%, 88%)',
      300: 'hsl(210, 100%, 80%)',
      400: 'hsl(210, 98%, 68%)',
      500: 'hsl(210, 79%, 46%)', // Primary
      600: 'hsl(210, 79%, 40%)',
      700: 'hsl(210, 79%, 34%)',
      800: 'hsl(210, 79%, 28%)',
      900: 'hsl(210, 79%, 22%)',
      950: 'hsl(210, 79%, 16%)',
    },
    secondary: {
      50: 'hsl(142, 76%, 97%)',
      100: 'hsl(142, 76%, 94%)',
      200: 'hsl(142, 76%, 88%)',
      300: 'hsl(142, 76%, 76%)',
      400: 'hsl(142, 76%, 56%)',
      500: 'hsl(142, 76%, 36%)', // Success/Clinical Success
      600: 'hsl(142, 76%, 30%)',
      700: 'hsl(142, 76%, 24%)',
      800: 'hsl(142, 76%, 18%)',
      900: 'hsl(142, 76%, 12%)',
      950: 'hsl(142, 76%, 8%)',
    },
  },

  // Semantic Colors
  semantic: {
    success: {
      light: 'hsl(142, 76%, 36%)',
      dark: 'hsl(142, 76%, 56%)',
      bg: 'hsl(142, 76%, 97%)',
      border: 'hsl(142, 76%, 88%)',
    },
    warning: {
      light: 'hsl(38, 92%, 50%)',
      dark: 'hsl(38, 92%, 60%)',
      bg: 'hsl(38, 92%, 97%)',
      border: 'hsl(38, 92%, 85%)',
    },
    error: {
      light: 'hsl(0, 84%, 60%)',
      dark: 'hsl(0, 84%, 70%)',
      bg: 'hsl(0, 84%, 97%)',
      border: 'hsl(0, 84%, 85%)',
    },
    info: {
      light: 'hsl(199, 89%, 48%)',
      dark: 'hsl(199, 89%, 58%)',
      bg: 'hsl(199, 89%, 97%)',
      border: 'hsl(199, 89%, 85%)',
    },
  },

  // Clinical Status Colors
  clinical: {
    critical: 'hsl(0, 84%, 60%)',
    urgent: 'hsl(15, 92%, 50%)',
    stable: 'hsl(142, 76%, 36%)',
    observation: 'hsl(199, 89%, 48%)',
    inactive: 'hsl(240, 5%, 64%)',
  },

  // Priority Colors
  priority: {
    high: 'hsl(0, 84%, 60%)',
    medium: 'hsl(38, 92%, 50%)',
    low: 'hsl(199, 89%, 48%)',
    none: 'hsl(240, 5%, 64%)',
  },

  // Neutral Colors - Light Mode
  neutral: {
    0: 'hsl(0, 0%, 100%)',
    50: 'hsl(210, 20%, 98%)',
    100: 'hsl(210, 20%, 96%)',
    200: 'hsl(210, 16%, 93%)',
    300: 'hsl(210, 14%, 89%)',
    400: 'hsl(210, 14%, 83%)',
    500: 'hsl(210, 11%, 71%)',
    600: 'hsl(210, 9%, 64%)',
    700: 'hsl(210, 10%, 40%)',
    800: 'hsl(210, 11%, 15%)',
    900: 'hsl(210, 11%, 8%)',
    950: 'hsl(210, 11%, 4%)',
    1000: 'hsl(0, 0%, 0%)',
  },

  // Allergy Alert Colors
  allergy: {
    severe: 'hsl(0, 84%, 60%)',
    moderate: 'hsl(38, 92%, 50%)',
    mild: 'hsl(48, 89%, 48%)',
  },

  // Chart Colors (Data Visualization)
  charts: {
    blue: 'hsl(210, 79%, 46%)',
    green: 'hsl(142, 76%, 36%)',
    yellow: 'hsl(48, 89%, 48%)',
    orange: 'hsl(38, 92%, 50%)',
    red: 'hsl(0, 84%, 60%)',
    purple: 'hsl(270, 79%, 46%)',
    teal: 'hsl(180, 76%, 36%)',
    pink: 'hsl(330, 79%, 56%)',
  },
} as const;

// Typography Scale
export const typography = {
  fontFamily: {
    sans: 'var(--font-inter), system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    mono: 'var(--font-jetbrains-mono), "JetBrains Mono", Menlo, Monaco, Consolas, monospace',
    display: 'var(--font-inter), system-ui, sans-serif',
  },

  fontSize: {
    xs: '0.75rem',      // 12px
    sm: '0.875rem',     // 14px
    base: '1rem',       // 16px
    lg: '1.125rem',     // 18px
    xl: '1.25rem',      // 20px
    '2xl': '1.5rem',    // 24px
    '3xl': '1.875rem',  // 30px
    '4xl': '2.25rem',   // 36px
    '5xl': '3rem',      // 48px
    '6xl': '3.75rem',   // 60px
    '7xl': '4.5rem',    // 72px
  },

  fontWeight: {
    light: 300,
    normal: 400,
    medium: 500,
    semibold: 600,
    bold: 700,
    extrabold: 800,
  },

  lineHeight: {
    none: 1,
    tight: 1.25,
    snug: 1.375,
    normal: 1.5,
    relaxed: 1.625,
    loose: 2,
  },

  letterSpacing: {
    tighter: '-0.05em',
    tight: '-0.025em',
    normal: '0',
    wide: '0.025em',
    wider: '0.05em',
    widest: '0.1em',
  },
} as const;

// Spacing System (8px base grid)
export const spacing = {
  0: '0',
  px: '1px',
  0.5: '0.125rem',   // 2px
  1: '0.25rem',      // 4px
  1.5: '0.375rem',   // 6px
  2: '0.5rem',       // 8px
  2.5: '0.625rem',   // 10px
  3: '0.75rem',      // 12px
  3.5: '0.875rem',   // 14px
  4: '1rem',         // 16px
  5: '1.25rem',      // 20px
  6: '1.5rem',       // 24px
  7: '1.75rem',      // 28px
  8: '2rem',         // 32px
  9: '2.25rem',      // 36px
  10: '2.5rem',      // 40px
  11: '2.75rem',     // 44px
  12: '3rem',        // 48px
  14: '3.5rem',      // 56px
  16: '4rem',        // 64px
  20: '5rem',        // 80px
  24: '6rem',        // 96px
  28: '7rem',        // 112px
  32: '8rem',        // 128px
  36: '9rem',        // 144px
  40: '10rem',       // 160px
  44: '11rem',       // 176px
  48: '12rem',       // 192px
  52: '13rem',       // 208px
  56: '14rem',       // 224px
  60: '15rem',       // 240px
  64: '16rem',       // 256px
  72: '18rem',       // 288px
  80: '20rem',       // 320px
  96: '24rem',       // 384px
} as const;

// Border Radius
export const borderRadius = {
  none: '0',
  sm: '0.125rem',    // 2px
  base: '0.25rem',   // 4px
  md: '0.375rem',    // 6px
  lg: '0.5rem',      // 8px
  xl: '0.75rem',     // 12px
  '2xl': '1rem',     // 16px
  '3xl': '1.5rem',   // 24px
  full: '9999px',
} as const;

// Shadow System
export const shadows = {
  xs: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
  sm: '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)',
  base: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
  md: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
  lg: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)',
  xl: '0 25px 50px -12px rgb(0 0 0 / 0.25)',
  '2xl': '0 50px 100px -20px rgb(0 0 0 / 0.25)',
  inner: 'inset 0 2px 4px 0 rgb(0 0 0 / 0.05)',
  none: 'none',

  // Clinical Shadows (with color tints)
  clinical: {
    critical: '0 4px 12px -2px rgb(239 68 68 / 0.3)',
    urgent: '0 4px 12px -2px rgb(251 146 60 / 0.3)',
    info: '0 4px 12px -2px rgb(59 130 246 / 0.3)',
    success: '0 4px 12px -2px rgb(34 197 94 / 0.3)',
  },
} as const;

// Animation Timing
export const animation = {
  duration: {
    fast: '150ms',
    base: '200ms',
    medium: '300ms',
    slow: '500ms',
    slower: '700ms',
  },

  easing: {
    linear: 'linear',
    in: 'cubic-bezier(0.4, 0, 1, 1)',
    out: 'cubic-bezier(0, 0, 0.2, 1)',
    inOut: 'cubic-bezier(0.4, 0, 0.2, 1)',
    spring: 'cubic-bezier(0.34, 1.56, 0.64, 1)',
    bounce: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
  },

  // Presets
  presets: {
    fadeIn: 'fade-in 200ms cubic-bezier(0, 0, 0.2, 1)',
    fadeOut: 'fade-out 200ms cubic-bezier(0.4, 0, 1, 1)',
    slideInFromTop: 'slide-in-from-top 300ms cubic-bezier(0, 0, 0.2, 1)',
    slideInFromBottom: 'slide-in-from-bottom 300ms cubic-bezier(0, 0, 0.2, 1)',
    slideInFromLeft: 'slide-in-from-left 300ms cubic-bezier(0, 0, 0.2, 1)',
    slideInFromRight: 'slide-in-from-right 300ms cubic-bezier(0, 0, 0.2, 1)',
    scaleIn: 'scale-in 200ms cubic-bezier(0, 0, 0.2, 1)',
    scaleOut: 'scale-out 200ms cubic-bezier(0.4, 0, 1, 1)',
  },
} as const;

// Z-Index Scale
export const zIndex = {
  hide: -1,
  base: 0,
  dropdown: 1000,
  sticky: 1100,
  fixed: 1200,
  overlay: 1300,
  modal: 1400,
  popover: 1500,
  tooltip: 1600,
  notification: 1700,
  commandPalette: 1800,
  max: 9999,
} as const;

// Breakpoints (Mobile-first)
export const breakpoints = {
  xs: '320px',
  sm: '640px',
  md: '768px',
  lg: '1024px',
  xl: '1280px',
  '2xl': '1536px',
  '3xl': '1920px',
} as const;

// Grid System
export const grid = {
  columns: 12,
  gutter: spacing[4],
  margin: spacing[4],
  maxWidth: '1440px',
} as const;

// Icon Sizes
export const iconSizes = {
  xs: '0.75rem',   // 12px
  sm: '1rem',      // 16px
  base: '1.25rem', // 20px
  lg: '1.5rem',    // 24px
  xl: '2rem',      // 32px
  '2xl': '2.5rem', // 40px
  '3xl': '3rem',   // 48px
} as const;

// Focus Ring Styles (Accessibility)
export const focusRing = {
  default: '0 0 0 3px hsl(210, 79%, 46% / 0.3)',
  error: '0 0 0 3px hsl(0, 84%, 60% / 0.3)',
  success: '0 0 0 3px hsl(142, 76%, 36% / 0.3)',
  warning: '0 0 0 3px hsl(38, 92%, 50% / 0.3)',
} as const;

// Layout Constants
export const layout = {
  navbar: {
    height: '4rem',      // 64px
    heightMobile: '3.5rem', // 56px
  },
  sidebar: {
    width: '16rem',      // 256px
    widthCollapsed: '4rem', // 64px
  },
  panel: {
    widthSm: '20rem',    // 320px
    widthMd: '24rem',    // 384px
    widthLg: '32rem',    // 512px
    widthXl: '40rem',    // 640px
  },
  contentMaxWidth: '1440px',
} as const;

// Export all tokens as a single object
export const designTokens = {
  colors,
  typography,
  spacing,
  borderRadius,
  shadows,
  animation,
  zIndex,
  breakpoints,
  grid,
  iconSizes,
  focusRing,
  layout,
} as const;

// Type exports
export type DesignTokens = typeof designTokens;
export type ColorToken = keyof typeof colors;
export type SpacingToken = keyof typeof spacing;
export type FontSizeToken = keyof typeof typography.fontSize;
export type BorderRadiusToken = keyof typeof borderRadius;
export type ShadowToken = keyof typeof shadows;
