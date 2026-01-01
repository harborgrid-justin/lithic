/**
 * Surgeon Performance Analytics
 * Tracks surgeon metrics, on-time starts, and turnover times
 */

import { differenceInMinutes } from "date-fns";
import type { SurgeonPerformance, SurgicalCase, CaseStatus } from "@/types/or-management";

export class PerformanceAnalyzer {
  calculateSurgeonPerformance(
    surgeonId: string,
    surgeonName: string,
    cases: SurgicalCase[],
    startDate: Date,
    endDate: Date
  ): SurgeonPerformance {
    const surgeonCases = cases.filter(
      (c) =>
        c.surgeonId === surgeonId &&
        new Date(c.scheduledDate) >= startDate &&
        new Date(c.scheduledDate) <= endDate
    );

    const completedCases = surgeonCases.filter(
      (c) => c.status === CaseStatus.COMPLETED
    );
    const cancelledCases = surgeonCases.filter(
      (c) => c.status === CaseStatus.CANCELLED
    );

    const avgDuration =
      completedCases.length > 0
        ? completedCases.reduce((sum, c) => sum + (c.actualDuration || 0), 0) /
          completedCases.length
        : 0;

    const onTimeStarts = completedCases.filter((c) => {
      if (!c.actualStartTime) return false;
      const delay = differenceInMinutes(
        new Date(c.actualStartTime),
        new Date(c.scheduledStartTime)
      );
      return delay <= 15;
    }).length;

    const onTimeStartRate =
      completedCases.length > 0 ? (onTimeStarts / completedCases.length) * 100 : 0;

    const totalDelay = completedCases.reduce((sum, c) => {
      if (!c.actualStartTime) return sum;
      return (
        sum +
        Math.max(
          0,
          differenceInMinutes(
            new Date(c.actualStartTime),
            new Date(c.scheduledStartTime)
          )
        )
      );
    }, 0);

    const avgDelay =
      completedCases.length > 0 ? totalDelay / completedCases.length : 0;

    const estimationAccuracy = this.calculateEstimationAccuracy(completedCases);
    const blockUtilizationRate = this.calculateBlockUtilization(surgeonCases);

    return {
      surgeonId,
      surgeonName,
      period: { start: startDate, end: endDate },
      totalCases: surgeonCases.length,
      completedCases: completedCases.length,
      cancelledCases: cancelledCases.length,
      averageCaseDuration: Math.round(avgDuration),
      onTimeStarts,
      onTimeStartRate,
      averageDelay: Math.round(avgDelay),
      blockUtilizationRate,
      estimationAccuracy,
      complicationRate: 0, // Would be calculated from actual complication data
      readmissionRate: 0, // Would be calculated from readmission data
    };
  }

  private calculateEstimationAccuracy(cases: SurgicalCase[]): number {
    if (cases.length === 0) return 0;

    const accuracies = cases
      .filter((c) => c.actualDuration !== null)
      .map((c) => {
        const diff = Math.abs(c.estimatedDuration - c.actualDuration!);
        const accuracy = 100 - (diff / c.estimatedDuration) * 100;
        return Math.max(0, accuracy);
      });

    return accuracies.length > 0
      ? accuracies.reduce((sum, a) => sum + a, 0) / accuracies.length
      : 0;
  }

  private calculateBlockUtilization(cases: SurgicalCase[]): number {
    const blockCases = cases.filter((c) => c.blockId !== null);
    if (blockCases.length === 0) return 0;

    // Simplified calculation - would need actual block data in real implementation
    return 75; // Placeholder
  }
}

let analyzerInstance: PerformanceAnalyzer | null = null;

export function getPerformanceAnalyzer(): PerformanceAnalyzer {
  if (!analyzerInstance) {
    analyzerInstance = new PerformanceAnalyzer();
  }
  return analyzerInstance;
}
