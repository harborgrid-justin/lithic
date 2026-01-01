/**
 * OR Utilization Analytics
 * Tracks OR utilization metrics, prime time analysis, and efficiency scores
 */

import { differenceInMinutes, startOfDay, setHours, format } from "date-fns";
import type {  ORUtilization,
  SurgicalCase,
  OperatingRoom,
  CaseStatus,
} from "@/types/or-management";

export class UtilizationAnalyzer {
  private readonly PRIME_TIME_START = 7; // 7 AM
  private readonly PRIME_TIME_END = 15; // 3 PM
  private readonly TARGET_UTILIZATION = 85;

  calculateUtilization(
    room: OperatingRoom,
    date: Date,
    cases: SurgicalCase[]
  ): ORUtilization {
    const dayStart = setHours(startOfDay(date), this.PRIME_TIME_START);
    const dayEnd = setHours(startOfDay(date), 18); // 6 PM
    const primeEnd = setHours(startOfDay(date), this.PRIME_TIME_END);

    const totalAvailableMinutes = differenceInMinutes(dayEnd, dayStart);
    const primeTimeMinutes = differenceInMinutes(primeEnd, dayStart);

    const roomCases = cases.filter(
      (c) =>
        c.roomId === room.id &&
        format(new Date(c.scheduledDate), "yyyy-MM-dd") ===
          format(date, "yyyy-MM-dd") &&
        c.status !== CaseStatus.CANCELLED
    );

    const scheduledMinutes = roomCases.reduce(
      (sum, c) => sum + c.estimatedDuration,
      0
    );

    const actualMinutes = roomCases
      .filter((c) => c.actualDuration !== null)
      .reduce((sum, c) => sum + c.actualDuration!, 0);

    const turnoverMinutes = roomCases.length > 1
      ? (roomCases.length - 1) * (room.turnoverDuration || 30)
      : 0;

    const delayMinutes = roomCases.reduce((sum, c) => sum + (c.delayMinutes || 0), 0);

    const firstCase = roomCases.sort(
      (a, b) =>
        new Date(a.scheduledStartTime).getTime() -
        new Date(b.scheduledStartTime).getTime()
    )[0];

    const firstCaseDelay =
      firstCase && firstCase.actualStartTime
        ? differenceInMinutes(
            new Date(firstCase.actualStartTime),
            new Date(firstCase.scheduledStartTime)
          )
        : 0;

    const primeTimeCases = roomCases.filter((c) => {
      const startHour = new Date(c.scheduledStartTime).getHours();
      return startHour >= this.PRIME_TIME_START && startHour < this.PRIME_TIME_END;
    });

    const primeTimeUsed = primeTimeCases.reduce(
      (sum, c) => sum + c.estimatedDuration,
      0
    );

    return {
      roomId: room.id,
      roomName: room.roomName,
      date,
      totalAvailableMinutes,
      scheduledMinutes,
      actualUsedMinutes: actualMinutes,
      turnoverMinutes,
      delayMinutes,
      utilizationRate: (scheduledMinutes / totalAvailableMinutes) * 100,
      primeTimeUtilization: (primeTimeUsed / primeTimeMinutes) * 100,
      casesScheduled: roomCases.length,
      casesCompleted: roomCases.filter((c) => c.status === CaseStatus.COMPLETED).length,
      casesCancelled: roomCases.filter((c) => c.status === CaseStatus.CANCELLED).length,
      firstCaseOnTimeStart: firstCaseDelay <= 15,
      averageTurnoverTime: roomCases.length > 1 ? turnoverMinutes / (roomCases.length - 1) : 0,
      createdAt: new Date(),
      updatedAt: new Date(),
      createdBy: "system",
      updatedBy: "system",
      deletedAt: null,
      id: `util_${room.id}_${format(date, "yyyyMMdd")}`,
    };
  }

  calculateEfficiencyScore(utilization: ORUtilization): {
    score: number;
    factors: Record<string, number>;
    grade: string;
  } {
    const factors = {
      utilizationScore: Math.min(100, (utilization.utilizationRate / this.TARGET_UTILIZATION) * 100) * 0.4,
      primeTimeScore: Math.min(100, (utilization.primeTimeUtilization / 90) * 100) * 0.25,
      turnoverScore: utilization.averageTurnoverTime <= 30 ? 100 : Math.max(0, 100 - (utilization.averageTurnoverTime - 30)) * 0.2,
      onTimeStartScore: utilization.firstCaseOnTimeStart ? 100 : 0 * 0.15,
    };

    const score =
      factors.utilizationScore +
      factors.primeTimeScore +
      factors.turnoverScore +
      factors.onTimeStartScore;

    let grade: string;
    if (score >= 90) grade = "A";
    else if (score >= 80) grade = "B";
    else if (score >= 70) grade = "C";
    else if (score >= 60) grade = "D";
    else grade = "F";

    return { score, factors, grade };
  }
}

let analyzerInstance: UtilizationAnalyzer | null = null;

export function getUtilizationAnalyzer(): UtilizationAnalyzer {
  if (!analyzerInstance) {
    analyzerInstance = new UtilizationAnalyzer();
  }
  return analyzerInstance;
}
