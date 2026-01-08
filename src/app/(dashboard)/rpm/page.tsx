/**
 * RPM Dashboard Page
 * Main page for Remote Patient Monitoring
 */

import { Metadata } from "next";
import RPMDashboard from "@/components/rpm/RPMDashboard";

export const metadata: Metadata = {
  title: "Remote Patient Monitoring | Lithic",
  description: "Remote Patient Monitoring dashboard with real-time vital signs tracking",
};

export default function RPMPage() {
  // In a real app, this would get the current user/patient context
  const patientId = "default-patient-id";

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Remote Patient Monitoring</h1>
        <p className="text-muted-foreground">
          Real-time vital signs monitoring and device management
        </p>
      </div>

      <RPMDashboard patientId={patientId} />
    </div>
  );
}
