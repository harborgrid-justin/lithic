"use client";

import { useEffect, useState } from "react";
import { Medication } from "@/types/clinical";
import { getMedications } from "@/services/clinical.service";
import { MedicationList } from "@/components/clinical/MedicationList";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

export default function MedicationsPage() {
  const [medications, setMedications] = useState<Medication[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadMedications();
  }, []);

  const loadMedications = async () => {
    try {
      // In production, pass actual patient ID
      const data = await getMedications("P001");
      setMedications(data);
    } catch (error) {
      console.error("Failed to load medications:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-7xl mx-auto">
          <p>Loading medications...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Medications</h1>
            <p className="text-gray-600 mt-1">
              Active and historical medication list
            </p>
          </div>
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Add Medication
          </Button>
        </div>

        <MedicationList medications={medications} />
      </div>
    </div>
  );
}
