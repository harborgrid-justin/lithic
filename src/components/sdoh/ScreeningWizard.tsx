"use client";

/**
 * SDOH Screening Wizard Component
 *
 * Step-by-step wizard for administering SDOH screening questionnaires
 */

import React, { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import type {
  Questionnaire,
  Question,
  ScreeningResponse,
  QuestionType,
} from "@/types/sdoh";

interface ScreeningWizardProps {
  questionnaire: Questionnaire;
  patientId: string;
  onComplete: (responses: ScreeningResponse[]) => void;
  onCancel: () => void;
}

export function ScreeningWizard({
  questionnaire,
  patientId,
  onComplete,
  onCancel,
}: ScreeningWizardProps) {
  const [currentSection, setCurrentSection] = useState(0);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [responses, setResponses] = useState<Map<string, ScreeningResponse>>(
    new Map()
  );

  const section = questionnaire.sections[currentSection];
  const question = section?.questions[currentQuestion];
  const progress = Math.round(
    ((currentSection * 100 + currentQuestion) /
      questionnaire.sections.reduce((sum, s) => sum + s.questions.length, 0)) *
      100
  );

  const handleAnswer = (answer: any, answerText: string) => {
    if (!question) return;

    const response: ScreeningResponse = {
      questionId: question.id,
      questionText: question.text,
      answer,
      answerText,
      domain: question.domain,
      riskIndicator: false, // Calculated on backend
      weight: question.riskWeighting,
    };

    const newResponses = new Map(responses);
    newResponses.set(question.id, response);
    setResponses(newResponses);

    handleNext();
  };

  const handleNext = () => {
    if (currentQuestion < section.questions.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
    } else if (currentSection < questionnaire.sections.length - 1) {
      setCurrentSection(currentSection + 1);
      setCurrentQuestion(0);
    } else {
      // Screening complete
      onComplete(Array.from(responses.values()));
    }
  };

  const handleBack = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion(currentQuestion - 1);
    } else if (currentSection > 0) {
      const prevSection = questionnaire.sections[currentSection - 1];
      setCurrentSection(currentSection - 1);
      setCurrentQuestion(prevSection!.questions.length - 1);
    }
  };

  const renderQuestion = () => {
    if (!question) return null;

    switch (question.type) {
      case "SINGLE_CHOICE":
        return (
          <div className="space-y-3">
            {question.options?.map((option) => (
              <Button
                key={option.id}
                variant="outline"
                className="w-full justify-start text-left h-auto py-4"
                onClick={() => handleAnswer(option.value, option.text)}
              >
                {option.text}
              </Button>
            ))}
          </div>
        );

      case "YES_NO":
        return (
          <div className="flex gap-4">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => handleAnswer(true, "Yes")}
            >
              Yes
            </Button>
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => handleAnswer(false, "No")}
            >
              No
            </Button>
          </div>
        );

      case "MULTIPLE_CHOICE":
        return (
          <div className="space-y-3">
            {question.options?.map((option) => (
              <label key={option.id} className="flex items-center gap-3 p-3 border rounded-lg cursor-pointer hover:bg-accent">
                <input type="checkbox" className="h-4 w-4" />
                <span>{option.text}</span>
              </label>
            ))}
            <Button onClick={() => handleAnswer([], "Multiple selections")}>
              Continue
            </Button>
          </div>
        );

      default:
        return (
          <div>
            <input
              type="text"
              className="w-full p-3 border rounded-lg"
              placeholder="Enter your answer"
              onKeyPress={(e) => {
                if (e.key === "Enter") {
                  handleAnswer(
                    (e.target as HTMLInputElement).value,
                    (e.target as HTMLInputElement).value
                  );
                }
              }}
            />
          </div>
        );
    }
  };

  if (!section || !question) {
    return <div>Loading...</div>;
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <Card className="p-6">
        <div className="space-y-6">
          {/* Header */}
          <div>
            <h2 className="text-2xl font-bold">{questionnaire.name}</h2>
            <p className="text-muted-foreground">
              {section.title} - Question {currentQuestion + 1} of{" "}
              {section.questions.length}
            </p>
          </div>

          {/* Progress */}
          <Progress value={progress} />

          {/* Question */}
          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-semibold">{question.text}</h3>
              {question.description && (
                <p className="text-sm text-muted-foreground mt-1">
                  {question.description}
                </p>
              )}
            </div>

            {renderQuestion()}
          </div>

          {/* Navigation */}
          <div className="flex justify-between pt-4">
            <Button
              variant="outline"
              onClick={handleBack}
              disabled={currentSection === 0 && currentQuestion === 0}
            >
              Back
            </Button>
            <Button variant="ghost" onClick={onCancel}>
              Cancel
            </Button>
          </div>
        </div>
      </Card>

      {/* Info Card */}
      <Card className="p-4 bg-muted">
        <p className="text-sm text-muted-foreground">
          Estimated time remaining:{" "}
          {Math.round(
            (questionnaire.estimatedMinutes * (100 - progress)) / 100
          )}{" "}
          minutes
        </p>
      </Card>
    </div>
  );
}
