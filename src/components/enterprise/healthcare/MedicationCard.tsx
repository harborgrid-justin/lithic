'use client';

import React from 'react';
import { Pill, Clock, AlertCircle, CheckCircle2 } from 'lucide-react';

export interface Medication {
  id: string;
  name: string;
  dosage: string;
  frequency: string;
  route: string;
  startDate: Date | string;
  endDate?: Date | string;
  prescriber?: string;
  instructions?: string;
  status: 'active' | 'completed' | 'discontinued';
  lastAdministered?: Date;
}

export interface MedicationCardProps {
  medication: Medication;
  showActions?: boolean;
  onAdminister?: () => void;
  onDiscontinue?: () => void;
  className?: string;
}

const statusStyles = {
  active: 'border-success bg-success/5',
  completed: 'border-muted bg-muted',
  discontinued: 'border-destructive bg-destructive/5',
};

export function MedicationCard({
  medication,
  showActions = true,
  onAdminister,
  onDiscontinue,
  className = '',
}: MedicationCardProps) {
  return (
    <div className={`border rounded-lg p-4 ${statusStyles[medication.status]} ${className}`}>
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-start gap-3">
          <div className="p-2 bg-primary/10 rounded-lg">
            <Pill className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h3 className="font-semibold text-lg">{medication.name}</h3>
            <p className="text-sm text-muted-foreground">
              {medication.dosage} • {medication.route}
            </p>
          </div>
        </div>

        <div className={`
          px-2 py-1 rounded-full text-xs font-semibold
          ${medication.status === 'active' ? 'bg-success text-success-foreground' : ''}
          ${medication.status === 'completed' ? 'bg-muted text-muted-foreground' : ''}
          ${medication.status === 'discontinued' ? 'bg-destructive text-destructive-foreground' : ''}
        `}>
          {medication.status}
        </div>
      </div>

      <div className="space-y-2 text-sm mb-3">
        <div className="flex items-center gap-2 text-muted-foreground">
          <Clock className="w-4 h-4" />
          <span>{medication.frequency}</span>
        </div>
        {medication.lastAdministered && (
          <div className="flex items-center gap-2 text-muted-foreground">
            <CheckCircle2 className="w-4 h-4" />
            <span>Last given: {new Date(medication.lastAdministered).toLocaleString()}</span>
          </div>
        )}
        {medication.instructions && (
          <div className="flex items-start gap-2 text-muted-foreground">
            <AlertCircle className="w-4 h-4 mt-0.5" />
            <span>{medication.instructions}</span>
          </div>
        )}
        {medication.prescriber && (
          <div className="text-muted-foreground">
            Prescribed by: {medication.prescriber}
          </div>
        )}
      </div>

      {showActions && medication.status === 'active' && (
        <div className="flex gap-2 pt-3 border-t border-border">
          {onAdminister && (
            <button
              onClick={onAdminister}
              className="flex-1 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 text-sm font-medium"
            >
              Administer
            </button>
          )}
          {onDiscontinue && (
            <button
              onClick={onDiscontinue}
              className="px-4 py-2 border border-border rounded-lg hover:bg-muted text-sm font-medium"
            >
              Discontinue
            </button>
          )}
        </div>
      )}
    </div>
  );
}
