'use client';

import OrganizationSettings from '@/components/admin/OrganizationSettings';

export default function OrganizationsPage() {
  return (
    <div className="container mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Organization Settings</h1>
        <p className="text-muted-foreground">Manage organization-wide settings and policies</p>
      </div>

      <OrganizationSettings />
    </div>
  );
}
