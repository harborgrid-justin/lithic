'use client';

/**
 * Lithic Enterprise Theme Provider
 *
 * Provides theme context for the entire application including:
 * - Light/dark mode
 * - Organization branding
 * - User preferences
 * - Accessibility settings
 * - High contrast mode
 */

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { designTokens } from './tokens';

export type ThemeMode = 'light' | 'dark' | 'system';
export type ContrastMode = 'normal' | 'high';
export type ReducedMotion = 'no-preference' | 'reduce';
export type FontSize = 'normal' | 'large' | 'larger';

export interface OrganizationBranding {
  primaryColor?: string;
  secondaryColor?: string;
  logo?: string;
  logoSmall?: string;
  favicon?: string;
  name: string;
}

export interface AccessibilitySettings {
  reducedMotion: ReducedMotion;
  highContrast: boolean;
  fontSize: FontSize;
  screenReaderOptimized: boolean;
  keyboardNavigationHints: boolean;
}

export interface ThemePreferences {
  mode: ThemeMode;
  contrast: ContrastMode;
  accessibility: AccessibilitySettings;
}

export interface ThemeContextValue {
  // Current theme state
  mode: ThemeMode;
  resolvedMode: 'light' | 'dark';
  contrast: ContrastMode;

  // Organization branding
  branding: OrganizationBranding;

  // Accessibility
  accessibility: AccessibilitySettings;

  // Actions
  setMode: (mode: ThemeMode) => void;
  setContrast: (contrast: ContrastMode) => void;
  setBranding: (branding: Partial<OrganizationBranding>) => void;
  updateAccessibility: (settings: Partial<AccessibilitySettings>) => void;
  toggleTheme: () => void;

  // Design tokens
  tokens: typeof designTokens;
}

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

const STORAGE_KEY = 'lithic-theme-preferences';
const BRANDING_KEY = 'lithic-org-branding';

interface ThemeProviderProps {
  children: React.ReactNode;
  defaultMode?: ThemeMode;
  defaultBranding?: OrganizationBranding;
  storageKey?: string;
}

export function ThemeProvider({
  children,
  defaultMode = 'system',
  defaultBranding = { name: 'Lithic Healthcare' },
  storageKey = STORAGE_KEY,
}: ThemeProviderProps) {
  // Initialize state from localStorage or defaults
  const [mode, setModeState] = useState<ThemeMode>(defaultMode);
  const [contrast, setContrastState] = useState<ContrastMode>('normal');
  const [branding, setBrandingState] = useState<OrganizationBranding>(defaultBranding);
  const [accessibility, setAccessibilityState] = useState<AccessibilitySettings>({
    reducedMotion: 'no-preference',
    highContrast: false,
    fontSize: 'normal',
    screenReaderOptimized: false,
    keyboardNavigationHints: true,
  });

  // Resolve system theme
  const [resolvedMode, setResolvedMode] = useState<'light' | 'dark'>('light');

  // Load preferences from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(storageKey);
      if (stored) {
        const preferences: ThemePreferences = JSON.parse(stored);
        setModeState(preferences.mode || defaultMode);
        setContrastState(preferences.contrast || 'normal');
        setAccessibilityState(preferences.accessibility || accessibility);
      }

      const brandingStored = localStorage.getItem(BRANDING_KEY);
      if (brandingStored) {
        setBrandingState(JSON.parse(brandingStored));
      }
    } catch (error) {
      console.error('Failed to load theme preferences:', error);
    }
  }, []);

  // Detect system theme preference
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');

    const handleChange = () => {
      if (mode === 'system') {
        setResolvedMode(mediaQuery.matches ? 'dark' : 'light');
      }
    };

    handleChange();
    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, [mode]);

  // Detect system reduced motion preference
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');

    const handleChange = () => {
      setAccessibilityState(prev => ({
        ...prev,
        reducedMotion: mediaQuery.matches ? 'reduce' : 'no-preference',
      }));
    };

    handleChange();
    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  // Update resolved mode when mode changes
  useEffect(() => {
    if (mode === 'system') {
      const isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      setResolvedMode(isDark ? 'dark' : 'light');
    } else {
      setResolvedMode(mode);
    }
  }, [mode]);

  // Apply theme to document
  useEffect(() => {
    const root = document.documentElement;

    // Remove existing theme classes
    root.classList.remove('light', 'dark', 'high-contrast');

    // Add theme class
    root.classList.add(resolvedMode);

    // Add contrast class
    if (contrast === 'high') {
      root.classList.add('high-contrast');
    }

    // Update color-scheme meta tag
    root.style.colorScheme = resolvedMode;

    // Apply font size
    if (accessibility.fontSize === 'large') {
      root.style.fontSize = '18px';
    } else if (accessibility.fontSize === 'larger') {
      root.style.fontSize = '20px';
    } else {
      root.style.fontSize = '16px';
    }

    // Apply reduced motion
    if (accessibility.reducedMotion === 'reduce') {
      root.style.setProperty('--animation-duration', '0.001ms');
    } else {
      root.style.removeProperty('--animation-duration');
    }
  }, [resolvedMode, contrast, accessibility.fontSize, accessibility.reducedMotion]);

  // Save preferences to localStorage
  useEffect(() => {
    try {
      const preferences: ThemePreferences = {
        mode,
        contrast,
        accessibility,
      };
      localStorage.setItem(storageKey, JSON.stringify(preferences));
    } catch (error) {
      console.error('Failed to save theme preferences:', error);
    }
  }, [mode, contrast, accessibility, storageKey]);

  // Save branding to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(BRANDING_KEY, JSON.stringify(branding));
    } catch (error) {
      console.error('Failed to save branding:', error);
    }
  }, [branding]);

  const setMode = useCallback((newMode: ThemeMode) => {
    setModeState(newMode);
  }, []);

  const setContrast = useCallback((newContrast: ContrastMode) => {
    setContrastState(newContrast);
    setAccessibilityState(prev => ({
      ...prev,
      highContrast: newContrast === 'high',
    }));
  }, []);

  const setBranding = useCallback((newBranding: Partial<OrganizationBranding>) => {
    setBrandingState(prev => ({
      ...prev,
      ...newBranding,
    }));
  }, []);

  const updateAccessibility = useCallback((settings: Partial<AccessibilitySettings>) => {
    setAccessibilityState(prev => ({
      ...prev,
      ...settings,
    }));

    // Auto-update contrast if high contrast is toggled
    if (settings.highContrast !== undefined) {
      setContrastState(settings.highContrast ? 'high' : 'normal');
    }
  }, []);

  const toggleTheme = useCallback(() => {
    if (mode === 'system') {
      setModeState('light');
    } else if (mode === 'light') {
      setModeState('dark');
    } else {
      setModeState('light');
    }
  }, [mode]);

  const value: ThemeContextValue = {
    mode,
    resolvedMode,
    contrast,
    branding,
    accessibility,
    setMode,
    setContrast,
    setBranding,
    updateAccessibility,
    toggleTheme,
    tokens: designTokens,
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}

