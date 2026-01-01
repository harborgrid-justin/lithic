"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";

export function QualityHeatmap() {
  // Mock data - would come from API
  const measures = [
    { id: "BCS", name: "Breast Cancer Screening", domain: "Preventive Care" },
    { id: "COL", name: "Colorectal Cancer Screening", domain: "Preventive Care" },
    { id: "CDC-H", name: "Diabetes HbA1c Testing", domain: "Diabetes Care" },
    { id: "CDC-C", name: "Diabetes HbA1c Control", domain: "Diabetes Care" },
    { id: "CBP", name: "Controlling High Blood Pressure", domain: "Cardiovascular Care" },
    { id: "SPC", name: "Statin Therapy for CVD", domain: "Cardiovascular Care" },
  ];

  const providers = [
    { id: "P1", name: "Dr. Smith" },
    { id: "P2", name: "Dr. Johnson" },
    { id: "P3", name: "Dr. Williams" },
    { id: "P4", name: "Dr. Brown" },
    { id: "P5", name: "Dr. Davis" },
  ];

  // Performance data: measure x provider (rates as percentages)
  const performanceData: Record<string, Record<string, number>> = {
    "BCS": { "P1": 78, "P2": 85, "P3": 72, "P4": 90, "P5": 68 },
    "COL": { "P1": 71, "P2": 75, "P3": 68, "P4": 82, "P5": 65 },
    "CDC-H": { "P1": 92, "P2": 88, "P3": 95, "P4": 90, "P5": 87 },
    "CDC-C": { "P1": 65, "P2": 72, "P3": 68, "P4": 75, "P5": 62 },
    "CBP": { "P1": 82, "P2": 78, "P3": 85, "P4": 88, "P5": 75 },
    "SPC": { "P1": 88, "P2": 90, "P3": 85, "P4": 92, "P5": 83 },
  };

  // Benchmarks for each measure
  const benchmarks: Record<string, number> = {
    "BCS": 72,
    "COL": 67,
    "CDC-H": 88,
    "CDC-C": 55,
    "CBP": 63,
    "SPC": 82,
  };

  // Calculate provider averages
  const providerAverages = providers.map(provider => {
    const rates = measures.map(m => performanceData[m.id][provider.id]);
    const avg = rates.reduce((a, b) => a + b, 0) / rates.length;
    return { providerId: provider.id, average: avg };
  });

  // Calculate measure averages
  const measureAverages = measures.map(measure => {
    const rates = providers.map(p => performanceData[measure.id][p.id]);
    const avg = rates.reduce((a, b) => a + b, 0) / rates.length;
    return { measureId: measure.id, average: avg };
  });

  const getColorClass = (rate: number, benchmark: number) => {
    const diff = rate - benchmark;
    if (diff >= 15) return "bg-green-600 text-white";
    if (diff >= 10) return "bg-green-500 text-white";
    if (diff >= 5) return "bg-green-400 text-white";
    if (diff >= 0) return "bg-green-300 text-gray-900";
    if (diff >= -5) return "bg-yellow-300 text-gray-900";
    if (diff >= -10) return "bg-orange-400 text-white";
    return "bg-red-500 text-white";
  };

  const getTrendIcon = (rate: number, benchmark: number) => {
    const diff = rate - benchmark;
    if (diff >= 5) return <TrendingUp className="w-3 h-3" />;
    if (diff <= -5) return <TrendingDown className="w-3 h-3" />;
    return <Minus className="w-3 h-3" />;
  };

  return (
    <div className="space-y-6">
      {/* Legend */}
      <Card>
        <CardHeader>
          <CardTitle>Quality Performance Heatmap</CardTitle>
          <CardDescription>
            Provider performance compared to national benchmarks
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-6 flex-wrap">
            <div className="text-sm font-medium">Performance vs. Benchmark:</div>
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 bg-green-600 rounded" />
              <span className="text-sm">+15%</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 bg-green-400 rounded" />
              <span className="text-sm">+5%</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 bg-yellow-300 rounded" />
              <span className="text-sm">±5%</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 bg-orange-400 rounded" />
              <span className="text-sm">-10%</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 bg-red-500 rounded" />
              <span className="text-sm">-15%</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Heatmap Table */}
      <Card>
        <CardContent className="pt-6">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr>
                  <th className="text-left p-3 border-b-2 font-semibold bg-gray-50 sticky left-0 z-10">
                    Measure
                  </th>
                  <th className="text-center p-3 border-b-2 font-semibold bg-gray-50 text-sm">
                    Benchmark
                  </th>
                  {providers.map(provider => (
                    <th key={provider.id} className="text-center p-3 border-b-2 font-semibold bg-gray-50 text-sm">
                      {provider.name}
                    </th>
                  ))}
                  <th className="text-center p-3 border-b-2 font-semibold bg-gray-50 text-sm">
                    Avg
                  </th>
                </tr>
              </thead>
              <tbody>
                {measures.map((measure, idx) => {
                  const measureAvg = measureAverages.find(m => m.measureId === measure.id)?.average || 0;
                  return (
                    <tr key={measure.id} className={idx % 2 === 0 ? "bg-white" : "bg-gray-50"}>
                      <td className="p-3 border-b font-medium text-sm sticky left-0 bg-inherit">
                        <div>
                          <div>{measure.name}</div>
                          <div className="text-xs text-gray-500 mt-1">{measure.domain}</div>
                        </div>
                      </td>
                      <td className="p-3 border-b text-center text-sm font-semibold">
                        {benchmarks[measure.id]}%
                      </td>
                      {providers.map(provider => {
                        const rate = performanceData[measure.id][provider.id];
                        const benchmark = benchmarks[measure.id];
                        return (
                          <td key={provider.id} className="p-3 border-b">
                            <div
                              className={`flex items-center justify-center gap-1 rounded px-2 py-1 font-semibold text-sm ${getColorClass(rate, benchmark)}`}
                            >
                              {getTrendIcon(rate, benchmark)}
                              {rate}%
                            </div>
                          </td>
                        );
                      })}
                      <td className="p-3 border-b text-center font-semibold text-sm">
                        {measureAvg.toFixed(1)}%
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot>
                <tr className="bg-gray-100 font-semibold">
                  <td className="p-3 border-t-2 sticky left-0 bg-gray-100">Provider Average</td>
                  <td className="p-3 border-t-2"></td>
                  {providers.map(provider => {
                    const avg = providerAverages.find(p => p.providerId === provider.id)?.average || 0;
                    return (
                      <td key={provider.id} className="p-3 border-t-2 text-center">
                        {avg.toFixed(1)}%
                      </td>
                    );
                  })}
                  <td className="p-3 border-t-2 text-center">
                    {(providerAverages.reduce((sum, p) => sum + p.average, 0) / providerAverages.length).toFixed(1)}%
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Insights */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Top Performers</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {providerAverages
                .sort((a, b) => b.average - a.average)
                .slice(0, 3)
                .map((p, idx) => {
                  const provider = providers.find(pr => pr.id === p.providerId);
                  return (
                    <div key={p.providerId} className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="text-2xl font-bold text-gray-400">#{idx + 1}</div>
                        <div className="font-medium">{provider?.name}</div>
                      </div>
                      <div className="text-lg font-bold text-green-600">
                        {p.average.toFixed(1)}%
                      </div>
                    </div>
                  );
                })}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Improvement Opportunities</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {measures
                .map(m => ({
                  ...m,
                  avgRate: measureAverages.find(ma => ma.measureId === m.id)?.average || 0,
                  benchmark: benchmarks[m.id],
                }))
                .filter(m => m.avgRate < m.benchmark)
                .sort((a, b) => (a.avgRate - a.benchmark) - (b.avgRate - b.benchmark))
                .slice(0, 3)
                .map((measure) => (
                  <div key={measure.id} className="flex items-center justify-between p-3 bg-orange-50 border border-orange-200 rounded-lg">
                    <div>
                      <div className="font-medium text-sm">{measure.name}</div>
                      <div className="text-xs text-gray-600 mt-1">
                        {measure.avgRate.toFixed(1)}% vs. {measure.benchmark}% benchmark
                      </div>
                    </div>
                    <div className="text-orange-600 font-semibold">
                      {(measure.avgRate - measure.benchmark).toFixed(1)}%
                    </div>
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
