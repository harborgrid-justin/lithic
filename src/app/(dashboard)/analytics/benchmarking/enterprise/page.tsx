"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge as _Badge } from "@/components/ui/badge";
import {
  Select as _Select,
  SelectContent as _SelectContent,
  SelectItem as _SelectItem,
  SelectTrigger as _SelectTrigger,
  SelectValue as _SelectValue,
} from "@/components/ui/select";
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar } from "recharts";
import { TrendingUp as _TrendingUp, TrendingDown as _TrendingDown, Download, Building2 } from "lucide-react";

export default function BenchmarkingPage() {
  const [selectedCategory, setSelectedCategory] = useState("financial");

  const facilities = [
    { name: "Main Hospital", value: 95, rank: 1 },
    { name: "North Clinic", value: 88, rank: 3 },
    { name: "South Clinic", value: 92, rank: 2 },
    { name: "East Campus", value: 85, rank: 4 },
  ];

  const benchmarkData = [
    { metric: "Revenue per Patient", yourValue: 285, peerAverage: 250, topQuartile: 320 },
    { metric: "Collection Rate", yourValue: 96, peerAverage: 94, topQuartile: 98 },
    { metric: "Days in A/R", yourValue: 28, peerAverage: 35, topQuartile: 25 },
    { metric: "Patient Satisfaction", yourValue: 4.6, peerAverage: 4.3, topQuartile: 4.8 },
  ];

  const radarData = [
    { subject: "Financial", A: 92, B: 85, fullMark: 100 },
    { subject: "Clinical Quality", A: 88, B: 82, fullMark: 100 },
    { subject: "Patient Satisfaction", A: 91, B: 87, fullMark: 100 },
    { subject: "Operational Efficiency", A: 85, B: 80, fullMark: 100 },
    { subject: "Staff Engagement", A: 87, B: 78, fullMark: 100 },
  ];

  return (
    <div className="container mx-auto space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Enterprise Benchmarking</h1>
          <p className="text-muted-foreground">
            Compare performance across facilities and against national benchmarks
          </p>
        </div>
        <Button>
          <Download className="mr-2 h-4 w-4" />
          Export Report
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        {facilities.map((facility) => (
          <Card key={facility.name}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{facility.name}</CardTitle>
              <Building2 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{facility.value}</div>
              <p className="text-xs text-muted-foreground">
                Rank #{facility.rank} of 4
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Tabs value={selectedCategory} onValueChange={setSelectedCategory} className="space-y-4">
        <TabsList>
          <TabsTrigger value="financial">Financial</TabsTrigger>
          <TabsTrigger value="clinical">Clinical Quality</TabsTrigger>
          <TabsTrigger value="operational">Operational</TabsTrigger>
          <TabsTrigger value="satisfaction">Satisfaction</TabsTrigger>
        </TabsList>

        <TabsContent value={selectedCategory} className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Benchmark Comparison</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <BarChart data={benchmarkData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="metric" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="yourValue" fill="#3b82f6" name="Your Value" />
                  <Bar dataKey="peerAverage" fill="#94a3b8" name="Peer Average" />
                  <Bar dataKey="topQuartile" fill="#10b981" name="Top Quartile" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Performance Radar</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <RadarChart data={radarData}>
                    <PolarGrid />
                    <PolarAngleAxis dataKey="subject" />
                    <PolarRadiusAxis angle={90} domain={[0, 100]} />
                    <Radar
                      name="Your Organization"
                      dataKey="A"
                      stroke="#3b82f6"
                      fill="#3b82f6"
                      fillOpacity={0.6}
                    />
                    <Radar
                      name="Peer Average"
                      dataKey="B"
                      stroke="#94a3b8"
                      fill="#94a3b8"
                      fillOpacity={0.6}
                    />
                    <Legend />
                  </RadarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Trend Analysis</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart
                    data={[
                      { month: "Jan", value: 85 },
                      { month: "Feb", value: 87 },
                      { month: "Mar", value: 90 },
                      { month: "Apr", value: 92 },
                      { month: "May", value: 95 },
                    ]}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip />
                    <Line type="monotone" dataKey="value" stroke="#3b82f6" strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
