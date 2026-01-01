"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Activity,
  FileText,
  Pill,
  TestTube,
  Image as ImageIcon,
  Stethoscope,
  Save,
  Send,
} from "lucide-react";

interface VirtualExamRoomProps {
  sessionId: string;
  patientId: string;
}

export function VirtualExamRoom({
  sessionId,
  patientId,
}: VirtualExamRoomProps) {
  const [vitals, setVitals] = useState({
    temperature: "",
    heartRate: "",
    bloodPressure: "",
    respiratoryRate: "",
    oxygenSaturation: "",
    weight: "",
  });

  const [clinicalNote, setClinicalNote] = useState({
    subjective: "",
    objective: "",
    assessment: "",
    plan: "",
  });

  const handleSaveVitals = async () => {
    try {
      await fetch("/api/clinical/vitals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          patientId,
          encounterId: sessionId,
          ...vitals,
        }),
      });
    } catch (error) {
      console.error("Error saving vitals:", error);
    }
  };

  const handleSaveNote = async () => {
    try {
      await fetch("/api/clinical/notes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          patientId,
          encounterId: sessionId,
          type: "SOAP",
          ...clinicalNote,
        }),
      });
    } catch (error) {
      console.error("Error saving note:", error);
    }
  };

  return (
    <Card className="h-full bg-white">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg">Virtual Exam Room</CardTitle>
      </CardHeader>
      <CardContent className="px-3">
        <Tabs defaultValue="vitals" className="h-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="vitals" className="text-xs">
              <Activity className="h-3 w-3 mr-1" />
              Vitals
            </TabsTrigger>
            <TabsTrigger value="notes" className="text-xs">
              <FileText className="h-3 w-3 mr-1" />
              Notes
            </TabsTrigger>
            <TabsTrigger value="orders" className="text-xs">
              <Pill className="h-3 w-3 mr-1" />
              Orders
            </TabsTrigger>
          </TabsList>

          <TabsContent value="vitals" className="space-y-4 mt-4">
            <div className="space-y-3">
              <div>
                <Label htmlFor="temperature" className="text-xs">
                  Temperature (F)
                </Label>
                <Input
                  id="temperature"
                  type="number"
                  placeholder="98.6"
                  value={vitals.temperature}
                  onChange={(e) =>
                    setVitals({ ...vitals, temperature: e.target.value })
                  }
                  className="h-8 text-sm"
                />
              </div>

              <div>
                <Label htmlFor="heartRate" className="text-xs">
                  Heart Rate (bpm)
                </Label>
                <Input
                  id="heartRate"
                  type="number"
                  placeholder="72"
                  value={vitals.heartRate}
                  onChange={(e) =>
                    setVitals({ ...vitals, heartRate: e.target.value })
                  }
                  className="h-8 text-sm"
                />
              </div>

              <div>
                <Label htmlFor="bloodPressure" className="text-xs">
                  Blood Pressure (mmHg)
                </Label>
                <Input
                  id="bloodPressure"
                  placeholder="120/80"
                  value={vitals.bloodPressure}
                  onChange={(e) =>
                    setVitals({ ...vitals, bloodPressure: e.target.value })
                  }
                  className="h-8 text-sm"
                />
              </div>

              <div>
                <Label htmlFor="respiratoryRate" className="text-xs">
                  Respiratory Rate (breaths/min)
                </Label>
                <Input
                  id="respiratoryRate"
                  type="number"
                  placeholder="16"
                  value={vitals.respiratoryRate}
                  onChange={(e) =>
                    setVitals({ ...vitals, respiratoryRate: e.target.value })
                  }
                  className="h-8 text-sm"
                />
              </div>

              <div>
                <Label htmlFor="oxygenSaturation" className="text-xs">
                  O2 Saturation (%)
                </Label>
                <Input
                  id="oxygenSaturation"
                  type="number"
                  placeholder="98"
                  value={vitals.oxygenSaturation}
                  onChange={(e) =>
                    setVitals({ ...vitals, oxygenSaturation: e.target.value })
                  }
                  className="h-8 text-sm"
                />
              </div>

              <div>
                <Label htmlFor="weight" className="text-xs">
                  Weight (lbs)
                </Label>
                <Input
                  id="weight"
                  type="number"
                  placeholder="150"
                  value={vitals.weight}
                  onChange={(e) =>
                    setVitals({ ...vitals, weight: e.target.value })
                  }
                  className="h-8 text-sm"
                />
              </div>

              <Button
                onClick={handleSaveVitals}
                className="w-full h-8 text-sm"
                size="sm"
              >
                <Save className="h-3 w-3 mr-1" />
                Save Vitals
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="notes" className="space-y-4 mt-4">
            <div className="space-y-3">
              <div>
                <Label htmlFor="subjective" className="text-xs">
                  Subjective
                </Label>
                <Textarea
                  id="subjective"
                  placeholder="Patient reports..."
                  value={clinicalNote.subjective}
                  onChange={(e) =>
                    setClinicalNote({
                      ...clinicalNote,
                      subjective: e.target.value,
                    })
                  }
                  className="h-16 text-sm resize-none"
                />
              </div>

              <div>
                <Label htmlFor="objective" className="text-xs">
                  Objective
                </Label>
                <Textarea
                  id="objective"
                  placeholder="Physical examination findings..."
                  value={clinicalNote.objective}
                  onChange={(e) =>
                    setClinicalNote({
                      ...clinicalNote,
                      objective: e.target.value,
                    })
                  }
                  className="h-16 text-sm resize-none"
                />
              </div>

              <div>
                <Label htmlFor="assessment" className="text-xs">
                  Assessment
                </Label>
                <Textarea
                  id="assessment"
                  placeholder="Clinical assessment and diagnosis..."
                  value={clinicalNote.assessment}
                  onChange={(e) =>
                    setClinicalNote({
                      ...clinicalNote,
                      assessment: e.target.value,
                    })
                  }
                  className="h-16 text-sm resize-none"
                />
              </div>

              <div>
                <Label htmlFor="plan" className="text-xs">
                  Plan
                </Label>
                <Textarea
                  id="plan"
                  placeholder="Treatment plan and follow-up..."
                  value={clinicalNote.plan}
                  onChange={(e) =>
                    setClinicalNote({ ...clinicalNote, plan: e.target.value })
                  }
                  className="h-16 text-sm resize-none"
                />
              </div>

              <div className="flex gap-2">
                <Button
                  onClick={handleSaveNote}
                  variant="outline"
                  className="flex-1 h-8 text-sm"
                  size="sm"
                >
                  <Save className="h-3 w-3 mr-1" />
                  Save Draft
                </Button>
                <Button
                  onClick={handleSaveNote}
                  className="flex-1 h-8 text-sm"
                  size="sm"
                >
                  <Send className="h-3 w-3 mr-1" />
                  Sign & Complete
                </Button>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="orders" className="space-y-4 mt-4">
            <div className="space-y-3">
              <Button
                variant="outline"
                className="w-full justify-start h-10 text-sm"
                size="sm"
              >
                <Pill className="h-4 w-4 mr-2" />
                Prescribe Medication
              </Button>

              <Button
                variant="outline"
                className="w-full justify-start h-10 text-sm"
                size="sm"
              >
                <TestTube className="h-4 w-4 mr-2" />
                Order Lab Tests
              </Button>

              <Button
                variant="outline"
                className="w-full justify-start h-10 text-sm"
                size="sm"
              >
                <ImageIcon className="h-4 w-4 mr-2" />
                Order Imaging
              </Button>

              <Button
                variant="outline"
                className="w-full justify-start h-10 text-sm"
                size="sm"
              >
                <Stethoscope className="h-4 w-4 mr-2" />
                Create Referral
              </Button>

              <div className="pt-4 border-t">
                <h4 className="text-xs font-semibold mb-2">Active Orders</h4>
                <div className="space-y-2">
                  <div className="p-2 bg-gray-50 rounded text-xs">
                    <div className="flex items-center justify-between mb-1">
                      <Badge variant="outline" className="text-xs">
                        Lab
                      </Badge>
                      <span className="text-gray-500">Pending</span>
                    </div>
                    <p className="font-medium">CBC with Differential</p>
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
