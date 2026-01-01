"use client";

import { CDSSuggestion, SuggestionType } from "@/types/cds";
import { DiagnosisAlert } from "@/lib/cds/rules/diagnosis-alerts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Stethoscope,
  FlaskConical,
  FileText,
  Activity,
  Heart,
  BookOpen,
  Lightbulb,
} from "lucide-react";

interface DiagnosisAssistProps {
  suggestions: CDSSuggestion[];
  diagnosisAlerts?: DiagnosisAlert[];
  onApplySuggestion?: (suggestion: CDSSuggestion) => void;
}

export function DiagnosisAssist({
  suggestions,
  diagnosisAlerts = [],
  onApplySuggestion,
}: DiagnosisAssistProps) {
  const getSuggestionIcon = (type: SuggestionType) => {
    const iconClass = "h-5 w-5";
    switch (type) {
      case "ALTERNATIVE_MEDICATION":
        return <Activity className={iconClass} />;
      case "DOSE_ADJUSTMENT":
        return <Activity className={iconClass} />;
      case "LAB_MONITORING":
        return <FlaskConical className={iconClass} />;
      case "DIAGNOSTIC_TEST":
        return <FileText className={iconClass} />;
      case "CLINICAL_GUIDELINE":
        return <BookOpen className={iconClass} />;
      case "PREVENTIVE_CARE":
        return <Heart className={iconClass} />;
      case "PATIENT_EDUCATION":
        return <Lightbulb className={iconClass} />;
      default:
        return <Stethoscope className={iconClass} />;
    }
  };

  const getPriorityColor = (priority: number | string) => {
    const p =
      typeof priority === "number"
        ? priority
        : priority === "HIGH"
          ? 3
          : priority === "MODERATE"
            ? 2
            : 1;
    if (p >= 3) return "destructive";
    if (p >= 2) return "warning";
    return "secondary";
  };

  const getCategoryBadgeColor = (category: string) => {
    switch (category) {
      case "MONITORING":
      case "TESTING":
        return "default";
      case "MEDICATION":
        return "destructive";
      case "PREVENTIVE":
        return "secondary";
      default:
        return "outline";
    }
  };

  const hasContent = suggestions.length > 0 || diagnosisAlerts.length > 0;

  if (!hasContent) {
    return null;
  }

  return (
    <div className="space-y-4">
      {/* Clinical Suggestions */}
      {suggestions.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Lightbulb className="h-5 w-5 text-blue-500" />
              Clinical Suggestions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {suggestions.map((suggestion) => (
                <div
                  key={suggestion.id}
                  className="border rounded-lg p-4 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-start gap-3">
                    <div className="text-blue-600 mt-1">
                      {getSuggestionIcon(suggestion.type)}
                    </div>
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center justify-between">
                        <h4 className="font-semibold">{suggestion.title}</h4>
                        <div className="flex gap-2">
                          <Badge
                            variant={getPriorityColor(suggestion.priority)}
                          >
                            Priority: {suggestion.priority}
                          </Badge>
                          <Badge variant="outline">
                            {suggestion.type.replace(/_/g, " ")}
                          </Badge>
                        </div>
                      </div>

                      <p className="text-sm text-gray-700">
                        {suggestion.description}
                      </p>

                      {suggestion.evidence &&
                        suggestion.evidence.length > 0 && (
                          <div className="text-xs text-gray-500">
                            <strong>Evidence:</strong>{" "}
                            {suggestion.evidence.join(", ")}
                          </div>
                        )}

                      {suggestion.action && onApplySuggestion && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => onApplySuggestion(suggestion)}
                        >
                          Apply Suggestion
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Diagnosis-Based Guidelines */}
      {diagnosisAlerts.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BookOpen className="h-5 w-5 text-purple-500" />
              Clinical Guidelines
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {diagnosisAlerts.map((alert, idx) => (
                <div
                  key={idx}
                  className="border rounded-lg p-4 hover:bg-gray-50 transition-colors"
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <h4 className="font-semibold">{alert.title}</h4>
                      <div className="flex gap-2">
                        <Badge variant={getPriorityColor(alert.priority)}>
                          {alert.priority}
                        </Badge>
                        <Badge variant={getCategoryBadgeColor(alert.category)}>
                          {alert.category}
                        </Badge>
                      </div>
                    </div>

                    <div className="text-sm text-gray-600">
                      <strong>Diagnosis:</strong> {alert.diagnosis.description}{" "}
                      ({alert.diagnosis.icdCode})
                    </div>

                    <p className="text-sm">{alert.recommendation}</p>

                    <div className="text-xs text-gray-500">
                      <strong>Evidence:</strong> {alert.evidence}
                    </div>

                    {alert.dueDate && (
                      <div className="text-xs text-gray-500">
                        <strong>Due:</strong>{" "}
                        {new Date(alert.dueDate).toLocaleDateString()}
                        {alert.overdue && (
                          <Badge variant="destructive" className="ml-2">
                            Overdue
                          </Badge>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Preventive Care Reminders */}
      {diagnosisAlerts.some((a) => a.category === "PREVENTIVE") && (
        <Card className="border-green-200 bg-green-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-green-900">
              <Heart className="h-5 w-5" />
              Preventive Care Opportunities
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {diagnosisAlerts
                .filter((a) => a.category === "PREVENTIVE")
                .map((alert, idx) => (
                  <div key={idx} className="bg-white p-3 rounded">
                    <div className="font-semibold text-sm">{alert.title}</div>
                    <div className="text-sm text-gray-700">
                      {alert.recommendation}
                    </div>
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
