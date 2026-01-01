'use client';

import React, { useEffect } from 'react';
import { X } from 'lucide-react';

export interface SidePanelProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  position?: 'left' | 'right';
  width?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

const widths = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-lg',
  xl: 'max-w-xl',
};

export function SidePanel({
  isOpen,
  onClose,
  title,
  children,
  position = 'right',
  width = 'md',
  className = '',
}: SidePanelProps) {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-40" onClick={onClose} />
      <div
        className={`
          fixed top-0 bottom-0 ${position}-0 z-50
          w-full ${widths[width]} bg-card border-${position === 'left' ? 'r' : 'l'} border-border
          flex flex-col shadow-2xl
          animate-slide-in-from-${position}
          ${className}
        `}
      >
        {title && (
          <div className="flex items-center justify-between p-6 border-b border-border">
            <h2 className="text-xl font-semibold">{title}</h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-muted rounded-lg"
              aria-label="Close panel"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        )}
        <div className="flex-1 overflow-auto p-6">{children}</div>
      </div>
    </>
  );
}