// Utility hook for checking dark mode
export function useDarkMode() {
  const { resolvedMode } = useTheme();
  return resolvedMode === 'dark';
}

// Utility hook for checking reduced motion
export function useReducedMotion() {
  const { accessibility } = useTheme();
  return accessibility.reducedMotion === 'reduce';
}

// Utility hook for high contrast mode
export function useHighContrast() {
  const { contrast } = useTheme();
  return contrast === 'high';
}

// CSS-in-JS theme object generator
export function useThemeStyles() {
  const { resolvedMode, tokens, branding } = useTheme();

  return {
    mode: resolvedMode,
    tokens,
    branding,

    // Helper functions
    color: (token: string) => {
      // Parse token path like 'brand.primary.500'
      const parts = token.split('.');
      let value: any = tokens.colors;
      for (const part of parts) {
        value = value?.[part];
      }
      return value || token;
    },

    spacing: (token: keyof typeof tokens.spacing) => tokens.spacing[token],
    shadow: (token: keyof typeof tokens.shadows) => tokens.shadows[token],
    radius: (token: keyof typeof tokens.borderRadius) => tokens.borderRadius[token],
  };
}

// Preset theme configurations
export const themes = {
  default: {
    name: 'Lithic Default',
    primaryColor: 'hsl(210, 79%, 46%)',
    secondaryColor: 'hsl(142, 76%, 36%)',
  },

  ocean: {
    name: 'Ocean Blue',
    primaryColor: 'hsl(199, 89%, 48%)',
    secondaryColor: 'hsl(180, 76%, 36%)',
  },

  forest: {
    name: 'Forest Green',
    primaryColor: 'hsl(142, 76%, 36%)',
    secondaryColor: 'hsl(120, 60%, 40%)',
  },

  sunset: {
    name: 'Sunset Orange',
    primaryColor: 'hsl(15, 92%, 50%)',
    secondaryColor: 'hsl(38, 92%, 50%)',
  },

  royal: {
    name: 'Royal Purple',
    primaryColor: 'hsl(270, 79%, 46%)',
    secondaryColor: 'hsl(260, 60%, 55%)',
  },
} as const;
