"use client";

import { QualityHeatmap } from "@/components/vbc/quality-heatmap";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Award, TrendingUp, Activity } from "lucide-react";

export default function QualityMeasuresPage() {
  const summaryMetrics = {
    totalMeasures: 18,
    above90thPercentile: 6,
    above75thPercentile: 10,
    below50thPercentile: 2,
    overallStarRating: 4.0,
    hedisAverage: 78.5,
  };

  return (
    <div className="p-8 space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Quality Measures</h1>
        <p className="text-gray-500 mt-1">
          HEDIS performance, benchmarking, and quality analytics
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Star Rating
            </CardTitle>
            <Award className="w-4 h-4 text-gray-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">
              {summaryMetrics.overallStarRating} Stars
            </div>
            <p className="text-xs text-gray-500 mt-1">Medicare Advantage</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              HEDIS Average
            </CardTitle>
            <Activity className="w-4 h-4 text-gray-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {summaryMetrics.hedisAverage}%
            </div>
            <p className="text-xs text-gray-500 mt-1">Across {summaryMetrics.totalMeasures} measures</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Top Performers
            </CardTitle>
            <TrendingUp className="w-4 h-4 text-gray-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {summaryMetrics.above90thPercentile}
            </div>
            <p className="text-xs text-gray-500 mt-1">Above 90th percentile</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Need Improvement
            </CardTitle>
            <Activity className="w-4 h-4 text-gray-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">
              {summaryMetrics.below50thPercentile}
            </div>
            <p className="text-xs text-gray-500 mt-1">Below 50th percentile</p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="heatmap" className="space-y-6">
        <TabsList>
          <TabsTrigger value="heatmap">Provider Heatmap</TabsTrigger>
          <TabsTrigger value="hedis">HEDIS Measures</TabsTrigger>
          <TabsTrigger value="benchmarks">Benchmarking</TabsTrigger>
          <TabsTrigger value="trends">Trends</TabsTrigger>
        </TabsList>

        <TabsContent value="heatmap">
          <QualityHeatmap />
        </TabsContent>

        <TabsContent value="hedis">
          <Card>
            <CardHeader>
              <CardTitle>HEDIS Measure Performance</CardTitle>
              <CardDescription>
                Healthcare Effectiveness Data and Information Set measures
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-gray-600">
                Detailed HEDIS measure data would be displayed here
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="benchmarks">
          <Card>
            <CardHeader>
              <CardTitle>Benchmark Comparison</CardTitle>
              <CardDescription>
                Compare performance against national, regional, and peer benchmarks
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-gray-600">
                Benchmark comparison charts would be displayed here
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="trends">
          <Card>
            <CardHeader>
              <CardTitle>Performance Trends</CardTitle>
              <CardDescription>
                Historical performance and year-over-year changes
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-gray-600">
                Trend analysis charts would be displayed here
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
