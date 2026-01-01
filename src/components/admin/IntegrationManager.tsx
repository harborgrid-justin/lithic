"use client";

import { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Plug, Database, Cloud, Activity } from "lucide-react";

const integrations = [
  {
    id: "1",
    name: "Epic EHR",
    type: "EHR",
    description: "Connect to Epic electronic health records",
    icon: Database,
    status: "inactive",
    color: "text-purple-600",
  },
  {
    id: "2",
    name: "FHIR API",
    type: "FHIR",
    description: "Fast Healthcare Interoperability Resources",
    icon: Cloud,
    status: "active",
    color: "text-blue-600",
  },
  {
    id: "3",
    name: "HL7 Interface",
    type: "HL7",
    description: "Health Level 7 messaging standard",
    icon: Activity,
    status: "inactive",
    color: "text-green-600",
  },
  {
    id: "4",
    name: "AWS S3",
    type: "STORAGE",
    description: "Document storage and management",
    icon: Cloud,
    status: "active",
    color: "text-orange-600",
  },
];

export default function IntegrationManager() {
  const [activeIntegrations, setActiveIntegrations] = useState<
    Record<string, boolean>
  >({
    "2": true,
    "4": true,
  });

  const toggleIntegration = (id: string) => {
    setActiveIntegrations((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  return (
    <div className="space-y-4">
      <div className="grid gap-4 md:grid-cols-2">
        {integrations.map((integration) => {
          const Icon = integration.icon;
          const isActive = activeIntegrations[integration.id];

          return (
            <Card key={integration.id}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg bg-gray-100`}>
                      <Icon className={`h-6 w-6 ${integration.color}`} />
                    </div>
                    <div>
                      <CardTitle className="text-lg">
                        {integration.name}
                      </CardTitle>
                      <CardDescription>
                        {integration.description}
                      </CardDescription>
                    </div>
                  </div>
                  <Switch
                    checked={isActive}
                    onCheckedChange={() => toggleIntegration(integration.id)}
                  />
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <Badge variant={isActive ? "default" : "secondary"}>
                    {isActive ? "Active" : "Inactive"}
                  </Badge>
                  <Button variant="outline" size="sm">
                    Configure
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Custom Integration</CardTitle>
          <CardDescription>
            Add a new integration using API keys
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button>
            <Plug className="h-4 w-4 mr-2" />
            Add Custom Integration
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
