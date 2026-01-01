"use client";

import { useState, useEffect } from "react";
import { NoteTemplate } from "@/types/clinical";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { FileText } from "lucide-react";

interface TemplateSelectorProps {
  onSelect: (template: NoteTemplate) => void;
  noteType?:
    | "soap"
    | "progress"
    | "admission"
    | "discharge"
    | "procedure"
    | "consultation";
}

// Mock templates - in production, fetch from API
const mockTemplates: NoteTemplate[] = [
  {
    id: "1",
    name: "General SOAP Note",
    type: "soap",
    content: "",
    subjectiveTemplate:
      "Chief Complaint:\n\nHistory of Present Illness:\n\nReview of Systems:",
    objectiveTemplate:
      "Vital Signs:\n\nPhysical Examination:\n\nLaboratory/Imaging:",
    assessmentTemplate:
      "Primary Diagnosis:\n\nDifferential Diagnosis:\n\nClinical Impression:",
    planTemplate:
      "Treatment Plan:\n\nMedications:\n\nFollow-up:\n\nPatient Education:",
  },
  {
    id: "2",
    name: "Annual Physical SOAP",
    type: "soap",
    content: "",
    subjectiveTemplate:
      "Patient presents for annual physical examination.\n\nNo acute complaints.\n\nReview of Systems: All systems reviewed and negative except as noted.",
    objectiveTemplate:
      "Vital Signs: [To be recorded]\n\nGeneral: Well-appearing, no acute distress\nHEENT: Normocephalic, PERRLA\nCardiovascular: RRR, no murmurs\nRespiratory: CTAB\nAbdomen: Soft, non-tender\nExtremities: No edema",
    assessmentTemplate: "Healthy adult\nNo acute medical issues",
    planTemplate:
      "Continue current health maintenance\nAge-appropriate screening\nReturn in 1 year for next annual exam",
  },
  {
    id: "3",
    name: "Progress Note Template",
    type: "progress",
    content:
      "<h2>Progress Note</h2>\n<p><strong>Date:</strong> [Date]</p>\n<p><strong>Interval History:</strong></p>\n<p>[Document changes since last visit]</p>\n<p><strong>Current Status:</strong></p>\n<p>[Patient's current condition]</p>\n<p><strong>Plan:</strong></p>\n<p>[Updated treatment plan]</p>",
  },
  {
    id: "4",
    name: "Discharge Summary",
    type: "discharge",
    content:
      "<h2>Discharge Summary</h2>\n<p><strong>Admission Date:</strong> [Date]</p>\n<p><strong>Discharge Date:</strong> [Date]</p>\n<p><strong>Admission Diagnosis:</strong></p>\n<p>[Primary diagnosis]</p>\n<p><strong>Hospital Course:</strong></p>\n<p>[Summary of hospitalization]</p>\n<p><strong>Discharge Medications:</strong></p>\n<p>[Medication list]</p>\n<p><strong>Follow-up Instructions:</strong></p>\n<p>[Follow-up plan]</p>",
  },
];

export function TemplateSelector({
  onSelect,
  noteType,
}: TemplateSelectorProps) {
  const [templates, setTemplates] = useState<NoteTemplate[]>([]);
  const [selectedTemplateId, setSelectedTemplateId] = useState("");

  useEffect(() => {
    // Filter templates by note type if provided
    const filtered = noteType
      ? mockTemplates.filter((t) => t.type === noteType)
      : mockTemplates;
    setTemplates(filtered);
  }, [noteType]);

  const handleSelect = () => {
    const template = templates.find((t) => t.id === selectedTemplateId);
    if (template) {
      onSelect(template);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          Select Template
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="template">Template</Label>
            <Select
              id="template"
              value={selectedTemplateId}
              onChange={(e) => setSelectedTemplateId(e.target.value)}
            >
              <option value="">-- Select a template --</option>
              {templates.map((template) => (
                <option key={template.id} value={template.id}>
                  {template.name}
                </option>
              ))}
            </Select>
          </div>
          <Button
            onClick={handleSelect}
            disabled={!selectedTemplateId}
            className="w-full"
          >
            Use Template
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
