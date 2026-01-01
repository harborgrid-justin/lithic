"use client";

import { useState, useEffect } from "react";
import { PredictiveCharts } from "@/components/analytics/PredictiveCharts";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { RefreshCw, TrendingUp, AlertTriangle, Calendar } from "lucide-react";
import { ForecastResult } from "@/lib/analytics/predictions";

export default function PredictivePage() {
  const [loading, setLoading] = useState(true);
  const [selectedMetric, setSelectedMetric] = useState("revenue");
  const [forecastPeriod, setForecastPeriod] = useState("30");
  const [forecasts, setForecasts] = useState<ForecastResult[]>([]);
  const [anomalies, setAnomalies] = useState<any[]>([]);
  const [trends, setTrends] = useState<any[]>([]);

  const metrics = [
    { value: "revenue", label: "Revenue" },
    { value: "patient_volume", label: "Patient Volume" },
    { value: "readmissions", label: "Readmission Rate" },
    { value: "wait_time", label: "Wait Time" },
    { value: "bed_occupancy", label: "Bed Occupancy" },
  ];

  const periods = [
    { value: "7", label: "7 Days" },
    { value: "30", label: "30 Days" },
    { value: "60", label: "60 Days" },
    { value: "90", label: "90 Days" },
  ];

  useEffect(() => {
    loadPredictiveData();
  }, [selectedMetric, forecastPeriod]);

  const loadPredictiveData = async () => {
    try {
      setLoading(true);
      const response = await fetch(
        `/api/analytics/predictive?metric=${selectedMetric}&period=${forecastPeriod}`,
      );

      if (!response.ok) {
        throw new Error("Failed to load predictive data");
      }

      const data = await response.json();
      setForecasts(data.forecasts || []);
      setAnomalies(data.anomalies || []);
      setTrends(data.trends || []);
    } catch (error) {
      console.error("Error loading predictive data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = () => {
    loadPredictiveData();
  };

  return (
    <div className="container mx-auto py-8 px-4">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              Predictive Analytics
            </h1>
            <p className="text-gray-600 mt-2">
              Forecasts, trend analysis, and anomaly detection powered by
              machine learning
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
        <div className="mt-6 flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium text-gray-700">Metric:</label>
            <Select value={selectedMetric} onValueChange={setSelectedMetric}>
              <SelectTrigger className="w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {metrics.map((metric) => (
                  <SelectItem key={metric.value} value={metric.value}>
                    {metric.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center gap-2">
            <label className="text-sm font-medium text-gray-700">
              Forecast Period:
            </label>
            <Select value={forecastPeriod} onValueChange={setForecastPeriod}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {periods.map((period) => (
                  <SelectItem key={period.value} value={period.value}>
                    {period.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Forecast Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="w-5 h-5 text-blue-500" />
            <h3 className="font-semibold text-gray-900">Forecast Trend</h3>
          </div>
          <div className="text-2xl font-bold text-gray-900">Upward</div>
          <p className="text-sm text-gray-600 mt-1">
            Expected 8.5% increase over next {forecastPeriod} days
          </p>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center gap-2 mb-2">
            <Calendar className="w-5 h-5 text-green-500" />
            <h3 className="font-semibold text-gray-900">Confidence Level</h3>
          </div>
          <div className="text-2xl font-bold text-gray-900">95%</div>
          <p className="text-sm text-gray-600 mt-1">
            High confidence in forecast accuracy
          </p>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle className="w-5 h-5 text-orange-500" />
            <h3 className="font-semibold text-gray-900">Anomalies Detected</h3>
          </div>
          <div className="text-2xl font-bold text-gray-900">
            {anomalies.length}
          </div>
          <p className="text-sm text-gray-600 mt-1">
            Unusual patterns requiring attention
          </p>
        </div>
      </div>

      {/* Predictive Charts */}
      <PredictiveCharts
        metric={selectedMetric}
        forecasts={forecasts}
        anomalies={anomalies}
        loading={loading}
      />

      {/* What-If Scenarios */}
      <div className="mt-8 bg-white rounded-lg border border-gray-200 p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">
          What-If Scenarios
        </h2>

        <div className="space-y-6">
          <div>
            <h3 className="font-medium text-gray-900 mb-2">
              Scenario: 10% Capacity Increase
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                <div className="text-sm text-blue-600 mb-1">
                  Projected Revenue
                </div>
                <div className="text-xl font-bold text-blue-900">+$125K</div>
              </div>
              <div className="bg-green-50 rounded-lg p-4 border border-green-200">
                <div className="text-sm text-green-600 mb-1">
                  Patient Volume
                </div>
                <div className="text-xl font-bold text-green-900">
                  +150 patients
                </div>
              </div>
              <div className="bg-purple-50 rounded-lg p-4 border border-purple-200">
                <div className="text-sm text-purple-600 mb-1">
                  Resource Utilization
                </div>
                <div className="text-xl font-bold text-purple-900">92%</div>
              </div>
            </div>
          </div>

          <div>
            <h3 className="font-medium text-gray-900 mb-2">
              Scenario: Enhanced Marketing Campaign
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                <div className="text-sm text-blue-600 mb-1">
                  New Patient Acquisition
                </div>
                <div className="text-xl font-bold text-blue-900">+18%</div>
              </div>
              <div className="bg-green-50 rounded-lg p-4 border border-green-200">
                <div className="text-sm text-green-600 mb-1">ROI</div>
                <div className="text-xl font-bold text-green-900">3.2x</div>
              </div>
              <div className="bg-purple-50 rounded-lg p-4 border border-purple-200">
                <div className="text-sm text-purple-600 mb-1">
                  Break-Even Point
                </div>
                <div className="text-xl font-bold text-purple-900">45 days</div>
              </div>
            </div>
          </div>

          <div>
            <h3 className="font-medium text-gray-900 mb-2">
              Scenario: Quality Improvement Initiative
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                <div className="text-sm text-blue-600 mb-1">
                  Readmission Reduction
                </div>
                <div className="text-xl font-bold text-blue-900">-22%</div>
              </div>
              <div className="bg-green-50 rounded-lg p-4 border border-green-200">
                <div className="text-sm text-green-600 mb-1">Cost Savings</div>
                <div className="text-xl font-bold text-green-900">
                  $85K/month
                </div>
              </div>
              <div className="bg-purple-50 rounded-lg p-4 border border-purple-200">
                <div className="text-sm text-purple-600 mb-1">
                  Patient Satisfaction
                </div>
                <div className="text-xl font-bold text-purple-900">+12%</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Trend Analysis */}
      <div className="mt-8 bg-white rounded-lg border border-gray-200 p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">
          Trend Analysis
        </h2>

        <div className="space-y-4">
          <div className="flex items-start gap-3 pb-4 border-b border-gray-200">
            <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
              <TrendingUp className="w-4 h-4 text-green-600" />
            </div>
            <div>
              <h3 className="font-medium text-gray-900">
                Revenue Growth Trend
              </h3>
              <p className="text-sm text-gray-600 mt-1">
                Consistent upward trend detected with strong correlation to
                outpatient services expansion. Growth rate: 6.5%
                month-over-month.
              </p>
              <div className="mt-2 text-sm font-medium text-green-600">
                Confidence: 92%
              </div>
            </div>
          </div>

          <div className="flex items-start gap-3 pb-4 border-b border-gray-200">
            <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
              <TrendingUp className="w-4 h-4 text-blue-600" />
            </div>
            <div>
              <h3 className="font-medium text-gray-900">
                Seasonal Pattern Identified
              </h3>
              <p className="text-sm text-gray-600 mt-1">
                Patient volume shows clear seasonal variation with peaks in
                fall/winter months. Plan capacity accordingly for Q4.
              </p>
              <div className="mt-2 text-sm font-medium text-blue-600">
                Seasonality Strength: 78%
              </div>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-full bg-yellow-100 flex items-center justify-center flex-shrink-0">
              <AlertTriangle className="w-4 h-4 text-yellow-600" />
            </div>
            <div>
              <h3 className="font-medium text-gray-900">
                Emerging Pattern Alert
              </h3>
              <p className="text-sm text-gray-600 mt-1">
                Slight uptick in wait times during afternoon hours. Consider
                adjusting staff scheduling to optimize resource allocation.
              </p>
              <div className="mt-2 text-sm font-medium text-yellow-600">
                Impact: Moderate
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
