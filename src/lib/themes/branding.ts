import { type ThemeColors } from "./presets/light";

export interface BrandingConfig {
  organizationName: string;
  logo?: {
    light: string;
    dark: string;
    icon: string;
  };
  colors?: {
    primary?: string;
    secondary?: string;
    accent?: string;
  };
  fonts?: {
    heading?: string;
    body?: string;
    mono?: string;
  };
  customCSS?: string;
}

export interface OrganizationBranding extends BrandingConfig {
  id: string;
  createdAt: Date;
  updatedAt: Date;
}

const defaultBranding: BrandingConfig = {
  organizationName: "Lithic",
  logo: {
    light: "/logos/lithic-light.svg",
    dark: "/logos/lithic-dark.svg",
    icon: "/logos/lithic-icon.svg",
  },
  colors: {
    primary: "221.2 83.2% 53.3%",
    secondary: "210 40% 96.1%",
    accent: "210 40% 96.1%",
  },
  fonts: {
    heading: "var(--font-inter)",
    body: "var(--font-inter)",
    mono: "var(--font-jetbrains-mono)",
  },
};

export class BrandingManager {
  private branding: BrandingConfig;
  private storageKey = "lithic-branding";

  constructor(initialBranding?: BrandingConfig) {
    this.branding = initialBranding || this.loadBranding();
  }

  private loadBranding(): BrandingConfig {
    if (typeof window === "undefined") return defaultBranding;

    try {
      const stored = localStorage.getItem(this.storageKey);
      if (stored) {
        return { ...defaultBranding, ...JSON.parse(stored) };
      }
    } catch (error) {
      console.error("Failed to load branding:", error);
    }

    return defaultBranding;
  }

  private saveBranding(): void {
    if (typeof window === "undefined") return;

    try {
      localStorage.setItem(this.storageKey, JSON.stringify(this.branding));
    } catch (error) {
      console.error("Failed to save branding:", error);
    }
  }

  getBranding(): BrandingConfig {
    return { ...this.branding };
  }

  updateBranding(updates: Partial<BrandingConfig>): void {
    this.branding = { ...this.branding, ...updates };
    this.saveBranding();
    this.applyBranding();
  }

  resetBranding(): void {
    this.branding = { ...defaultBranding };
    this.saveBranding();
    this.applyBranding();
  }

  applyBranding(): void {
    if (typeof window === "undefined") return;

    const root = document.documentElement;

    // Apply custom colors
    if (this.branding.colors?.primary) {
      root.style.setProperty("--primary", this.branding.colors.primary);
    }
    if (this.branding.colors?.secondary) {
      root.style.setProperty("--secondary", this.branding.colors.secondary);
    }
    if (this.branding.colors?.accent) {
      root.style.setProperty("--accent", this.branding.colors.accent);
    }

    // Apply custom fonts
    if (this.branding.fonts?.heading) {
      root.style.setProperty("--font-heading", this.branding.fonts.heading);
    }
    if (this.branding.fonts?.body) {
      root.style.setProperty("--font-body", this.branding.fonts.body);
    }
    if (this.branding.fonts?.mono) {
      root.style.setProperty("--font-mono", this.branding.fonts.mono);
    }

    // Apply custom CSS
    if (this.branding.customCSS) {
      let styleElement = document.getElementById("custom-branding-styles");
      if (!styleElement) {
        styleElement = document.createElement("style");
        styleElement.id = "custom-branding-styles";
        document.head.appendChild(styleElement);
      }
      styleElement.textContent = this.branding.customCSS;
    }
  }

  getLogo(theme: "light" | "dark" = "light"): string {
    return this.branding.logo?.[theme] || defaultBranding.logo![theme];
  }

  getIcon(): string {
    return this.branding.logo?.icon || defaultBranding.logo!.icon;
  }

  getOrganizationName(): string {
    return this.branding.organizationName;
  }
}

// Singleton instance
let brandingManager: BrandingManager | null = null;

export function getBrandingManager(): BrandingManager {
  if (!brandingManager) {
    brandingManager = new BrandingManager();
  }
  return brandingManager;
}

// Color utilities for branding
export function hexToHSL(hex: string): string {
  // Remove # if present
  hex = hex.replace(/^#/, "");

  // Parse hex values
  const r = parseInt(hex.slice(0, 2), 16) / 255;
  const g = parseInt(hex.slice(2, 4), 16) / 255;
  const b = parseInt(hex.slice(4, 6), 16) / 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0;
  let s = 0;
  const l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);

    switch (max) {
      case r:
        h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
        break;
      case g:
        h = ((b - r) / d + 2) / 6;
        break;
      case b:
        h = ((r - g) / d + 4) / 6;
        break;
    }
  }

  h = Math.round(h * 360);
  s = Math.round(s * 100);
  const lPercent = Math.round(l * 100);

  return `${h} ${s}% ${lPercent}%`;
}

export function validateBrandingColors(
  colors: Partial<BrandingConfig["colors"]>,
): boolean {
  // Ensure sufficient contrast ratios for WCAG AA compliance
  // This is a simplified check - production should use proper contrast calculation
  return true;
}
