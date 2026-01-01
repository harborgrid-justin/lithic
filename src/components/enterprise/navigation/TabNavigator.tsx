'use client';

import React, { useState } from 'react';
import { X } from 'lucide-react';

export interface Tab {
  id: string;
  label: string;
  icon?: React.ReactNode;
  closable?: boolean;
  content?: React.ReactNode;
  badge?: string | number;
}

export interface TabNavigatorProps {
  tabs: Tab[];
  activeId: string;
  onChange: (id: string) => void;
  onClose?: (id: string) => void;
  variant?: 'line' | 'pills' | 'enclosed';
  className?: string;
}

export function TabNavigator({
  tabs,
  activeId,
  onChange,
  onClose,
  variant = 'line',
  className = '',
}: TabNavigatorProps) {
  const variantStyles = {
    line: 'border-b border-border',
    pills: 'gap-2',
    enclosed: 'border-b border-border',
  };

  const tabStyles = {
    line: (isActive: boolean) => `
      px-4 py-3 border-b-2 transition-colors
      ${isActive
        ? 'border-primary text-primary font-semibold'
        : 'border-transparent text-muted-foreground hover:text-foreground hover:border-border'
      }
    `,
    pills: (isActive: boolean) => `
      px-4 py-2 rounded-lg transition-colors
      ${isActive
        ? 'bg-primary text-primary-foreground'
        : 'text-muted-foreground hover:bg-muted'
      }
    `,
    enclosed: (isActive: boolean) => `
      px-4 py-3 border border-border rounded-t-lg -mb-px transition-colors
      ${isActive
        ? 'bg-background border-b-background font-semibold'
        : 'bg-muted border-b-border text-muted-foreground hover:bg-background/50'
      }
    `,
  };

  return (
    <div className={className}>
      <div className={`flex items-center ${variantStyles[variant]}`} role="tablist">
        {tabs.map(tab => {
          const isActive = tab.id === activeId;

          return (
            <button
              key={tab.id}
              role="tab"
              aria-selected={isActive}
              aria-controls={`panel-${tab.id}`}
              onClick={() => onChange(tab.id)}
              className={`
                ${tabStyles[variant](isActive)}
                flex items-center gap-2 text-sm whitespace-nowrap
              `}
            >
              {tab.icon}
              <span>{tab.label}</span>
              {tab.badge && (
                <span className="px-2 py-0.5 bg-primary text-primary-foreground text-xs rounded-full">
                  {tab.badge}
                </span>
              )}
              {tab.closable && onClose && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onClose(tab.id);
                  }}
                  className="ml-2 hover:bg-muted-foreground/20 rounded-full p-0.5"
                  aria-label={`Close ${tab.label}`}
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </button>
          );
        })}
      </div>

      {/* Tab Panels */}
      <div className="mt-4">
        {tabs.map(tab => (
          <div
            key={tab.id}
            id={`panel-${tab.id}`}
            role="tabpanel"
            aria-labelledby={tab.id}
            hidden={tab.id !== activeId}
          >
            {tab.content}
          </div>
        ))}
      </div>
    </div>
  );
}
