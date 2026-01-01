/**
 * Lithic Enterprise Accessibility Utilities
 *
 * Comprehensive accessibility utilities for WCAG 2.1 AA compliance.
 * Includes screen reader support, keyboard navigation, focus management, and ARIA helpers.
 */

import { useEffect, useRef, useCallback, useState } from 'react';

// Screen Reader Utilities
export const srOnly = {
  position: 'absolute',
  width: '1px',
  height: '1px',
  padding: '0',
  margin: '-1px',
  overflow: 'hidden',
  clip: 'rect(0, 0, 0, 0)',
  whiteSpace: 'nowrap',
  borderWidth: '0',
} as const;

export function announceToScreenReader(message: string, priority: 'polite' | 'assertive' = 'polite') {
  const announcement = document.createElement('div');
  announcement.setAttribute('role', 'status');
  announcement.setAttribute('aria-live', priority);
  announcement.setAttribute('aria-atomic', 'true');
  announcement.className = 'sr-only';
  Object.assign(announcement.style, srOnly);
  announcement.textContent = message;

  document.body.appendChild(announcement);

  setTimeout(() => {
    document.body.removeChild(announcement);
  }, 1000);
}

// Focus Management
export function useFocusTrap(enabled: boolean = true) {
  const containerRef = useRef<HTMLElement>(null);

  useEffect(() => {
    if (!enabled || !containerRef.current) return;

    const container = containerRef.current;
    const focusableElements = container.querySelectorAll<HTMLElement>(
      'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])'
    );

    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];

    function handleKeyDown(e: KeyboardEvent) {
      if (e.key !== 'Tab') return;

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
    }

    container.addEventListener('keydown', handleKeyDown);
    firstElement?.focus();

    return () => {
      container.removeEventListener('keydown', handleKeyDown);
    };
  }, [enabled]);

  return containerRef;
}

export function useFocusReturn() {
  const previouslyFocusedElement = useRef<HTMLElement | null>(null);

  useEffect(() => {
    previouslyFocusedElement.current = document.activeElement as HTMLElement;

    return () => {
      previouslyFocusedElement.current?.focus();
    };
  }, []);
}

export function useFocusVisible() {
  const [focusVisible, setFocusVisible] = useState(false);
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    let hadKeyboardEvent = false;

    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Tab') {
        hadKeyboardEvent = true;
      }
    }

    function onFocus() {
      if (hadKeyboardEvent) {
        setFocusVisible(true);
      }
    }

    function onBlur() {
      setFocusVisible(false);
      hadKeyboardEvent = false;
    }

    function onPointerDown() {
      hadKeyboardEvent = false;
    }

    element.addEventListener('keydown', onKeyDown);
    element.addEventListener('focus', onFocus);
    element.addEventListener('blur', onBlur);
    element.addEventListener('pointerdown', onPointerDown);

    return () => {
      element.removeEventListener('keydown', onKeyDown);
      element.removeEventListener('focus', onFocus);
      element.removeEventListener('blur', onBlur);
      element.removeEventListener('pointerdown', onPointerDown);
    };
  }, []);

  return { ref, focusVisible };
}

// Keyboard Navigation
export function useKeyboardNavigation(options: {
  onEscape?: () => void;
  onEnter?: () => void;
  onArrowUp?: () => void;
  onArrowDown?: () => void;
  onArrowLeft?: () => void;
  onArrowRight?: () => void;
  onHome?: () => void;
  onEnd?: () => void;
  enabled?: boolean;
}) {
  const { enabled = true, ...handlers } = options;

  useEffect(() => {
    if (!enabled) return;

    function handleKeyDown(e: KeyboardEvent) {
      switch (e.key) {
        case 'Escape':
          handlers.onEscape?.();
          break;
        case 'Enter':
          handlers.onEnter?.();
          break;
        case 'ArrowUp':
          e.preventDefault();
          handlers.onArrowUp?.();
          break;
        case 'ArrowDown':
          e.preventDefault();
          handlers.onArrowDown?.();
          break;
        case 'ArrowLeft':
          handlers.onArrowLeft?.();
          break;
        case 'ArrowRight':
          handlers.onArrowRight?.();
          break;
        case 'Home':
          e.preventDefault();
          handlers.onHome?.();
          break;
        case 'End':
          e.preventDefault();
          handlers.onEnd?.();
          break;
      }
    }

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [enabled, handlers]);
}

// ARIA Helpers
export interface AriaLabelProps {
  'aria-label'?: string;
  'aria-labelledby'?: string;
  'aria-describedby'?: string;
}

export function getAriaLabel(
  label?: string,
  labelledBy?: string,
  describedBy?: string
): AriaLabelProps {
  const props: AriaLabelProps = {};

  if (label) {
    props['aria-label'] = label;
  }

  if (labelledBy) {
    props['aria-labelledby'] = labelledBy;
  }

  if (describedBy) {
    props['aria-describedby'] = describedBy;
  }

  return props;
}

export interface AriaLiveRegionProps {
  role: 'status' | 'alert' | 'log';
  'aria-live': 'polite' | 'assertive' | 'off';
  'aria-atomic'?: boolean;
  'aria-relevant'?: 'additions' | 'removals' | 'text' | 'all';
}

export function createAriaLiveRegion(
  type: 'status' | 'alert' | 'log' = 'status',
  priority: 'polite' | 'assertive' = 'polite'
): AriaLiveRegionProps {
  return {
    role: type,
    'aria-live': priority,
    'aria-atomic': true,
    'aria-relevant': 'additions text',
  };
}

// Color Contrast Checker
export function getContrastRatio(color1: string, color2: string): number {
  function getLuminance(color: string): number {
    // Parse hex color
    const hex = color.replace('#', '');
    const r = parseInt(hex.substr(0, 2), 16) / 255;
    const g = parseInt(hex.substr(2, 2), 16) / 255;
    const b = parseInt(hex.substr(4, 2), 16) / 255;

    // Calculate relative luminance
    const [rs, gs, bs] = [r, g, b].map(c =>
      c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4)
    );

    return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
  }

  const l1 = getLuminance(color1);
  const l2 = getLuminance(color2);

  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);

  return (lighter + 0.05) / (darker + 0.05);
}

