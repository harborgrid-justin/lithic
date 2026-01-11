/**
 * SDOH Screening Page
 */

"use client";

import React, { useState } from "react";
import { ScreeningWizard } from "@/components/sdoh/ScreeningWizard";
import { getPRAPAREQuestionnaire } from "@/lib/sdoh/questionnaires/prapare";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function ScreeningPage() {
  const [isScreening, setIsScreening] = useState(false);
  const [questionnaireType, setQuestionnaireType] = useState<"PRAPARE" | "AHC_HRSN" | null>(null);

  const handleStartScreening = (type: "PRAPARE" | "AHC_HRSN") => {
    setQuestionnaireType(type);
    setIsScreening(true);
  };

  if (isScreening && questionnaireType) {
    return (
      <ScreeningWizard
        questionnaire={getPRAPAREQuestionnaire()}
        patientId="patient-1"
        onComplete={(responses) => {
          console.log("Screening complete", responses);
          setIsScreening(false);
        }}
        onCancel={() => setIsScreening(false)}
      />
    );
  }

  return (
    <div className="container mx-auto py-8 max-w-4xl">
      <h1 className="text-3xl font-bold mb-8">Start SDOH Screening</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="p-6">
          <h3 className="text-xl font-semibold mb-2">PRAPARE</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Protocol for Responding to and Assessing Patients' Assets, Risks, and Experiences
          </p>
          <p className="text-sm mb-4">
            Comprehensive 15-question screening covering housing, food, transportation, and social support
          </p>
          <Button onClick={() => handleStartScreening("PRAPARE")}>
            Start PRAPARE Screening
          </Button>
        </Card>

        <Card className="p-6">
          <h3 className="text-xl font-semibold mb-2">AHC-HRSN</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Accountable Health Communities Health-Related Social Needs
          </p>
          <p className="text-sm mb-4">
            CMS standardized 10-question screening for core social needs
          </p>
          <Button onClick={() => handleStartScreening("AHC_HRSN")}>
            Start AHC-HRSN Screening
          </Button>
        </Card>
      </div>
    </div>
  );
}
