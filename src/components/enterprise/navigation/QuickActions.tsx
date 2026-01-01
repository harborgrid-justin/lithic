'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Plus, Zap } from 'lucide-react';

export interface QuickAction {
  id: string;
  label: string;
  icon?: React.ReactNode;
  onClick: () => void;
  shortcut?: string;
  category?: string;
  disabled?: boolean;
}

export interface QuickActionsProps {
  actions: QuickAction[];
  variant?: 'fab' | 'menu';
  position?: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left';
  className?: string;
}

export function QuickActions({
  actions,
  variant = 'fab',
  position = 'bottom-right',
  className = '',
}: QuickActionsProps) {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const positionClasses = {
    'bottom-right': 'bottom-6 right-6',
    'bottom-left': 'bottom-6 left-6',
    'top-right': 'top-6 right-6',
    'top-left': 'top-6 left-6',
  };

  if (variant === 'fab') {
    return (
      <div ref={menuRef} className={`fixed ${positionClasses[position]} z-50 ${className}`}>
        {/* Actions Menu */}
        {isOpen && (
          <div className="mb-4 space-y-2 animate-scale-in">
            {actions.map(action => (
              <button
                key={action.id}
                onClick={() => {
                  action.onClick();
                  setIsOpen(false);
                }}
                disabled={action.disabled}
                className="
                  w-full flex items-center gap-3 px-4 py-3
                  bg-card border border-border rounded-lg shadow-lg
                  hover:bg-muted transition-all
                  disabled:opacity-50 disabled:cursor-not-allowed
                "
                title={action.shortcut}
              >
                {action.icon || <Zap className="w-5 h-5" />}
                <span className="font-medium">{action.label}</span>
                {action.shortcut && (
                  <span className="ml-auto text-xs text-muted-foreground">
                    {action.shortcut}
                  </span>
                )}
              </button>
            ))}
          </div>
        )}

        {/* FAB Button */}
        <button
          onClick={() => setIsOpen(!isOpen)}
          className={`
            w-14 h-14 rounded-full shadow-xl
            bg-primary text-primary-foreground
            hover:scale-110 transition-all
            flex items-center justify-center
            ${isOpen ? 'rotate-45' : ''}
          `}
          aria-label="Quick actions"
          aria-expanded={isOpen}
        >
          <Plus className="w-6 h-6" />
        </button>
      </div>
    );
  }

  return (
    <div className={className}>
      <div className="flex flex-wrap gap-2">
        {actions.map(action => (
          <button
            key={action.id}
            onClick={action.onClick}
            disabled={action.disabled}
            className="
              inline-flex items-center gap-2 px-4 py-2 rounded-lg
              border border-border hover:bg-muted
              transition-colors
              disabled:opacity-50 disabled:cursor-not-allowed
            "
            title={action.shortcut}
          >
            {action.icon}
            <span className="text-sm font-medium">{action.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
