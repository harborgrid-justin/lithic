"use client";

import AuditLog from "@/components/admin/AuditLog";

export default function AuditPage() {
  return (
    <div className="container mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Audit Logs</h1>
        <p className="text-muted-foreground">
          Track all system activities and access
        </p>
      </div>

      <AuditLog />
    </div>
  );
}
