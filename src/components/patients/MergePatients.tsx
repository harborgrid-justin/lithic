"use client"

import { useState } from 'react';
import { Patient, DuplicatePatient, PatientMergeRequest } from '@/types/patient';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { calculateAge, formatPhone } from '@/lib/utils';
import { AlertCircle, ArrowRight, Users } from 'lucide-react';

interface MergePatientsProps {
  duplicates: DuplicatePatient[];
  onMerge: (request: PatientMergeRequest) => void;
  onCancel: () => void;
}

export function MergePatients({ duplicates, onMerge, onCancel }: MergePatientsProps) {
  const [selectedSource, setSelectedSource] = useState<Patient | null>(null);
  const [selectedTarget, setSelectedTarget] = useState<Patient | null>(null);
  const [mergeOptions, setMergeOptions] = useState({
    keepTargetDemographics: true,
    mergeInsurance: true,
    mergeContacts: true,
    mergeDocuments: true,
  });
  const [reason, setReason] = useState('');

  const handleMerge = () => {
    if (!selectedSource || !selectedTarget) return;

    const request: PatientMergeRequest = {
      sourcePatientId: selectedSource.id,
      targetPatientId: selectedTarget.id,
      ...mergeOptions,
      reason,
      performedBy: 'current-user-id', // Replace with actual user ID
    };

    onMerge(request);
  };

  const PatientCard = ({ patient, matchScore }: { patient: Patient; matchScore?: number }) => (
    <div className="border rounded-lg p-4">
      <div className="flex items-start justify-between mb-2">
        <div>
          <div className="font-medium">
            {patient.firstName} {patient.lastName}
          </div>
          <div className="text-sm text-gray-500 font-mono">{patient.mrn}</div>
        </div>
        {matchScore && (
          <Badge variant={matchScore > 90 ? 'danger' : 'warning'}>
            {matchScore}% match
          </Badge>
        )}
      </div>
      <div className="text-sm text-gray-600 space-y-1">
        <div>DOB: {patient.dateOfBirth} (Age {calculateAge(patient.dateOfBirth)})</div>
        {patient.phone && <div>Phone: {formatPhone(patient.phone)}</div>}
        {patient.email && <div>Email: {patient.email}</div>}
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            <CardTitle>Merge Patient Records</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4 flex gap-2">
            <AlertCircle className="h-5 w-5 text-yellow-600 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-yellow-800">
              <div className="font-medium mb-1">Warning: This action cannot be undone</div>
              <div>
                Merging patient records will combine all data from the source patient into the
                target patient. The source patient record will be marked as inactive.
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Found {duplicates.length} potential duplicate{duplicates.length !== 1 ? 's' : ''}
            </label>
            <div className="space-y-2">
              {duplicates.map((dup) => (
                <div
                  key={dup.patient.id}
                  className="cursor-pointer"
                  onClick={() => {
                    if (!selectedSource) {
                      setSelectedSource(dup.patient);
                    } else if (!selectedTarget && dup.patient.id !== selectedSource.id) {
                      setSelectedTarget(dup.patient);
                    }
                  }}
                >
                  <PatientCard patient={dup.patient} matchScore={dup.matchScore} />
                  {dup.matchReasons.length > 0 && (
                    <div className="mt-1 ml-4 text-xs text-gray-500">
                      Match reasons: {dup.matchReasons.join(', ')}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {selectedSource && selectedTarget && (
            <>
              <div className="border-t pt-4">
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Merge Configuration
                </label>
                <div className="flex items-center gap-4">
                  <div className="flex-1">
                    <div className="text-sm font-medium mb-1">Source (will be merged)</div>
                    <PatientCard patient={selectedSource} />
                  </div>
                  <ArrowRight className="h-6 w-6 text-gray-400 flex-shrink-0" />
                  <div className="flex-1">
                    <div className="text-sm font-medium mb-1">Target (will be kept)</div>
                    <PatientCard patient={selectedTarget} />
                  </div>
                </div>
              </div>

              <div className="border-t pt-4 space-y-3">
                <label className="block text-sm font-medium text-gray-700">
                  Merge Options
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={mergeOptions.keepTargetDemographics}
                    onChange={(e) =>
                      setMergeOptions({ ...mergeOptions, keepTargetDemographics: e.target.checked })
                    }
                    className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                  />
                  <span className="text-sm">Keep target patient demographics</span>
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={mergeOptions.mergeInsurance}
                    onChange={(e) =>
                      setMergeOptions({ ...mergeOptions, mergeInsurance: e.target.checked })
                    }
                    className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                  />
                  <span className="text-sm">Merge insurance information</span>
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={mergeOptions.mergeContacts}
                    onChange={(e) =>
                      setMergeOptions({ ...mergeOptions, mergeContacts: e.target.checked })
                    }
                    className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                  />
                  <span className="text-sm">Merge emergency contacts</span>
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={mergeOptions.mergeDocuments}
                    onChange={(e) =>
                      setMergeOptions({ ...mergeOptions, mergeDocuments: e.target.checked })
                    }
                    className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                  />
                  <span className="text-sm">Merge documents</span>
                </label>
              </div>

              <div className="border-t pt-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Reason for merge <span className="text-red-500">*</span>
                </label>
                <textarea
                  required
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                  rows={3}
                  placeholder="Explain why these records are being merged..."
                />
              </div>
            </>
          )}
        </CardContent>
      </Card>

      <div className="flex gap-2 justify-end">
        <Button variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button
          onClick={handleMerge}
          disabled={!selectedSource || !selectedTarget || !reason}
        >
          Merge Patients
        </Button>
      </div>
    </div>
  );
}
