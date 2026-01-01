"use client";

import { useState, useEffect } from "react";

export type Breakpoint = "sm" | "md" | "lg" | "xl" | "2xl";

interface BreakpointValues {
  sm: number;
  md: number;
  lg: number;
  xl: number;
  "2xl": number;
}

const breakpoints: BreakpointValues = {
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
  "2xl": 1536,
};

export function useResponsive() {
  const [windowSize, setWindowSize] = useState({
    width: typeof window !== "undefined" ? window.innerWidth : 0,
    height: typeof window !== "undefined" ? window.innerHeight : 0,
  });

  useEffect(() => {
    if (typeof window === "undefined") return;

    const handleResize = () => {
      setWindowSize({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    };

    window.addEventListener("resize", handleResize);
    handleResize();

    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const isMobile = windowSize.width < breakpoints.md;
  const isTablet =
    windowSize.width >= breakpoints.md && windowSize.width < breakpoints.lg;
  const isDesktop = windowSize.width >= breakpoints.lg;

  const isBreakpoint = (breakpoint: Breakpoint) => {
    return windowSize.width >= breakpoints[breakpoint];
  };

  const isBreakpointOnly = (breakpoint: Breakpoint) => {
    const breakpointKeys = Object.keys(breakpoints) as Breakpoint[];
    const currentIndex = breakpointKeys.indexOf(breakpoint);
    const nextBreakpoint = breakpointKeys[currentIndex + 1];

    if (!nextBreakpoint) {
      return windowSize.width >= breakpoints[breakpoint];
    }

    return (
      windowSize.width >= breakpoints[breakpoint] &&
      windowSize.width < breakpoints[nextBreakpoint]
    );
  };

  const isBreakpointBetween = (min: Breakpoint, max: Breakpoint) => {
    return (
      windowSize.width >= breakpoints[min] &&
      windowSize.width < breakpoints[max]
    );
  };

  const getCurrentBreakpoint = (): Breakpoint => {
    const width = windowSize.width;
    if (width >= breakpoints["2xl"]) return "2xl";
    if (width >= breakpoints.xl) return "xl";
    if (width >= breakpoints.lg) return "lg";
    if (width >= breakpoints.md) return "md";
    return "sm";
  };

  return {
    windowSize,
    isMobile,
    isTablet,
    isDesktop,
    isBreakpoint,
    isBreakpointOnly,
    isBreakpointBetween,
    getCurrentBreakpoint,
    breakpoints,
  };
}

// Hook for specific breakpoint
export function useBreakpoint(breakpoint: Breakpoint): boolean {
  const { isBreakpoint } = useResponsive();
  return isBreakpoint(breakpoint);
}

// Hook for mobile detection
export function useIsMobile(): boolean {
  const { isMobile } = useResponsive();
  return isMobile;
}

// Hook for tablet detection
export function useIsTablet(): boolean {
  const { isTablet } = useResponsive();
  return isTablet;
}

// Hook for desktop detection
export function useIsDesktop(): boolean {
  const { isDesktop } = useResponsive();
  return isDesktop;
}

// Hook for orientation
export function useOrientation() {
  const [orientation, setOrientation] = useState<"portrait" | "landscape">(
    typeof window !== "undefined" && window.innerHeight > window.innerWidth
      ? "portrait"
      : "landscape",
  );

  useEffect(() => {
    if (typeof window === "undefined") return;

    const handleOrientationChange = () => {
      setOrientation(
        window.innerHeight > window.innerWidth ? "portrait" : "landscape",
      );
    };

    window.addEventListener("resize", handleOrientationChange);
    handleOrientationChange();

    return () => window.removeEventListener("resize", handleOrientationChange);
  }, []);

  return orientation;
}

// Hook for media query
export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const mediaQuery = window.matchMedia(query);
    setMatches(mediaQuery.matches);

    const handleChange = (e: MediaQueryListEvent) => {
      setMatches(e.matches);
    };

    mediaQuery.addEventListener("change", handleChange);
    return () => mediaQuery.removeEventListener("change", handleChange);
  }, [query]);

  return matches;
}
