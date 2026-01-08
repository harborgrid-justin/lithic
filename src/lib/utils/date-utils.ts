/**
 * Date Utilities
 * Comprehensive date formatting and manipulation utilities
 */

/**
 * Format date in various formats
 */
export function formatDate(
  date: Date | string,
  format: "short" | "long" | "full" | "iso" | "medical" = "short",
): string {
  const d = typeof date === "string" ? new Date(date) : date;

  switch (format) {
    case "short":
      return d.toLocaleDateString("en-US");
    case "long":
      return d.toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      });
    case "full":
      return d.toLocaleDateString("en-US", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
      });
    case "iso":
      return d.toISOString().split("T")[0] || "";
    case "medical":
      // MM/DD/YYYY format commonly used in US medical records
      const month = String(d.getMonth() + 1).padStart(2, "0");
      const day = String(d.getDate()).padStart(2, "0");
      const year = d.getFullYear();
      return `${month}/${day}/${year}`;
    default:
      return d.toLocaleDateString("en-US");
  }
}

/**
 * Format time in various formats
 */
export function formatTime(
  date: Date | string,
  format: "12h" | "24h" | "full" = "12h",
): string {
  const d = typeof date === "string" ? new Date(date) : date;

  switch (format) {
    case "12h":
      return d.toLocaleTimeString("en-US", {
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
      });
    case "24h":
      return d.toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
      });
    case "full":
      return d.toLocaleTimeString("en-US", {
        hour: "numeric",
        minute: "2-digit",
        second: "2-digit",
        hour12: true,
      });
    default:
      return d.toLocaleTimeString("en-US", {
        hour: "numeric",
        minute: "2-digit",
      });
  }
}

/**
 * Format date and time together
 */
export function formatDateTime(
  date: Date | string,
  options?: {
    dateFormat?: "short" | "long" | "full";
    timeFormat?: "12h" | "24h";
  },
): string {
  const dateStr = formatDate(date, options?.dateFormat || "short");
  const timeStr = formatTime(date, options?.timeFormat || "12h");
  return `${dateStr} ${timeStr}`;
}

/**
 * Format relative time (e.g., "2 hours ago", "in 3 days")
 */
export function formatRelativeTime(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHour = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHour / 24);
  const diffWeek = Math.floor(diffDay / 7);
  const diffMonth = Math.floor(diffDay / 30);
  const diffYear = Math.floor(diffDay / 365);

  if (diffSec < 60) return "just now";
  if (diffMin < 60)
    return `${diffMin} ${diffMin === 1 ? "minute" : "minutes"} ago`;
  if (diffHour < 24)
    return `${diffHour} ${diffHour === 1 ? "hour" : "hours"} ago`;
  if (diffDay < 7) return `${diffDay} ${diffDay === 1 ? "day" : "days"} ago`;
  if (diffWeek < 4)
    return `${diffWeek} ${diffWeek === 1 ? "week" : "weeks"} ago`;
  if (diffMonth < 12)
    return `${diffMonth} ${diffMonth === 1 ? "month" : "months"} ago`;
  return `${diffYear} ${diffYear === 1 ? "year" : "years"} ago`;
}

/**
 * Calculate age from date of birth
 */
export function calculateAge(dateOfBirth: Date | string): number {
  const dob =
    typeof dateOfBirth === "string" ? new Date(dateOfBirth) : dateOfBirth;
  const today = new Date();
  let age = today.getFullYear() - dob.getFullYear();
  const monthDiff = today.getMonth() - dob.getMonth();

  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dob.getDate())) {
    age--;
  }

  return age;
}

/**
 * Calculate age with precision (years, months, days)
 */
export function calculatePreciseAge(dateOfBirth: Date | string): {
  years: number;
  months: number;
  days: number;
} {
  const dob =
    typeof dateOfBirth === "string" ? new Date(dateOfBirth) : dateOfBirth;
  const today = new Date();

  let years = today.getFullYear() - dob.getFullYear();
  let months = today.getMonth() - dob.getMonth();
  let days = today.getDate() - dob.getDate();

  if (days < 0) {
    months--;
    const lastMonth = new Date(today.getFullYear(), today.getMonth(), 0);
    days += lastMonth.getDate();
  }

  if (months < 0) {
    years--;
    months += 12;
  }

  return { years, months, days };
}

