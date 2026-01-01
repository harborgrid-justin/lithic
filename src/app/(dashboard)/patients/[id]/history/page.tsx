"use client"

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { PatientHistory } from '@/types/patient';
import { patientService } from '@/services/patient.service';
import { PatientTimeline } from '@/components/patients/PatientTimeline';
import { ArrowLeft } from 'lucide-react';

export default function PatientHistoryPage() {
  const params = useParams();
  const patientId = params.id as string;
  const [history, setHistory] = useState<PatientHistory[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadHistory();
  }, [patientId]);

  const loadHistory = async () => {
    try {
      setLoading(true);
      const data = await patientService.getPatientHistory(patientId);
      setHistory(data);
    } catch (error) {
      console.error('Failed to load history:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center h-64">Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <Link
          href={'/patients/' + patientId}
          className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700 mb-4"
        >
          <ArrowLeft className="h-4 w-4 mr-1" />
          Back to Patient
        </Link>
        <h1 className="text-3xl font-bold text-gray-900">Activity History</h1>
        <p className="text-gray-500 mt-1">
          HIPAA-compliant audit log of all patient record access and modifications
        </p>
      </div>

      <PatientTimeline history={history} />
    </div>
  );
}
