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
import { Input } from "@/components/ui/input";
import { PatientRegistry } from "@/components/population-health/PatientRegistry";
import { Plus, Search, Filter } from "lucide-react";

export default function RegistriesPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedRegistry, setSelectedRegistry] = useState<string | null>(null);

  const registries = [
    {
      id: "1",
      name: "Diabetes Type 2",
      condition: "DIABETES_TYPE_2",
      patientCount: 847,
      status: "ACTIVE",
    },
    {
      id: "2",
      name: "Hypertension",
      condition: "HYPERTENSION",
      patientCount: 1203,
      status: "ACTIVE",
    },
    {
      id: "3",
      name: "Heart Failure",
      condition: "CONGESTIVE_HEART_FAILURE",
      patientCount: 234,
      status: "ACTIVE",
    },
    {
      id: "4",
      name: "COPD",
      condition: "COPD",
      patientCount: 189,
      status: "ACTIVE",
    },
    {
      id: "5",
      name: "Chronic Kidney Disease",
      condition: "CHRONIC_KIDNEY_DISEASE",
      patientCount: 312,
      status: "ACTIVE",
    },
    {
      id: "6",
      name: "Preventive Care",
      condition: "PREVENTIVE_CARE",
      patientCount: 2847,
      status: "ACTIVE",
    },
  ];

  return (
    <div className="p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            Patient Registries
          </h1>
          <p className="text-gray-500 mt-1">
            Manage and monitor patient registries by condition
          </p>
        </div>
        <Button>
          <Plus className="w-4 h-4 mr-2" />
          Create Registry
        </Button>
      </div>

      <div className="flex gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            placeholder="Search registries..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <Button variant="outline">
          <Filter className="w-4 h-4 mr-2" />
          Filter
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {registries.map((registry) => (
          <Card
            key={registry.id}
            className="cursor-pointer hover:shadow-lg transition-shadow"
            onClick={() => setSelectedRegistry(registry.id)}
          >
            <CardHeader>
              <CardTitle>{registry.name}</CardTitle>
              <CardDescription>
                {registry.condition.replace(/_/g, " ")}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Patients:</span>
                  <span className="font-semibold">{registry.patientCount}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Status:</span>
                  <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs font-medium">
                    {registry.status}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {selectedRegistry && (
        <PatientRegistry
          registryId={selectedRegistry}
          onClose={() => setSelectedRegistry(null)}
        />
      )}
    </div>
  );
}
