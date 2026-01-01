"use client";

import PermissionMatrix from "@/components/admin/PermissionMatrix";

export default function PermissionsPage() {
  return (
    <div className="container mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Permission Matrix</h1>
        <p className="text-muted-foreground">
          View and manage permissions across roles
        </p>
      </div>

      <PermissionMatrix />
    </div>
  );
}
