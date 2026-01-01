"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Award, TrendingUp, TrendingDown, AlertCircle } from "lucide-react";

interface MIPSScorecardProps {
  npi: string;
  performanceYear: number;
}

export function MIPSScorecard({ npi, performanceYear }: MIPSScorecardProps) {
  // Mock data - would come from API
  const finalScore = {
    performanceYear,
    clinicianNPI: npi,
    qualityScore: 80.8,
    costScore: 75.0,
    iaScore: 100,
    piScore: 100,
    qualityWeight: 0.30,
    costWeight: 0.30,
    iaWeight: 0.15,
    piWeight: 0.25,
    finalScore: 86.74,
    paymentAdjustmentPercent: 6.2,
    paymentAdjustmentDirection: "positive" as const,
    performanceThreshold: 75,
    exceptionalPerformanceThreshold: 89,
    meetsPerformanceThreshold: true,
    achievesExceptionalPerformance: false,
  };

  const categories = [
    {
      name: "Quality",
      score: finalScore.qualityScore,
      weight: finalScore.qualityWeight,
      weighted: finalScore.qualityScore * finalScore.qualityWeight,
      icon: Award,
      color: "blue",
    },
    {
      name: "Cost",
      score: finalScore.costScore,
      weight: finalScore.costWeight,
      weighted: finalScore.costScore * finalScore.costWeight,
      icon: TrendingDown,
      color: "green",
    },
    {
      name: "Improvement Activities",
      score: finalScore.iaScore,
      weight: finalScore.iaWeight,
      weighted: finalScore.iaScore * finalScore.iaWeight,
      icon: TrendingUp,
      color: "purple",
    },
    {
      name: "Promoting Interoperability",
      score: finalScore.piScore,
      weight: finalScore.piWeight,
      weighted: finalScore.piScore * finalScore.piWeight,
      icon: AlertCircle,
      color: "orange",
    },
  ];

  const paymentYear = performanceYear + 2;
  const estimatedPayments = 500000;
  const adjustmentDollars = estimatedPayments * (finalScore.paymentAdjustmentPercent / 100);

  return (
    <div className="space-y-6">
      {/* Final Score Card */}
      <Card className="border-2 border-blue-200 bg-gradient-to-br from-blue-50 to-white">
        <CardHeader>
          <CardTitle className="text-2xl">MIPS Final Score</CardTitle>
          <CardDescription>
            Performance Year {performanceYear} - Payment Adjustment in {paymentYear}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between mb-6">
            <div>
              <div className="text-6xl font-bold text-blue-600">
                {finalScore.finalScore.toFixed(2)}
              </div>
              <div className="text-sm text-gray-600 mt-2">Out of 100 points</div>
            </div>
            <div className="text-right">
              <div className="flex items-center gap-2 text-green-600 mb-2">
                <TrendingUp className="w-6 h-6" />
                <span className="text-3xl font-bold">
                  +{finalScore.paymentAdjustmentPercent.toFixed(2)}%
                </span>
              </div>
              <div className="text-sm text-gray-600">Payment Adjustment</div>
              <div className="text-lg font-semibold text-green-600 mt-1">
                +${adjustmentDollars.toLocaleString()}
              </div>
            </div>
          </div>

          {/* Threshold Indicators */}
          <div className="relative pt-6">
            <div className="absolute top-0 left-0 right-0 h-3 bg-gray-200 rounded-full overflow-hidden">
              <div
                className="absolute h-full bg-gradient-to-r from-red-500 via-yellow-500 to-green-500"
                style={{ width: '100%' }}
              />
              <div
                className="absolute h-full w-1 bg-blue-600"
                style={{ left: `${finalScore.finalScore}%` }}
              />
            </div>

            <div className="flex justify-between mt-6 text-xs text-gray-600">
              <div className="text-center">
                <div className="font-medium">0</div>
                <div>Minimum</div>
              </div>
              <div className="text-center">
                <div className="font-medium">{finalScore.performanceThreshold}</div>
                <div>Performance Threshold</div>
              </div>
              <div className="text-center">
                <div className="font-medium">{finalScore.exceptionalPerformanceThreshold}</div>
                <div>Exceptional Performance</div>
              </div>
              <div className="text-center">
                <div className="font-medium">100</div>
                <div>Maximum</div>
              </div>
            </div>
          </div>

          {finalScore.meetsPerformanceThreshold && (
            <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex items-center gap-2 text-green-800">
                <TrendingUp className="w-5 h-5" />
                <span className="font-semibold">Meets Performance Threshold</span>
              </div>
              <p className="text-sm text-green-700 mt-1">
                {finalScore.achievesExceptionalPerformance
                  ? "Achieves exceptional performance! Maximum positive adjustment applied."
                  : `${(finalScore.exceptionalPerformanceThreshold - finalScore.finalScore).toFixed(1)} points away from exceptional performance.`}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Category Breakdown */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {categories.map((category, idx) => {
          const Icon = category.icon;
          const colorMap: Record<string, string> = {
            blue: "text-blue-600 bg-blue-50 border-blue-200",
            green: "text-green-600 bg-green-50 border-green-200",
            purple: "text-purple-600 bg-purple-50 border-purple-200",
            orange: "text-orange-600 bg-orange-50 border-orange-200",
          };

          return (
            <Card key={idx} className={`border-2 ${colorMap[category.color]}`}>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-medium">{category.name}</CardTitle>
                  <Icon className={`w-4 h-4 ${colorMap[category.color].split(' ')[0]}`} />
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div>
                    <div className="text-2xl font-bold">{category.score.toFixed(1)}%</div>
                    <div className="text-xs text-gray-500">Category Score</div>
                  </div>
                  <div className="border-t pt-2">
                    <div className="text-sm text-gray-600">
                      Weight: {(category.weight * 100).toFixed(0)}%
                    </div>
                    <div className="text-lg font-semibold">
                      {category.weighted.toFixed(2)} pts
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Detailed Category Performance */}
      <Card>
        <CardHeader>
          <CardTitle>Category Performance Details</CardTitle>
          <CardDescription>
            Weighted contribution to final score
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {categories.map((category, idx) => (
              <div key={idx} className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-3 h-3 rounded-full ${category.color === 'blue' ? 'bg-blue-500' : category.color === 'green' ? 'bg-green-500' : category.color === 'purple' ? 'bg-purple-500' : 'bg-orange-500'}`} />
                    <span className="font-medium">{category.name}</span>
                  </div>
                  <div className="flex items-center gap-6">
                    <span className="text-sm text-gray-600">
                      {category.score.toFixed(1)}% × {(category.weight * 100).toFixed(0)}%
                    </span>
                    <span className="text-lg font-semibold min-w-[80px] text-right">
                      {category.weighted.toFixed(2)} pts
                    </span>
                  </div>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full ${category.color === 'blue' ? 'bg-blue-500' : category.color === 'green' ? 'bg-green-500' : category.color === 'purple' ? 'bg-purple-500' : 'bg-orange-500'}`}
                    style={{ width: `${category.weighted}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Recommendations */}
      <Card>
        <CardHeader>
          <CardTitle>Improvement Opportunities</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-start gap-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5" />
              <div>
                <div className="font-medium text-blue-900">Cost Category Performance</div>
                <p className="text-sm text-blue-700 mt-1">
                  At 75%, this is your lowest category. Improving cost performance by 10% would add 3 points to your final score.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3 bg-green-50 border border-green-200 rounded-lg">
              <TrendingUp className="w-5 h-5 text-green-600 mt-0.5" />
              <div>
                <div className="font-medium text-green-900">Quality Score Opportunity</div>
                <p className="text-sm text-green-700 mt-1">
                  You're {(finalScore.exceptionalPerformanceThreshold - finalScore.finalScore).toFixed(1)} points from exceptional performance.
                  Focus on 2-3 underperforming quality measures.
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
