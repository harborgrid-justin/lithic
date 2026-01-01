/**
 * Availability Service - Business Logic for Provider Availability
 * Lithic Healthcare Platform - Vanilla TypeScript
 *
 * Handles provider availability calculations, slot generation, and scheduling optimization.
 */

import type { Provider } from "../routes/scheduling/providers";
import type { Appointment } from "../routes/scheduling/appointments";
import type {
  TimeSlot,
  DaySchedule,
  ProviderAvailability,
  BlockedTime,
} from "../routes/scheduling/availability";

export class AvailabilityService {
  /**
   * Generate time slots for a given date and working hours
   */
  static generateTimeSlots(
    date: Date,
    workingHours: { startTime: string; endTime: string },
    slotDuration: number = 30,
    breaks?: { startTime: string; endTime: string }[],
  ): TimeSlot[] {
    const slots: TimeSlot[] = [];
    const dayDate = new Date(date);
    dayDate.setHours(0, 0, 0, 0);

    // Parse working hours
    const [startHour, startMinute] = workingHours.startTime
      .split(":")
      .map(Number);
    const [endHour, endMinute] = workingHours.endTime.split(":").map(Number);

    const currentSlot = new Date(dayDate);
    currentSlot.setHours(startHour, startMinute, 0, 0);

    const endTime = new Date(dayDate);
    endTime.setHours(endHour, endMinute, 0, 0);

    while (currentSlot < endTime) {
      const slotEnd = new Date(currentSlot);
      slotEnd.setMinutes(slotEnd.getMinutes() + slotDuration);

      // Check if slot overlaps with break times
      const isDuringBreak = breaks?.some((breakPeriod) => {
        const [breakStartHour, breakStartMinute] = breakPeriod.startTime
          .split(":")
          .map(Number);
        const [breakEndHour, breakEndMinute] = breakPeriod.endTime
          .split(":")
          .map(Number);

        const breakStart = new Date(dayDate);
        breakStart.setHours(breakStartHour, breakStartMinute, 0, 0);

        const breakEnd = new Date(dayDate);
        breakEnd.setHours(breakEndHour, breakEndMinute, 0, 0);

        return currentSlot < breakEnd && slotEnd > breakStart;
      });

      slots.push({
        startTime: new Date(currentSlot),
        endTime: slotEnd,
        available: !isDuringBreak,
        reason: isDuringBreak ? "Break time" : undefined,
      });

      currentSlot.setMinutes(currentSlot.getMinutes() + slotDuration);
    }

    return slots;
  }

  /**
   * Calculate provider availability for a date range
   */
  static async calculateAvailability(
    provider: Provider,
    startDate: Date,
    endDate: Date,
    slotDuration: number = 30,
  ): Promise<ProviderAvailability> {
    const schedule: DaySchedule[] = [];
    const currentDate = new Date(startDate);
    currentDate.setHours(0, 0, 0, 0);

    const end = new Date(endDate);
    end.setHours(23, 59, 59, 999);

    while (currentDate <= end) {
      const dayOfWeek = currentDate.getDay();
      const daySchedule = this.generateDaySchedule(
        provider,
        new Date(currentDate),
        dayOfWeek,
        slotDuration,
      );

      schedule.push(daySchedule);
      currentDate.setDate(currentDate.getDate() + 1);
    }

    // TODO: Fetch blocked times and existing appointments
    // Mark slots as unavailable based on existing appointments and blocks

    return {
      providerId: provider.id,
      providerName: provider.fullName,
      specialty: provider.specialty,
      schedule,
      workingHours: provider.schedulingPreferences ? [] : [], // TODO: Get from provider profile
      exceptions: [],
    };
  }

  /**
   * Generate schedule for a specific day
   */
  static generateDaySchedule(
    provider: Provider,
    date: Date,
    dayOfWeek: number,
    slotDuration: number,
  ): DaySchedule {
    // Find working hours for this day
    // TODO: Get from provider's working hours configuration
    const workingHours = {
      startTime: "09:00",
      endTime: "17:00",
    };

    const isWorkingDay = dayOfWeek >= 1 && dayOfWeek <= 5; // Monday to Friday

    let slots: TimeSlot[] = [];
    if (isWorkingDay) {
      slots = this.generateTimeSlots(date, workingHours, slotDuration);
    }

    const availableSlots = slots.filter((s) => s.available).length;
    const bookedSlots = slots.filter((s) => !s.available).length;

    return {
      date: new Date(date),
      dayOfWeek: this.getDayName(dayOfWeek),
      isWorkingDay,
      slots,
      totalSlots: slots.length,
      availableSlots,
      bookedSlots,
    };
  }

