"use client";

import { useState, useEffect, useCallback } from "react";
import { BenchmarkChart } from "@/components/analytics/BenchmarkChart";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { RefreshCw, Award, TrendingUp, AlertCircle } from "lucide-react";
import { BenchmarkData } from "@/lib/analytics/benchmarking";

export default function BenchmarkingPage() {
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [benchmarks, setBenchmarks] = useState<BenchmarkData[]>([]);
  const [competitivePosition, setCompetitivePosition] = useState<any>(null);

  const categories = [
    { value: "all", label: "All Metrics" },
    { value: "financial", label: "Financial" },
    { value: "operational", label: "Operational" },
    { value: "clinical", label: "Clinical" },
    { value: "quality", label: "Quality" },
  ];

  const loadBenchmarkData = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch(
        `/api/analytics/benchmarking?category=${selectedCategory}`,
      );

      if (!response.ok) {
        throw new Error("Failed to load benchmark data");
      }

      const data = await response.json();
      setBenchmarks(data.benchmarks || []);
      setCompetitivePosition(data.competitivePosition || null);
    } catch (error) {
      console.error("Error loading benchmark data:", error);
    } finally {
      setLoading(false);
    }
  }, [selectedCategory]);

  useEffect(() => {
    loadBenchmarkData();
  }, [loadBenchmarkData]);

  const handleRefresh = () => {
    loadBenchmarkData();
  };

  const getPositionColor = (position: string) => {
    switch (position) {
      case "leader":
        return "bg-green-100 text-green-800 border-green-200";
      case "above-average":
        return "bg-blue-100 text-blue-800 border-blue-200";
      case "average":
        return "bg-gray-100 text-gray-800 border-gray-200";
      case "below-average":
        return "bg-orange-100 text-orange-800 border-orange-200";
      case "laggard":
        return "bg-red-100 text-red-800 border-red-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  return (
    <div className="container mx-auto py-8 px-4">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              Industry Benchmarking
            </h1>
            <p className="text-gray-600 mt-2">
              Compare your performance against industry standards and peer
              organizations
            </p>
          </div>

          <Button
            variant="outline"
            onClick={handleRefresh}
            disabled={loading}
            className="flex items-center gap-2"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        </div>

        {/* Controls */}
        <div className="mt-6 flex items-center gap-4">
          <label className="text-sm font-medium text-gray-700">Category:</label>
          <Select value={selectedCategory} onValueChange={setSelectedCategory}>
            <SelectTrigger className="w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {categories.map((category) => (
                <SelectItem key={category.value} value={category.value}>
                  {category.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Competitive Position */}
      {competitivePosition && (
        <div className="mb-8 bg-white rounded-lg border border-gray-200 p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Competitive Position
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div>
              <div className="text-sm text-gray-600 mb-2">Overall Score</div>
              <div className="text-3xl font-bold text-gray-900">
                {competitivePosition.score}
              </div>
              <div className="text-sm text-gray-600 mt-1">out of 100</div>
            </div>

            <div>
              <div className="text-sm text-gray-600 mb-2">Position</div>
              <div
                className={`inline-block px-3 py-1 rounded-full border font-medium ${getPositionColor(
                  competitivePosition.position,
                )}`}
              >
                {competitivePosition.position.replace("-", " ").toUpperCase()}
              </div>
            </div>

            <div>
              <div className="text-sm text-gray-600 mb-2">Above Average</div>
              <div className="text-3xl font-bold text-green-600">
                {benchmarks.filter((b) => b.comparison === "above").length}
              </div>
              <div className="text-sm text-gray-600 mt-1">metrics</div>
            </div>

            <div>
              <div className="text-sm text-gray-600 mb-2">Below Average</div>
              <div className="text-3xl font-bold text-red-600">
                {benchmarks.filter((b) => b.comparison === "below").length}
              </div>
              <div className="text-sm text-gray-600 mt-1">metrics</div>
            </div>
          </div>

          {/* Strengths and Weaknesses */}
          <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="font-medium text-gray-900 mb-3 flex items-center gap-2">
                <Award className="w-4 h-4 text-green-600" />
                Top Strengths
              </h3>
              <ul className="space-y-2">
                {competitivePosition.strengths
                  .slice(0, 5)
                  .map((strength: string, index: number) => (
                    <li
                      key={index}
                      className="text-sm text-gray-600 flex items-center gap-2"
                    >
                      <div className="w-1.5 h-1.5 rounded-full bg-green-500"></div>
                      {strength}
                    </li>
                  ))}
                {competitivePosition.strengths.length === 0 && (
                  <li className="text-sm text-gray-500 italic">
                    No strengths identified
                  </li>
                )}
              </ul>
            </div>

            <div>
              <h3 className="font-medium text-gray-900 mb-3 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-orange-600" />
                Areas for Improvement
              </h3>
              <ul className="space-y-2">
                {competitivePosition.weaknesses
                  .slice(0, 5)
                  .map((weakness: string, index: number) => (
                    <li
                      key={index}
                      className="text-sm text-gray-600 flex items-center gap-2"
                    >
                      <div className="w-1.5 h-1.5 rounded-full bg-orange-500"></div>
                      {weakness}
                    </li>
                  ))}
                {competitivePosition.weaknesses.length === 0 && (
                  <li className="text-sm text-gray-500 italic">
                    No weaknesses identified
                  </li>
                )}
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* Benchmark Charts */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">
          Metric Comparisons
        </h2>
        <BenchmarkChart benchmarks={benchmarks} loading={loading} />
      </div>

      {/* Detailed Benchmarks */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">
            Detailed Analysis
          </h2>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Metric
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Your Value
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Industry Median
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Gap
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Percentile
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Performance
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td
                    colSpan={6}
                    className="px-6 py-8 text-center text-gray-500"
                  >
                    Loading benchmark data...
                  </td>
                </tr>
              ) : benchmarks.length === 0 ? (
                <tr>
                  <td
                    colSpan={6}
                    className="px-6 py-8 text-center text-gray-500"
                  >
                    No benchmark data available
                  </td>
                </tr>
              ) : (
                benchmarks.map((benchmark, index) => (
                  <tr key={index} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {benchmark.metricName}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {benchmark.organizationValue.toFixed(2)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {benchmark.industryMedian.toFixed(2)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <span
                        className={
                          benchmark.comparison === "above"
                            ? "text-green-600"
                            : benchmark.comparison === "below"
                              ? "text-red-600"
                              : "text-gray-600"
                        }
                      >
                        {benchmark.gapPercent > 0 ? "+" : ""}
                        {benchmark.gapPercent.toFixed(1)}%
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {benchmark.organizationPercentile}th
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-2 py-1 text-xs font-medium rounded-full ${
                          benchmark.comparison === "above"
                            ? "bg-green-100 text-green-800"
                            : benchmark.comparison === "below"
                              ? "bg-red-100 text-red-800"
                              : "bg-gray-100 text-gray-800"
                        }`}
                      >
                        {benchmark.comparison === "above"
                          ? "Above Average"
                          : benchmark.comparison === "below"
                            ? "Below Average"
                            : "At Average"}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Recommendations */}
      <div className="mt-8 bg-white rounded-lg border border-gray-200 p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">
          Recommendations
        </h2>

        <div className="space-y-4">
          <div className="flex items-start gap-3 pb-4 border-b border-gray-200">
            <div className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
              <AlertCircle className="w-4 h-4 text-red-600" />
            </div>
            <div>
              <h3 className="font-medium text-gray-900">
                Critical: Improve Claims Denial Rate
              </h3>
              <p className="text-sm text-gray-600 mt-1">
                Your denial rate is 35% above industry median. Implement
                enhanced claims scrubbing and staff training to reduce denials
                and improve revenue cycle.
              </p>
              <div className="mt-2 text-sm font-medium text-red-600">
                Potential Impact: $150K+ annual savings
              </div>
            </div>
          </div>

          <div className="flex items-start gap-3 pb-4 border-b border-gray-200">
            <div className="w-8 h-8 rounded-full bg-orange-100 flex items-center justify-center flex-shrink-0">
              <TrendingUp className="w-4 h-4 text-orange-600" />
            </div>
            <div>
              <h3 className="font-medium text-gray-900">
                Moderate: Reduce Patient Wait Times
              </h3>
              <p className="text-sm text-gray-600 mt-1">
                Wait times are 20% above industry standard. Consider optimizing
                scheduling workflows and adjusting staffing patterns during peak
                hours.
              </p>
              <div className="mt-2 text-sm font-medium text-orange-600">
                Target: Reduce to 15 minutes average
              </div>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
              <Award className="w-4 h-4 text-green-600" />
            </div>
            <div>
              <h3 className="font-medium text-gray-900">
                Strength: Maintain High Patient Satisfaction
              </h3>
              <p className="text-sm text-gray-600 mt-1">
                Patient satisfaction scores are in the top 10% nationally.
                Continue current patient experience initiatives and consider
                sharing best practices organization-wide.
              </p>
              <div className="mt-2 text-sm font-medium text-green-600">
                Current Percentile: 95th
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
