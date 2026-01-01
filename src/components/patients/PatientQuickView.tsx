"use client";

import { Patient } from "@/types/patient";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { calculateAge, formatPhone, maskSSN } from "@/lib/utils";
import { X, User, Phone, Mail, Calendar, Hash } from "lucide-react";

interface PatientQuickViewProps {
  patient: Patient;
  onClose: () => void;
  onViewFull?: () => void;
}

export function PatientQuickView({
  patient,
  onClose,
  onViewFull,
}: PatientQuickViewProps) {
  const age = calculateAge(patient.dateOfBirth);

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-auto">
        <div className="sticky top-0 bg-white border-b px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-full bg-primary-100 flex items-center justify-center">
              <User className="h-6 w-6 text-primary-600" />
            </div>
            <div>
              <h2 className="text-xl font-semibold">
                {patient.firstName} {patient.lastName}
              </h2>
              <div className="text-sm text-gray-500">Quick View</div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          <div className="flex gap-2">
            <Badge
              variant={patient.status === "active" ? "success" : "secondary"}
            >
              {patient.status}
            </Badge>
            <Badge variant="outline">{patient.gender}</Badge>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <div className="text-sm text-gray-500 flex items-center gap-1">
                <Hash className="h-3 w-3" />
                MRN
              </div>
              <div className="font-mono font-medium">{patient.mrn}</div>
            </div>
            <div className="space-y-1">
              <div className="text-sm text-gray-500 flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                Age
              </div>
              <div className="font-medium">{age} years old</div>
            </div>
            {patient.phone && (
              <div className="space-y-1">
                <div className="text-sm text-gray-500 flex items-center gap-1">
                  <Phone className="h-3 w-3" />
                  Phone
                </div>
                <div className="font-medium">{formatPhone(patient.phone)}</div>
              </div>
            )}
            {patient.email && (
              <div className="space-y-1">
                <div className="text-sm text-gray-500 flex items-center gap-1">
                  <Mail className="h-3 w-3" />
                  Email
                </div>
                <div className="font-medium">{patient.email}</div>
              </div>
            )}
          </div>

          {patient.address && (
            <div className="border-t pt-4">
              <div className="text-sm text-gray-500 mb-1">Address</div>
              <div className="text-sm">
                {patient.address.street1}
                {patient.address.street2 && <>, {patient.address.street2}</>}
                <br />
                {patient.address.city}, {patient.address.state}{" "}
                {patient.address.zipCode}
              </div>
            </div>
          )}

          {patient.insurance && patient.insurance.length > 0 && (
            <div className="border-t pt-4">
              <div className="text-sm text-gray-500 mb-2">Insurance</div>
              <div className="space-y-2">
                {patient.insurance.slice(0, 2).map((ins) => (
                  <div
                    key={ins.id}
                    className="flex items-center justify-between text-sm"
                  >
                    <div>
                      <div className="font-medium">{ins.provider}</div>
                      <div className="text-gray-500">{ins.type}</div>
                    </div>
                    <Badge
                      variant={
                        ins.status === "active" ? "success" : "secondary"
                      }
                    >
                      {ins.status}
                    </Badge>
                  </div>
                ))}
              </div>
            </div>
          )}

          {patient.emergencyContacts &&
            patient.emergencyContacts.length > 0 && (
              <div className="border-t pt-4">
                <div className="text-sm text-gray-500 mb-2">
                  Emergency Contact
                </div>
                {patient.emergencyContacts.filter((c) => c.isPrimary)[0] && (
                  <div className="text-sm">
                    <div className="font-medium">
                      {
                        patient.emergencyContacts.filter((c) => c.isPrimary)[0]
                          .name
                      }
                    </div>
                    <div className="text-gray-500">
                      {
                        patient.emergencyContacts.filter((c) => c.isPrimary)[0]
                          .relationship
                      }
                    </div>
                    <div className="text-gray-600">
                      {formatPhone(
                        patient.emergencyContacts.filter((c) => c.isPrimary)[0]
                          .phone,
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}
        </div>

        <div className="sticky bottom-0 bg-gray-50 px-6 py-4 flex gap-2 justify-end border-t">
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
          {onViewFull && (
            <Button onClick={onViewFull}>View Full Profile</Button>
          )}
        </div>
      </div>
    </div>
  );
}
