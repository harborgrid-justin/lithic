"use client";

import { useEffect, useState } from "react";
import { Allergy } from "@/types/clinical";
import { getAllergies } from "@/services/clinical.service";
import { AllergyList } from "@/components/clinical/AllergyList";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

export default function AllergiesPage() {
  const [allergies, setAllergies] = useState<Allergy[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAllergies();
  }, []);

  const loadAllergies = async () => {
    try {
      // In production, pass actual patient ID
      const data = await getAllergies("P001");
      setAllergies(data);
    } catch (error) {
      console.error("Failed to load allergies:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-7xl mx-auto">
          <p>Loading allergies...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Allergies</h1>
            <p className="text-gray-600 mt-1">
              Patient allergies and adverse reactions
            </p>
          </div>
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Add Allergy
          </Button>
        </div>

        <AllergyList allergies={allergies} />
      </div>
    </div>
  );
}
