"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Download, Filter, Users, AlertCircle, CheckCircle2, Clock } from "lucide-react";
import type { DiseaseRegistryType, RiskLevel, CareGap } from "@/types/analytics-enterprise";

export default function PopulationRegistryPage() {
  const [selectedRegistry, setSelectedRegistry] = useState<DiseaseRegistryType>("diabetes");
  const [riskFilter, setRiskFilter] = useState<RiskLevel | "all">("all");

  const registries = [
    { type: "diabetes" as DiseaseRegistryType, name: "Diabetes", count: 2850, highRisk: 340 },
    { type: "hypertension" as DiseaseRegistryType, name: "Hypertension", count: 4200, highRisk: 450 },
    { type: "chf" as DiseaseRegistryType, name: "CHF", count: 580, highRisk: 125 },
    { type: "copd" as DiseaseRegistryType, name: "COPD", count: 720, highRisk: 160 },
    { type: "ckd" as DiseaseRegistryType, name: "CKD", count: 650, highRisk: 180 },
  ];

  const qualityMetrics = [
    { name: "HbA1c Testing Rate", value: 92, target: 90, status: "excellent" },
    { name: "HbA1c Control (<8%)", value: 68, target: 70, status: "warning" },
    { name: "Annual Eye Exam", value: 78, target: 80, status: "warning" },
    { name: "Annual Foot Exam", value: 85, target: 80, status: "excellent" },
    { name: "Statin Therapy", value: 74, target: 75, status: "warning" },
  ];

  const careGaps = [
    {
      patientId: "P001",
      patientName: "Sarah Johnson",
      mrn: "MRN-12345",
      riskLevel: "high" as RiskLevel,
      gaps: [
        { category: "preventive_screening", description: "Annual eye exam overdue", priority: "high" },
        { category: "lab_test", description: "HbA1c test overdue (6 months)", priority: "medium" },
      ],
      lastVisit: new Date("2024-10-15"),
      nextDue: new Date("2025-02-01"),
    },
    {
      patientId: "P002",
      patientName: "Michael Chen",
      mrn: "MRN-23456",
      riskLevel: "very_high" as RiskLevel,
      gaps: [
        { category: "medication_adherence", description: "Statin therapy not documented", priority: "high" },
        { category: "preventive_screening", description: "Nephropathy screening overdue", priority: "urgent" },
      ],
      lastVisit: new Date("2024-09-20"),
      nextDue: new Date("2025-01-15"),
    },
  ];

  const riskDistribution = [
    { level: "Low", count: 1520, percentage: 53 },
    { level: "Moderate", count: 890, percentage: 31 },
    { level: "High", count: 340, percentage: 12 },
    { level: "Very High", count: 100, percentage: 4 },
  ];

  return (
    <div className="container mx-auto space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Population Health Registries</h1>
          <p className="text-muted-foreground">Disease management and care gap tracking</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">
            <Filter className="mr-2 h-4 w-4" />
            Filters
          </Button>
          <Button>
            <Download className="mr-2 h-4 w-4" />
            Export
          </Button>
        </div>
      </div>

      {/* Registry Selection Cards */}
      <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-5">
        {registries.map((registry) => (
          <Card
            key={registry.type}
            className={`cursor-pointer transition-all ${
              selectedRegistry === registry.type
                ? "ring-2 ring-blue-600 ring-offset-2"
                : "hover:shadow-md"
            }`}
            onClick={() => setSelectedRegistry(registry.type)}
          >
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">{registry.name}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{registry.count.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground mt-1">
                {registry.highRisk} high risk
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Main Content */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="care-gaps">Care Gaps</TabsTrigger>
          <TabsTrigger value="quality">Quality Metrics</TabsTrigger>
          <TabsTrigger value="outreach">Outreach</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Total Patients</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">2,850</div>
                <p className="text-xs text-green-600 mt-1">+120 this quarter</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Active Care Gaps</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">1,245</div>
                <p className="text-xs text-yellow-600 mt-1">340 urgent</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Avg. Risk Score</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">42.5</div>
                <p className="text-xs text-muted-foreground mt-1">Moderate risk</p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Risk Stratification</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {riskDistribution.map((item) => (
                  <div key={item.level}>
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium">{item.level} Risk</span>
                        <Badge variant="outline">{item.count}</Badge>
                      </div>
                      <span className="text-sm text-muted-foreground">{item.percentage}%</span>
                    </div>
                    <div className="h-2 w-full rounded-full bg-gray-200">
                      <div
                        className={`h-full rounded-full ${
                          item.level === "Very High"
                            ? "bg-red-600"
                            : item.level === "High"
                              ? "bg-orange-500"
                              : item.level === "Moderate"
                                ? "bg-yellow-500"
                                : "bg-green-500"
                        }`}
                        style={{ width: `${item.percentage}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="care-gaps" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Care Gap Worklist</CardTitle>
                <div className="flex gap-2">
                  <Select value={riskFilter} onValueChange={(v) => setRiskFilter(v as any)}>
                    <SelectTrigger className="w-40">
                      <SelectValue placeholder="All risk levels" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Risk Levels</SelectItem>
                      <SelectItem value="very_high">Very High Risk</SelectItem>
                      <SelectItem value="high">High Risk</SelectItem>
                      <SelectItem value="moderate">Moderate Risk</SelectItem>
                      <SelectItem value="low">Low Risk</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Patient</TableHead>
                    <TableHead>MRN</TableHead>
                    <TableHead>Risk Level</TableHead>
                    <TableHead>Care Gaps</TableHead>
                    <TableHead>Last Visit</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {careGaps.map((patient) => (
                    <TableRow key={patient.patientId}>
                      <TableCell className="font-medium">{patient.patientName}</TableCell>
                      <TableCell>{patient.mrn}</TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            patient.riskLevel === "very_high"
                              ? "destructive"
                              : patient.riskLevel === "high"
                                ? "default"
                                : "secondary"
                          }
                        >
                          {patient.riskLevel.replace("_", " ").toUpperCase()}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          {patient.gaps.map((gap, idx) => (
                            <div key={idx} className="flex items-center gap-1 text-xs">
                              <AlertCircle className="h-3 w-3 text-red-500" />
                              <span>{gap.description}</span>
                            </div>
                          ))}
                        </div>
                      </TableCell>
                      <TableCell>{patient.lastVisit.toLocaleDateString()}</TableCell>
                      <TableCell>
                        <Button size="sm" variant="outline">
                          Outreach
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="quality" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Quality Measure Performance</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {qualityMetrics.map((metric) => (
                  <div key={metric.name}>
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium">{metric.name}</span>
                        {metric.status === "excellent" ? (
                          <CheckCircle2 className="h-4 w-4 text-green-600" />
                        ) : (
                          <Clock className="h-4 w-4 text-yellow-600" />
                        )}
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-sm text-muted-foreground">
                          Target: {metric.target}%
                        </span>
                        <span className="text-sm font-bold">{metric.value}%</span>
                      </div>
                    </div>
                    <div className="h-2 w-full rounded-full bg-gray-200">
                      <div
                        className={`h-full rounded-full ${
                          metric.status === "excellent" ? "bg-green-600" : "bg-yellow-500"
                        }`}
                        style={{ width: `${metric.value}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="outreach" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Outreach Campaigns</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Configure and manage outreach campaigns for care gap closure
              </p>
              <div className="mt-4">
                <Button>
                  <Users className="mr-2 h-4 w-4" />
                  Create Campaign
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
