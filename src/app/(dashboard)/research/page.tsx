/**
 * Research Dashboard Page
 * Lithic Healthcare Platform v0.5
 */

import { TrialDashboard } from "@/components/research/TrialDashboard";

export default function ResearchPage() {
  const organizationId = "org_123"; // Would get from session

  return (
    <div className="container mx-auto px-4 py-8">
      <TrialDashboard organizationId={organizationId} />
    </div>
  );
}

export const metadata = {
  title: "Clinical Research | Lithic Healthcare",
  description: "Manage clinical trials and research studies",
};
