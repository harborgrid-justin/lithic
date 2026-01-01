/**
 * OR Demand Forecasting
 * Forecasts demand, capacity planning, and bottleneck identification
 */

import { addDays, addMonths, differenceInDays, format } from "date-fns";
import type { SurgicalCase, OperatingRoom } from "@/types/or-management";

export interface DemandForecast {
  date: Date;
  predictedCases: number;
  predictedMinutes: number;
  confidence: number;
  seasonalityFactor: number;
  trendFactor: number;
}

export interface CapacityPlan {
  period: { start: Date; end: Date };
  totalCapacity: number;
  predictedDemand: number;
  utilizationForecast: number;
  surplus: number;
  deficit: number;
  recommendations: string[];
}

export interface Bottleneck {
  type: "ROOM" | "STAFF" | "EQUIPMENT" | "TIME";
  resource: string;
  severity: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  impact: string;
  resolution: string;
}

export class ForecastingEngine {
  forecastDemand(
    historicalCases: SurgicalCase[],
    forecastDate: Date,
    lookbackDays: number = 90
  ): DemandForecast {
    const historicalData = this.prepareHistoricalData(
      historicalCases,
      lookbackDays
    );

    const avgCasesPerDay = historicalData.reduce(
      (sum, d) => sum + d.cases,
      0
    ) / historicalData.length;

    const avgMinutesPerDay = historicalData.reduce(
      (sum, d) => sum + d.minutes,
      0
    ) / historicalData.length;

    // Calculate trend
    const trendFactor = this.calculateTrend(historicalData);

    // Calculate seasonality
    const seasonalityFactor = this.calculateSeasonality(forecastDate);

    // Apply factors
    const predictedCases = Math.round(
      avgCasesPerDay * trendFactor * seasonalityFactor
    );
    const predictedMinutes = Math.round(
      avgMinutesPerDay * trendFactor * seasonalityFactor
    );

    // Calculate confidence based on data consistency
    const confidence = this.calculateConfidence(historicalData);

    return {
      date: forecastDate,
      predictedCases,
      predictedMinutes,
      confidence,
      seasonalityFactor,
      trendFactor,
    };
  }

  planCapacity(
    rooms: OperatingRoom[],
    forecasts: DemandForecast[],
    startDate: Date,
    endDate: Date
  ): CapacityPlan {
    const activeRooms = rooms.filter((r) => r.isActive);
    const dailyCapacity = activeRooms.length * 11 * 60; // 11 hours per room

    const totalDays = differenceInDays(endDate, startDate) + 1;
    const totalCapacity = dailyCapacity * totalDays;

    const predictedDemand = forecasts.reduce(
      (sum, f) => sum + f.predictedMinutes,
      0
    );

    const utilizationForecast = (predictedDemand / totalCapacity) * 100;
    const surplus = totalCapacity > predictedDemand ? totalCapacity - predictedDemand : 0;
    const deficit = predictedDemand > totalCapacity ? predictedDemand - totalCapacity : 0;

    const recommendations: string[] = [];

    if (utilizationForecast > 90) {
      recommendations.push("Consider adding OR capacity or extending hours");
      recommendations.push("Review block schedules for optimization opportunities");
    } else if (utilizationForecast < 70) {
      recommendations.push("Capacity may be underutilized");
      recommendations.push("Consider consolidating OR blocks");
    }

    if (deficit > 0) {
      const additionalRoomsNeeded = Math.ceil(deficit / (11 * 60 * totalDays));
      recommendations.push(`Need approximately ${additionalRoomsNeeded} additional OR(s)`);
    }

    return {
      period: { start: startDate, end: endDate },
      totalCapacity,
      predictedDemand,
      utilizationForecast,
      surplus,
      deficit,
      recommendations,
    };
  }

