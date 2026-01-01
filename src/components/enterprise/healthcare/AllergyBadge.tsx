'use client';

import React from 'react';
import { AlertTriangle } from 'lucide-react';

export interface Allergy {
  allergen: string;
  severity: 'mild' | 'moderate' | 'severe';
  reaction?: string;
  onsetDate?: Date | string;
}

export interface AllergyBadgeProps {
  allergy: Allergy;
  variant?: 'default' | 'compact';
  showReaction?: boolean;
  className?: string;
}

const severityStyles = {
  mild: 'bg-warning/10 border-warning/30 text-warning',
  moderate: 'bg-destructive/10 border-destructive/30 text-destructive',
  severe: 'bg-destructive border-destructive text-destructive-foreground',
};

export function AllergyBadge({
  allergy,
  variant = 'default',
  showReaction = true,
  className = '',
}: AllergyBadgeProps) {
  if (variant === 'compact') {
    return (
      <span
        className={`
          inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold border
          ${severityStyles[allergy.severity]} ${className}
        `}
        title={`${allergy.severity.toUpperCase()} allergy${allergy.reaction ? `: ${allergy.reaction}` : ''}`}
      >
        <AlertTriangle className="w-3 h-3" />
        {allergy.allergen}
      </span>
    );
  }

  return (
    <div
      className={`
        flex items-start gap-3 p-3 rounded-lg border
        ${severityStyles[allergy.severity]} ${className}
      `}
    >
      <AlertTriangle className="w-5 h-5 flex-shrink-0" />
      <div className="flex-1 min-w-0">
        <div className="font-semibold">{allergy.allergen}</div>
        <div className="text-xs uppercase tracking-wide mt-1">
          {allergy.severity} Severity
        </div>
        {showReaction && allergy.reaction && (
          <div className="text-sm mt-1 opacity-90">
            Reaction: {allergy.reaction}
          </div>
        )}
        {allergy.onsetDate && (
          <div className="text-xs mt-1 opacity-75">
            Since: {new Date(allergy.onsetDate).toLocaleDateString()}
          </div>
        )}
      </div>
    </div>
  );
}
