/**
 * useKeyboardNav Hook
 * Lithic Healthcare Platform v0.5
 */

'use client';

import { useEffect, useCallback, useRef } from 'react';

export interface KeyboardShortcut {
  key: string;
  ctrl?: boolean;
  alt?: boolean;
  shift?: boolean;
  meta?: boolean;
  description: string;
  action: () => void;
}

export function useKeyboardNav(shortcuts: KeyboardShortcut[], enabled: boolean = true) {
  const shortcutsRef = useRef(shortcuts);

  useEffect(() => {
    shortcutsRef.current = shortcuts;
  }, [shortcuts]);

  useEffect(() => {
    if (!enabled) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      for (const shortcut of shortcutsRef.current) {
        const matches =
          event.key.toLowerCase() === shortcut.key.toLowerCase() &&
          (!shortcut.ctrl || event.ctrlKey) &&
          (!shortcut.alt || event.altKey) &&
          (!shortcut.shift || event.shiftKey) &&
          (!shortcut.meta || event.metaKey);

        if (matches) {
          event.preventDefault();
          shortcut.action();
          break;
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [enabled]);

  const registerShortcut = useCallback((shortcut: KeyboardShortcut) => {
    shortcutsRef.current = [...shortcutsRef.current, shortcut];
  }, []);

  const unregisterShortcut = useCallback((key: string) => {
    shortcutsRef.current = shortcutsRef.current.filter((s) => s.key !== key);
  }, []);

  return {
    registerShortcut,
    unregisterShortcut,
  };
}