  identifyBottlenecks(
    cases: SurgicalCase[],
    rooms: OperatingRoom[]
  ): Bottleneck[] {
    const bottlenecks: Bottleneck[] = [];

    // Check for time bottlenecks (peak hours)
    const hourCounts = new Map<number, number>();
    cases.forEach((c) => {
      const hour = new Date(c.scheduledStartTime).getHours();
      hourCounts.set(hour, (hourCounts.get(hour) || 0) + 1);
    });

    const maxCasesPerHour = Math.max(...Array.from(hourCounts.values()));
    if (maxCasesPerHour > rooms.length * 0.8) {
      bottlenecks.push({
        type: "TIME",
        resource: "Peak hours (7-9 AM)",
        severity: "HIGH",
        impact: "High demand during prime time hours",
        resolution: "Consider staggered start times or additional capacity",
      });
    }

    // Check for room type bottlenecks
    const roomTypeCounts = new Map<string, number>();
    cases.forEach((c) => {
      const room = rooms.find((r) => r.id === c.roomId);
      if (room) {
        roomTypeCounts.set(room.type, (roomTypeCounts.get(room.type) || 0) + 1);
      }
    });

    // Check equipment bottlenecks (simplified)
    const equipmentCounts = new Map<string, number>();
    cases.forEach((c) => {
      c.equipmentNeeded.forEach((eq) => {
        if (eq.required) {
          equipmentCounts.set(
            eq.equipmentName,
            (equipmentCounts.get(eq.equipmentName) || 0) + 1
          );
        }
      });
    });

    const topEquipment = Array.from(equipmentCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3);

    topEquipment.forEach(([equipment, count]) => {
      if (count > cases.length * 0.3) {
        bottlenecks.push({
          type: "EQUIPMENT",
          resource: equipment,
          severity: "MEDIUM",
          impact: `High demand for ${equipment}`,
          resolution: "Consider acquiring additional units",
        });
      }
    });

    return bottlenecks;
  }

  private prepareHistoricalData(
    cases: SurgicalCase[],
    lookbackDays: number
  ): Array<{ date: string; cases: number; minutes: number }> {
    const data: Array<{ date: string; cases: number; minutes: number }> = [];
    const cutoffDate = addDays(new Date(), -lookbackDays);

    const casesByDate = new Map<string, SurgicalCase[]>();
    cases.forEach((c) => {
      const caseDate = new Date(c.scheduledDate);
      if (caseDate >= cutoffDate) {
        const dateKey = format(caseDate, "yyyy-MM-dd");
        if (!casesByDate.has(dateKey)) {
          casesByDate.set(dateKey, []);
        }
        casesByDate.get(dateKey)!.push(c);
      }
    });

    casesByDate.forEach((casesOnDate, dateKey) => {
      data.push({
        date: dateKey,
        cases: casesOnDate.length,
        minutes: casesOnDate.reduce((sum, c) => sum + c.estimatedDuration, 0),
      });
    });

    return data.sort((a, b) => a.date.localeCompare(b.date));
  }

  private calculateTrend(
    historicalData: Array<{ date: string; cases: number; minutes: number }>
  ): number {
    if (historicalData.length < 7) return 1.0;

    const recentAvg =
      historicalData.slice(-7).reduce((sum, d) => sum + d.cases, 0) / 7;
    const olderAvg =
      historicalData.slice(0, 7).reduce((sum, d) => sum + d.cases, 0) / 7;

    return olderAvg > 0 ? recentAvg / olderAvg : 1.0;
  }

  private calculateSeasonality(date: Date): number {
    const month = date.getMonth();

    // Healthcare seasonality: typically lower in summer, higher in fall/winter
    const seasonalFactors = [
      1.05, // Jan
      1.03, // Feb
      1.0, // Mar
      0.98, // Apr
      0.96, // May
      0.92, // Jun
      0.90, // Jul
      0.94, // Aug
      1.02, // Sep
      1.05, // Oct
      1.03, // Nov
      0.98, // Dec
    ];

    return seasonalFactors[month];
  }

  private calculateConfidence(
    historicalData: Array<{ date: string; cases: number; minutes: number }>
  ): number {
    if (historicalData.length < 14) return 50;

    const values = historicalData.map((d) => d.cases);
    const mean = values.reduce((sum, v) => sum + v, 0) / values.length;
    const variance =
      values.reduce((sum, v) => sum + Math.pow(v - mean, 2), 0) / values.length;
    const stdDev = Math.sqrt(variance);
    const coefficientOfVariation = stdDev / mean;

    // Lower variation = higher confidence
    const confidence = Math.max(50, Math.min(95, 95 - coefficientOfVariation * 100));

    return Math.round(confidence);
  }
}

let engineInstance: ForecastingEngine | null = null;

export function getForecastingEngine(): ForecastingEngine {
  if (!engineInstance) {
    engineInstance = new ForecastingEngine();
  }
  return engineInstance;
}
