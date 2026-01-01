"use client"

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Patient } from '@/types/patient';
import { patientService } from '@/services/patient.service';
import { PatientForm } from '@/components/patients/PatientForm';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function NewPatientPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (data: Partial<Patient>) => {
    try {
      setLoading(true);
      setError(null);
      const newPatient = await patientService.createPatient(data as any);
      router.push('/patients/' + newPatient.id);
    } catch (err: any) {
      setError(err.message || 'Failed to create patient');
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
        <h1 className="text-3xl font-bold text-gray-900">New Patient</h1>
        <p className="text-gray-500 mt-1">
          Create a new patient record
        </p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4 text-red-800">
          {error}
        </div>
      )}

      <PatientForm
        onSubmit={handleSubmit}
        onCancel={() => router.push('/patients')}
        isLoading={loading}
      />
    </div>
  );
}
