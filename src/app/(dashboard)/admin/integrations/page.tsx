"use client";

import IntegrationManager from "@/components/admin/IntegrationManager";

export default function IntegrationsPage() {
  return (
    <div className="container mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Integrations</h1>
        <p className="text-muted-foreground">
          Manage third-party integrations and API connections
        </p>
      </div>

      <IntegrationManager />
    </div>
  );
}
