'use client';

import React from 'react';
import { FileX, SearchX, Inbox, Database } from 'lucide-react';

export interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  variant?: 'default' | 'search' | 'inbox' | 'data';
  className?: string;
}

const defaultIcons = {
  default: FileX,
  search: SearchX,
  inbox: Inbox,
  data: Database,
};

export function EmptyState({
  icon,
  title,
  description,
  action,
  variant = 'default',
  className = '',
}: EmptyStateProps) {
  const Icon = icon ? null : defaultIcons[variant];

  return (
    <div className={`flex flex-col items-center justify-center py-12 px-4 text-center ${className}`}>
      <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
        {icon || (Icon && <Icon className="w-8 h-8 text-muted-foreground" />)}
      </div>
      <h3 className="text-lg font-semibold mb-2">{title}</h3>
      {description && (
        <p className="text-muted-foreground max-w-md mb-6">{description}</p>
      )}
      {action && (
        <button
          onClick={action.onClick}
          className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
        >
          {action.label}
        </button>
      )}
    </div>
  );
}
