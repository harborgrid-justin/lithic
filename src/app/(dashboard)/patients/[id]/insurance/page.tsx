"use client"

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { Insurance } from '@/types/patient';
import { patientService } from '@/services/patient.service';
import { InsuranceCard } from '@/components/patients/InsuranceCard';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Plus } from 'lucide-react';

export default function PatientInsurancePage() {
  const params = useParams();
  const patientId = params.id as string;
  const [insurance, setInsurance] = useState<Insurance[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadInsurance();
  }, [patientId]);

  const loadInsurance = async () => {
    try {
      setLoading(true);
      const data = await patientService.getPatientInsurance(patientId);
      setInsurance(data);
    } catch (error) {
      console.error('Failed to load insurance:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async (insuranceId: string) => {
    try {
      await patientService.verifyInsurance(patientId, insuranceId);
      loadInsurance();
    } catch (error) {
      console.error('Failed to verify insurance:', error);
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
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Insurance</h1>
            <p className="text-gray-500 mt-1">Manage patient insurance information</p>
          </div>
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Add Insurance
          </Button>
        </div>
      </div>

      {insurance.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          No insurance information on file
        </div>
      ) : (
        <div className="space-y-4">
          {insurance.map((ins) => (
            <InsuranceCard
              key={ins.id}
              insurance={ins}
              onVerify={handleVerify}
            />
          ))}
        </div>
      )}
    </div>
  );
}
