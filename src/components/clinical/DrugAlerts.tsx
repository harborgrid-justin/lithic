"use client";

import { DrugDrugInteraction, DrugAllergyInteraction } from "@/types/cds";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Pill, AlertTriangle, ExternalLink } from "lucide-react";

interface DrugAlertsProps {
  drugInteractions: DrugDrugInteraction[];
  allergyConflicts: DrugAllergyInteraction[];
  onSelectAlternative?: (alternative: string) => void;
}

export function DrugAlerts({
  drugInteractions,
  allergyConflicts,
  onSelectAlternative,
}: DrugAlertsProps) {
  const getSeverityColor = (severity: string) => {
    switch (severity.toUpperCase()) {
      case "CONTRAINDICATED":
        return "destructive";
      case "MAJOR":
        return "destructive";
      case "MODERATE":
        return "warning";
      case "MINOR":
        return "secondary";
      case "LIFE_THREATENING":
      case "SEVERE":
        return "destructive";
      default:
        return "secondary";
    }
  };

  const hasAlerts = drugInteractions.length > 0 || allergyConflicts.length > 0;

  if (!hasAlerts) {
    return null;
  }

  return (
    <Card className="border-orange-200 bg-orange-50">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-orange-900">
          <AlertTriangle className="h-5 w-5" />
          Drug Safety Alerts
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Allergy Conflicts */}
        {allergyConflicts.map((conflict, idx) => (
          <Alert key={`allergy-${idx}`} variant="destructive">
            <Pill className="h-4 w-4" />
            <AlertTitle>Drug-Allergy Conflict</AlertTitle>
            <AlertDescription>
              <div className="space-y-2">
                <p className="font-semibold">
                  {conflict.drugName} conflicts with allergy to{" "}
                  {conflict.allergen}
                </p>
                <div className="flex items-center gap-2">
                  <Badge variant={getSeverityColor(conflict.severity)}>
                    {conflict.severity}
                  </Badge>
                  {conflict.crossReactivity && (
                    <Badge variant="outline">Cross-Reactivity</Badge>
                  )}
                </div>
                <p className="text-sm">{conflict.description}</p>
                <div className="bg-white p-3 rounded">
                  <p className="font-semibold text-sm mb-1">Management:</p>
                  <p className="text-sm">{conflict.management}</p>
                </div>
              </div>
            </AlertDescription>
          </Alert>
        ))}

        {/* Drug Interactions */}
        {drugInteractions.map((interaction, idx) => (
          <Alert
            key={`interaction-${idx}`}
            variant={
              interaction.severity === "CONTRAINDICATED" ||
              interaction.severity === "MAJOR"
                ? "destructive"
                : "default"
            }
          >
            <Pill className="h-4 w-4" />
            <AlertTitle>Drug-Drug Interaction</AlertTitle>
            <AlertDescription>
              <div className="space-y-2">
                <p className="font-semibold">
                  {interaction.drug1.name} + {interaction.drug2.name}
                </p>
                <div className="flex items-center gap-2">
                  <Badge variant={getSeverityColor(interaction.severity)}>
                    {interaction.severity}
                  </Badge>
                  <Badge variant="outline">
                    Evidence: {interaction.evidenceLevel}
                  </Badge>
                  <Badge variant="outline">{interaction.documentation}</Badge>
                </div>

                <p className="text-sm font-medium">{interaction.description}</p>

                {interaction.clinicalEffects && (
                  <div>
                    <p className="font-semibold text-sm">Clinical Effects:</p>
                    <p className="text-sm">{interaction.clinicalEffects}</p>
                  </div>
                )}

                {interaction.mechanism && (
                  <div className="text-sm text-gray-600">
                    <strong>Mechanism:</strong> {interaction.mechanism}
                  </div>
                )}

                {interaction.management && (
                  <div className="bg-white p-3 rounded">
                    <p className="font-semibold text-sm mb-1">Management:</p>
                    <p className="text-sm">{interaction.management}</p>
                  </div>
                )}

                {interaction.alternatives &&
                  interaction.alternatives.length > 0 && (
                    <div className="bg-white p-3 rounded">
                      <p className="font-semibold text-sm mb-1">
                        Suggested Alternatives:
                      </p>
                      <div className="flex flex-wrap gap-2 mt-2">
                        {interaction.alternatives.map((alt, altIdx) => (
                          <Button
                            key={altIdx}
                            size="sm"
                            variant="outline"
                            onClick={() => onSelectAlternative?.(alt)}
                          >
                            {alt}
                          </Button>
                        ))}
                      </div>
                    </div>
                  )}

                {interaction.monitoringParameters &&
                  interaction.monitoringParameters.length > 0 && (
                    <div>
                      <p className="font-semibold text-sm">
                        Monitoring Parameters:
                      </p>
                      <ul className="list-disc list-inside text-sm">
                        {interaction.monitoringParameters.map(
                          (param, paramIdx) => (
                            <li key={paramIdx}>{param}</li>
                          ),
                        )}
                      </ul>
                    </div>
                  )}

                {interaction.onsetTime && (
                  <p className="text-sm text-gray-600">
                    <strong>Onset:</strong> {interaction.onsetTime}
                  </p>
                )}

                {interaction.references &&
                  interaction.references.length > 0 && (
                    <div className="flex items-center gap-2 text-xs text-gray-500">
                      <ExternalLink className="h-3 w-3" />
                      <span>
                        References: {interaction.references.join(", ")}
                      </span>
                    </div>
                  )}
              </div>
            </AlertDescription>
          </Alert>
        ))}
      </CardContent>
    </Card>
  );
}
