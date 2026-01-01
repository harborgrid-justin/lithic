/**
 * SDOH Resource Directory Page
 * SDOH & Care Coordination Specialist - Agent 7
 */

"use client";

import { ResourceFinder } from "@/components/sdoh/resource-finder";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Database, Upload } from "lucide-react";

export default function SDOHResourcesPage() {
  const handleSelectResource = (resource: any) => {
    console.log("Selected resource:", resource);
  };

  const handleCreateReferral = (resource: any) => {
    console.log("Create referral for:", resource);
    // Navigate to referral creation
  };

  return (
    <div className="p-8 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Community Resources</h1>
          <p className="text-gray-600 mt-2">
            Search and manage community resources for SDOH needs
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">
            <Database className="h-4 w-4 mr-2" />
            Sync External Sources
          </Button>
          <Button>
            <Upload className="h-4 w-4 mr-2" />
            Add Resource
          </Button>
        </div>
      </div>

      {/* Resource Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <p className="text-sm text-gray-600">Total Resources</p>
          <p className="text-2xl font-bold mt-1">847</p>
        </Card>
        <Card className="p-4">
          <p className="text-sm text-gray-600">Verified</p>
          <p className="text-2xl font-bold mt-1">623</p>
        </Card>
        <Card className="p-4">
          <p className="text-sm text-gray-600">Accepting Referrals</p>
          <p className="text-2xl font-bold mt-1">512</p>
        </Card>
        <Card className="p-4">
          <p className="text-sm text-gray-600">Active Partnerships</p>
          <p className="text-2xl font-bold mt-1">89</p>
        </Card>
      </div>

      {/* Resource Finder */}
      <ResourceFinder
        onSelectResource={handleSelectResource}
        onCreateReferral={handleCreateReferral}
      />
    </div>
  );
}
