/**
 * SDOH Screening Wizard Component
 * Step-by-step screening with progress indicator
 * SDOH & Care Coordination Specialist - Agent 7
 */

"use client";

import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { ChevronLeft, ChevronRight, Check } from "lucide-react";
import type {
  PrapareQuestion,
  PrapareResponse,
} from "@/lib/sdoh/screening/prapare";
import { PRAPARE_QUESTIONS } from "@/lib/sdoh/screening/prapare";

interface ScreeningWizardProps {
  patientId: string;
  organizationId: string;
  completedBy: string;
  language?: "en" | "es";
  onComplete: (responses: PrapareResponse[]) => void;
  onCancel: () => void;
}

export function ScreeningWizard({
  patientId,
  organizationId,
  completedBy,
  language = "en",
  onComplete,
  onCancel,
}: ScreeningWizardProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [responses, setResponses] = useState<Map<string, any>>(new Map());

  const questions = PRAPARE_QUESTIONS;
  const currentQuestion = questions[currentStep];
  const progress = ((currentStep + 1) / questions.length) * 100;

  const handleResponse = (questionId: string, value: any) => {
    const newResponses = new Map(responses);
    newResponses.set(questionId, value);
    setResponses(newResponses);
  };

  const handleNext = () => {
    if (currentStep < questions.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      // Complete screening
      const finalResponses: PrapareResponse[] = Array.from(responses.entries()).map(
        ([questionId, value]) => ({
          questionId,
          value,
        })
      );
      onComplete(finalResponses);
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const isAnswered = responses.has(currentQuestion.id);
  const canProceed = !currentQuestion.required || isAnswered;

  return (
    <div className="max-w-2xl mx-auto p-6 space-y-6">
      {/* Progress Header */}
      <div className="space-y-2">
        <div className="flex justify-between text-sm text-gray-600">
          <span>
            Question {currentStep + 1} of {questions.length}
          </span>
          <span>{Math.round(progress)}% Complete</span>
        </div>
        <Progress value={progress} className="h-2" />
      </div>

      {/* Question Card */}
      <Card className="p-6">
        <div className="space-y-6">
          <div>
            <h2 className="text-xl font-semibold mb-2">
              {language === "es"
                ? currentQuestion.questionTextEs
                : currentQuestion.questionText}
            </h2>
            {currentQuestion.required && (
              <p className="text-sm text-red-600">* Required</p>
            )}
          </div>

          {/* Render question based on type */}
          {currentQuestion.type === "SINGLE_CHOICE" && (
            <RadioGroup
              value={responses.get(currentQuestion.id) || ""}
              onValueChange={(value) => handleResponse(currentQuestion.id, value)}
            >
              <div className="space-y-3">
                {currentQuestion.options?.map((option) => (
                  <div key={option.value} className="flex items-center space-x-2">
                    <RadioGroupItem value={option.value} id={option.value} />
                    <Label htmlFor={option.value} className="cursor-pointer">
                      {language === "es" ? option.labelEs : option.label}
                    </Label>
                  </div>
                ))}
              </div>
            </RadioGroup>
          )}

          {currentQuestion.type === "MULTIPLE_CHOICE" && (
            <div className="space-y-3">
              {currentQuestion.options?.map((option) => (
                <div key={option.value} className="flex items-center space-x-2">
                  <Checkbox
                    id={option.value}
                    checked={
                      (responses.get(currentQuestion.id) || []).includes(
                        option.value
                      )
                    }
                    onCheckedChange={(checked) => {
                      const current = responses.get(currentQuestion.id) || [];
                      const updated = checked
                        ? [...current, option.value]
                        : current.filter((v: string) => v !== option.value);
                      handleResponse(currentQuestion.id, updated);
                    }}
                  />
                  <Label htmlFor={option.value} className="cursor-pointer">
                    {language === "es" ? option.labelEs : option.label}
                  </Label>
                </div>
              ))}
            </div>
          )}

          {currentQuestion.type === "NUMBER" && (
            <input
              type="number"
              className="w-full p-3 border rounded-md"
              value={responses.get(currentQuestion.id) || ""}
              onChange={(e) =>
                handleResponse(currentQuestion.id, parseInt(e.target.value))
              }
              placeholder="Enter number"
            />
          )}

          {currentQuestion.type === "TEXT" && (
            <input
              type="text"
              className="w-full p-3 border rounded-md"
              value={responses.get(currentQuestion.id) || ""}
              onChange={(e) => handleResponse(currentQuestion.id, e.target.value)}
              placeholder="Enter your answer"
            />
          )}
        </div>
      </Card>

      {/* Navigation Buttons */}
      <div className="flex justify-between">
        <Button
          variant="outline"
          onClick={handleBack}
          disabled={currentStep === 0}
        >
          <ChevronLeft className="h-4 w-4 mr-2" />
          Back
        </Button>

        <div className="space-x-2">
          <Button variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button onClick={handleNext} disabled={!canProceed}>
            {currentStep === questions.length - 1 ? (
              <>
                <Check className="h-4 w-4 mr-2" />
                Complete
              </>
            ) : (
              <>
                Next
                <ChevronRight className="h-4 w-4 ml-2" />
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
