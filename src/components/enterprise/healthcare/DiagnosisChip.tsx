'use client';

import React from 'react';
import { X, Star, FileText } from 'lucide-react';

export interface Diagnosis {
  code: string;
  description: string;
  type: 'primary' | 'secondary' | 'differential';
  status: 'active' | 'resolved' | 'ruled-out';
  onsetDate?: Date | string;
  isPrimary?: boolean;
}

export interface DiagnosisChipProps {
  diagnosis: Diagnosis;
  variant?: 'default' | 'compact';
  showCode?: boolean;
  showDate?: boolean;
  removable?: boolean;
  onRemove?: () => void;
  onClick?: () => void;
  className?: string;
}

const typeStyles = {
  primary: 'bg-primary text-primary-foreground border-primary',
  secondary: 'bg-muted text-foreground border-border',
  differential: 'bg-info/10 text-info border-info/20',
};

const statusStyles = {
  active: 'border-solid',
  resolved: 'opacity-60 border-dashed',
  'ruled-out': 'opacity-40 line-through',
};

export function DiagnosisChip({
  diagnosis,
  variant = 'default',
  showCode = true,
  showDate = false,
  removable = false,
  onRemove,
  onClick,
  className = '',
}: DiagnosisChipProps) {
  if (variant === 'compact') {
    return (
      <span
        onClick={onClick}
        className={`
          inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium border
          ${typeStyles[diagnosis.type]}
          ${statusStyles[diagnosis.status]}
          ${onClick ? 'cursor-pointer hover:opacity-80' : ''}
          ${className}
        `}
      >
        {diagnosis.isPrimary && <Star className="w-3 h-3 fill-current" />}
        {showCode && <span className="font-mono">{diagnosis.code}</span>}
        <span className="truncate max-w-[200px]">{diagnosis.description}</span>
        {removable && onRemove && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onRemove();
            }}
            className="ml-1 hover:bg-background/20 rounded-full p-0.5"
            aria-label="Remove diagnosis"
          >
            <X className="w-3 h-3" />
          </button>
        )}
      </span>
    );
  }

  return (
    <div
      onClick={onClick}
      className={`
        flex items-start gap-3 p-4 rounded-lg border
        ${typeStyles[diagnosis.type]}
        ${statusStyles[diagnosis.status]}
        ${onClick ? 'cursor-pointer hover:opacity-90' : ''}
        ${className}
      `}
    >
      <div className="flex-shrink-0 p-2 bg-background/20 rounded-lg">
        <FileText className="w-5 h-5" />
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2 mb-1">
          <div className="flex items-center gap-2">
            {diagnosis.isPrimary && (
              <Star className="w-4 h-4 fill-current flex-shrink-0" title="Primary diagnosis" />
            )}
            {showCode && (
              <span className="font-mono font-semibold">{diagnosis.code}</span>
            )}
          </div>
          <span className="text-xs uppercase tracking-wide">
            {diagnosis.type}
          </span>
        </div>

        <div className="text-sm mb-2">{diagnosis.description}</div>

        <div className="flex items-center gap-4 text-xs">
          <span className="px-2 py-0.5 rounded-full bg-background/20">
            {diagnosis.status}
          </span>
          {showDate && diagnosis.onsetDate && (
            <span>
              Since: {new Date(diagnosis.onsetDate).toLocaleDateString()}
            </span>
          )}
        </div>
      </div>

      {removable && onRemove && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onRemove();
          }}
          className="flex-shrink-0 p-1 hover:bg-background/20 rounded-full"
          aria-label="Remove diagnosis"
        >
          <X className="w-4 h-4" />
        </button>
      )}
    </div>
  );
}
