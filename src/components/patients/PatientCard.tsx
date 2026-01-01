"use client";

import { Patient } from "@/types/patient";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { calculateAge, formatPhone } from "@/lib/utils";
import { User, Phone, Mail, Calendar } from "lucide-react";

interface PatientCardProps {
  patient: Patient;
  onClick?: () => void;
}

export function PatientCard({ patient, onClick }: PatientCardProps) {
  const age = calculateAge(patient.dateOfBirth);

  const statusVariant = {
    active: "success" as const,
    inactive: "secondary" as const,
    deceased: "danger" as const,
  };

  return (
    <Card
      className="hover:shadow-md transition-shadow cursor-pointer"
      onClick={onClick}
    >
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div className="flex gap-4">
            <div className="h-12 w-12 rounded-full bg-primary-100 flex items-center justify-center">
              <User className="h-6 w-6 text-primary-600" />
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-semibold">
                  {patient.firstName} {patient.lastName}
                </h3>
                <Badge variant={statusVariant[patient.status]}>
                  {patient.status}
                </Badge>
              </div>
              <div className="text-sm text-gray-500 space-y-1">
                <div className="flex items-center gap-2">
                  <span className="font-medium">MRN:</span>
                  <span className="font-mono">{patient.mrn}</span>
                </div>
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    <span>Age {age}</span>
                  </div>
                  <span className="capitalize">{patient.gender}</span>
                </div>
              </div>
            </div>
          </div>
          <div className="text-right text-sm text-gray-500 space-y-1">
            {patient.phone && (
              <div className="flex items-center gap-1 justify-end">
                <Phone className="h-3 w-3" />
                <span>{formatPhone(patient.phone)}</span>
              </div>
            )}
            {patient.email && (
              <div className="flex items-center gap-1 justify-end">
                <Mail className="h-3 w-3" />
                <span>{patient.email}</span>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
