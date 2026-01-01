/**
 * Appointment Optimization - Smart Scheduling & Load Balancing
 * Gap filling, travel time consideration, patient preferences
 */

import {
  addMinutes,
  addDays,
  differenceInMinutes,
  isBefore,
  isAfter,
  startOfDay,
  endOfDay,
  format,
  parseISO,
} from "date-fns";
import type {
  Appointment,
  Schedule,
  AppointmentType,
  PreferredTime,
} from "@/types/scheduling";
import { getSchedulingEngine } from "./engine";
import { getResourceManager } from "./resources";

// ============================================================================
// Types
// ============================================================================

export interface OptimizationCriteria {
  fillGaps?: boolean;
  considerTravelTime?: boolean;
  respectPatientPreferences?: boolean;
  balanceLoad?: boolean;
  minimizeWaitTime?: boolean;
  maximizeUtilization?: boolean;
  priorityWeight?: number;
}

export interface SchedulingSuggestion {
  providerId: string;
  providerName: string;
  startTime: Date;
  endTime: Date;
  score: number;
  reasons: string[];
  roomId?: string;
  distance?: number;
  travelTime?: number;
}

export interface PatientPreferences {
  preferredProviders?: string[];
  preferredDays?: number[];
  preferredTimes?: PreferredTime[];
  preferredFacility?: string;
  avoidDays?: number[];
  maxTravelDistance?: number;
  languagePreference?: string;
  genderPreference?: "M" | "F" | "ANY";
}

export interface GapAnalysis {
  providerId: string;
  date: Date;
  gaps: TimeGap[];
  totalGapMinutes: number;
  fillableGaps: TimeGap[];
}

export interface TimeGap {
  startTime: Date;
  endTime: Date;
  duration: number;
  canFill: boolean;
  suggestedAppointmentType?: AppointmentType;
}

export interface LoadDistribution {
  providerId: string;
  providerName: string;
  totalAppointments: number;
  totalMinutes: number;
  utilizationRate: number;
  overbooked: boolean;
  recommendedLoad: number;
}

export interface TravelTimeMatrix {
  fromLocation: string;
  toLocation: string;
  distanceKm: number;
  durationMinutes: number;
  mode: "DRIVING" | "WALKING" | "TRANSIT";
}

// ============================================================================
// Optimization Engine Class
// ============================================================================

export class OptimizationEngine {
  private schedulingEngine = getSchedulingEngine();
  private resourceManager = getResourceManager();
  private travelTimeCache: Map<string, TravelTimeMatrix> = new Map();

  // --------------------------------------------------------------------------
  // Smart Scheduling Suggestions
  // --------------------------------------------------------------------------

  suggestOptimalSlots(
    appointmentType: AppointmentType,
    duration: number,
    providers: string[],
    schedules: Schedule[],
    existingAppointments: Appointment[],
    patientPreferences?: PatientPreferences,
    criteria: OptimizationCriteria = {},
  ): SchedulingSuggestion[] {
    const suggestions: SchedulingSuggestion[] = [];
    const searchDays = 30; // Search next 30 days

    for (let dayOffset = 0; dayOffset < searchDays; dayOffset++) {
      const checkDate = addDays(new Date(), dayOffset);

      for (const providerId of providers) {
        const schedule = schedules.find((s) => s.providerId === providerId);
        if (!schedule) continue;

        const providerAppointments = existingAppointments.filter(
          (a) => a.providerId === providerId,
        );

        const availability = this.resourceManager.getProviderAvailability(
          schedule,
          providerAppointments,
          checkDate,
        );

        // Find available slots
        const availableSlots = availability.slots.filter(
          (slot) => slot.available && slot.duration >= duration,
        );

        for (const slot of availableSlots) {
          const score = this.calculateSlotScore(
            slot.startTime,
            duration,
            providerId,
            checkDate,
            providerAppointments,
            patientPreferences,
            criteria,
          );

          const reasons = this.generateScoreReasons(
            slot.startTime,
            score,
            patientPreferences,
            criteria,
          );

          suggestions.push({
            providerId,
            providerName: `Provider ${providerId}`,
            startTime: slot.startTime,
            endTime: addMinutes(slot.startTime, duration),
            score,
            reasons,
            roomId: slot.roomId,
          });
        }
      }
    }

    // Sort by score (highest first) and return top suggestions
    return suggestions.sort((a, b) => b.score - a.score).slice(0, 20);
  }

  // --------------------------------------------------------------------------
  // Gap Filling Optimization
  // --------------------------------------------------------------------------

