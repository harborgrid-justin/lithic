"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import OrganizationSettings from "@/components/admin/OrganizationSettings";
import MFASetup from "@/components/admin/MFASetup";
import AccessControl from "@/components/admin/AccessControl";

export default function SettingsPage() {
  return (
    <div className="container mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Settings</h1>
        <p className="text-muted-foreground">
          Configure system settings and preferences
        </p>
      </div>

      <Tabs defaultValue="organization" className="w-full">
        <TabsList>
          <TabsTrigger value="organization">Organization</TabsTrigger>
          <TabsTrigger value="security">Security</TabsTrigger>
          <TabsTrigger value="access">Access Control</TabsTrigger>
        </TabsList>

        <TabsContent value="organization" className="space-y-4">
          <OrganizationSettings />
        </TabsContent>

        <TabsContent value="security" className="space-y-4">
          <MFASetup />
        </TabsContent>

        <TabsContent value="access" className="space-y-4">
          <AccessControl />
        </TabsContent>
      </Tabs>
    </div>
  );
}
