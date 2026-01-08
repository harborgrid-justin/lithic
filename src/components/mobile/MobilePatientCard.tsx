"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import {
  User,
  Phone,
  Mail,
  Calendar,
  Clock,
  AlertCircle,
  ChevronRight,
} from "lucide-react";

interface MobilePatientCardProps {
  patient: {
    id: string;
    mrn: string;
    firstName: string;
    lastName: string;
    dateOfBirth: string;
    gender: string;
    phone?: string;
    email?: string;
    age?: number;
    allergies?: string[];
    lastVisit?: string;
    nextAppointment?: string;
    alerts?: Array<{
      type: "warning" | "error" | "info";
      message: string;
    }>;
  };
  onClick?: () => void;
  showDetails?: boolean;
  compact?: boolean;
  className?: string;
}

/**
 * Mobile Patient Card
 * Touch-optimized patient information card
 */
export function MobilePatientCard({
  patient,
  onClick,
  showDetails = false,
  compact = false,
  className,
}: MobilePatientCardProps) {
  const [expanded, setExpanded] = React.useState(false);

  const handleClick = () => {
    if (onClick) {
      onClick();
    } else if (showDetails) {
      setExpanded(!expanded);
    }
  };

  const getInitials = () => {
    return `${patient.firstName.charAt(0)}${patient.lastName.charAt(0)}`.toUpperCase();
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const hasAlerts = patient.alerts && patient.alerts.length > 0;

  return (
    <div
      className={cn(
        "mobile-patient-card",
        "bg-card rounded-lg border",
        "shadow-sm",
        "overflow-hidden",
        onClick || showDetails
          ? [
              "active:scale-[0.98]",
              "transition-all duration-100",
              "cursor-pointer",
            ]
          : "",
        hasAlerts && "border-l-4 border-l-destructive",
        className
      )}
      onClick={handleClick}
    >
      {/* Main content */}
      <div className="p-4">
        <div className="flex items-start gap-3">
          {/* Avatar */}
          <div
            className={cn(
              "flex-shrink-0",
              "flex items-center justify-center",
              "bg-primary/10 text-primary",
              "rounded-full font-semibold",
              compact ? "w-10 h-10 text-sm" : "w-12 h-12 text-base"
            )}
          >
            {getInitials()}
          </div>

          {/* Patient info */}
          <div className="flex-1 min-w-0">
            {/* Name and MRN */}
            <div className="flex items-start justify-between gap-2 mb-1">
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-foreground truncate">
                  {patient.firstName} {patient.lastName}
                </h3>
                <p className="text-sm text-muted-foreground">
                  MRN: {patient.mrn}
                </p>
              </div>
              {onClick && (
                <ChevronRight className="w-5 h-5 text-muted-foreground flex-shrink-0" />
              )}
            </div>

            {/* Basic info */}
            {!compact && (
              <div className="flex items-center gap-4 text-sm text-muted-foreground mt-2">
                <span>
                  {patient.age || calculateAge(patient.dateOfBirth)}y
                </span>
                <span className="capitalize">{patient.gender}</span>
                {patient.dateOfBirth && (
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5" />
                    {formatDate(patient.dateOfBirth)}
                  </span>
                )}
              </div>
            )}

            {/* Contact info */}
            {!compact && (patient.phone || patient.email) && (
              <div className="flex flex-col gap-1 mt-2">
                {patient.phone && (
                  <a
                    href={`tel:${patient.phone}`}
                    className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <Phone className="w-3.5 h-3.5" />
                    <span>{formatPhone(patient.phone)}</span>
                  </a>
                )}
                {patient.email && (
                  <a
                    href={`mailto:${patient.email}`}
                    className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground truncate"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <Mail className="w-3.5 h-3.5 flex-shrink-0" />
                    <span className="truncate">{patient.email}</span>
                  </a>
                )}
              </div>
            )}

            {/* Allergies warning */}
            {patient.allergies && patient.allergies.length > 0 && (
              <div className="mt-2 flex items-start gap-2 p-2 bg-destructive/10 text-destructive rounded text-sm">
                <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                <div>
                  <span className="font-medium">Allergies: </span>
                  <span>{patient.allergies.join(", ")}</span>
                </div>
              </div>
            )}

            {/* Visit info */}
            {!compact && (patient.lastVisit || patient.nextAppointment) && (
              <div className="flex flex-col gap-1 mt-2 text-sm">
                {patient.lastVisit && (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Clock className="w-3.5 h-3.5" />
                    <span>Last visit: {formatDate(patient.lastVisit)}</span>
                  </div>
                )}
                {patient.nextAppointment && (
                  <div className="flex items-center gap-2 text-primary">
                    <Calendar className="w-3.5 h-3.5" />
                    <span>Next: {formatDate(patient.nextAppointment)}</span>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Alerts */}
        {hasAlerts && (
          <div className="mt-3 space-y-2">
            {patient.alerts?.map((alert, index) => (
              <div
                key={index}
                className={cn(
                  "flex items-start gap-2 p-2 rounded text-sm",
                  alert.type === "error" && "bg-destructive/10 text-destructive",
                  alert.type === "warning" && "bg-yellow-500/10 text-yellow-700 dark:text-yellow-400",
                  alert.type === "info" && "bg-blue-500/10 text-blue-700 dark:text-blue-400"
                )}
              >
                <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                <span>{alert.message}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Expanded details */}
      {expanded && showDetails && (
        <div className="border-t bg-muted/50 p-4">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-muted-foreground">DOB</span>
              <p className="font-medium">
                {formatDate(patient.dateOfBirth)}
              </p>
            </div>
            <div>
              <span className="text-muted-foreground">Age</span>
              <p className="font-medium">
                {patient.age || calculateAge(patient.dateOfBirth)} years
              </p>
            </div>
            <div>
              <span className="text-muted-foreground">Gender</span>
              <p className="font-medium capitalize">{patient.gender}</p>
            </div>
            <div>
              <span className="text-muted-foreground">MRN</span>
              <p className="font-medium">{patient.mrn}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * Calculate age from date of birth
 */
function calculateAge(dob: string): number {
  const birthDate = new Date(dob);
  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();

  if (
    monthDiff < 0 ||
    (monthDiff === 0 && today.getDate() < birthDate.getDate())
  ) {
    age--;
  }

  return age;
}

/**
 * Format phone number for display
 */
function formatPhone(phone: string): string {
  const cleaned = phone.replace(/\D/g, "");

  if (cleaned.length === 10) {
    return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6)}`;
  } else if (cleaned.length === 11) {
    return `+${cleaned.slice(0, 1)} (${cleaned.slice(1, 4)}) ${cleaned.slice(4, 7)}-${cleaned.slice(7)}`;
  }

  return phone;
}

/**
 * Compact Patient List Item
 */
interface MobilePatientListItemProps {
  patient: {
    id: string;
    firstName: string;
    lastName: string;
    mrn: string;
    age?: number;
    nextAppointment?: string;
  };
  onClick?: () => void;
  className?: string;
}

export function MobilePatientListItem({
  patient,
  onClick,
  className,
}: MobilePatientListItemProps) {
  const getInitials = () => {
    return `${patient.firstName.charAt(0)}${patient.lastName.charAt(0)}`.toUpperCase();
  };

  return (
    <div
      className={cn(
        "flex items-center gap-3 p-3",
        "active:bg-accent/10 transition-colors",
        "cursor-pointer",
        className
      )}
      onClick={onClick}
    >
      {/* Avatar */}
      <div className="flex-shrink-0 w-10 h-10 bg-primary/10 text-primary rounded-full flex items-center justify-center font-semibold text-sm">
        {getInitials()}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="font-medium text-foreground truncate">
          {patient.firstName} {patient.lastName}
        </div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <span>MRN: {patient.mrn}</span>
          {patient.age && (
            <>
              <span>•</span>
              <span>{patient.age}y</span>
            </>
          )}
        </div>
      </div>

      {/* Arrow */}
      <ChevronRight className="w-5 h-5 text-muted-foreground flex-shrink-0" />
    </div>
  );
}
