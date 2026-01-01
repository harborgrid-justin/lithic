/**
 * SDOH Screening Management Page
 * SDOH & Care Coordination Specialist - Agent 7
 */

"use client";

import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ScreeningWizard } from "@/components/sdoh/screening-wizard";
import { ZCodeSelector } from "@/components/sdoh/z-code-selector";
import { Plus, FileText, Search } from "lucide-react";
import type { PrapareResponse } from "@/lib/sdoh/screening/prapare";

export default function SDOHScreeningPage() {
  const [showWizard, setShowWizard] = useState(false);
  const [screeningResults, setScreeningResults] = useState<any>(null);
  const [selectedZCodes, setSelectedZCodes] = useState<string[]>([]);

  const handleScreeningComplete = async (responses: PrapareResponse[]) => {
    try {
      const response = await fetch("/api/sdoh/screen", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "PRAPARE",
          patientId: "patient-123", // Get from context
          organizationId: "org-123",
          responses,
          completedBy: "provider-123",
        }),
      });

      const data = await response.json();
      if (data.success) {
        setScreeningResults(data.data);
        setShowWizard(false);
      }
    } catch (error) {
      console.error("Screening submission error:", error);
    }
  };

  if (showWizard) {
    return (
      <div className="p-8">
        <ScreeningWizard
          patientId="patient-123"
          organizationId="org-123"
          completedBy="provider-123"
          language="en"
          onComplete={handleScreeningComplete}
          onCancel={() => setShowWizard(false)}
        />
      </div>
    );
  }

  return (
    <div className="p-8 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">SDOH Screening</h1>
          <p className="text-gray-600 mt-2">
            Screen patients for social determinants of health
          </p>
        </div>
        <Button onClick={() => setShowWizard(true)}>
          <Plus className="h-4 w-4 mr-2" />
          New Screening
        </Button>
      </div>

      {screeningResults ? (
        <div className="space-y-6">
          {/* Screening Results */}
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4">Screening Results</h2>
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <p className="text-sm text-gray-600">Total Score</p>
                <p className="text-2xl font-bold">{screeningResults.result.totalScore}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Risk Level</p>
                <p className="text-2xl font-bold capitalize">
                  {screeningResults.result.riskLevel}
                </p>
              </div>
            </div>
            <div>
              <h3 className="font-semibold mb-2">Identified Needs</h3>
              <div className="flex flex-wrap gap-2">
                {screeningResults.result.identifiedNeeds.map((need: any, index: number) => (
                  <span
                    key={index}
                    className="px-3 py-1 bg-orange-100 text-orange-800 rounded-full text-sm"
                  >
                    {need.category}
                  </span>
                ))}
              </div>
            </div>
          </Card>

          {/* Z-Code Selection */}
          <ZCodeSelector
            identifiedNeeds={screeningResults.result.identifiedNeeds.map(
              (n: any) => n.category
            )}
            selectedCodes={selectedZCodes}
            onCodesChange={setSelectedZCodes}
            onGenerateDocumentation={(codes) => {
              console.log("Generate documentation for:", codes);
            }}
          />

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setScreeningResults(null)}>
              Start New Screening
            </Button>
            <Button>Save & Create Referrals</Button>
          </div>
        </div>
      ) : (
        <>
          {/* Screening Tools */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="p-6 hover:shadow-lg transition-shadow cursor-pointer">
              <FileText className="h-12 w-12 text-blue-500 mb-4" />
              <h3 className="text-lg font-semibold mb-2">PRAPARE</h3>
              <p className="text-sm text-gray-600 mb-4">
                Protocol for Responding to and Assessing Patients' Assets, Risks, and
                Experiences
              </p>
              <Button onClick={() => setShowWizard(true)} className="w-full">
                Start PRAPARE
              </Button>
            </Card>

            <Card className="p-6 hover:shadow-lg transition-shadow cursor-pointer">
              <FileText className="h-12 w-12 text-green-500 mb-4" />
              <h3 className="text-lg font-semibold mb-2">AHC HRSN</h3>
              <p className="text-sm text-gray-600 mb-4">
                Accountable Health Communities Health-Related Social Needs screening
              </p>
              <Button className="w-full">Start AHC HRSN</Button>
            </Card>

            <Card className="p-6 hover:shadow-lg transition-shadow cursor-pointer">
              <FileText className="h-12 w-12 text-purple-500 mb-4" />
              <h3 className="text-lg font-semibold mb-2">Custom Screener</h3>
              <p className="text-sm text-gray-600 mb-4">
                Create a custom screening tool tailored to your population
              </p>
              <Button className="w-full">Build Custom</Button>
            </Card>
          </div>

          {/* Recent Screenings */}
          <Card className="p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">Recent Screenings</h2>
              <Button variant="outline" size="sm">
                <Search className="h-4 w-4 mr-2" />
                View All
              </Button>
            </div>
            <div className="text-center py-8 text-gray-500">
              No recent screenings. Start a new screening to begin.
            </div>
          </Card>
        </>
      )}
    </div>
  );
}
