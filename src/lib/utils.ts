import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(
  date: Date | string,
  format: "short" | "long" | "full" = "short",
): string {
  const d = typeof date === "string" ? new Date(date) : date;
  if (format === "short") {
    return d.toLocaleDateString("en-US");
  } else if (format === "long") {
    return d.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  } else {
    return d.toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  }
}

export function formatTime(
  date: Date | string,
  includeSeconds = false,
): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    second: includeSeconds ? "2-digit" : undefined,
  });
}

export function formatDateTime(date: Date | string): string {
  return formatDate(date) + " " + formatTime(date);
}

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

export function formatCurrency(amount: number, currency = "USD"): string {
  return new Intl.NumberFormat("en-US", { style: "currency", currency }).format(
    amount,
  );
}

export function formatPhoneNumber(phone: string): string {
  const cleaned = phone.replace(/\D/g, "");
  if (cleaned.length === 10) {
    return (
      "(" +
      cleaned.slice(0, 3) +
      ") " +
      cleaned.slice(3, 6) +
      "-" +
      cleaned.slice(6)
    );
  } else if (cleaned.length === 11 && cleaned[0] === "1") {
    return (
      "+1 (" +
      cleaned.slice(1, 4) +
      ") " +
      cleaned.slice(4, 7) +
      "-" +
      cleaned.slice(7)
    );
  }
  return phone;
}

// Alias for consistency with other code
export const formatPhone = formatPhoneNumber;

export function truncate(str: string, length: number): string {
  if (str.length <= length) return str;
  return str.slice(0, length) + "...";
}

export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function isEmpty(obj: any): boolean {
  if (obj === null || obj === undefined) return true;
  if (typeof obj === "string") return obj.length === 0;
  if (Array.isArray(obj)) return obj.length === 0;
  if (typeof obj === "object") return Object.keys(obj).length === 0;
  return false;
}

export function capitalize(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
}

export function maskSSN(ssn: string): string {
  if (ssn.length !== 9) return ssn;
  return "***-**-" + ssn.slice(-4);
}

export function calculateBMI(
  weight: number,
  height: number,
  weightUnit: "kg" | "lb",
  heightUnit: "cm" | "in",
): number {
  let weightKg = weightUnit === "kg" ? weight : weight * 0.453592;
  let heightM = heightUnit === "cm" ? height / 100 : height * 0.0254;
  return Math.round((weightKg / (heightM * heightM)) * 10) / 10;
}

export function handleError(error: unknown): { code: string; message: string } {
  if (error instanceof Error) {
    return { code: "INTERNAL_ERROR", message: error.message };
  }
  return { code: "UNKNOWN_ERROR", message: "An unknown error occurred" };
}

// Scheduling-specific utilities
export function formatDuration(minutes: number): string {
  if (minutes < 60) {
    return `${minutes}m`;
  }
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
}

export function parseTimeString(timeStr: string): {
  hours: number;
  minutes: number;
} {
  const [hours, minutes] = timeStr.split(":").map(Number);
  return { hours, minutes };
}

export function timeStringToDate(dateStr: string, timeStr: string): Date {
  const date = new Date(dateStr);
  const { hours, minutes } = parseTimeString(timeStr);
  date.setHours(hours, minutes, 0, 0);
  return date;
}

export function getStatusColor(status: string): string {
  const colors: Record<string, string> = {
    scheduled: "bg-blue-100 text-blue-800",
    confirmed: "bg-green-100 text-green-800",
    "checked-in": "bg-purple-100 text-purple-800",
    "in-progress": "bg-yellow-100 text-yellow-800",
    completed: "bg-gray-100 text-gray-800",
    cancelled: "bg-red-100 text-red-800",
    "no-show": "bg-orange-100 text-orange-800",
    rescheduled: "bg-indigo-100 text-indigo-800",
  };
  return colors[status] || "bg-gray-100 text-gray-800";
}

export function getPriorityColor(priority: string): string {
  const colors: Record<string, string> = {
    low: "bg-gray-100 text-gray-800",
    medium: "bg-blue-100 text-blue-800",
    high: "bg-orange-100 text-orange-800",
    urgent: "bg-red-100 text-red-800",
  };
  return colors[priority] || "bg-gray-100 text-gray-800";
}

export function generateTimeSlots(
  startTime: string,
  endTime: string,
  slotDuration: number,
  breakDuration: number = 0,
): string[] {
  const slots: string[] = [];
  const start = parseTimeString(startTime);
  const end = parseTimeString(endTime);

  let currentMinutes = start.hours * 60 + start.minutes;
  const endMinutes = end.hours * 60 + end.minutes;

  while (currentMinutes + slotDuration <= endMinutes) {
    const hours = Math.floor(currentMinutes / 60);
    const minutes = currentMinutes % 60;
    slots.push(
      `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}`,
    );
    currentMinutes += slotDuration + breakDuration;
  }

  return slots;
}

export function isTimeSlotAvailable(
  slotStart: Date,
  slotEnd: Date,
  existingAppointments: { startTime: string; endTime: string }[],
): boolean {
  return !existingAppointments.some((apt) => {
    const aptStart = new Date(apt.startTime);
    const aptEnd = new Date(apt.endTime);

    return (
      (slotStart >= aptStart && slotStart < aptEnd) ||
      (slotEnd > aptStart && slotEnd <= aptEnd) ||
      (slotStart <= aptStart && slotEnd >= aptEnd)
    );
  });
}

export function getDayOfWeek(date: Date): number {
  return date.getDay();
}

export function addMinutes(date: Date, minutes: number): Date {
  return new Date(date.getTime() + minutes * 60000);
}

export function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

export function isSameDay(date1: Date, date2: Date): boolean {
  return (
    date1.getFullYear() === date2.getFullYear() &&
    date1.getMonth() === date2.getMonth() &&
    date1.getDate() === date2.getDate()
  );
}

export function getWeekDates(date: Date): Date[] {
  const dates: Date[] = [];
  const day = date.getDay();
  const diff = date.getDate() - day;

  for (let i = 0; i < 7; i++) {
    const weekDate = new Date(date);
    weekDate.setDate(diff + i);
    dates.push(weekDate);
  }

  return dates;
}

export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number,
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null;

  return (...args: Parameters<T>) => {
    if (timeout) clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}
