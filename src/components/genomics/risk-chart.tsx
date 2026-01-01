'use client';

import { useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { TrendingUp, TrendingDown, Minus, AlertTriangle } from 'lucide-react';

interface RiskScore {
  condition: string;
  score: number;
  percentile: number;
  riskCategory: 'very_low' | 'low' | 'average' | 'high' | 'very_high';
  relativeRisk: number;
  absoluteRisk?: number;
}

interface RiskChartProps {
  risks: RiskScore[];
  loading?: boolean;
}

export function RiskChart({ risks, loading = false }: RiskChartProps) {
  const sortedRisks = useMemo(() => {
    return [...risks].sort((a, b) => b.percentile - a.percentile);
  }, [risks]);

  const getRiskColor = (category: string) => {
    const colors: Record<string, { bg: string; text: string; border: string }> = {
      very_high: { bg: 'bg-red-100', text: 'text-red-800', border: 'border-red-300' },
      high: { bg: 'bg-orange-100', text: 'text-orange-800', border: 'border-orange-300' },
      average: { bg: 'bg-gray-100', text: 'text-gray-800', border: 'border-gray-300' },
      low: { bg: 'bg-blue-100', text: 'text-blue-800', border: 'border-blue-300' },
      very_low: { bg: 'bg-green-100', text: 'text-green-800', border: 'border-green-300' },
    };
    return colors[category] || colors.average;
  };

  const getRiskIcon = (category: string) => {
    if (category === 'very_high' || category === 'high') {
      return <TrendingUp className="h-4 w-4" />;
    } else if (category === 'very_low' || category === 'low') {
      return <TrendingDown className="h-4 w-4" />;
    }
    return <Minus className="h-4 w-4" />;
  };

  const getProgressColor = (percentile: number) => {
    if (percentile >= 95) return 'bg-red-500';
    if (percentile >= 75) return 'bg-orange-500';
    if (percentile >= 25) return 'bg-blue-500';
    return 'bg-green-500';
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            <span className="ml-3 text-muted-foreground">Calculating genetic risk...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  const highRiskCount = risks.filter(
    (r) => r.riskCategory === 'high' || r.riskCategory === 'very_high'
  ).length;

  return (
    <div className="space-y-4">
      {highRiskCount > 0 && (
        <Card className="border-orange-300 bg-orange-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-orange-900">
              <AlertTriangle className="h-5 w-5" />
              High Risk Conditions Detected
            </CardTitle>
            <CardDescription className="text-orange-700">
              You have {highRiskCount} condition(s) with elevated genetic risk. Review the details below and discuss with your healthcare provider.
            </CardDescription>
          </CardHeader>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Polygenic Risk Scores</CardTitle>
          <CardDescription>
            Your genetic risk compared to the general population
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {sortedRisks.map((risk, index) => {
              const colors = getRiskColor(risk.riskCategory);
              return (
                <div key={index} className="space-y-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="font-semibold text-lg">{risk.condition}</div>
                      <div className="text-sm text-muted-foreground mt-1">
                        Relative Risk: {risk.relativeRisk.toFixed(2)}x
                        {risk.absoluteRisk && (
                          <span className="ml-2">
                            | Lifetime Risk: {(risk.absoluteRisk * 100).toFixed(1)}%
                          </span>
                        )}
                      </div>
                    </div>
                    <Badge className={`${colors.bg} ${colors.text} border-0 flex items-center gap-1`}>
                      {getRiskIcon(risk.riskCategory)}
                      {risk.riskCategory.replace('_', ' ')}
                    </Badge>
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Genetic Risk Percentile</span>
                      <span className="font-medium">{risk.percentile.toFixed(1)}th percentile</span>
                    </div>

                    <div className="relative">
                      <Progress value={risk.percentile} className="h-3" />
                      <div
                        className={`absolute top-0 left-0 h-3 rounded-full ${getProgressColor(risk.percentile)}`}
                        style={{ width: `${risk.percentile}%` }}
                      />

                      {/* Reference markers */}
                      <div className="absolute inset-0 flex justify-between px-1 pointer-events-none">
                        <div className="w-px h-3 bg-gray-300" style={{ marginLeft: '25%' }} />
                        <div className="w-px h-3 bg-gray-300" style={{ marginLeft: '25%' }} />
                        <div className="w-px h-3 bg-gray-300" style={{ marginLeft: '25%' }} />
                      </div>
                    </div>

                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>Low Risk</span>
                      <span>Average</span>
                      <span>High Risk</span>
                    </div>
                  </div>

                  <div className="text-sm text-muted-foreground">
                    {risk.percentile >= 95 && (
                      <p>
                        Your genetic risk is higher than 95% of the population. Enhanced screening and
                        preventive measures are recommended.
                      </p>
                    )}
                    {risk.percentile >= 75 && risk.percentile < 95 && (
                      <p>
                        Your genetic risk is higher than average. Discuss preventive strategies with
                        your healthcare provider.
                      </p>
                    )}
                    {risk.percentile < 25 && (
                      <p>
                        Your genetic risk is lower than average. Continue with standard screening
                        guidelines.
                      </p>
                    )}
                  </div>

                  {index < sortedRisks.length - 1 && <div className="border-t pt-3" />}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Risk Distribution */}
      <Card>
        <CardHeader>
          <CardTitle>Risk Distribution</CardTitle>
          <CardDescription>Summary of your genetic risk profile</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            {['very_low', 'low', 'average', 'high', 'very_high'].map((category) => {
              const count = risks.filter((r) => r.riskCategory === category).length;
              const colors = getRiskColor(category);

              return (
                <div
                  key={category}
                  className={`p-4 rounded-lg border ${colors.border} ${colors.bg}`}
                >
                  <div className={`text-2xl font-bold ${colors.text}`}>{count}</div>
                  <div className={`text-xs ${colors.text} capitalize mt-1`}>
                    {category.replace('_', ' ')}
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Disclaimer */}
      <Card>
        <CardContent className="pt-6">
          <p className="text-sm text-muted-foreground">
            <strong>Important:</strong> These risk scores represent genetic factors only. Your actual
            risk depends on many factors including lifestyle, environment, and family history. Always
            consult with a healthcare professional to interpret these results in the context of your
            overall health.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
