"use client"

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { DuplicatePatient, PatientMergeRequest } from '@/types/patient';
import { patientService } from '@/services/patient.service';
import { MergePatients } from '@/components/patients/MergePatients';
import { ArrowLeft } from 'lucide-react';

export default function MergePatientsPage() {
  const router = useRouter();
  const [duplicates, setDuplicates] = useState<DuplicatePatient[]>([]);
  const [loading, setLoading] = useState(false);

  const handleMerge = async (request: PatientMergeRequest) => {
    try {
      setLoading(true);
      await patientService.mergePatients(request);
      router.push('/patients/' + request.targetPatientId);
    } catch (error) {
      console.error('Failed to merge patients:', error);
      alert('Failed to merge patients. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <Link
          href="/patients"
          className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700 mb-4"
        >
          <ArrowLeft className="h-4 w-4 mr-1" />
          Back to Patients
        </Link>
        <h1 className="text-3xl font-bold text-gray-900">Merge Patient Records</h1>
        <p className="text-gray-500 mt-1">
          Combine duplicate patient records into a single record
        </p>
      </div>

      {duplicates.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          Search for patients to find duplicates
        </div>
      ) : (
        <MergePatients
          duplicates={duplicates}
          onMerge={handleMerge}
          onCancel={() => router.push('/patients')}
        />
      )}
    </div>
  );
}