  /**
   * Mark slots as unavailable based on existing appointments
   */
  static markSlotsUnavailable(
    slots: TimeSlot[],
    appointments: Appointment[],
  ): TimeSlot[] {
    return slots.map((slot) => {
      const hasConflict = appointments.some((apt) => {
        if (apt.status === "cancelled") return false;
        return this.hasTimeOverlap(
          slot.startTime,
          slot.endTime,
          apt.startTime,
          apt.endTime,
        );
      });

      if (hasConflict) {
        const conflictingApt = appointments.find((apt) =>
          this.hasTimeOverlap(
            slot.startTime,
            slot.endTime,
            apt.startTime,
            apt.endTime,
          ),
        );
        return {
          ...slot,
          available: false,
          reason: "Already booked",
          appointmentId: conflictingApt?.id,
        };
      }

      return slot;
    });
  }

  /**
   * Check if two time ranges overlap
   */
  static hasTimeOverlap(
    start1: Date,
    end1: Date,
    start2: Date,
    end2: Date,
  ): boolean {
    return start1 < end2 && end1 > start2;
  }

  /**
   * Find next available slot
   */
  static async findNextAvailableSlot(
    providerId: string,
    duration: number,
    startDate?: Date,
    maxDaysAhead: number = 30,
  ): Promise<TimeSlot | null> {
    const searchStart = startDate || new Date();
    const searchEnd = new Date(searchStart);
    searchEnd.setDate(searchEnd.getDate() + maxDaysAhead);

    // TODO: Fetch provider and appointments
    // TODO: Calculate availability
    // TODO: Find first available slot that fits the duration

    return null;
  }

  /**
   * Find all available slots in a date range
   */
  static async findAvailableSlots(
    providerId: string,
    duration: number,
    startDate: Date,
    endDate: Date,
    preferences?: {
      daysOfWeek?: number[];
      timeOfDay?: "morning" | "afternoon" | "evening";
    },
  ): Promise<TimeSlot[]> {
    const availableSlots: TimeSlot[] = [];

    // TODO: Fetch provider availability
    // TODO: Filter based on preferences
    // TODO: Return slots that can accommodate the requested duration

    return availableSlots;
  }

  /**
   * Calculate utilization rate
   */
  static calculateUtilizationRate(schedule: DaySchedule[]): number {
    let totalSlots = 0;
    let bookedSlots = 0;

    for (const day of schedule) {
      if (day.isWorkingDay) {
        totalSlots += day.totalSlots;
        bookedSlots += day.bookedSlots;
      }
    }

    return totalSlots > 0 ? (bookedSlots / totalSlots) * 100 : 0;
  }

  /**
   * Find optimal slot based on multiple criteria
   */
  static findOptimalSlot(
    availableSlots: TimeSlot[],
    criteria: {
      preferredTime?: "morning" | "afternoon" | "evening";
      minimizeWaitTime?: boolean;
      balanceLoad?: boolean;
    },
  ): TimeSlot | null {
    if (availableSlots.length === 0) return null;

    let scoredSlots = availableSlots.map((slot) => ({
      slot,
      score: 0,
    }));

    // Score based on preferred time
    if (criteria.preferredTime) {
      scoredSlots = scoredSlots.map(({ slot, score }) => {
        const hour = slot.startTime.getHours();
        let timeScore = 0;

        if (criteria.preferredTime === "morning" && hour >= 8 && hour < 12) {
          timeScore = 10;
        } else if (
          criteria.preferredTime === "afternoon" &&
          hour >= 12 &&
          hour < 17
        ) {
          timeScore = 10;
        } else if (
          criteria.preferredTime === "evening" &&
          hour >= 17 &&
          hour < 20
        ) {
          timeScore = 10;
        }

        return { slot, score: score + timeScore };
      });
    }

    // Score based on minimizing wait time (prefer earlier slots)
    if (criteria.minimizeWaitTime) {
      scoredSlots = scoredSlots.map(({ slot, score }, index) => ({
        slot,
        score: score + (availableSlots.length - index),
      }));
    }

    // Sort by score and return highest
    scoredSlots.sort((a, b) => b.score - a.score);
    return scoredSlots[0].slot;
  }

  /**
   * Check if a specific time slot is available
   */
  static async isSlotAvailable(
    providerId: string,
    startTime: Date,
    endTime: Date,
    excludeAppointmentId?: string,
  ): Promise<boolean> {
    // TODO: Check against existing appointments
    // TODO: Check against blocked times
    // TODO: Check against working hours

    return true;
  }

