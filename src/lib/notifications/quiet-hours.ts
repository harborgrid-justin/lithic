/**
 * Quiet Hours Manager
 * Lithic Healthcare Platform v0.5
 *
 * Manages quiet hours and do-not-disturb settings for notifications.
 * Respects user-defined schedules while allowing critical alerts.
 */

import { QuietHours, NotificationPriority } from '@/types/notifications';
import { format, parse, isWithinInterval } from 'date-fns';
import { utcToZonedTime, zonedTimeToUtc } from 'date-fns-tz';

export class QuietHoursManager {
  /**
   * Check if quiet hours are currently active for a user
   */
  isQuietHoursActive(quietHours: QuietHours, priority: NotificationPriority): boolean {
    // Quiet hours not enabled
    if (!quietHours.enabled) {
      return false;
    }

    // Critical notifications bypass quiet hours if configured
    if (priority === NotificationPriority.CRITICAL && quietHours.allowCritical) {
      return false;
    }

    const now = new Date();

    // Convert to user's timezone
    const userTime = utcToZonedTime(now, quietHours.timezone);

    // Check if current day is in quiet hours days
    const dayOfWeek = userTime.getDay();
    if (!quietHours.days.includes(dayOfWeek)) {
      return false;
    }

    // Check if current time is within quiet hours
    return this.isTimeInQuietHours(userTime, quietHours.startTime, quietHours.endTime);
  }

  /**
   * Check if a specific time is within quiet hours
   */
  private isTimeInQuietHours(date: Date, startTime: string, endTime: string): boolean {
    const currentTime = format(date, 'HH:mm');
    const [startHour, startMin] = startTime.split(':').map(Number);
    const [endHour, endMin] = endTime.split(':').map(Number);
    const [currentHour, currentMin] = currentTime.split(':').map(Number);

    const currentMinutes = currentHour * 60 + currentMin;
    const startMinutes = startHour * 60 + startMin;
    const endMinutes = endHour * 60 + endMin;

    // Handle overnight quiet hours (e.g., 22:00 to 08:00)
    if (endMinutes < startMinutes) {
      return currentMinutes >= startMinutes || currentMinutes < endMinutes;
    }

    // Normal quiet hours (e.g., 08:00 to 17:00)
    return currentMinutes >= startMinutes && currentMinutes < endMinutes;
  }

  /**
   * Calculate when quiet hours will end
   */
  getQuietHoursEndTime(quietHours: QuietHours): Date | null {
    if (!quietHours.enabled) {
      return null;
    }

    const now = new Date();
    const userTime = utcToZonedTime(now, quietHours.timezone);

    // If not in quiet hours, return null
    if (!this.isTimeInQuietHours(userTime, quietHours.startTime, quietHours.endTime)) {
      return null;
    }

    // Parse end time
    const [endHour, endMin] = quietHours.endTime.split(':').map(Number);

    // Create end time for today
    const endTime = new Date(userTime);
    endTime.setHours(endHour, endMin, 0, 0);

    // If end time is before current time (overnight quiet hours), add a day
    if (endTime < userTime) {
      endTime.setDate(endTime.getDate() + 1);
    }

    // Convert back to UTC
    return zonedTimeToUtc(endTime, quietHours.timezone);
  }

  /**
   * Calculate when quiet hours will start next
   */
  getNextQuietHoursStart(quietHours: QuietHours): Date | null {
    if (!quietHours.enabled) {
      return null;
    }

    const now = new Date();
    const userTime = utcToZonedTime(now, quietHours.timezone);

    // Parse start time
    const [startHour, startMin] = quietHours.startTime.split(':').map(Number);

    // Create start time for today
    let startTime = new Date(userTime);
    startTime.setHours(startHour, startMin, 0, 0);

    // If start time has passed today, find next valid day
    if (startTime <= userTime) {
      startTime.setDate(startTime.getDate() + 1);
    }

    // Find next day that's in quiet hours days
    let daysChecked = 0;
    while (daysChecked < 7) {
      const dayOfWeek = startTime.getDay();
      if (quietHours.days.includes(dayOfWeek)) {
        break;
      }
      startTime.setDate(startTime.getDate() + 1);
      daysChecked++;
    }

    if (daysChecked === 7) {
      return null; // No quiet hours configured
    }

    // Convert back to UTC
    return zonedTimeToUtc(startTime, quietHours.timezone);
  }

  /**
   * Check if notification should be delayed due to quiet hours
   */
  shouldDelayNotification(
    quietHours: QuietHours,
    priority: NotificationPriority
  ): { delay: boolean; until?: Date } {
    if (!this.isQuietHoursActive(quietHours, priority)) {
      return { delay: false };
    }

    const endTime = this.getQuietHoursEndTime(quietHours);

    return {
      delay: true,
      until: endTime || undefined,
    };
  }

  /**
   * Validate quiet hours configuration
   */
  validateQuietHours(quietHours: QuietHours): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    // Validate time format
    const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
    if (!timeRegex.test(quietHours.startTime)) {
      errors.push('Invalid start time format. Use HH:mm (24-hour)');
    }
    if (!timeRegex.test(quietHours.endTime)) {
      errors.push('Invalid end time format. Use HH:mm (24-hour)');
    }

