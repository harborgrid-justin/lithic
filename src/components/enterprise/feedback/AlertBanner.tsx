'use client';

import React from 'react';
import { AlertCircle, CheckCircle2, Info, XCircle, X } from 'lucide-react';

export interface AlertBannerProps {
  type?: 'info' | 'success' | 'warning' | 'error';
  title?: string;
  message: string;
  dismissible?: boolean;
  onDismiss?: () => void;
  action?: { label: string; onClick: () => void };
  className?: string;
}

const icons = {
  info: Info,
  success: CheckCircle2,
  warning: AlertCircle,
  error: XCircle,
};

const styles = {
  info: 'bg-info/10 border-info/20 text-info',
  success: 'bg-success/10 border-success/20 text-success',
  warning: 'bg-warning/10 border-warning/20 text-warning',
  error: 'bg-destructive/10 border-destructive/20 text-destructive',
};

export function AlertBanner({
  type = 'info',
  title,
  message,
  dismissible = true,
  onDismiss,
  action,
  className = '',
}: AlertBannerProps) {
  const Icon = icons[type];

  return (
    <div
      role="alert"
      className={`
        flex items-start gap-3 p-4 border rounded-lg
        ${styles[type]} ${className}
      `}
    >
      <Icon className="w-5 h-5 flex-shrink-0 mt-0.5" />
      <div className="flex-1 min-w-0">
        {title && <div className="font-semibold mb-1">{title}</div>}
        <div className="text-sm">{message}</div>
        {action && (
          <button
            onClick={action.onClick}
            className="mt-2 text-sm font-semibold underline hover:no-underline"
          >
            {action.label}
          </button>
        )}
      </div>
      {dismissible && onDismiss && (
        <button
          onClick={onDismiss}
          className="flex-shrink-0 hover:opacity-70"
          aria-label="Dismiss"
        >
          <X className="w-5 h-5" />
        </button>
      )}
    </div>
  );
}