  analyzeGaps(
    providerId: string,
    schedule: Schedule,
    appointments: Appointment[],
    date: Date,
  ): GapAnalysis {
    const availability = this.resourceManager.getProviderAvailability(
      schedule,
      appointments,
      date,
    );

    const gaps: TimeGap[] = [];
    let totalGapMinutes = 0;

    // Find gaps between appointments
    const sortedSlots = availability.slots.sort(
      (a, b) => a.startTime.getTime() - b.startTime.getTime(),
    );

    let gapStart: Date | null = null;

    for (let i = 0; i < sortedSlots.length; i++) {
      const slot = sortedSlots[i];

      if (slot.available) {
        if (!gapStart) {
          gapStart = slot.startTime;
        }
      } else {
        if (gapStart) {
          const gapDuration = differenceInMinutes(slot.startTime, gapStart);
          if (gapDuration > 0) {
            gaps.push({
              startTime: gapStart,
              endTime: slot.startTime,
              duration: gapDuration,
              canFill: gapDuration >= 15, // Minimum 15 minutes
              suggestedAppointmentType: this.suggestAppointmentTypeForGap(
                gapDuration,
              ),
            });
            totalGapMinutes += gapDuration;
          }
          gapStart = null;
        }
      }
    }

    // Handle gap at end of day
    if (gapStart && sortedSlots.length > 0) {
      const lastSlot = sortedSlots[sortedSlots.length - 1];
      const gapDuration = differenceInMinutes(lastSlot.endTime, gapStart);
      if (gapDuration > 0) {
        gaps.push({
          startTime: gapStart,
          endTime: lastSlot.endTime,
          duration: gapDuration,
          canFill: gapDuration >= 15,
          suggestedAppointmentType: this.suggestAppointmentTypeForGap(
            gapDuration,
          ),
        });
        totalGapMinutes += gapDuration;
      }
    }

    const fillableGaps = gaps.filter((g) => g.canFill);

    return {
      providerId,
      date,
      gaps,
      totalGapMinutes,
      fillableGaps,
    };
  }

  fillGap(
    gap: TimeGap,
    waitlistAppointments: Partial<Appointment>[],
  ): Partial<Appointment> | null {
    // Find best fit from waitlist
    const candidates = waitlistAppointments.filter(
      (appt) => (appt.duration || 30) <= gap.duration,
    );

    if (candidates.length === 0) return null;

    // Sort by priority and duration fit
    const sorted = candidates.sort((a, b) => {
      const aDiff = gap.duration - (a.duration || 30);
      const bDiff = gap.duration - (b.duration || 30);
      return aDiff - bDiff; // Prefer tighter fit
    });

    return sorted[0];
  }

  // --------------------------------------------------------------------------
  // Load Balancing
  // --------------------------------------------------------------------------

  analyzeLoadDistribution(
    providers: string[],
    schedules: Schedule[],
    appointments: Appointment[],
    startDate: Date,
    endDate: Date,
  ): LoadDistribution[] {
    const distribution: LoadDistribution[] = [];

    for (const providerId of providers) {
      const schedule = schedules.find((s) => s.providerId === providerId);
      if (!schedule) continue;

      const providerAppointments = appointments.filter(
        (a) =>
          a.providerId === providerId &&
          a.status !== "CANCELLED" &&
          a.status !== "NO_SHOW",
      );

      const capacity = this.resourceManager.calculateCapacity(
        schedule,
        providerAppointments,
        startDate,
        endDate,
      );

      distribution.push({
        providerId,
        providerName: `Provider ${providerId}`,
        totalAppointments: providerAppointments.length,
        totalMinutes: capacity.bookedSlots * 30, // Approximate
        utilizationRate: capacity.utilizationRate,
        overbooked: capacity.overbookedSlots > 0,
        recommendedLoad: capacity.totalSlots,
      });
    }

    return distribution;
  }

  suggestRebalancing(
    distribution: LoadDistribution[],
    threshold: number = 0.8,
  ): {
    overloaded: LoadDistribution[];
    underloaded: LoadDistribution[];
    suggestions: string[];
  } {
    const overloaded = distribution.filter(
      (d) => d.utilizationRate > threshold * 100,
    );
    const underloaded = distribution.filter(
      (d) => d.utilizationRate < (threshold - 0.2) * 100,
    );

    const suggestions: string[] = [];

    if (overloaded.length > 0 && underloaded.length > 0) {
      suggestions.push(
        `Consider redistributing appointments from ${overloaded.map((d) => d.providerName).join(", ")} to ${underloaded.map((d) => d.providerName).join(", ")}`,
      );
    }

    if (overloaded.length > 0) {
      suggestions.push(
        `Providers ${overloaded.map((d) => d.providerName).join(", ")} are over ${threshold * 100}% utilized`,
      );
    }

    return {
      overloaded,
      underloaded,
      suggestions,
    };
  }

