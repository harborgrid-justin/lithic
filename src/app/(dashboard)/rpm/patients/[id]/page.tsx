/**
 * Patient RPM Detail Page
 * Detailed RPM view for individual patient
 */

import { Metadata } from "next";
import RPMDashboard from "@/components/rpm/RPMDashboard";

export const metadata: Metadata = {
  title: "Patient RPM Details | Lithic",
  description: "Detailed remote patient monitoring view",
};

interface PageProps {
  params: {
    id: string;
  };
}

export default function PatientRPMPage({ params }: PageProps) {
  return (
    <div className="container mx-auto py-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Patient RPM Dashboard</h1>
        <p className="text-muted-foreground">
          Remote monitoring for Patient ID: {params.id}
        </p>
      </div>

      <RPMDashboard patientId={params.id} />
    </div>
  );
}
