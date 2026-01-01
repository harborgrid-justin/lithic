import { z } from "zod";

export const appointmentSchema = z.object({
  patientId: z.string().min(1, "Patient is required"),
  providerId: z.string().min(1, "Provider is required"),
  type: z.enum([
    "consultation",
    "follow-up",
    "procedure",
    "surgery",
    "therapy",
    "diagnostic",
    "screening",
    "vaccination",
    "telemedicine",
  ]),
  startTime: z.string().min(1, "Start time is required"),
  duration: z.number().min(5, "Duration must be at least 5 minutes"),
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
  location: z.string().optional(),
  roomId: z.string().optional(),
  resourceIds: z.array(z.string()).optional(),
  notes: z.string().optional(),
  chiefComplaint: z.string().optional(),
  isRecurring: z.boolean().default(false),
  recurrenceRule: z
    .object({
      frequency: z.enum(["daily", "weekly", "biweekly", "monthly", "yearly"]),
      interval: z.number().min(1),
      daysOfWeek: z.array(z.number().min(0).max(6)).optional(),
      endDate: z.string().optional(),
      occurrences: z.number().optional(),
    })
    .optional(),
});

export const providerSchema = z.object({
  name: z.string().min(1, "Name is required"),
  specialty: z.string().min(1, "Specialty is required"),
  email: z.string().email("Invalid email"),
  phone: z.string().min(1, "Phone is required"),
  department: z.string().min(1, "Department is required"),
  avatar: z.string().optional(),
});

export const resourceSchema = z.object({
  name: z.string().min(1, "Name is required"),
  type: z.enum(["room", "equipment", "facility", "vehicle"]),
  description: z.string().optional(),
  location: z.string().min(1, "Location is required"),
  capacity: z.number().optional(),
  isAvailable: z.boolean().default(true),
});

export const waitlistSchema = z.object({
  patientId: z.string().min(1, "Patient is required"),
  providerId: z.string().optional(),
  appointmentType: z.enum([
    "consultation",
    "follow-up",
    "procedure",
    "surgery",
    "therapy",
    "diagnostic",
    "screening",
    "vaccination",
    "telemedicine",
  ]),
  priority: z.enum(["low", "medium", "high", "urgent"]),
  preferredDates: z.array(z.string()).optional(),
  preferredTimes: z.array(z.string()).optional(),
  notes: z.string().optional(),
});

export const scheduleTemplateSchema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().optional(),
  providerId: z.string().optional(),
  schedule: z.array(
    z.object({
      dayOfWeek: z.number().min(0).max(6),
      startTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/),
      endTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/),
      slotDuration: z.number().min(5),
      breakDuration: z.number().optional(),
      location: z.string().optional(),
    }),
  ),
  isActive: z.boolean().default(true),
});

export type AppointmentInput = z.infer<typeof appointmentSchema>;
export type ProviderInput = z.infer<typeof providerSchema>;
export type ResourceInput = z.infer<typeof resourceSchema>;
export type WaitlistInput = z.infer<typeof waitlistSchema>;
export type ScheduleTemplateInput = z.infer<typeof scheduleTemplateSchema>;
