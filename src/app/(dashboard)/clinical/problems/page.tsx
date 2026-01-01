"use client";

import { useEffect, useState } from "react";
import { Problem } from "@/types/clinical";
import { getProblems } from "@/services/clinical.service";
import { ProblemList } from "@/components/clinical/ProblemList";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

export default function ProblemsPage() {
  const [problems, setProblems] = useState<Problem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadProblems();
  }, []);

  const loadProblems = async () => {
    try {
      // In production, pass actual patient ID
      const data = await getProblems("P001");
      setProblems(data);
    } catch (error) {
      console.error("Failed to load problems:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-7xl mx-auto">
          <p>Loading problems...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Problem List</h1>
            <p className="text-gray-600 mt-1">
              Active and chronic patient conditions
            </p>
          </div>
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Add Problem
          </Button>
        </div>

        <ProblemList problems={problems} />
      </div>
    </div>
  );
}
