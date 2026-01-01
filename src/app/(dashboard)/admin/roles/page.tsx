'use client';

import RoleManager from '@/components/admin/RoleManager';

export default function RolesPage() {
  return (
    <div className="container mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Roles & Access Control</h1>
        <p className="text-muted-foreground">Manage roles and permissions</p>
      </div>

      <RoleManager />
    </div>
  );
}