/**
 * Format age for display
 */
export function formatAge(dateOfBirth: Date | string): string {
  const age = calculateAge(dateOfBirth);
  if (age < 1) {
    const precise = calculatePreciseAge(dateOfBirth);
    if (precise.months < 1) {
      return `${precise.days} ${precise.days === 1 ? "day" : "days"}`;
    }
    return `${precise.months} ${precise.months === 1 ? "month" : "months"}`;
  }
  return `${age} ${age === 1 ? "year" : "years"}`;
}

/**
 * Add days to a date
 */
export function addDays(date: Date | string, days: number): Date {
  const d = typeof date === "string" ? new Date(date) : new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

/**
 * Add months to a date
 */
export function addMonths(date: Date | string, months: number): Date {
  const d = typeof date === "string" ? new Date(date) : new Date(date);
  d.setMonth(d.getMonth() + months);
  return d;
}

/**
 * Add years to a date
 */
export function addYears(date: Date | string, years: number): Date {
  const d = typeof date === "string" ? new Date(date) : new Date(date);
  d.setFullYear(d.getFullYear() + years);
  return d;
}

/**
 * Add minutes to a date
 */
export function addMinutes(date: Date | string, minutes: number): Date {
  const d = typeof date === "string" ? new Date(date) : new Date(date);
  return new Date(d.getTime() + minutes * 60000);
}

/**
 * Add hours to a date
 */
export function addHours(date: Date | string, hours: number): Date {
  const d = typeof date === "string" ? new Date(date) : new Date(date);
  return new Date(d.getTime() + hours * 3600000);
}

/**
 * Get start of day
 */
export function startOfDay(date: Date | string): Date {
  const d = typeof date === "string" ? new Date(date) : new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

/**
 * Get end of day
 */
export function endOfDay(date: Date | string): Date {
  const d = typeof date === "string" ? new Date(date) : new Date(date);
  d.setHours(23, 59, 59, 999);
  return d;
}

/**
 * Get start of week
 */
export function startOfWeek(date: Date | string): Date {
  const d = typeof date === "string" ? new Date(date) : new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day;
  return new Date(d.setDate(diff));
}

/**
 * Get end of week
 */
export function endOfWeek(date: Date | string): Date {
  const d = startOfWeek(date);
  return addDays(d, 6);
}

/**
 * Get start of month
 */
export function startOfMonth(date: Date | string): Date {
  const d = typeof date === "string" ? new Date(date) : new Date(date);
  return new Date(d.getFullYear(), d.getMonth(), 1);
}

/**
 * Get end of month
 */
export function endOfMonth(date: Date | string): Date {
  const d = typeof date === "string" ? new Date(date) : new Date(date);
  return new Date(d.getFullYear(), d.getMonth() + 1, 0);
}

/**
 * Check if two dates are the same day
 */
export function isSameDay(date1: Date | string, date2: Date | string): boolean {
  const d1 = typeof date1 === "string" ? new Date(date1) : date1;
  const d2 = typeof date2 === "string" ? new Date(date2) : date2;

  return (
    d1.getFullYear() === d2.getFullYear() &&
    d1.getMonth() === d2.getMonth() &&
    d1.getDate() === d2.getDate()
  );
}

/**
 * Check if date is today
 */
export function isToday(date: Date | string): boolean {
  return isSameDay(date, new Date());
}

/**
 * Check if date is yesterday
 */
export function isYesterday(date: Date | string): boolean {
  const yesterday = addDays(new Date(), -1);
  return isSameDay(date, yesterday);
}

/**
 * Check if date is tomorrow
 */
export function isTomorrow(date: Date | string): boolean {
  const tomorrow = addDays(new Date(), 1);
  return isSameDay(date, tomorrow);
}

/**
 * Check if date is in the past
 */
export function isPast(date: Date | string): boolean {
  const d = typeof date === "string" ? new Date(date) : date;
  return d < new Date();
}

/**
 * Check if date is in the future
 */
export function isFuture(date: Date | string): boolean {
  const d = typeof date === "string" ? new Date(date) : date;
  return d > new Date();
}

/**
 * Check if date is between two dates
 */
export function isBetween(
  date: Date | string,
  startDate: Date | string,
  endDate: Date | string,
): boolean {
  const d = typeof date === "string" ? new Date(date) : date;
  const start = typeof startDate === "string" ? new Date(startDate) : startDate;
  const end = typeof endDate === "string" ? new Date(endDate) : endDate;

  return d >= start && d <= end;
}

/**
 * Get difference in days between two dates
 */
export function differenceInDays(
  date1: Date | string,
  date2: Date | string,
): number {
  const d1 = typeof date1 === "string" ? new Date(date1) : date1;
  const d2 = typeof date2 === "string" ? new Date(date2) : date2;
  const diffTime = Math.abs(d2.getTime() - d1.getTime());
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

/**
 * Get difference in hours between two dates
 */
export function differenceInHours(
  date1: Date | string,
  date2: Date | string,
): number {
  const d1 = typeof date1 === "string" ? new Date(date1) : date1;
  const d2 = typeof date2 === "string" ? new Date(date2) : date2;
  const diffTime = Math.abs(d2.getTime() - d1.getTime());
  return Math.floor(diffTime / (1000 * 60 * 60));
}

/**
 * Get difference in minutes between two dates
 */
export function differenceInMinutes(
  date1: Date | string,
  date2: Date | string,
): number {
  const d1 = typeof date1 === "string" ? new Date(date1) : date1;
  const d2 = typeof date2 === "string" ? new Date(date2) : date2;
  const diffTime = Math.abs(d2.getTime() - d1.getTime());
  return Math.floor(diffTime / (1000 * 60));
}

/**
 * Format duration in milliseconds to human-readable string
 */
export function formatDuration(milliseconds: number): string {
  const seconds = Math.floor(milliseconds / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 0) {
    return `${days}d ${hours % 24}h`;
  } else if (hours > 0) {
    return `${hours}h ${minutes % 60}m`;
  } else if (minutes > 0) {
    return `${minutes}m ${seconds % 60}s`;
  } else {
    return `${seconds}s`;
  }
}

/**
 * Parse time string (HH:MM) to Date object
 */
export function parseTimeString(timeStr: string, baseDate?: Date): Date {
  const [hours, minutes] = timeStr.split(":").map(Number);
  const date = baseDate ? new Date(baseDate) : new Date();
  date.setHours(hours, minutes, 0, 0);
  return date;
}

/**
 * Format date for medical records (with time zone)
 */
export function formatMedicalDateTime(
  date: Date | string,
  includeTimezone = true,
): string {
  const d = typeof date === "string" ? new Date(date) : date;
  const formatted = formatDateTime(d, {
    dateFormat: "medical",
    timeFormat: "24h",
  });

  if (includeTimezone) {
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
    return `${formatted} ${tz}`;
  }

  return formatted;
}

/**
 * Get day of week name
 */
export function getDayName(
  date: Date | string,
  format: "short" | "long" = "long",
): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleDateString("en-US", { weekday: format });
}

/**
 * Get month name
 */
export function getMonthName(
  date: Date | string,
  format: "short" | "long" = "long",
): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleDateString("en-US", { month: format });
}

/**
 * Get array of dates for a week
 */
export function getWeekDates(date: Date | string): Date[] {
  const start = startOfWeek(date);
  return Array.from({ length: 7 }, (_, i) => addDays(start, i));
}

/**
 * Get array of dates for a month
 */
export function getMonthDates(date: Date | string): Date[] {
  const start = startOfMonth(date);
  const end = endOfMonth(date);
  const days = differenceInDays(start, end) + 1;
  return Array.from({ length: days }, (_, i) => addDays(start, i));
}

/**
 * Check if year is leap year
 */
export function isLeapYear(year: number): boolean {
  return (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
}

/**
 * Get number of days in month
 */
export function getDaysInMonth(date: Date | string): number {
  const d = typeof date === "string" ? new Date(date) : date;
  return new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate();
}

/**
 * Format date for API (ISO 8601)
 */
export function toISODate(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toISOString();
}

/**
 * Parse ISO date string
 */
export function fromISODate(isoString: string): Date {
  return new Date(isoString);
}
