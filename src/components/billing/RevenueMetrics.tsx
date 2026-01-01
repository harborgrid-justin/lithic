"use client";

/**
 * Lithic Enterprise v0.3 - Revenue Metrics Component
 */

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, TrendingDown, DollarSign, Clock, PercentSquare, AlertCircle } from "lucide-react";

interface RevenueMetricsProps {
  metrics: {
    netRevenue: number;
    collectionRate: number;
    daysInAR: number;
    denialRate: number;
    cleanClaimRate: number;
  };
}

export function RevenueMetrics({ metrics }: RevenueMetricsProps) {
  const cards = [
    {
      title: "Net Revenue",
      value: `$${metrics.netRevenue.toLocaleString()}`,
      icon: DollarSign,
      color: "text-green-600",
      bgColor: "bg-green-100",
    },
    {
      title: "Collection Rate",
      value: `${metrics.collectionRate.toFixed(1)}%`,
      icon: TrendingUp,
      color: "text-blue-600",
      bgColor: "bg-blue-100",
      target: "Target: 95%",
    },
    {
      title: "Days in A/R",
      value: metrics.daysInAR.toString(),
      icon: Clock,
      color: "text-orange-600",
      bgColor: "bg-orange-100",
      target: "Target: < 45",
    },
    {
      title: "Denial Rate",
      value: `${metrics.denialRate.toFixed(1)}%`,
      icon: AlertCircle,
      color: "text-red-600",
      bgColor: "bg-red-100",
      target: "Target: < 5%",
    },
    {
      title: "Clean Claim Rate",
      value: `${metrics.cleanClaimRate.toFixed(1)}%`,
      icon: PercentSquare,
      color: "text-purple-600",
      bgColor: "bg-purple-100",
      target: "Target: > 95%",
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
      {cards.map((card) => {
        const Icon = card.icon;
        return (
          <Card key={card.title}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500 font-medium">
                    {card.title}
                  </p>
                  <p className="text-2xl font-bold mt-2">{card.value}</p>
                  {card.target && (
                    <p className="text-xs text-gray-500 mt-1">{card.target}</p>
                  )}
                </div>
                <div className={`p-3 rounded-full ${card.bgColor}`}>
                  <Icon className={`h-6 w-6 ${card.color}`} />
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
