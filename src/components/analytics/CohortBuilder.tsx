"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, X, Save } from "lucide-react";
import type { CohortCriteria, CohortDefinition } from "@/types/analytics-enterprise";

export interface CohortBuilderProps {
  onSave?: (cohort: Partial<CohortDefinition>) => void;
  initialCohort?: Partial<CohortDefinition>;
}

export function CohortBuilder({ onSave, initialCohort }: CohortBuilderProps) {
  const [name, setName] = useState(initialCohort?.name || "");
  const [description, setDescription] = useState(initialCohort?.description || "");
  const [criteria, setCriteria] = useState<CohortCriteria[]>(
    initialCohort?.criteria || [
      {
        field: "age",
        operator: "gte",
        value: 18,
      },
    ]
  );
  const [dynamicUpdate, setDynamicUpdate] = useState(
    initialCohort?.dynamicUpdate || true
  );

  const addCriterion = () => {
    setCriteria([
      ...criteria,
      {
        field: "",
        operator: "eq",
        value: "",
        logicalOperator: criteria.length > 0 ? "AND" : undefined,
      },
    ]);
  };

  const removeCriterion = (index: number) => {
    setCriteria(criteria.filter((_, i) => i !== index));
  };

  const updateCriterion = (
    index: number,
    field: keyof CohortCriteria,
    value: any
  ) => {
    const updated = [...criteria];
    updated[index] = { ...updated[index], [field]: value };
    setCriteria(updated);
  };

  const handleSave = () => {
    if (onSave) {
      onSave({
        name,
        description,
        criteria,
        dynamicUpdate,
        tags: [],
      });
    }
  };

  const fieldOptions = [
    { value: "age", label: "Age" },
    { value: "gender", label: "Gender" },
    { value: "diagnosis", label: "Diagnosis" },
    { value: "medication", label: "Medication" },
    { value: "lastVisit", label: "Last Visit" },
    { value: "chronicConditions", label: "Chronic Conditions" },
    { value: "riskLevel", label: "Risk Level" },
  ];

  const operatorOptions = [
    { value: "eq", label: "Equals" },
    { value: "ne", label: "Not Equals" },
    { value: "gt", label: "Greater Than" },
    { value: "gte", label: "Greater Than or Equal" },
    { value: "lt", label: "Less Than" },
    { value: "lte", label: "Less Than or Equal" },
    { value: "in", label: "In List" },
    { value: "not_in", label: "Not In List" },
    { value: "contains", label: "Contains" },
    { value: "between", label: "Between" },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Build Patient Cohort</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-4">
          <div>
            <Label htmlFor="cohort-name">Cohort Name</Label>
            <Input
              id="cohort-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., High-Risk Diabetes Patients"
            />
          </div>

          <div>
            <Label htmlFor="cohort-description">Description</Label>
            <Input
              id="cohort-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe the purpose of this cohort"
            />
          </div>
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label>Inclusion Criteria</Label>
            <Button onClick={addCriterion} size="sm" variant="outline">
              <Plus className="mr-1 h-4 w-4" />
              Add Criterion
            </Button>
          </div>

          <div className="space-y-2">
            {criteria.map((criterion, index) => (
              <div
                key={index}
                className="flex items-center gap-2 rounded-lg border p-3"
              >
                {index > 0 && (
                  <Select
                    value={criterion.logicalOperator}
                    onValueChange={(value) =>
                      updateCriterion(index, "logicalOperator", value as "AND" | "OR")
                    }
                  >
                    <SelectTrigger className="w-20">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="AND">AND</SelectItem>
                      <SelectItem value="OR">OR</SelectItem>
                    </SelectContent>
                  </Select>
                )}

                <Select
                  value={criterion.field}
                  onValueChange={(value) => updateCriterion(index, "field", value)}
                >
                  <SelectTrigger className="flex-1">
                    <SelectValue placeholder="Select field" />
                  </SelectTrigger>
                  <SelectContent>
                    {fieldOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select
                  value={criterion.operator}
                  onValueChange={(value) => updateCriterion(index, "operator", value)}
                >
                  <SelectTrigger className="w-40">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {operatorOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Input
                  value={criterion.value}
                  onChange={(e) => updateCriterion(index, "value", e.target.value)}
                  placeholder="Value"
                  className="flex-1"
                />

                <Button
                  onClick={() => removeCriterion(index)}
                  size="sm"
                  variant="ghost"
                  className="text-red-600 hover:text-red-700"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="dynamic-update"
            checked={dynamicUpdate}
            onChange={(e) => setDynamicUpdate(e.target.checked)}
            className="h-4 w-4 rounded border-gray-300"
          />
          <Label htmlFor="dynamic-update" className="text-sm">
            Automatically update cohort membership as patient data changes
          </Label>
        </div>

        <div className="flex justify-end gap-2">
          <Button variant="outline">Cancel</Button>
          <Button onClick={handleSave} disabled={!name || criteria.length === 0}>
            <Save className="mr-2 h-4 w-4" />
            Save Cohort
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
