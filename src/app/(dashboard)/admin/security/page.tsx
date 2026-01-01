"use client";

import SecurityDashboard from "@/components/admin/SecurityDashboard";
import SessionManager from "@/components/admin/SessionManager";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function SecurityPage() {
  return (
    <div className="container mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Security Center</h1>
        <p className="text-muted-foreground">
          Monitor and manage security settings
        </p>
      </div>

      <Tabs defaultValue="dashboard" className="w-full">
        <TabsList>
          <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
          <TabsTrigger value="sessions">Sessions</TabsTrigger>
        </TabsList>

        <TabsContent value="dashboard" className="space-y-4">
          <SecurityDashboard />
        </TabsContent>

        <TabsContent value="sessions" className="space-y-4">
          <SessionManager />
        </TabsContent>
      </Tabs>
    </div>
  );
}
