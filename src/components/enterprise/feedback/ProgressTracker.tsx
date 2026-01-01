'use client';

import React from 'react';
import { Check, Circle } from 'lucide-react';

export interface ProgressStep {
  id: string;
  label: string;
  description?: string;
  status: 'completed' | 'current' | 'upcoming';
}

export interface ProgressTrackerProps {
  steps: ProgressStep[];
  orientation?: 'horizontal' | 'vertical';
  showDescriptions?: boolean;
  className?: string;
}

export function ProgressTracker({
  steps,
  orientation = 'horizontal',
  showDescriptions = true,
  className = '',
}: ProgressTrackerProps) {
  if (orientation === 'vertical') {
    return (
      <div className={`space-y-2 ${className}`}>
        {steps.map((step, index) => (
          <div key={step.id} className="flex gap-4">
            <div className="flex flex-col items-center">
              <StepIndicator status={step.status} />
              {index < steps.length - 1 && (
                <div className={`w-0.5 h-12 ${step.status === 'completed' ? 'bg-primary' : 'bg-border'}`} />
              )}
            </div>
            <div className="flex-1 pb-8">
              <div className={`font-semibold ${step.status === 'current' ? 'text-primary' : ''}`}>
                {step.label}
              </div>
              {showDescriptions && step.description && (
                <div className="text-sm text-muted-foreground mt-1">{step.description}</div>
              )}
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className={`flex items-center ${className}`}>
      {steps.map((step, index) => (
        <React.Fragment key={step.id}>
          <div className="flex flex-col items-center">
            <StepIndicator status={step.status} />
            <div className={`mt-2 text-sm text-center ${step.status === 'current' ? 'font-semibold text-primary' : 'text-muted-foreground'}`}>
              {step.label}
            </div>
          </div>
          {index < steps.length - 1 && (
            <div className={`flex-1 h-0.5 mx-4 ${step.status === 'completed' ? 'bg-primary' : 'bg-border'}`} />
          )}
        </React.Fragment>
      ))}
    </div>
  );
}

function StepIndicator({ status }: { status: ProgressStep['status'] }) {
  if (status === 'completed') {
    return (
      <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center">
        <Check className="w-5 h-5" />
      </div>
    );
  }

  if (status === 'current') {
    return (
      <div className="w-8 h-8 rounded-full border-2 border-primary bg-background flex items-center justify-center">
        <div className="w-3 h-3 rounded-full bg-primary" />
      </div>
    );
  }

  return (
    <div className="w-8 h-8 rounded-full border-2 border-border bg-background flex items-center justify-center">
      <Circle className="w-3 h-3 text-muted-foreground" />
    </div>
  );
}
