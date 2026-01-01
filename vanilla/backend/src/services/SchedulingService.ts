/**
 * Scheduling Service - Business Logic Layer
 * Lithic Healthcare Platform - Vanilla TypeScript
 *
 * Handles core scheduling business logic, validation, and data processing.
 */

import type { Appointment } from "../routes/scheduling/appointments";
import type { Provider } from "../routes/scheduling/providers";
import type { Resource, ResourceBooking } from "../routes/scheduling/resources";
import type { WaitlistEntry } from "../routes/scheduling/waitlist";
import type {
  RecurringAppointment,
  RecurrencePattern,
} from "../routes/scheduling/recurring";

export class SchedulingService {
  /**
   * Validate appointment data
   */
  static validateAppointment(appointmentData: Partial<Appointment>): {
    valid: boolean;
    errors: string[];
  } {
    const errors: string[] = [];

    // Required fields
    if (!appointmentData.patientId) {
      errors.push("Patient ID is required");
    }
    if (!appointmentData.providerId) {
      errors.push("Provider ID is required");
    }
    if (!appointmentData.startTime) {
      errors.push("Start time is required");
    }
    if (!appointmentData.duration) {
      errors.push("Duration is required");
    }

    // Validation rules
    if (appointmentData.duration && appointmentData.duration < 5) {
      errors.push("Duration must be at least 5 minutes");
    }

    if (appointmentData.duration && appointmentData.duration > 480) {
      errors.push("Duration cannot exceed 8 hours");
    }

    if (appointmentData.startTime) {
      const startTime = new Date(appointmentData.startTime);
      const now = new Date();

      if (startTime < now) {
        errors.push("Cannot schedule appointments in the past");
      }
    }

    // Business hours validation
    if (appointmentData.startTime) {
      const hour = new Date(appointmentData.startTime).getHours();
      if (hour < 6 || hour > 22) {
        errors.push("Appointments must be scheduled between 6 AM and 10 PM");
      }
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  /**
   * Calculate appointment end time
   */
  static calculateEndTime(startTime: Date, duration: number): Date {
    const endTime = new Date(startTime);
    endTime.setMinutes(endTime.getMinutes() + duration);
    return endTime;
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
   * Find scheduling conflicts for a proposed appointment
   */
  static async findConflicts(
    providerId: string,
    startTime: Date,
    endTime: Date,
    excludeAppointmentId?: string,
  ): Promise<any[]> {
    const conflicts: any[] = [];

    // TODO: Query database for existing appointments
    const existingAppointments: Appointment[] = [];

    for (const apt of existingAppointments) {
      if (apt.id === excludeAppointmentId) continue;
      if (apt.status === "cancelled") continue;

      if (this.hasTimeOverlap(startTime, endTime, apt.startTime, apt.endTime)) {
        conflicts.push({
          type: "double-booking",
          appointmentId: apt.id,
          message: `Provider has another appointment at this time`,
          conflictingAppointment: apt,
        });
      }
    }

    return conflicts;
  }

  /**
   * Calculate buffer time between appointments
   */
  static calculateBufferTime(
    previousAppointment: Appointment,
    nextAppointment: Appointment,
  ): number {
    const prevEnd = new Date(previousAppointment.endTime);
    const nextStart = new Date(nextAppointment.startTime);
    const diffMs = nextStart.getTime() - prevEnd.getTime();
    return Math.floor(diffMs / 60000); // Convert to minutes
  }

  /**
   * Get recommended appointment slots
   */
  static async getRecommendedSlots(
    providerId: string,
    duration: number,
    startDate: Date,
    endDate: Date,
    preferences?: {
      preferredDays?: number[];
      preferredTimeSlots?: string[];
      avoidBackToBack?: boolean;
    },
  ): Promise<any[]> {
    const recommendedSlots: any[] = [];

    // TODO: Implement slot recommendation algorithm
    // Consider:
    // - Provider availability
    // - Existing appointments
    // - Buffer times
    // - Patient preferences
    // - Historical patterns

    return recommendedSlots;
  }

  /**
   * Process appointment reminders
   */
  static async processReminders(
    appointments: Appointment[],
    reminderTiming: { hours?: number; days?: number },
  ): Promise<{
    sent: number;
    failed: number;
    skipped: number;
  }> {
    const results = {
      sent: 0,
      failed: 0,
      skipped: 0,
    };

    for (const appointment of appointments) {
      try {
        // Check if reminder already sent
        const alreadySent = appointment.reminders.some(
          (r) => r.type === "email" && r.status === "sent",
        );

        if (alreadySent) {
          results.skipped++;
          continue;
        }

        // TODO: Send reminder via email/SMS
        results.sent++;
      } catch (error) {
        results.failed++;
      }
    }

    return results;
  }

  /**
   * Calculate no-show probability
   */
  static calculateNoShowProbability(appointment: Appointment): number {
    let probability = 0.1; // Base 10%

    // Factors that increase no-show probability:
    // - Not confirmed: +20%
    if (appointment.status !== "confirmed") {
      probability += 0.2;
    }

    // - More than 7 days away: +10%
    const daysUntil = Math.floor(
      (new Date(appointment.startTime).getTime() - Date.now()) /
        (1000 * 60 * 60 * 24),
    );
    if (daysUntil > 7) {
      probability += 0.1;
    }

    // - Insurance not verified: +15%
    if (!appointment.insuranceVerified) {
      probability += 0.15;
    }

    // - No reminders sent: +10%
    if (appointment.reminders.length === 0) {
      probability += 0.1;
    }

    // TODO: Add historical patient no-show rate

    return Math.min(probability, 0.9); // Cap at 90%
  }

  /**
   * Optimize appointment scheduling order
   */
  static optimizeScheduleOrder(appointments: Appointment[]): Appointment[] {
    // Sort appointments to minimize gaps and optimize flow
    return appointments.sort((a, b) => {
      // Primary: Sort by start time
      const timeCompare =
        new Date(a.startTime).getTime() - new Date(b.startTime).getTime();
      if (timeCompare !== 0) return timeCompare;

      // Secondary: Urgent appointments first
      const urgentTypes = ["urgent", "emergency"];
      const aIsUrgent = urgentTypes.includes(a.appointmentType);
      const bIsUrgent = urgentTypes.includes(b.appointmentType);
      if (aIsUrgent && !bIsUrgent) return -1;
      if (!aIsUrgent && bIsUrgent) return 1;

      return 0;
    });
  }

  /**
   * Generate appointment summary
   */
  static generateAppointmentSummary(appointment: Appointment): string {
    const date = new Date(appointment.startTime);
    const time = date.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
    const dateStr = date.toLocaleDateString("en-US", {
      weekday: "long",
      month: "long",
      day: "numeric",
      year: "numeric",
    });

    return `${appointment.appointmentType} appointment with ${appointment.providerName} on ${dateStr} at ${time}. Location: ${appointment.location.facilityName}${appointment.location.roomNumber ? ", Room " + appointment.location.roomNumber : ""}.`;
  }

  /**
   * Calculate appointment statistics
   */
  static calculateStatistics(appointments: Appointment[]): any {
    const stats = {
      total: appointments.length,
      byStatus: {} as Record<string, number>,
      byType: {} as Record<string, number>,
      averageDuration: 0,
      totalDuration: 0,
      noShowRate: 0,
      cancellationRate: 0,
      confirmationRate: 0,
    };

    let totalDuration = 0;
    const statusCounts: Record<string, number> = {};
    const typeCounts: Record<string, number> = {};

    for (const apt of appointments) {
      // Count by status
      statusCounts[apt.status] = (statusCounts[apt.status] || 0) + 1;

      // Count by type
      typeCounts[apt.appointmentType] =
        (typeCounts[apt.appointmentType] || 0) + 1;

      // Sum duration
      totalDuration += apt.duration;
    }

    stats.byStatus = statusCounts;
    stats.byType = typeCounts;
    stats.totalDuration = totalDuration;
    stats.averageDuration =
      appointments.length > 0 ? totalDuration / appointments.length : 0;

    if (appointments.length > 0) {
      stats.noShowRate = (statusCounts["no-show"] || 0) / appointments.length;
      stats.cancellationRate =
        (statusCounts["cancelled"] || 0) / appointments.length;
      stats.confirmationRate =
        (statusCounts["confirmed"] || 0) / appointments.length;
    }

    return stats;
  }

  /**
   * Validate recurring appointment pattern
   */
  static validateRecurrencePattern(pattern: RecurrencePattern): {
    valid: boolean;
    errors: string[];
  } {
    const errors: string[] = [];

    if (!pattern.frequency) {
      errors.push("Frequency is required");
    }

    if (!pattern.interval || pattern.interval < 1) {
      errors.push("Interval must be at least 1");
    }

    if (!pattern.count && !pattern.endDate) {
      errors.push("Either count or end date must be specified");
    }

    if (pattern.count && pattern.count < 1) {
      errors.push("Count must be at least 1");
    }

    if (pattern.count && pattern.count > 100) {
      errors.push("Count cannot exceed 100 occurrences");
    }

    if (pattern.frequency === "weekly" && pattern.daysOfWeek) {
      if (
        !Array.isArray(pattern.daysOfWeek) ||
        pattern.daysOfWeek.length === 0
      ) {
        errors.push("Days of week must be specified for weekly recurrence");
      }
      if (pattern.daysOfWeek.some((d) => d < 0 || d > 6)) {
        errors.push("Days of week must be between 0 (Sunday) and 6 (Saturday)");
      }
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  /**
   * Calculate next recurrence date
   */
  static calculateNextRecurrence(
    lastDate: Date,
    pattern: RecurrencePattern,
  ): Date | null {
    const nextDate = new Date(lastDate);

    switch (pattern.frequency) {
      case "daily":
        nextDate.setDate(nextDate.getDate() + pattern.interval);
        break;
      case "weekly":
        nextDate.setDate(nextDate.getDate() + pattern.interval * 7);
        break;
      case "monthly":
        nextDate.setMonth(nextDate.getMonth() + pattern.interval);
        break;
      case "yearly":
        nextDate.setFullYear(nextDate.getFullYear() + pattern.interval);
        break;
      default:
        return null;
    }

    // Check if we've exceeded the end date
    if (pattern.endDate && nextDate > pattern.endDate) {
      return null;
    }

    return nextDate;
  }

  /**
   * Format time duration
   */
  static formatDuration(minutes: number): string {
    if (minutes < 60) {
      return `${minutes} min`;
    }
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return mins > 0 ? `${hours}h ${mins}min` : `${hours}h`;
  }

  /**
   * Check if appointment needs attention
   */
  static needsAttention(appointment: Appointment): {
    needs: boolean;
    reasons: string[];
  } {
    const reasons: string[] = [];
    const now = new Date();
    const startTime = new Date(appointment.startTime);
    const hoursUntil = (startTime.getTime() - now.getTime()) / (1000 * 60 * 60);

    // Check various conditions
    if (appointment.status !== "confirmed" && hoursUntil < 48) {
      reasons.push("Not confirmed and less than 48 hours away");
    }

    if (!appointment.insuranceVerified && hoursUntil < 24) {
      reasons.push("Insurance not verified");
    }

    if (appointment.reminders.length === 0 && hoursUntil < 24) {
      reasons.push("No reminders sent");
    }

    if (appointment.telehealth?.enabled && !appointment.telehealth.meetingUrl) {
      reasons.push("Telehealth enabled but no meeting URL");
    }

    return {
      needs: reasons.length > 0,
      reasons,
    };
  }
}

export default SchedulingService;