  /**
   * Get day name from day number
   */
  static getDayName(dayOfWeek: number): string {
    const days = [
      "Sunday",
      "Monday",
      "Tuesday",
      "Wednesday",
      "Thursday",
      "Friday",
      "Saturday",
    ];
    return days[dayOfWeek];
  }

  /**
   * Parse time string to minutes since midnight
   */
  static timeToMinutes(timeStr: string): number {
    const [hours, minutes] = timeStr.split(":").map(Number);
    return hours * 60 + minutes;
  }

  /**
   * Convert minutes since midnight to time string
   */
  static minutesToTime(minutes: number): string {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${String(hours).padStart(2, "0")}:${String(mins).padStart(2, "0")}`;
  }

  /**
   * Calculate gap between appointments
   */
  static calculateGaps(appointments: Appointment[]): {
    totalGaps: number;
    averageGap: number;
    largestGap: number;
    gaps: { start: Date; end: Date; duration: number }[];
  } {
    if (appointments.length < 2) {
      return {
        totalGaps: 0,
        averageGap: 0,
        largestGap: 0,
        gaps: [],
      };
    }

    // Sort appointments by start time
    const sorted = [...appointments].sort(
      (a, b) =>
        new Date(a.startTime).getTime() - new Date(b.startTime).getTime(),
    );

    const gaps: { start: Date; end: Date; duration: number }[] = [];

    for (let i = 0; i < sorted.length - 1; i++) {
      const currentEnd = new Date(sorted[i].endTime);
      const nextStart = new Date(sorted[i + 1].startTime);
      const gapDuration =
        (nextStart.getTime() - currentEnd.getTime()) / (1000 * 60); // minutes

      if (gapDuration > 0) {
        gaps.push({
          start: currentEnd,
          end: nextStart,
          duration: gapDuration,
        });
      }
    }

    const totalGaps = gaps.reduce((sum, gap) => sum + gap.duration, 0);
    const averageGap = gaps.length > 0 ? totalGaps / gaps.length : 0;
    const largestGap =
      gaps.length > 0 ? Math.max(...gaps.map((g) => g.duration)) : 0;

    return {
      totalGaps,
      averageGap,
      largestGap,
      gaps,
    };
  }

  /**
   * Suggest schedule optimizations
   */
  static suggestOptimizations(
    schedule: DaySchedule[],
    appointments: Appointment[],
  ): {
    suggestions: string[];
    potentialTimeSaved: number;
  } {
    const suggestions: string[] = [];
    let potentialTimeSaved = 0;

    // Analyze gaps
    const gapAnalysis = this.calculateGaps(appointments);

    if (gapAnalysis.averageGap > 15) {
      suggestions.push(
        `Average gap between appointments is ${Math.round(gapAnalysis.averageGap)} minutes. Consider reducing buffer times.`,
      );
      potentialTimeSaved +=
        (gapAnalysis.averageGap - 10) * gapAnalysis.gaps.length;
    }

    if (gapAnalysis.largestGap > 60) {
      suggestions.push(
        `Largest gap is ${Math.round(gapAnalysis.largestGap)} minutes. This slot could accommodate another appointment.`,
      );
    }

    // Check utilization
    const utilization = this.calculateUtilizationRate(schedule);

    if (utilization < 50) {
      suggestions.push(
        `Utilization rate is ${Math.round(utilization)}%. Consider adjusting working hours or increasing appointment capacity.`,
      );
    }

    if (utilization > 90) {
      suggestions.push(
        `Utilization rate is ${Math.round(utilization)}%. Consider adding more availability or another provider.`,
      );
    }

    return {
      suggestions,
      potentialTimeSaved,
    };
  }

  /**
   * Generate availability summary
   */
  static generateSummary(availability: ProviderAvailability): string {
    const totalDays = availability.schedule.length;
    const workingDays = availability.schedule.filter(
      (d) => d.isWorkingDay,
    ).length;
    const totalSlots = availability.schedule.reduce(
      (sum, d) => sum + d.totalSlots,
      0,
    );
    const availableSlots = availability.schedule.reduce(
      (sum, d) => sum + d.availableSlots,
      0,
    );
    const utilization =
      totalSlots > 0 ? ((totalSlots - availableSlots) / totalSlots) * 100 : 0;

    return `${availability.providerName} has ${availableSlots} available slots out of ${totalSlots} total slots across ${workingDays} working days (${Math.round(utilization)}% utilized).`;
  }
}

export default AvailabilityService;
