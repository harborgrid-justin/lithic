"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Patient } from "@/types/patient";
import { patientService } from "@/services/patient.service";
import { PatientDemographics } from "@/components/patients/PatientDemographics";
import { ArrowLeft } from "lucide-react";

export default function PatientDemographicsPage() {
  const params = useParams();
  const patientId = params.id as string;
  const [patient, setPatient] = useState<Patient | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadPatient();
  }, [patientId]);

  const loadPatient = async () => {
    try {
      setLoading(true);
      const data = await patientService.getPatient(patientId);
      setPatient(data);
    } catch (error) {
      console.error("Failed to load patient:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">Loading...</div>
    );
  }

  if (!patient) {
    return <div className="text-center py-12">Patient not found</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <Link
          href={"/patients/" + patient.id}
          className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700 mb-4"
        >
          <ArrowLeft className="h-4 w-4 mr-1" />
          Back to Patient
        </Link>
        <h1 className="text-3xl font-bold text-gray-900">Demographics</h1>
        <p className="text-gray-500 mt-1">
          {patient.firstName} {patient.lastName} - {patient.mrn}
        </p>
      </div>

      <PatientDemographics patient={patient} />
    </div>
  );
}