export function meetsWCAGAA(foreground: string, background: string, isLargeText = false): boolean {
  const ratio = getContrastRatio(foreground, background);
  return isLargeText ? ratio >= 3 : ratio >= 4.5;
}

export function meetsWCAGAAA(foreground: string, background: string, isLargeText = false): boolean {
  const ratio = getContrastRatio(foreground, background);
  return isLargeText ? ratio >= 4.5 : ratio >= 7;
}

// Skip Link Utility
export function SkipLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <a
      href={href}
      className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-max focus:px-4 focus:py-2 focus:bg-primary focus:text-primary-foreground focus:rounded-md focus:shadow-lg"
    >
      {children}
    </a>
  );
}

// Accessible Icon Button
export interface AccessibleIconButtonProps {
  label: string;
  icon: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  className?: string;
}

// Hook for managing roving tabindex (for toolbars, menus, etc.)
export function useRovingTabIndex(
  itemCount: number,
  orientation: 'horizontal' | 'vertical' = 'horizontal'
) {
  const [focusedIndex, setFocusedIndex] = useState(0);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent, index: number) => {
      const isVertical = orientation === 'vertical';
      const nextKey = isVertical ? 'ArrowDown' : 'ArrowRight';
      const prevKey = isVertical ? 'ArrowUp' : 'ArrowLeft';

      if (e.key === nextKey) {
        e.preventDefault();
        const nextIndex = (index + 1) % itemCount;
        setFocusedIndex(nextIndex);
      } else if (e.key === prevKey) {
        e.preventDefault();
        const prevIndex = (index - 1 + itemCount) % itemCount;
        setFocusedIndex(prevIndex);
      } else if (e.key === 'Home') {
        e.preventDefault();
        setFocusedIndex(0);
      } else if (e.key === 'End') {
        e.preventDefault();
        setFocusedIndex(itemCount - 1);
      }
    },
    [itemCount, orientation]
  );

  return {
    focusedIndex,
    setFocusedIndex,
    handleKeyDown,
    getItemProps: (index: number) => ({
      tabIndex: index === focusedIndex ? 0 : -1,
      onKeyDown: (e: React.KeyboardEvent) => handleKeyDown(e, index),
    }),
  };
}

// Accessible description ID generator
let idCounter = 0;
export function useId(prefix = 'lithic'): string {
  const [id] = useState(() => `${prefix}-${++idCounter}`);
  return id;
}

// Hook to detect if user prefers reduced motion
export function usePrefersReducedMotion(): boolean {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReducedMotion(mediaQuery.matches);

    const listener = (e: MediaQueryListEvent) => {
      setPrefersReducedMotion(e.matches);
    };

    mediaQuery.addEventListener('change', listener);
    return () => mediaQuery.removeEventListener('change', listener);
  }, []);

  return prefersReducedMotion;
}

// Accessible tooltip trigger
export function useAccessibleTooltip() {
  const [isVisible, setIsVisible] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout>();

  useEffect(() => {
    setIsVisible(isHovered || isFocused);
  }, [isHovered, isFocused]);

  const show = useCallback(() => {
    clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => {
      setIsHovered(true);
    }, 300);
  }, []);

  const hide = useCallback(() => {
    clearTimeout(timeoutRef.current);
    setIsHovered(false);
  }, []);

  const onFocus = useCallback(() => {
    setIsFocused(true);
  }, []);

  const onBlur = useCallback(() => {
    setIsFocused(false);
  }, []);

  return {
    isVisible,
    triggerProps: {
      onMouseEnter: show,
      onMouseLeave: hide,
      onFocus,
      onBlur,
    },
  };
}

// Form validation announcements
export function announceFormError(fieldName: string, error: string) {
  announceToScreenReader(`${fieldName}: ${error}`, 'assertive');
}

export function announceFormSuccess(message: string) {
  announceToScreenReader(message, 'polite');
}

// Utility to generate ARIA attributes for form fields
export function getFormFieldAria(
  id: string,
  error?: string,
  description?: string
) {
  const describedBy: string[] = [];

  if (description) {
    describedBy.push(`${id}-description`);
  }

  if (error) {
    describedBy.push(`${id}-error`);
  }

  return {
    id,
    'aria-invalid': !!error,
    'aria-describedby': describedBy.length > 0 ? describedBy.join(' ') : undefined,
  };
}

// Landmark regions helper
export const landmarks = {
  banner: { role: 'banner' as const },
  navigation: { role: 'navigation' as const },
  main: { role: 'main' as const },
  complementary: { role: 'complementary' as const },
  contentinfo: { role: 'contentinfo' as const },
  search: { role: 'search' as const },
  form: { role: 'form' as const },
  region: { role: 'region' as const },
} as const;