  // --------------------------------------------------------------------------
  // Travel Time Optimization
  // --------------------------------------------------------------------------

  calculateTravelTime(
    fromLocation: string,
    toLocation: string,
  ): TravelTimeMatrix | null {
    const cacheKey = `${fromLocation}-${toLocation}`;
    return this.travelTimeCache.get(cacheKey) || null;
  }

  addTravelTime(matrix: TravelTimeMatrix): void {
    const cacheKey = `${matrix.fromLocation}-${matrix.toLocation}`;
    this.travelTimeCache.set(cacheKey, matrix);
  }

  optimizeWithTravelTime(
    appointments: Appointment[],
    patientLocation: string,
  ): Appointment[] {
    // Sort appointments by start time
    const sorted = [...appointments].sort(
      (a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime(),
    );

    // Score each appointment based on travel time
    const scored = sorted.map((appt) => {
      // In real implementation, would fetch facility location
      const facilityLocation = `facility_${appt.providerId}`;
      const travelTime = this.calculateTravelTime(
        patientLocation,
        facilityLocation,
      );

      return {
        ...appt,
        travelScore: travelTime ? 100 - travelTime.durationMinutes : 50,
      };
    });

    // Sort by travel score
    return scored.sort((a, b) => b.travelScore - a.travelScore);
  }

  // --------------------------------------------------------------------------
  // Patient Preference Matching
  // --------------------------------------------------------------------------

  matchPreferences(
    suggestions: SchedulingSuggestion[],
    preferences: PatientPreferences,
  ): SchedulingSuggestion[] {
    return suggestions.map((suggestion) => {
      let adjustedScore = suggestion.score;
      const bonuses: string[] = [];

      // Preferred provider bonus
      if (
        preferences.preferredProviders?.includes(suggestion.providerId)
      ) {
        adjustedScore += 20;
        bonuses.push("Preferred provider");
      }

      // Preferred day bonus
      const dayOfWeek = suggestion.startTime.getDay();
      if (preferences.preferredDays?.includes(dayOfWeek)) {
        adjustedScore += 10;
        bonuses.push("Preferred day");
      }

      // Preferred time bonus
      const hour = suggestion.startTime.getHours();
      if (preferences.preferredTimes) {
        for (const timeRange of preferences.preferredTimes) {
          if (this.isInPreferredTimeRange(hour, timeRange)) {
            adjustedScore += 15;
            bonuses.push("Preferred time");
            break;
          }
        }
      }

      // Avoid days penalty
      if (preferences.avoidDays?.includes(dayOfWeek)) {
        adjustedScore -= 20;
        bonuses.push("Not preferred day");
      }

      return {
        ...suggestion,
        score: adjustedScore,
        reasons: [...suggestion.reasons, ...bonuses],
      };
    });
  }

  private isInPreferredTimeRange(hour: number, timeRange: PreferredTime): boolean {
    switch (timeRange) {
      case PreferredTime.EARLY_MORNING:
        return hour >= 6 && hour < 9;
      case PreferredTime.MORNING:
        return hour >= 9 && hour < 12;
      case PreferredTime.AFTERNOON:
        return hour >= 12 && hour < 17;
      case PreferredTime.EVENING:
        return hour >= 17 && hour < 20;
      case PreferredTime.ANY:
        return true;
      default:
        return false;
    }
  }

  // --------------------------------------------------------------------------
  // Scoring Functions
  // --------------------------------------------------------------------------

  private calculateSlotScore(
    startTime: Date,
    duration: number,
    providerId: string,
    date: Date,
    appointments: Appointment[],
    preferences?: PatientPreferences,
    criteria: OptimizationCriteria = {},
  ): number {
    let score = 50; // Base score

    // Sooner is better (up to +20 points)
    const daysAway = differenceInMinutes(startTime, new Date()) / (24 * 60);
    score += Math.max(0, 20 - daysAway);

    // Optimal time of day (9-11am and 2-4pm are best)
    const hour = startTime.getHours();
    if ((hour >= 9 && hour < 11) || (hour >= 14 && hour < 16)) {
      score += 10;
    }

    // Gap filling bonus
    if (criteria.fillGaps) {
      const isGapFiller = this.isGapFillerSlot(
        startTime,
        duration,
        appointments,
      );
      if (isGapFiller) score += 15;
    }

    // Load balancing bonus
    if (criteria.balanceLoad) {
      const dayAppointments = appointments.filter(
        (a) =>
          format(new Date(a.startTime), "yyyy-MM-dd") ===
          format(date, "yyyy-MM-dd"),
      );
      if (dayAppointments.length < 8) score += 10;
      if (dayAppointments.length > 12) score -= 10;
    }

    return Math.max(0, Math.min(100, score));
  }

  private isGapFillerSlot(
    startTime: Date,
    duration: number,
    appointments: Appointment[],
  ): boolean {
    const endTime = addMinutes(startTime, duration);

    // Check if there's an appointment before and after
    const before = appointments.find((a) => {
      const apptEnd = new Date(a.endTime);
      return (
        apptEnd <= startTime &&
        differenceInMinutes(startTime, apptEnd) <= 30
      );
    });

    const after = appointments.find((a) => {
      const apptStart = new Date(a.startTime);
      return (
        apptStart >= endTime &&
        differenceInMinutes(apptStart, endTime) <= 30
      );
    });

    return !!(before && after);
  }

  private generateScoreReasons(
    startTime: Date,
    score: number,
    preferences?: PatientPreferences,
    criteria: OptimizationCriteria = {},
  ): string[] {
    const reasons: string[] = [];

    const daysAway = Math.floor(
      differenceInMinutes(startTime, new Date()) / (24 * 60),
    );
    if (daysAway === 0) reasons.push("Available today");
    else if (daysAway === 1) reasons.push("Available tomorrow");
    else if (daysAway <= 7) reasons.push("Available this week");

    const hour = startTime.getHours();
    if ((hour >= 9 && hour < 11) || (hour >= 14 && hour < 16)) {
      reasons.push("Optimal time of day");
    }

    if (score >= 80) reasons.push("Highly recommended");
    else if (score >= 60) reasons.push("Good match");

    return reasons;
  }

  private suggestAppointmentTypeForGap(duration: number): AppointmentType {
    if (duration >= 60) return AppointmentType.NEW_PATIENT;
    if (duration >= 30) return AppointmentType.FOLLOW_UP;
    if (duration >= 15) return AppointmentType.VACCINE;
    return AppointmentType.SICK_VISIT;
  }
}

// ============================================================================
// Singleton Instance
// ============================================================================

let optimizationEngineInstance: OptimizationEngine | null = null;

export function getOptimizationEngine(): OptimizationEngine {
  if (!optimizationEngineInstance) {
    optimizationEngineInstance = new OptimizationEngine();
  }
  return optimizationEngineInstance;
}

// ============================================================================
// Utility Functions
// ============================================================================

export function calculateOptimalDuration(
  appointmentType: AppointmentType,
): number {
  const durations: Record<AppointmentType, number> = {
    [AppointmentType.NEW_PATIENT]: 60,
    [AppointmentType.FOLLOW_UP]: 30,
    [AppointmentType.ANNUAL_PHYSICAL]: 45,
    [AppointmentType.WELL_CHILD]: 30,
    [AppointmentType.SICK_VISIT]: 20,
    [AppointmentType.CONSULTATION]: 45,
    [AppointmentType.PROCEDURE]: 60,
    [AppointmentType.SURGERY]: 120,
    [AppointmentType.THERAPY]: 45,
    [AppointmentType.LAB_ONLY]: 15,
    [AppointmentType.IMAGING_ONLY]: 30,
    [AppointmentType.VACCINE]: 15,
    [AppointmentType.TELEHEALTH]: 30,
    [AppointmentType.WALK_IN]: 20,
  };

  return durations[appointmentType] || 30;
}

export function prioritizeUrgentAppointments(
  suggestions: SchedulingSuggestion[],
  isUrgent: boolean,
): SchedulingSuggestion[] {
  if (!isUrgent) return suggestions;

  // For urgent appointments, prioritize sooner slots
  return suggestions.map((s) => {
    const hoursAway = differenceInMinutes(s.startTime, new Date()) / 60;
    if (hoursAway <= 24) s.score += 30;
    else if (hoursAway <= 48) s.score += 20;
    else if (hoursAway <= 72) s.score += 10;
    return s;
  });
}
