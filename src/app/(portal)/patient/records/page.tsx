/**
 * Patient Medical Records Page
 * Agent 1: Patient Portal & Experience Expert
 * USCDI compliant records viewer with lab results, imaging, clinical notes
 */

"use client";

import React, { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  FileText,
  Download,
  Share2,
  Search,
  TrendingUp,
  TrendingDown,
  Activity,
  Image as ImageIcon,
  Pill,
  AlertTriangle,
  CheckCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { formatDate } from "@/lib/utils";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

const mockLabResults = [
  {
    id: "1",
    testName: "Hemoglobin A1c",
    loincCode: "4548-4",
    result: "6.2",
    unit: "%",
    referenceRange: "4.0-5.6",
    status: "FINAL",
    abnormalFlag: "HIGH",
    orderedDate: new Date("2025-12-01"),
    resultDate: new Date("2025-12-03"),
    orderedBy: "Dr. Michael Chen",
    performingLab: "Quest Diagnostics",
    history: [
      { date: "2025-09-01", value: 6.5 },
      { date: "2025-10-01", value: 6.3 },
      { date: "2025-11-01", value: 6.4 },
      { date: "2025-12-03", value: 6.2 },
    ],
  },
  {
    id: "2",
    testName: "Total Cholesterol",
    loincCode: "2093-3",
    result: "195",
    unit: "mg/dL",
    referenceRange: "<200",
    status: "FINAL",
    abnormalFlag: "NORMAL",
    orderedDate: new Date("2025-12-01"),
    resultDate: new Date("2025-12-03"),
    orderedBy: "Dr. Michael Chen",
    performingLab: "Quest Diagnostics",
    history: [
      { date: "2025-09-01", value: 210 },
      { date: "2025-10-01", value: 205 },
      { date: "2025-11-01", value: 198 },
      { date: "2025-12-03", value: 195 },
    ],
  },
  {
    id: "3",
    testName: "LDL Cholesterol",
    loincCode: "18262-6",
    result: "145",
    unit: "mg/dL",
    referenceRange: "<100",
    status: "FINAL",
    abnormalFlag: "HIGH",
    orderedDate: new Date("2025-12-01"),
    resultDate: new Date("2025-12-03"),
    orderedBy: "Dr. Michael Chen",
    performingLab: "Quest Diagnostics",
    history: [
      { date: "2025-09-01", value: 155 },
      { date: "2025-10-01", value: 150 },
      { date: "2025-11-01", value: 148 },
      { date: "2025-12-03", value: 145 },
    ],
  },
];

const mockClinicalNotes = [
  {
    id: "1",
    type: "Progress Note",
    title: "Diabetes Follow-up Visit",
    date: new Date("2025-12-20"),
    provider: "Dr. Michael Chen",
    specialty: "Internal Medicine",
    summary: "Patient continues on current diabetes management plan. A1c improved to 6.2%.",
  },
  {
    id: "2",
    type: "Annual Physical",
    title: "Annual Wellness Exam",
    date: new Date("2025-11-15"),
    provider: "Dr. Sarah Johnson",
    specialty: "Family Medicine",
    summary: "Comprehensive physical examination completed. All systems reviewed.",
  },
];

export default function MedicalRecordsPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedResult, setSelectedResult] = useState<any>(null);

  return (
    <div className="container mx-auto space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Medical Records</h1>
          <p className="text-muted-foreground">
            Access your complete health information
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">
            <Share2 className="mr-2 h-4 w-4" />
            Share Records
          </Button>
          <Button>
            <Download className="mr-2 h-4 w-4" />
            Download (Blue Button)
          </Button>
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search records, tests, or documents..."
          className="pl-9"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      {/* Tabs */}
      <Tabs defaultValue="labs">
        <TabsList>
          <TabsTrigger value="labs">Lab Results</TabsTrigger>
          <TabsTrigger value="imaging">Imaging</TabsTrigger>
          <TabsTrigger value="notes">Clinical Notes</TabsTrigger>
          <TabsTrigger value="medications">Medications</TabsTrigger>
          <TabsTrigger value="immunizations">Immunizations</TabsTrigger>
          <TabsTrigger value="documents">Documents</TabsTrigger>
        </TabsList>

        <TabsContent value="labs" className="space-y-4">
          <div className="grid gap-4 lg:grid-cols-3">
            {/* Results List */}
            <Card className="lg:col-span-1">
              <CardHeader>
                <CardTitle>Recent Results</CardTitle>
                <CardDescription>Lab tests from the past year</CardDescription>
              </CardHeader>
              <ScrollArea className="h-[600px]">
                <div className="space-y-2 p-4">
                  {mockLabResults.map((result) => (
                    <button
                      key={result.id}
                      onClick={() => setSelectedResult(result)}
                      className={cn(
                        "w-full rounded-lg border p-3 text-left transition-colors hover:bg-accent",
                        selectedResult?.id === result.id && "bg-accent",
                      )}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1">
                          <p className="font-medium text-sm">{result.testName}</p>
                          <p className="text-xs text-muted-foreground mt-1">
                            {formatDate(result.resultDate)}
                          </p>
                        </div>
                        {result.abnormalFlag === "HIGH" || result.abnormalFlag === "LOW" ? (
                          <Badge variant="danger" className="shrink-0">
                            {result.abnormalFlag}
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="shrink-0">
                            Normal
                          </Badge>
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              </ScrollArea>
            </Card>

            {/* Result Details */}
            <Card className="lg:col-span-2">
              {selectedResult ? (
                <>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle>{selectedResult.testName}</CardTitle>
                        <CardDescription>
                          LOINC: {selectedResult.loincCode} • {selectedResult.performingLab}
                        </CardDescription>
                      </div>
                      <Badge
                        variant={
                          selectedResult.abnormalFlag === "NORMAL"
                            ? "outline"
                            : "destructive"
                        }
                      >
                        {selectedResult.status}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {/* Current Result */}
                    <div className="rounded-lg border-2 border-primary/20 bg-primary/5 p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-muted-foreground">Current Result</p>
                          <p className="text-3xl font-bold mt-1">
                            {selectedResult.result} <span className="text-lg">{selectedResult.unit}</span>
                          </p>
                        </div>
                        {selectedResult.abnormalFlag !== "NORMAL" ? (
                          <AlertTriangle className="h-8 w-8 text-destructive" />
                        ) : (
                          <CheckCircle className="h-8 w-8 text-green-600" />
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground mt-2">
                        Reference Range: {selectedResult.referenceRange}
                      </p>
                    </div>

                    {/* Trend Chart */}
                    <div>
                      <h4 className="font-medium mb-4 flex items-center gap-2">
                        <Activity className="h-4 w-4" />
                        Trend Analysis
                      </h4>
                      <ResponsiveContainer width="100%" height={200}>
                        <LineChart data={selectedResult.history}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis
                            dataKey="date"
                            tickFormatter={(value) => new Date(value).toLocaleDateString()}
                          />
                          <YAxis />
                          <Tooltip
                            labelFormatter={(value) => formatDate(new Date(value))}
                          />
                          <Line
                            type="monotone"
                            dataKey="value"
                            stroke="hsl(var(--primary))"
                            strokeWidth={2}
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>

                    {/* Details */}
                    <div className="space-y-2">
                      <h4 className="font-medium">Test Details</h4>
                      <div className="grid gap-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Ordered By:</span>
                          <span className="font-medium">{selectedResult.orderedBy}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Ordered Date:</span>
                          <span>{formatDate(selectedResult.orderedDate)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Result Date:</span>
                          <span>{formatDate(selectedResult.resultDate)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Performing Lab:</span>
                          <span>{selectedResult.performingLab}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <Button variant="outline" className="flex-1">
                        <Download className="mr-2 h-4 w-4" />
                        Download PDF
                      </Button>
                      <Button variant="outline" className="flex-1">
                        <Share2 className="mr-2 h-4 w-4" />
                        Share Result
                      </Button>
                    </div>
                  </CardContent>
                </>
              ) : (
                <CardContent className="flex flex-col items-center justify-center h-[600px]">
                  <Activity className="h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-medium">Select a test result</h3>
                  <p className="text-sm text-muted-foreground mt-2">
                    Choose a result from the list to view details
                  </p>
                </CardContent>
              )}
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="imaging" className="space-y-4">
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <ImageIcon className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium">No imaging studies</h3>
              <p className="text-sm text-muted-foreground mt-2">
                Your imaging results will appear here when available
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notes" className="space-y-4">
          {mockClinicalNotes.map((note) => (
            <Card key={note.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <FileText className="h-5 w-5" />
                      {note.title}
                    </CardTitle>
                    <CardDescription>
                      {note.provider} • {note.specialty}
                    </CardDescription>
                  </div>
                  <Badge variant="outline">{note.type}</Badge>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm mb-4">{note.summary}</p>
                <div className="flex items-center justify-between text-sm text-muted-foreground">
                  <span>{formatDate(note.date, "long")}</span>
                  <Button variant="link" size="sm">View Full Note</Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="medications">
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Pill className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium">View medications on dashboard</h3>
              <Button className="mt-4" variant="outline">Go to Dashboard</Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="immunizations">
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <CheckCircle className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium">View immunizations on dashboard</h3>
              <Button className="mt-4" variant="outline">Go to Dashboard</Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="documents">
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <FileText className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium">No documents uploaded</h3>
              <p className="text-sm text-muted-foreground mt-2">
                Upload medical documents to access them here
              </p>
              <Button className="mt-4">
                <Download className="mr-2 h-4 w-4" />
                Upload Document
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
