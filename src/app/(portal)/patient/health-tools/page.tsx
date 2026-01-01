/**
 * Patient Health Tools Page
 * Agent 1: Patient Portal & Experience Expert
 * AI symptom checker, medication interactions, risk assessments, educational content
 */

"use client";

import React, { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import {
  HeartPulse,
  Pill,
  Activity,
  BookOpen,
  AlertCircle,
  CheckCircle,
  Search,
  Brain,
  TrendingUp,
  Shield,
  Sparkles,
} from "lucide-react";
import { cn } from "@/lib/utils";

const HEALTH_TOOLS = [
  {
    id: "symptom-checker",
    title: "AI Symptom Checker",
    description: "Get AI-powered insights about your symptoms",
    icon: Brain,
    color: "from-purple-500 to-pink-500",
  },
  {
    id: "medication-checker",
    title: "Medication Interaction Checker",
    description: "Check for potential drug interactions",
    icon: Pill,
    color: "from-blue-500 to-cyan-500",
  },
  {
    id: "risk-assessment",
    title: "Health Risk Assessment",
    description: "Assess your risk for various health conditions",
    icon: Activity,
    color: "from-green-500 to-emerald-500",
  },
  {
    id: "education",
    title: "Health Education Library",
    description: "Learn about conditions, treatments, and wellness",
    icon: BookOpen,
    color: "from-orange-500 to-red-500",
  },
];

const SYMPTOM_SEVERITY = [
  { value: "MILD", label: "Mild", description: "Slightly uncomfortable but manageable" },
  { value: "MODERATE", label: "Moderate", description: "Noticeably uncomfortable" },
  { value: "SEVERE", label: "Severe", description: "Very uncomfortable, affecting daily life" },
  { value: "EMERGENCY", label: "Emergency", description: "Life-threatening symptoms" },
];

const COMMON_SYMPTOMS = [
  "Fever", "Cough", "Headache", "Fatigue", "Nausea", "Dizziness",
  "Chest Pain", "Shortness of Breath", "Abdominal Pain", "Sore Throat",
];

export default function HealthToolsPage() {
  const [selectedTool, setSelectedTool] = useState<string | null>(null);
  const [symptomDescription, setSymptomDescription] = useState("");
  const [selectedSymptoms, setSelectedSymptoms] = useState<string[]>([]);
  const [symptomSeverity, setSymptomSeverity] = useState("MODERATE");
  const [medications, setMedications] = useState<string[]>([""]);
  const [showResults, setShowResults] = useState(false);

  const handleAddMedication = () => {
    setMedications([...medications, ""]);
  };

  const handleMedicationChange = (index: number, value: string) => {
    const newMeds = [...medications];
    newMeds[index] = value;
    setMedications(newMeds);
  };

  const handleSymptomToggle = (symptom: string) => {
    if (selectedSymptoms.includes(symptom)) {
      setSelectedSymptoms(selectedSymptoms.filter((s) => s !== symptom));
    } else {
      setSelectedSymptoms([...selectedSymptoms, symptom]);
    }
  };

  const handleSymptomCheck = () => {
    setShowResults(true);
  };

  return (
    <div className="container mx-auto space-y-6 p-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Health Tools</h1>
        <p className="text-muted-foreground">
          AI-powered tools to help you manage your health
        </p>
      </div>

      {!selectedTool ? (
        /* Tool Selection Grid */
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {HEALTH_TOOLS.map((tool) => (
            <Card
              key={tool.id}
              className="cursor-pointer transition-all hover:shadow-lg hover:scale-105"
              onClick={() => setSelectedTool(tool.id)}
            >
              <CardContent className="pt-6">
                <div className={cn(
                  "rounded-full w-12 h-12 flex items-center justify-center mb-4 bg-gradient-to-br",
                  tool.color
                )}>
                  <tool.icon className="h-6 w-6 text-white" />
                </div>
                <h3 className="font-bold text-lg mb-2">{tool.title}</h3>
                <p className="text-sm text-muted-foreground">{tool.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        /* Tool Content */
        <div className="space-y-6">
          <Button
            variant="outline"
            onClick={() => {
              setSelectedTool(null);
              setShowResults(false);
            }}
          >
            Back to Tools
          </Button>

          {selectedTool === "symptom-checker" && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Brain className="h-5 w-5" />
                  AI Symptom Checker
                </CardTitle>
                <CardDescription>
                  Describe your symptoms to get AI-powered insights. This is not a substitute for professional medical advice.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {!showResults ? (
                  <>
                    <Alert>
                      <AlertCircle className="h-4 w-4" />
                      <AlertTitle>Important Disclaimer</AlertTitle>
                      <AlertDescription>
                        This tool provides general information only. If you have severe symptoms or a medical emergency, call 911 immediately.
                      </AlertDescription>
                    </Alert>

                    <div className="space-y-2">
                      <Label>Describe Your Symptoms</Label>
                      <Textarea
                        placeholder="Tell us what you're experiencing..."
                        rows={4}
                        value={symptomDescription}
                        onChange={(e) => setSymptomDescription(e.target.value)}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Common Symptoms (select all that apply)</Label>
                      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                        {COMMON_SYMPTOMS.map((symptom) => (
                          <div key={symptom} className="flex items-center space-x-2">
                            <Checkbox
                              id={symptom}
                              checked={selectedSymptoms.includes(symptom)}
                              onCheckedChange={() => handleSymptomToggle(symptom)}
                            />
                            <Label htmlFor={symptom} className="cursor-pointer">
                              {symptom}
                            </Label>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label>Severity Level</Label>
                      <RadioGroup value={symptomSeverity} onValueChange={setSymptomSeverity}>
                        {SYMPTOM_SEVERITY.map((severity) => (
                          <div key={severity.value} className="flex items-center space-x-2">
                            <RadioGroupItem value={severity.value} id={severity.value} />
                            <Label htmlFor={severity.value} className="cursor-pointer">
                              <span className="font-medium">{severity.label}</span>
                              <span className="text-sm text-muted-foreground ml-2">
                                {severity.description}
                              </span>
                            </Label>
                          </div>
                        ))}
                      </RadioGroup>
                    </div>

                    <Button
                      onClick={handleSymptomCheck}
                      disabled={!symptomDescription && selectedSymptoms.length === 0}
                      className="w-full"
                    >
                      <Sparkles className="mr-2 h-4 w-4" />
                      Analyze Symptoms with AI
                    </Button>
                  </>
                ) : (
                  <>
                    <Alert className={cn(
                      symptomSeverity === "EMERGENCY"
                        ? "border-red-200 bg-red-50"
                        : "border-blue-200 bg-blue-50"
                    )}>
                      <AlertCircle className="h-4 w-4" />
                      <AlertTitle>
                        {symptomSeverity === "EMERGENCY"
                          ? "Seek Immediate Medical Attention"
                          : "AI Assessment Complete"}
                      </AlertTitle>
                      <AlertDescription>
                        {symptomSeverity === "EMERGENCY"
                          ? "Based on your symptoms, you should seek emergency care immediately."
                          : "Here's what our AI found based on your symptoms."}
                      </AlertDescription>
                    </Alert>

                    <div className="space-y-4">
                      <div>
                        <h4 className="font-medium mb-2">Your Symptoms</h4>
                        <div className="flex flex-wrap gap-2">
                          {selectedSymptoms.map((symptom) => (
                            <Badge key={symptom} variant="outline">{symptom}</Badge>
                          ))}
                        </div>
                      </div>

                      <div>
                        <h4 className="font-medium mb-2">Possible Conditions</h4>
                        <div className="space-y-2">
                          <Card>
                            <CardContent className="pt-4">
                              <div className="flex items-start justify-between">
                                <div>
                                  <p className="font-medium">Common Cold</p>
                                  <p className="text-sm text-muted-foreground mt-1">
                                    Most likely based on symptom pattern
                                  </p>
                                </div>
                                <Badge>75% Match</Badge>
                              </div>
                            </CardContent>
                          </Card>
                          <Card>
                            <CardContent className="pt-4">
                              <div className="flex items-start justify-between">
                                <div>
                                  <p className="font-medium">Flu (Influenza)</p>
                                  <p className="text-sm text-muted-foreground mt-1">
                                    Possible based on symptoms
                                  </p>
                                </div>
                                <Badge variant="outline">45% Match</Badge>
                              </div>
                            </CardContent>
                          </Card>
                        </div>
                      </div>

                      <div>
                        <h4 className="font-medium mb-2">Recommended Actions</h4>
                        <div className="space-y-2">
                          <div className="flex items-start gap-2">
                            <CheckCircle className="h-5 w-5 text-green-600 shrink-0 mt-0.5" />
                            <div>
                              <p className="font-medium">Rest and Hydration</p>
                              <p className="text-sm text-muted-foreground">
                                Get plenty of rest and drink fluids
                              </p>
                            </div>
                          </div>
                          <div className="flex items-start gap-2">
                            <CheckCircle className="h-5 w-5 text-green-600 shrink-0 mt-0.5" />
                            <div>
                              <p className="font-medium">Monitor Symptoms</p>
                              <p className="text-sm text-muted-foreground">
                                Track your symptoms over the next 24-48 hours
                              </p>
                            </div>
                          </div>
                          <div className="flex items-start gap-2">
                            <CheckCircle className="h-5 w-5 text-green-600 shrink-0 mt-0.5" />
                            <div>
                              <p className="font-medium">Schedule Appointment</p>
                              <p className="text-sm text-muted-foreground">
                                Consider scheduling a visit if symptoms worsen
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="flex gap-2">
                        <Button className="flex-1">Schedule Appointment</Button>
                        <Button variant="outline" className="flex-1">
                          Message Provider
                        </Button>
                      </div>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          )}

          {selectedTool === "medication-checker" && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Pill className="h-5 w-5" />
                  Medication Interaction Checker
                </CardTitle>
                <CardDescription>
                  Check for potential interactions between medications
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>Important</AlertTitle>
                  <AlertDescription>
                    Always consult your healthcare provider before making changes to your medications.
                  </AlertDescription>
                </Alert>

                <div className="space-y-4">
                  <Label>Enter Your Medications</Label>
                  {medications.map((med, index) => (
                    <Input
                      key={index}
                      placeholder="e.g., Metformin 500mg"
                      value={med}
                      onChange={(e) => handleMedicationChange(index, e.target.value)}
                    />
                  ))}
                  <Button variant="outline" onClick={handleAddMedication}>
                    Add Another Medication
                  </Button>
                </div>

                <Button className="w-full">
                  <Search className="mr-2 h-4 w-4" />
                  Check for Interactions
                </Button>
              </CardContent>
            </Card>
          )}

          {selectedTool === "risk-assessment" && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="h-5 w-5" />
                  Health Risk Assessment
                </CardTitle>
                <CardDescription>
                  Assess your risk for various health conditions
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 sm:grid-cols-2">
                  <Card className="cursor-pointer border-2 hover:border-primary transition-colors">
                    <CardHeader>
                      <CardTitle className="text-lg flex items-center gap-2">
                        <HeartPulse className="h-5 w-5" />
                        Cardiovascular Risk
                      </CardTitle>
                      <CardDescription>
                        Assess your heart disease risk
                      </CardDescription>
                    </CardHeader>
                  </Card>
                  <Card className="cursor-pointer border-2 hover:border-primary transition-colors">
                    <CardHeader>
                      <CardTitle className="text-lg flex items-center gap-2">
                        <Activity className="h-5 w-5" />
                        Diabetes Risk
                      </CardTitle>
                      <CardDescription>
                        Evaluate your diabetes risk factors
                      </CardDescription>
                    </CardHeader>
                  </Card>
                  <Card className="cursor-pointer border-2 hover:border-primary transition-colors">
                    <CardHeader>
                      <CardTitle className="text-lg flex items-center gap-2">
                        <Shield className="h-5 w-5" />
                        Cancer Screening
                      </CardTitle>
                      <CardDescription>
                        Recommended cancer screenings
                      </CardDescription>
                    </CardHeader>
                  </Card>
                  <Card className="cursor-pointer border-2 hover:border-primary transition-colors">
                    <CardHeader>
                      <CardTitle className="text-lg flex items-center gap-2">
                        <Brain className="h-5 w-5" />
                        Mental Health
                      </CardTitle>
                      <CardDescription>
                        Mental health screening tool
                      </CardDescription>
                    </CardHeader>
                  </Card>
                </div>
              </CardContent>
            </Card>
          )}

          {selectedTool === "education" && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BookOpen className="h-5 w-5" />
                  Health Education Library
                </CardTitle>
                <CardDescription>
                  Explore trusted health information and resources
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input placeholder="Search health topics..." className="pl-9" />
                  </div>

                  <Tabs defaultValue="conditions">
                    <TabsList>
                      <TabsTrigger value="conditions">Conditions</TabsTrigger>
                      <TabsTrigger value="treatments">Treatments</TabsTrigger>
                      <TabsTrigger value="wellness">Wellness</TabsTrigger>
                      <TabsTrigger value="videos">Videos</TabsTrigger>
                    </TabsList>

                    <TabsContent value="conditions" className="space-y-2">
                      {["Diabetes", "Hypertension", "Asthma", "Arthritis"].map((topic) => (
                        <Card key={topic} className="cursor-pointer hover:bg-accent transition-colors">
                          <CardHeader className="py-3">
                            <CardTitle className="text-base">{topic}</CardTitle>
                          </CardHeader>
                        </Card>
                      ))}
                    </TabsContent>
                  </Tabs>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}
