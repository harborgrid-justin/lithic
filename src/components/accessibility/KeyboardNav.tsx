/**
 * Keyboard Navigation Component - Lithic Healthcare Platform v0.5
 */

'use client';

import React, { useEffect } from 'react';
import { useKeyboardNav, KeyboardShortcut } from '@/hooks/useKeyboardNav';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Keyboard } from 'lucide-react';

interface KeyboardNavProps {
  shortcuts: KeyboardShortcut[];
  enabled?: boolean;
  showHelp?: boolean;
  className?: string;
}

export function KeyboardNav({
  shortcuts,
  enabled = true,
  showHelp = false,
  className = '',
}: KeyboardNavProps) {
  useKeyboardNav(shortcuts, enabled);

  const formatShortcut = (shortcut: KeyboardShortcut) => {
    const parts = [];
    if (shortcut.ctrl) parts.push('Ctrl');
    if (shortcut.alt) parts.push('Alt');
    if (shortcut.shift) parts.push('Shift');
    if (shortcut.meta) parts.push('⌘');
    parts.push(shortcut.key.toUpperCase());
    return parts.join(' + ');
  };

  if (!showHelp) return null;

  return (
    <Card className={`p-6 ${className}`}>
      <div className="flex items-center gap-2 mb-4">
        <Keyboard className="h-5 w-5" />
        <h3 className="text-lg font-semibold">Keyboard Shortcuts</h3>
      </div>

      <div className="space-y-2">
        {shortcuts.map((shortcut, index) => (
          <div
            key={index}
            className="flex items-center justify-between p-2 bg-gray-50 rounded"
          >
            <span className="text-sm">{shortcut.description}</span>
            <Badge variant="secondary" className="font-mono">
              {formatShortcut(shortcut)}
            </Badge>
          </div>
        ))}
      </div>
    </Card>
  );
}
