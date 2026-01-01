"use client"

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Patient } from '@/types/patient';
import { patientService } from '@/services/patient.service';
import { PatientList } from '@/components/patients/PatientList';
import { PatientSearch } from '@/components/patients/PatientSearch';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';

export default function PatientsPage() {
  const router = useRouter();
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdvancedSearch, setShowAdvancedSearch] = useState(false);

  useEffect(() => {
    loadPatients();
  }, []);

  const loadPatients = async () => {
    try {
      setLoading(true);
      const result = await patientService.getPatients({ limit: 50 });
      setPatients(result.patients);
    } catch (error) {
      console.error('Failed to load patients:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async (params: any) => {
    try {
      setLoading(true);
      const results = await patientService.searchPatients(params);
      setPatients(results);
    } catch (error) {
      console.error('Failed to search patients:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePatientClick = (patient: Patient) => {
    router.push('/patients/' + patient.id);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Patients</h1>
          <p className="text-gray-500 mt-1">
            Manage patient records and information
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => setShowAdvancedSearch(!showAdvancedSearch)}
          >
            Advanced Search
          </Button>
          <Button onClick={() => router.push('/patients/new')}>
            <Plus className="h-4 w-4 mr-2" />
            New Patient
          </Button>
        </div>
      </div>

      {showAdvancedSearch && (
        <PatientSearch
          onSearch={handleSearch}
          onReset={loadPatients}
        />
      )}

      <PatientList
        patients={patients}
        onPatientClick={handlePatientClick}
        loading={loading}
      />
    </div>
  );
}
