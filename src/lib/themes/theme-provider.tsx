"use client";

import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
} from "react";
import { lightTheme } from "./presets/light";
import { darkTheme } from "./presets/dark";
import { highContrastTheme } from "./presets/high-contrast";
import { BrandingManager, getBrandingManager } from "./branding";

export type ThemeMode = "light" | "dark" | "high-contrast" | "system";
export type ResolvedTheme = "light" | "dark" | "high-contrast";

interface ThemeContextValue {
  theme: ThemeMode;
  resolvedTheme: ResolvedTheme;
  setTheme: (theme: ThemeMode) => void;
  brandingManager: BrandingManager;
  isReducedMotion: boolean;
  setReducedMotion: (enabled: boolean) => void;
}

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

const STORAGE_KEY = "lithic-theme";
const REDUCED_MOTION_KEY = "lithic-reduced-motion";

const themes = {
  light: lightTheme,
  dark: darkTheme,
  "high-contrast": highContrastTheme,
} as const;

interface ThemeProviderProps {
  children: React.ReactNode;
  defaultTheme?: ThemeMode;
  storageKey?: string;
}

export function ThemeProvider({
  children,
  defaultTheme = "system",
  storageKey = STORAGE_KEY,
}: ThemeProviderProps) {
  const [theme, setThemeState] = useState<ThemeMode>(defaultTheme);
  const [resolvedTheme, setResolvedTheme] = useState<ResolvedTheme>("light");
  const [isReducedMotion, setIsReducedMotion] = useState(false);
  const [brandingManager] = useState(() => getBrandingManager());
  const [isMounted, setIsMounted] = useState(false);

  // Load theme from storage on mount
  useEffect(() => {
    setIsMounted(true);

    try {
      const stored = localStorage.getItem(storageKey);
      if (stored) {
        const parsed = stored as ThemeMode;
        if (["light", "dark", "high-contrast", "system"].includes(parsed)) {
          setThemeState(parsed);
        }
      }

      const reducedMotionStored = localStorage.getItem(REDUCED_MOTION_KEY);
      if (reducedMotionStored === "true") {
        setIsReducedMotion(true);
      }
    } catch (error) {
      console.error("Failed to load theme from storage:", error);
    }
  }, [storageKey]);

  // Resolve system theme
  const getSystemTheme = useCallback((): ResolvedTheme => {
    if (typeof window === "undefined") return "light";

    // Check for high contrast mode
    if (window.matchMedia("(prefers-contrast: more)").matches) {
      return "high-contrast";
    }

    // Check for dark mode
    return window.matchMedia("(prefers-color-scheme: dark)").matches
      ? "dark"
      : "light";
  }, []);

  // Update resolved theme when theme changes
  useEffect(() => {
    if (!isMounted) return;

    const resolved = theme === "system" ? getSystemTheme() : theme;
    setResolvedTheme(resolved);
  }, [theme, getSystemTheme, isMounted]);

  // Listen for system theme changes
  useEffect(() => {
    if (theme !== "system") return;

    const darkModeQuery = window.matchMedia("(prefers-color-scheme: dark)");
    const highContrastQuery = window.matchMedia("(prefers-contrast: more)");

    const handleChange = () => {
      setResolvedTheme(getSystemTheme());
    };

    darkModeQuery.addEventListener("change", handleChange);
    highContrastQuery.addEventListener("change", handleChange);

    return () => {
      darkModeQuery.removeEventListener("change", handleChange);
      highContrastQuery.removeEventListener("change", handleChange);
    };
  }, [theme, getSystemTheme]);

  // Listen for system reduced motion preference
  useEffect(() => {
    const reducedMotionQuery = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    );

    const handleChange = (e: MediaQueryListEvent | MediaQueryList) => {
      const shouldReduce = e.matches;
      setIsReducedMotion(shouldReduce);

      // Store preference
      try {
        localStorage.setItem(REDUCED_MOTION_KEY, String(shouldReduce));
      } catch (error) {
        console.error("Failed to save reduced motion preference:", error);
      }
    };

    // Initial check
    handleChange(reducedMotionQuery);

    reducedMotionQuery.addEventListener("change", handleChange);
    return () => reducedMotionQuery.removeEventListener("change", handleChange);
  }, []);

  // Apply theme to DOM
  useEffect(() => {
    if (!isMounted) return;

    const root = document.documentElement;
    const themeConfig = themes[resolvedTheme];

    // Remove old theme classes
    root.classList.remove("light", "dark", "high-contrast");

    // Add new theme class
    root.classList.add(resolvedTheme);

    // Apply CSS variables
    Object.entries(themeConfig.colors).forEach(([key, value]) => {
      root.style.setProperty(`--${key}`, value);
    });

    root.style.setProperty("--radius", themeConfig.radius);

    // Apply reduced motion
    if (isReducedMotion) {
      root.classList.add("reduce-motion");
    } else {
      root.classList.remove("reduce-motion");
    }

    // Apply branding
    brandingManager.applyBranding();
  }, [resolvedTheme, isReducedMotion, brandingManager, isMounted]);

  const setTheme = useCallback(
    (newTheme: ThemeMode) => {
      setThemeState(newTheme);

      try {
        localStorage.setItem(storageKey, newTheme);
      } catch (error) {
        console.error("Failed to save theme to storage:", error);
      }
    },
    [storageKey],
  );

  const setReducedMotion = useCallback((enabled: boolean) => {
    setIsReducedMotion(enabled);

    try {
      localStorage.setItem(REDUCED_MOTION_KEY, String(enabled));
    } catch (error) {
      console.error("Failed to save reduced motion preference:", error);
    }
  }, []);

  const value: ThemeContextValue = {
    theme,
    resolvedTheme,
    setTheme,
    brandingManager,
    isReducedMotion,
    setReducedMotion,
  };

  // Prevent flash of unstyled content
  if (!isMounted) {
    return null;
  }

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
}

// Utility hook for theme-specific values
export function useThemedValue<T>(values: Record<ResolvedTheme, T>): T {
  const { resolvedTheme } = useTheme();
  return values[resolvedTheme];
}