    // Validate days
    if (quietHours.days.length === 0) {
      errors.push('At least one day must be selected');
    }
    if (quietHours.days.some((day) => day < 0 || day > 6)) {
      errors.push('Invalid day value. Must be 0-6 (Sunday=0)');
    }

    // Validate timezone
    try {
      utcToZonedTime(new Date(), quietHours.timezone);
    } catch {
      errors.push('Invalid timezone');
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  /**
   * Get default quiet hours configuration
   */
  getDefaultQuietHours(): QuietHours {
    return {
      enabled: false,
      startTime: '22:00',
      endTime: '08:00',
      timezone: 'America/New_York',
      days: [0, 1, 2, 3, 4, 5, 6], // All days
      allowCritical: true,
    };
  }

  /**
   * Get common quiet hours presets
   */
  getQuietHoursPresets(): Array<{
    name: string;
    description: string;
    config: QuietHours;
  }> {
    return [
      {
        name: 'Nighttime',
        description: 'Every night from 10 PM to 8 AM',
        config: {
          enabled: true,
          startTime: '22:00',
          endTime: '08:00',
          timezone: 'America/New_York',
          days: [0, 1, 2, 3, 4, 5, 6],
          allowCritical: true,
        },
      },
      {
        name: 'Work Hours',
        description: 'Weekdays 9 AM to 5 PM',
        config: {
          enabled: true,
          startTime: '09:00',
          endTime: '17:00',
          timezone: 'America/New_York',
          days: [1, 2, 3, 4, 5], // Monday-Friday
          allowCritical: true,
        },
      },
      {
        name: 'Weekends',
        description: 'All day Saturday and Sunday',
        config: {
          enabled: true,
          startTime: '00:00',
          endTime: '23:59',
          timezone: 'America/New_York',
          days: [0, 6], // Sunday and Saturday
          allowCritical: true,
        },
      },
      {
        name: 'Sleep Schedule',
        description: 'Every night from 11 PM to 7 AM',
        config: {
          enabled: true,
          startTime: '23:00',
          endTime: '07:00',
          timezone: 'America/New_York',
          days: [0, 1, 2, 3, 4, 5, 6],
          allowCritical: true,
        },
      },
    ];
  }

  /**
   * Format quiet hours for display
   */
  formatQuietHours(quietHours: QuietHours): string {
    if (!quietHours.enabled) {
      return 'Not enabled';
    }

    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const days = quietHours.days.map((d) => dayNames[d]).join(', ');

    return `${quietHours.startTime} - ${quietHours.endTime} on ${days}`;
  }

  /**
   * Get quiet hours status for display
   */
  getQuietHoursStatus(quietHours: QuietHours): {
    active: boolean;
    message: string;
    endsAt?: Date;
    startsAt?: Date;
  } {
    if (!quietHours.enabled) {
      return {
        active: false,
        message: 'Quiet hours not enabled',
      };
    }

    const now = new Date();
    const userTime = utcToZonedTime(now, quietHours.timezone);
    const isActive = this.isTimeInQuietHours(
      userTime,
      quietHours.startTime,
      quietHours.endTime
    );

    if (isActive) {
      const endsAt = this.getQuietHoursEndTime(quietHours);
      return {
        active: true,
        message: `Quiet hours active until ${quietHours.endTime}`,
        endsAt: endsAt || undefined,
      };
    } else {
      const startsAt = this.getNextQuietHoursStart(quietHours);
      return {
        active: false,
        message: `Quiet hours start at ${quietHours.startTime}`,
        startsAt: startsAt || undefined,
      };
    }
  }

  /**
   * Convert time string to minutes since midnight
   */
  private timeToMinutes(time: string): number {
    const [hours, minutes] = time.split(':').map(Number);
    return hours * 60 + minutes;
  }

  /**
   * Calculate quiet hours duration in minutes
   */
  getQuietHoursDuration(quietHours: QuietHours): number {
    const startMinutes = this.timeToMinutes(quietHours.startTime);
    const endMinutes = this.timeToMinutes(quietHours.endTime);

    if (endMinutes < startMinutes) {
      // Overnight quiet hours
      return 24 * 60 - startMinutes + endMinutes;
    }

    return endMinutes - startMinutes;
  }

  /**
   * Check if two quiet hours periods overlap
   */
  doPeriodsOverlap(period1: QuietHours, period2: QuietHours): boolean {
    // Check if any days overlap
    const daysOverlap = period1.days.some((day) => period2.days.includes(day));
    if (!daysOverlap) {
      return false;
    }

    // Check if times overlap
    const start1 = this.timeToMinutes(period1.startTime);
    const end1 = this.timeToMinutes(period1.endTime);
    const start2 = this.timeToMinutes(period2.startTime);
    const end2 = this.timeToMinutes(period2.endTime);

    // Handle overnight periods
    if (end1 < start1 && end2 < start2) {
      return true; // Both overnight = overlap
    }

    if (end1 < start1) {
      return start2 < end1 || end2 > start1;
    }

    if (end2 < start2) {
      return start1 < end2 || end1 > start2;
    }

    return start1 < end2 && end1 > start2;
  }
}
