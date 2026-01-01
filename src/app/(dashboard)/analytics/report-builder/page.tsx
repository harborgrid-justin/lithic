"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Play, Save, Download, Plus, X, Table2, BarChart3, LineChart, PieChart } from "lucide-react";
import type { ReportDataSource, VisualizationType } from "@/types/analytics-enterprise";

export default function ReportBuilderPage() {
  const [reportName, setReportName] = useState("");
  const [dataSources, setDataSources] = useState<string[]>([]);
  const [selectedViz, setSelectedViz] = useState<VisualizationType>("table");

  const availableDataSources: Array<{ value: ReportDataSource; label: string }> = [
    { value: "patients", label: "Patients" },
    { value: "encounters", label: "Encounters" },
    { value: "claims", label: "Claims" },
    { value: "lab_results", label: "Lab Results" },
    { value: "medications", label: "Medications" },
    { value: "diagnoses", label: "Diagnoses" },
    { value: "procedures", label: "Procedures" },
    { value: "vitals", label: "Vitals" },
    { value: "registries", label: "Disease Registries" },
  ];

  const visualizationTypes = [
    { value: "table", label: "Table", icon: Table2 },
    { value: "bar_chart", label: "Bar Chart", icon: BarChart3 },
    { value: "line_chart", label: "Line Chart", icon: LineChart },
    { value: "pie_chart", label: "Pie Chart", icon: PieChart },
  ];

  const savedReports = [
    { id: "1", name: "Monthly Revenue Report", category: "Financial", lastRun: "2 days ago" },
    { id: "2", name: "Quality Metrics Dashboard", category: "Clinical", lastRun: "1 day ago" },
    { id: "3", name: "Patient Demographics", category: "Population", lastRun: "3 hours ago" },
  ];

  return (
    <div className="container mx-auto space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Custom Report Builder</h1>
          <p className="text-muted-foreground">Design and generate custom analytics reports</p>
        </div>
      </div>

      <Tabs defaultValue="builder" className="space-y-4">
        <TabsList>
          <TabsTrigger value="builder">Report Builder</TabsTrigger>
          <TabsTrigger value="saved">Saved Reports</TabsTrigger>
          <TabsTrigger value="scheduled">Scheduled Reports</TabsTrigger>
        </TabsList>

        <TabsContent value="builder" className="space-y-4">
          <div className="grid gap-6 lg:grid-cols-3">
            {/* Configuration Panel */}
            <div className="lg:col-span-1 space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Report Configuration</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="report-name">Report Name</Label>
                    <Input
                      id="report-name"
                      value={reportName}
                      onChange={(e) => setReportName(e.target.value)}
                      placeholder="Enter report name"
                    />
                  </div>

                  <div>
                    <Label>Data Sources</Label>
                    <Select>
                      <SelectTrigger>
                        <SelectValue placeholder="Select data source" />
                      </SelectTrigger>
                      <SelectContent>
                        {availableDataSources.map((ds) => (
                          <SelectItem key={ds.value} value={ds.value}>
                            {ds.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {dataSources.map((ds) => (
                        <Badge key={ds} variant="secondary">
                          {ds}
                          <X className="ml-1 h-3 w-3 cursor-pointer" />
                        </Badge>
                      ))}
                    </div>
                  </div>

                  <div>
                    <Label>Visualization Type</Label>
                    <div className="mt-2 grid grid-cols-2 gap-2">
                      {visualizationTypes.slice(0, 4).map((viz) => (
                        <Button
                          key={viz.value}
                          variant={selectedViz === viz.value ? "default" : "outline"}
                          size="sm"
                          onClick={() => setSelectedViz(viz.value as VisualizationType)}
                          className="w-full"
                        >
                          <viz.icon className="mr-1 h-4 w-4" />
                          {viz.label}
                        </Button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <Label>Filters</Label>
                    <Button variant="outline" size="sm" className="w-full">
                      <Plus className="mr-1 h-4 w-4" />
                      Add Filter
                    </Button>
                  </div>

                  <div>
                    <Label>Columns</Label>
                    <Button variant="outline" size="sm" className="w-full">
                      <Plus className="mr-1 h-4 w-4" />
                      Add Column
                    </Button>
                  </div>
                </CardContent>
              </Card>

              <div className="flex gap-2">
                <Button className="flex-1">
                  <Save className="mr-2 h-4 w-4" />
                  Save
                </Button>
                <Button variant="outline" className="flex-1">
                  <Play className="mr-2 h-4 w-4" />
                  Run
                </Button>
              </div>
            </div>

            {/* Preview Panel */}
            <div className="lg:col-span-2">
              <Card className="h-full">
                <CardHeader>
                  <CardTitle>Preview</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex h-[500px] items-center justify-center border-2 border-dashed border-gray-300 rounded-lg">
                    <div className="text-center">
                      <Table2 className="mx-auto h-12 w-12 text-gray-400" />
                      <p className="mt-2 text-sm text-muted-foreground">
                        Configure your report and click Run to see preview
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="saved" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Saved Reports</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {savedReports.map((report) => (
                  <div
                    key={report.id}
                    className="flex items-center justify-between rounded-lg border p-4"
                  >
                    <div>
                      <h4 className="font-medium">{report.name}</h4>
                      <div className="mt-1 flex items-center gap-2 text-sm text-muted-foreground">
                        <Badge variant="outline">{report.category}</Badge>
                        <span>Last run: {report.lastRun}</span>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline">
                        <Play className="mr-1 h-4 w-4" />
                        Run
                      </Button>
                      <Button size="sm" variant="outline">
                        <Download className="mr-1 h-4 w-4" />
                        Export
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="scheduled" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Scheduled Reports</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                No scheduled reports configured. Create a report and set up a schedule to receive
                automated deliveries.
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
