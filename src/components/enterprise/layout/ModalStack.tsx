'use client';

import React, { useEffect } from 'react';
import { X } from 'lucide-react';

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
  showClose?: boolean;
  className?: string;
}

const sizes = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-lg',
  xl: 'max-w-xl',
  full: 'max-w-full m-4',
};

export function ModalStack({
  isOpen,
  onClose,
  title,
  children,
  size = 'md',
  showClose = true,
  className = '',
}: ModalProps) {
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

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={onClose}>
        <div
          className={`
            w-full ${sizes[size]} bg-card border border-border rounded-lg shadow-2xl
            animate-scale-in ${className}
          `}
          onClick={(e) => e.stopPropagation()}
          role="dialog"
          aria-modal="true"
          aria-labelledby="modal-title"
        >
          {(title || showClose) && (
            <div className="flex items-center justify-between p-6 border-b border-border">
              {title && <h2 id="modal-title" className="text-xl font-semibold">{title}</h2>}
              {showClose && (
                <button onClick={onClose} className="p-2 hover:bg-muted rounded-lg ml-auto" aria-label="Close">
                  <X className="w-5 h-5" />
                </button>
              )}
            </div>
          )}
          <div className="p-6 max-h-[calc(100vh-200px)] overflow-auto">{children}</div>
        </div>
      </div>
    </>
  );
}
