"use client";

import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  useRef,
} from "react";

interface A11yContextValue {
  announce: (message: string, priority?: "polite" | "assertive") => void;
  isReducedMotion: boolean;
  setReducedMotion: (enabled: boolean) => void;
  focusTrap: {
    enable: (element: HTMLElement) => void;
    disable: () => void;
  };
  skipToContent: () => void;
}

const A11yContext = createContext<A11yContextValue | undefined>(undefined);

interface A11yProviderProps {
  children: React.ReactNode;
}

export function A11yProvider({ children }: A11yProviderProps) {
  const [isReducedMotion, setIsReducedMotion] = useState(false);
  const [announcements, setAnnouncements] = useState<
    Array<{ id: string; message: string; priority: "polite" | "assertive" }>
  >([]);
  const focusTrapRef = useRef<HTMLElement | null>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);

  // Detect system reduced motion preference
  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");

    const handleChange = (e: MediaQueryListEvent | MediaQueryList) => {
      setIsReducedMotion(e.matches);

      // Apply to document
      if (e.matches) {
        document.documentElement.classList.add("reduce-motion");
      } else {
        document.documentElement.classList.remove("reduce-motion");
      }
    };

    // Initial check
    handleChange(mediaQuery);

    mediaQuery.addEventListener("change", handleChange);
    return () => mediaQuery.removeEventListener("change", handleChange);
  }, []);

  // Announce messages to screen readers
  const announce = useCallback(
    (message: string, priority: "polite" | "assertive" = "polite") => {
      const id = `announcement-${Date.now()}-${Math.random()}`;
      setAnnouncements((prev) => [...prev, { id, message, priority }]);

      // Remove announcement after it's been read
      setTimeout(() => {
        setAnnouncements((prev) => prev.filter((a) => a.id !== id));
      }, 3000);
    },
    [],
  );

  // Focus trap management
  const enableFocusTrap = useCallback((element: HTMLElement) => {
    if (focusTrapRef.current) {
      disableFocusTrap();
    }

    previousFocusRef.current = document.activeElement as HTMLElement;
    focusTrapRef.current = element;

    const focusableElements = element.querySelectorAll<HTMLElement>(
      'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])',
    );

    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key !== "Tab") return;

      if (e.shiftKey) {
        if (document.activeElement === firstElement) {
          e.preventDefault();
          lastElement?.focus();
        }
      } else {
        if (document.activeElement === lastElement) {
          e.preventDefault();
          firstElement?.focus();
        }
      }
    };

    element.addEventListener("keydown", handleKeyDown);
    firstElement?.focus();

    return () => {
      element.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  const disableFocusTrap = useCallback(() => {
    if (focusTrapRef.current) {
      focusTrapRef.current = null;
      previousFocusRef.current?.focus();
      previousFocusRef.current = null;
    }
  }, []);

  // Skip to main content
  const skipToContent = useCallback(() => {
    const mainContent =
      document.getElementById("main-content") || document.querySelector("main");
    if (mainContent) {
      mainContent.focus();
      mainContent.scrollIntoView({ behavior: "smooth", block: "start" });
      announce("Skipped to main content", "polite");
    }
  }, [announce]);

  // Keyboard navigation helpers
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Escape key to close modals/dialogs
      if (e.key === "Escape" && focusTrapRef.current) {
        disableFocusTrap();
      }

      // Alt + / for keyboard shortcuts help
      if (e.altKey && e.key === "/") {
        e.preventDefault();
        announce(
          "Keyboard shortcuts: Alt + S to skip to content, Tab to navigate, Enter to activate, Escape to close",
          "polite",
        );
      }

      // Alt + S to skip to content
      if (e.altKey && e.key.toLowerCase() === "s") {
        e.preventDefault();
        skipToContent();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [skipToContent, disableFocusTrap, announce]);

  // Focus visible polyfill for older browsers
  useEffect(() => {
    let hadKeyboardEvent = false;

    const markKeyboardEvent = () => {
      hadKeyboardEvent = true;
    };

    const markMouseEvent = () => {
      hadKeyboardEvent = false;
    };

    const handleFocus = (e: FocusEvent) => {
      const target = e.target as HTMLElement;
      if (hadKeyboardEvent && target) {
        target.classList.add("focus-visible");
      }
    };

    const handleBlur = (e: FocusEvent) => {
      const target = e.target as HTMLElement;
      if (target) {
        target.classList.remove("focus-visible");
      }
    };

    document.addEventListener("keydown", markKeyboardEvent);
    document.addEventListener("mousedown", markMouseEvent);
    document.addEventListener("focus", handleFocus, true);
    document.addEventListener("blur", handleBlur, true);

    return () => {
      document.removeEventListener("keydown", markKeyboardEvent);
      document.removeEventListener("mousedown", markMouseEvent);
      document.removeEventListener("focus", handleFocus, true);
      document.removeEventListener("blur", handleBlur, true);
    };
  }, []);

  const value: A11yContextValue = {
    announce,
    isReducedMotion,
    setReducedMotion,
    focusTrap: {
      enable: enableFocusTrap,
      disable: disableFocusTrap,
    },
    skipToContent,
  };

  return (
    <A11yContext.Provider value={value}>
      {children}

      {/* Live regions for announcements */}
      <div
        role="status"
        aria-live="polite"
        aria-atomic="true"
        className="sr-only"
      >
        {announcements
          .filter((a) => a.priority === "polite")
          .map((a) => (
            <div key={a.id}>{a.message}</div>
          ))}
      </div>

      <div
        role="alert"
        aria-live="assertive"
        aria-atomic="true"
        className="sr-only"
      >
        {announcements
          .filter((a) => a.priority === "assertive")
          .map((a) => (
            <div key={a.id}>{a.message}</div>
          ))}
      </div>
    </A11yContext.Provider>
  );
}

export function useA11y() {
  const context = useContext(A11yContext);
  if (context === undefined) {
    throw new Error("useA11y must be used within an A11yProvider");
  }
  return context;
}

// Hook for announcements
export function useAnnounce() {
  const { announce } = useA11y();
  return announce;
}

// Hook for focus trap
export function useFocusTrap() {
  const { focusTrap } = useA11y();
  return focusTrap;
}

// Hook for reduced motion
export function useReducedMotion() {
  const { isReducedMotion } = useA11y();
  return isReducedMotion;
}
