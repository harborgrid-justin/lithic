"use client";

import { useEffect, useState } from "react";
import {
  Activity,
  TrendingUp,
  TrendingDown,
  AlertCircle,
  CheckCircle,
} from "lucide-react";
import {
  MetricData,
  FilterConfig,
  analyticsService,
} from "@/services/analytics.service";
import { KPICard } from "./KPICard";

interface QualityMetricsProps {
  filters?: FilterConfig;
  className?: string;
}

interface CMSMeasure {
  id: string;
  name: string;
  score: number;
  benchmark: number;
  target: number;
  category: string;
  status: "above" | "at" | "below";
}

export function QualityMetrics({
  filters,
  className = "",
}: QualityMetricsProps) {
  const [metrics, setMetrics] = useState<MetricData[]>([]);
  const [cmsMeasures, setCmsMeasures] = useState<CMSMeasure[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadMetrics();
  }, [filters]);

  const loadMetrics = async () => {
    setLoading(true);
    try {
      const data = await analyticsService.getQualityMetrics(filters);
      setMetrics(data);

      // Simulate CMS measures (in real app, would come from API)
      setCmsMeasures([
        {
          id: "ami_30_day",
          name: "AMI 30-Day Mortality",
          score: 14.2,
          benchmark: 15.5,
          target: 14.0,
          category: "Mortality",
          status: "above",
        },
        {
          id: "hf_readmission",
          name: "Heart Failure Readmission",
          score: 18.5,
          benchmark: 21.0,
          target: 18.0,
          category: "Readmission",
          status: "above",
        },
        {
          id: "pneumonia_mortality",
          name: "Pneumonia 30-Day Mortality",
          score: 10.8,
          benchmark: 11.5,
          target: 10.5,
          category: "Mortality",
          status: "at",
        },
        {
          id: "sepsis_management",
          name: "Sepsis Management",
          score: 87.5,
          benchmark: 85.0,
          target: 90.0,
          category: "Process",
          status: "at",
        },
        {
          id: "hai_clabsi",
          name: "CLABSI (HAI)",
          score: 1.2,
          benchmark: 1.0,
          target: 0.8,
          category: "Safety",
          status: "below",
        },
        {
          id: "hai_cauti",
          name: "CAUTI (HAI)",
          score: 0.9,
          benchmark: 1.1,
          target: 0.8,
          category: "Safety",
          status: "above",
        },
      ]);
    } catch (error) {
      console.error("Failed to load quality metrics:", error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: CMSMeasure["status"]) => {
    switch (status) {
      case "above":
        return "text-green-600 bg-green-50";
      case "at":
        return "text-yellow-600 bg-yellow-50";
      case "below":
        return "text-red-600 bg-red-50";
    }
  };

  const getStatusIcon = (status: CMSMeasure["status"]) => {
    switch (status) {
      case "above":
        return <CheckCircle className="w-5 h-5" />;
      case "at":
        return <AlertCircle className="w-5 h-5" />;
      case "below":
        return <AlertCircle className="w-5 h-5" />;
    }
  };

  const groupedMeasures = cmsMeasures.reduce(
    (acc, measure) => {
      if (!acc[measure.category]) {
        acc[measure.category] = [];
      }
      acc[measure.category].push(measure);
      return acc;
    },
    {} as Record<string, CMSMeasure[]>,
  );

  if (loading) {
    return (
      <div
        className={`bg-white rounded-lg border border-gray-200 p-8 ${className}`}
      >
        <div className="flex items-center justify-center">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Key Metrics */}
      <div>
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          Key Quality Indicators
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {metrics.map((metric) => (
            <KPICard key={metric.id} metric={metric} />
          ))}
        </div>
      </div>

      {/* CMS Core Measures */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex items-center gap-2 mb-6">
          <Activity className="w-6 h-6 text-blue-600" />
          <h2 className="text-lg font-semibold text-gray-900">
            CMS Core Measures
          </h2>
        </div>

        <div className="space-y-6">
          {Object.entries(groupedMeasures).map(([category, measures]) => (
            <div key={category}>
              <h3 className="text-sm font-semibold text-gray-700 mb-3 uppercase tracking-wide">
                {category}
              </h3>
              <div className="space-y-3">
                {measures.map((measure) => (
                  <div
                    key={measure.id}
                    className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-center gap-4 flex-1">
                      <div
                        className={`p-2 rounded-lg ${getStatusColor(measure.status)}`}
                      >
                        {getStatusIcon(measure.status)}
                      </div>
                      <div className="flex-1">
                        <h4 className="font-medium text-gray-900">
                          {measure.name}
                        </h4>
                        <div className="flex items-center gap-4 mt-1 text-sm text-gray-500">
                          <span>Score: {measure.score}%</span>
                          <span>Benchmark: {measure.benchmark}%</span>
                          <span>Target: {measure.target}%</span>
                        </div>
                      </div>
                    </div>

                    {/* Performance Bar */}
                    <div className="w-48 ml-4">
                      <div className="relative h-2 bg-gray-200 rounded-full overflow-hidden">
                        <div
                          className={`absolute h-full rounded-full transition-all ${
                            measure.status === "above"
                              ? "bg-green-500"
                              : measure.status === "at"
                                ? "bg-yellow-500"
                                : "bg-red-500"
                          }`}
                          style={{
                            width: `${Math.min(100, (measure.score / measure.target) * 100)}%`,
                          }}
                        />
                        {/* Target marker */}
                        <div
                          className="absolute top-0 w-0.5 h-full bg-gray-900"
                          style={{
                            left: `${(measure.benchmark / measure.target) * 100}%`,
                          }}
                        />
                      </div>
                      <div className="flex justify-between text-xs text-gray-500 mt-1">
                        <span>0%</span>
                        <span>Target: {measure.target}%</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Performance Summary */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          Performance Summary
        </h2>
        <div className="grid grid-cols-3 gap-4">
          <div className="text-center p-4 bg-green-50 rounded-lg">
            <div className="text-3xl font-bold text-green-600">
              {cmsMeasures.filter((m) => m.status === "above").length}
            </div>
            <div className="text-sm text-gray-600 mt-1">Above Benchmark</div>
          </div>
          <div className="text-center p-4 bg-yellow-50 rounded-lg">
            <div className="text-3xl font-bold text-yellow-600">
              {cmsMeasures.filter((m) => m.status === "at").length}
            </div>
            <div className="text-sm text-gray-600 mt-1">At Benchmark</div>
          </div>
          <div className="text-center p-4 bg-red-50 rounded-lg">
            <div className="text-3xl font-bold text-red-600">
              {cmsMeasures.filter((m) => m.status === "below").length}
            </div>
            <div className="text-sm text-gray-600 mt-1">Below Benchmark</div>
          </div>
        </div>
      </div>
    </div>
  );
}
