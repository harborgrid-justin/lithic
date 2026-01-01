"use client";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";

interface QualityMeasureGaugeProps {
  measure: {
    id: string;
    name: string;
    description: string;
    rate: number;
    target: number;
    benchmark?: number;
    numerator: number;
    denominator: number;
    trend?: "IMPROVING" | "DECLINING" | "STABLE";
  };
}

export function QualityMeasureGauge({ measure }: QualityMeasureGaugeProps) {
  const percentage = measure.rate;
  const targetMet = measure.rate >= measure.target;

  const getGaugeColor = () => {
    if (targetMet) return "text-green-600";
    if (measure.rate >= measure.target * 0.9) return "text-yellow-600";
    return "text-red-600";
  };

  const getGaugeFillColor = () => {
    if (targetMet) return "bg-green-600";
    if (measure.rate >= measure.target * 0.9) return "bg-yellow-600";
    return "bg-red-600";
  };

  const getTrendIcon = () => {
    switch (measure.trend) {
      case "IMPROVING":
        return <TrendingUp className="w-4 h-4 text-green-600" />;
      case "DECLINING":
        return <TrendingDown className="w-4 h-4 text-red-600" />;
      default:
        return <Minus className="w-4 h-4 text-gray-600" />;
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="text-lg">{measure.name}</CardTitle>
            <CardDescription className="mt-1">
              {measure.description}
            </CardDescription>
          </div>
          {measure.trend && <div className="ml-4">{getTrendIcon()}</div>}
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Gauge Visualization */}
          <div className="relative">
            <div className="flex items-end justify-center mb-2">
              <div className={`text-4xl font-bold ${getGaugeColor()}`}>
                {percentage.toFixed(1)}%
              </div>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-4 overflow-hidden">
              <div
                className={`h-4 rounded-full transition-all duration-500 ${getGaugeFillColor()}`}
                style={{ width: `${Math.min(percentage, 100)}%` }}
              />
            </div>
            {/* Target marker */}
            <div
              className="absolute top-8 w-1 h-6 bg-gray-800"
              style={{ left: `${Math.min(measure.target, 100)}%` }}
            >
              <div className="absolute -top-6 left-1/2 transform -translate-x-1/2 text-xs text-gray-600 whitespace-nowrap">
                Target: {measure.target}%
              </div>
            </div>
          </div>

          {/* Statistics */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t">
            <div>
              <div className="text-xs text-gray-500">Numerator</div>
              <div className="text-lg font-semibold text-gray-900">
                {measure.numerator}
              </div>
            </div>
            <div>
              <div className="text-xs text-gray-500">Denominator</div>
              <div className="text-lg font-semibold text-gray-900">
                {measure.denominator}
              </div>
            </div>
            <div>
              <div className="text-xs text-gray-500">Target</div>
              <div className="text-lg font-semibold text-gray-900">
                {measure.target}%
              </div>
            </div>
            {measure.benchmark && (
              <div>
                <div className="text-xs text-gray-500">Benchmark</div>
                <div className="text-lg font-semibold text-gray-900">
                  {measure.benchmark}%
                </div>
              </div>
            )}
          </div>

          {/* Performance Status */}
          <div
            className={`p-3 rounded-lg ${targetMet ? "bg-green-50" : "bg-orange-50"}`}
          >
            <div
              className={`text-sm font-medium ${targetMet ? "text-green-800" : "text-orange-800"}`}
            >
              {targetMet ? "Target Met" : "Below Target"}
            </div>
            <div
              className={`text-xs mt-1 ${targetMet ? "text-green-600" : "text-orange-600"}`}
            >
              {targetMet
                ? `Exceeding target by ${(percentage - measure.target).toFixed(1)}%`
                : `Gap to target: ${(measure.target - percentage).toFixed(1)}%`}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
