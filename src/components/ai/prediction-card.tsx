/**
 * Prediction Card Component
 *
 * Display card for clinical predictions with:
 * - Risk visualization
 * - Trend display
 * - Action recommendations
 *
 * @component
 */

'use client';

import React from 'react';
import { TrendingUp, TrendingDown, AlertTriangle, Activity, ChevronRight } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';

export interface PredictionData {
  title: string;
  riskScore: number;
  riskLevel: 'low' | 'moderate' | 'high' | 'very_high' | 'critical';
  trend?: 'increasing' | 'decreasing' | 'stable';
  topFactors?: Array<{
    factor: string;
    contribution: number;
  }>;
  recommendations?: string[];
  lastUpdated?: Date;
}

interface PredictionCardProps {
  prediction: PredictionData;
  onViewDetails?: () => void;
  compact?: boolean;
}

export function PredictionCard({
  prediction,
  onViewDetails,
  compact = false,
}: PredictionCardProps) {
  /**
   * Get risk level styling
   */
  const getRiskStyle = (level: PredictionData['riskLevel']) => {
    switch (level) {
      case 'low':
        return {
          color: 'text-green-700',
          bg: 'bg-green-50',
          border: 'border-green-200',
          badge: 'bg-green-100 text-green-800',
        };
      case 'moderate':
        return {
          color: 'text-yellow-700',
          bg: 'bg-yellow-50',
          border: 'border-yellow-200',
          badge: 'bg-yellow-100 text-yellow-800',
        };
      case 'high':
        return {
          color: 'text-orange-700',
          bg: 'bg-orange-50',
          border: 'border-orange-200',
          badge: 'bg-orange-100 text-orange-800',
        };
      case 'very_high':
      case 'critical':
        return {
          color: 'text-red-700',
          bg: 'bg-red-50',
          border: 'border-red-200',
          badge: 'bg-red-100 text-red-800',
        };
    }
  };

  /**
   * Get trend icon
   */
  const getTrendIcon = (trend?: PredictionData['trend']) => {
    switch (trend) {
      case 'increasing':
        return <TrendingUp className="h-4 w-4 text-red-600" />;
      case 'decreasing':
        return <TrendingDown className="h-4 w-4 text-green-600" />;
      case 'stable':
        return <Activity className="h-4 w-4 text-gray-600" />;
      default:
        return null;
    }
  };

  const style = getRiskStyle(prediction.riskLevel);

  if (compact) {
    return (
      <div
        className={`flex items-center justify-between p-3 rounded-lg border ${style.border} ${style.bg}`}
      >
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-full ${style.badge}`}>
            <AlertTriangle className="h-4 w-4" />
          </div>
          <div>
            <p className="font-medium text-sm">{prediction.title}</p>
            <div className="flex items-center gap-2 mt-1">
              <Badge className={style.badge} variant="outline">
                {prediction.riskLevel.replace('_', ' ').toUpperCase()}
              </Badge>
              <span className="text-xs text-muted-foreground">
                {prediction.riskScore}%
              </span>
            </div>
          </div>
        </div>
        {onViewDetails && (
          <Button size="sm" variant="ghost" onClick={onViewDetails}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        )}
      </div>
    );
  }

  return (
    <Card className={`p-6 border-l-4 ${style.border}`}>
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold mb-1">{prediction.title}</h3>
          <div className="flex items-center gap-2">
            <Badge className={style.badge}>
              {prediction.riskLevel.replace('_', ' ').toUpperCase()}
            </Badge>
            {prediction.trend && (
              <div className="flex items-center gap-1">
                {getTrendIcon(prediction.trend)}
                <span className="text-xs text-muted-foreground">
                  {prediction.trend}
                </span>
              </div>
            )}
          </div>
        </div>
        <div className={`text-3xl font-bold ${style.color}`}>
          {prediction.riskScore}
          <span className="text-lg">%</span>
        </div>
      </div>

      {/* Risk Score Progress */}
      <div className="mb-4">
        <div className="flex justify-between text-sm mb-2">
          <span className="text-muted-foreground">Risk Score</span>
          <span className="font-medium">{prediction.riskScore}/100</span>
        </div>
        <Progress
          value={prediction.riskScore}
          className="h-2"
          indicatorClassName={
            prediction.riskScore > 75
              ? 'bg-red-600'
              : prediction.riskScore > 50
              ? 'bg-orange-600'
              : prediction.riskScore > 25
              ? 'bg-yellow-600'
              : 'bg-green-600'
          }
        />
      </div>

      {/* Top Risk Factors */}
      {prediction.topFactors && prediction.topFactors.length > 0 && (
        <div className="mb-4">
          <h4 className="text-sm font-medium mb-2">Top Risk Factors</h4>
          <div className="space-y-2">
            {prediction.topFactors.slice(0, 3).map((factor, index) => (
              <div key={index} className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">
                  {factor.factor}
                </span>
                <Badge variant="secondary" className="text-xs">
                  {Math.abs(factor.contribution * 100).toFixed(0)}%
                </Badge>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recommendations */}
      {prediction.recommendations && prediction.recommendations.length > 0 && (
        <div className="mb-4">
          <h4 className="text-sm font-medium mb-2">Recommendations</h4>
          <ul className="space-y-1">
            {prediction.recommendations.slice(0, 3).map((rec, index) => (
              <li key={index} className="text-sm text-muted-foreground flex gap-2">
                <span className="text-primary">•</span>
                <span>{rec}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between pt-4 border-t">
        <span className="text-xs text-muted-foreground">
          {prediction.lastUpdated
            ? `Updated ${new Date(prediction.lastUpdated).toLocaleDateString()}`
            : 'Real-time prediction'}
        </span>
        {onViewDetails && (
          <Button size="sm" variant="outline" onClick={onViewDetails}>
            View Details
            <ChevronRight className="ml-1 h-4 w-4" />
          </Button>
        )}
      </div>
    </Card>
  );
}
