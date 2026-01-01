'use client';

import React from 'react';
import { Calendar, User, Phone, MapPin, AlertTriangle } from 'lucide-react';

export interface PatientData {
  id: string;
  mrn: string;
  name: string;
  dateOfBirth: Date | string;
  age: number;
  gender: 'M' | 'F' | 'O';
  phone?: string;
  address?: string;
  photo?: string;
  allergies?: string[];
  alerts?: string[];
}

export interface PatientBannerProps {
  patient: PatientData;
  showAllergies?: boolean;
  showAlerts?: boolean;
  className?: string;
}

export function PatientBanner({
  patient,
  showAllergies = true,
  showAlerts = true,
  className = '',
}: PatientBannerProps) {
  const dob = typeof patient.dateOfBirth === 'string'
    ? new Date(patient.dateOfBirth)
    : patient.dateOfBirth;

  return (
    <div className={`bg-card border border-border rounded-lg p-4 ${className}`}>
      <div className="flex items-start gap-4">
        {/* Photo */}
        <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
          {patient.photo ? (
            <img src={patient.photo} alt={patient.name} className="w-full h-full rounded-full object-cover" />
          ) : (
            <User className="w-8 h-8 text-muted-foreground" />
          )}
        </div>

        {/* Patient Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between mb-2">
            <div>
              <h2 className="text-xl font-bold">{patient.name}</h2>
              <div className="flex items-center gap-4 text-sm text-muted-foreground mt-1">
                <span>MRN: {patient.mrn}</span>
                <span>•</span>
                <span className="flex items-center gap-1">
                  <Calendar className="w-4 h-4" />
                  {dob.toLocaleDateString()} ({patient.age}y {patient.gender})
                </span>
              </div>
            </div>
          </div>

          {/* Contact Info */}
          <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
            {patient.phone && (
              <span className="flex items-center gap-1">
                <Phone className="w-4 h-4" />
                {patient.phone}
              </span>
            )}
            {patient.address && (
              <span className="flex items-center gap-1">
                <MapPin className="w-4 h-4" />
                {patient.address}
              </span>
            )}
          </div>

          {/* Allergies & Alerts */}
          <div className="flex flex-wrap gap-2 mt-3">
            {showAllergies && patient.allergies && patient.allergies.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {patient.allergies.map((allergy, idx) => (
                  <span
                    key={idx}
                    className="px-3 py-1 bg-destructive/10 text-destructive text-sm font-semibold rounded-full flex items-center gap-1"
                  >
                    <AlertTriangle className="w-3 h-3" />
                    Allergy: {allergy}
                  </span>
                ))}
              </div>
            )}
            {showAlerts && patient.alerts && patient.alerts.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {patient.alerts.map((alert, idx) => (
                  <span
                    key={idx}
                    className="px-3 py-1 bg-warning/10 text-warning text-sm font-semibold rounded-full"
                  >
                    {alert}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
