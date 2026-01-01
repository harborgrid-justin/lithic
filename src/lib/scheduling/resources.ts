/**
 * Resource Management - Provider Schedules & Capacity Planning
 * Manages provider templates, room allocation, and resource pooling
 */

import {
  addDays,
  addWeeks,
  addMonths,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  format,
  parseISO,
  differenceInMinutes,
  setHours,
  setMinutes,
  isBefore,
  isAfter,
  isWithinInterval,
} from "date-fns";
import type {
  Schedule,
  TimeSlot,
  ScheduleException,
  DayOfWeek,
  AppointmentType,
  Room,
  Equipment,
  Appointment,
  RecurrenceRule,
  RecurrenceFrequency,
} from "@/types/scheduling";

// ============================================================================
// Types
// ============================================================================

export interface ScheduleTemplate {
  id: string;
  name: string;
  description: string;
  category: TemplateCategory;
  timeSlots: TimeSlot[];
  bufferTime: number;
  maxConcurrent: number;
  appointmentTypes: AppointmentType[];
  isDefault: boolean;
  createdBy: string;
  createdAt: Date;
}

export enum TemplateCategory {
  PRIMARY_CARE = "PRIMARY_CARE",
  SPECIALTY_CARE = "SPECIALTY_CARE",
  SURGERY = "SURGERY",
  URGENT_CARE = "URGENT_CARE",
  TELEHEALTH = "TELEHEALTH",
  CUSTOM = "CUSTOM",
}

export interface ResourcePool {
  id: string;
  name: string;
  type: ResourcePoolType;
  resourceIds: string[];
  facilityId: string;
  priority: number;
  autoAssign: boolean;
  loadBalancing: LoadBalancingStrategy;
}

export enum ResourcePoolType {
  PROVIDER = "PROVIDER",
  ROOM = "ROOM",
  EQUIPMENT = "EQUIPMENT",
}

export enum LoadBalancingStrategy {
  ROUND_ROBIN = "ROUND_ROBIN",
  LEAST_LOADED = "LEAST_LOADED",
  PRIORITY_BASED = "PRIORITY_BASED",
  PATIENT_PREFERENCE = "PATIENT_PREFERENCE",
}

export interface CapacityAnalysis {
  providerId: string;
  providerName: string;
  period: {
    start: Date;
    end: Date;
  };
  totalSlots: number;
  bookedSlots: number;
  availableSlots: number;
  utilizationRate: number;
  overbookedSlots: number;
  cancelledSlots: number;
  noShowSlots: number;
  breakdown: {
    [appointmentType: string]: {
      total: number;
      booked: number;
      available: number;
    };
  };
}

export interface ProviderAvailability {
  providerId: string;
  date: Date;
  dayOfWeek: DayOfWeek;
  slots: AvailabilitySlot[];
  totalMinutes: number;
  bookedMinutes: number;
  availableMinutes: number;
  exceptions: ScheduleException[];
}

export interface AvailabilitySlot {
  startTime: Date;
  endTime: Date;
  duration: number;
  available: boolean;
  appointmentTypes: AppointmentType[];
  roomId?: string;
  reason?: string;
}

export interface ResourceAllocation {
  appointmentId: string;
  providerId: string;
  roomId?: string;
  equipmentIds: string[];
  allocationTime: Date;
  releaseTime: Date;
  status: AllocationStatus;
}

export enum AllocationStatus {
  PENDING = "PENDING",
  ALLOCATED = "ALLOCATED",
  IN_USE = "IN_USE",
  RELEASED = "RELEASED",
  CANCELLED = "CANCELLED",
}

// ============================================================================
// Resource Manager Class
// ============================================================================

export class ResourceManager {
  private templates: Map<string, ScheduleTemplate> = new Map();
  private resourcePools: Map<string, ResourcePool> = new Map();

  // --------------------------------------------------------------------------
  // Schedule Template Management
  // --------------------------------------------------------------------------

  createTemplate(params: {
    name: string;
    description: string;
    category: TemplateCategory;
    timeSlots: TimeSlot[];
    bufferTime?: number;
    maxConcurrent?: number;
    appointmentTypes?: AppointmentType[];
    createdBy: string;
  }): ScheduleTemplate {
    const template: ScheduleTemplate = {
      id: `template_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      name: params.name,
      description: params.description,
      category: params.category,
      timeSlots: params.timeSlots,
      bufferTime: params.bufferTime || 0,
      maxConcurrent: params.maxConcurrent || 1,
      appointmentTypes: params.appointmentTypes || [],
      isDefault: false,
      createdBy: params.createdBy,
      createdAt: new Date(),
    };

    this.templates.set(template.id, template);
    return template;
  }

  getTemplate(id: string): ScheduleTemplate | undefined {
    return this.templates.get(id);
  }

  applyTemplate(
    providerId: string,
    templateId: string,
    facilityId: string,
    effectiveDate: Date,
  ): Schedule {
    const template = this.templates.get(templateId);
    if (!template) {
      throw new Error(`Template ${templateId} not found`);
    }

    return {
      id: `schedule_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      providerId,
      facilityId,
      name: `${template.name} - ${format(effectiveDate, "MMM yyyy")}`,
      type: "PROVIDER" as any,
      status: "ACTIVE" as any,
      effectiveDate,
      expirationDate: null,
      timeSlots: template.timeSlots,
      exceptions: [],
      recurrenceRule: null,
      allowOverlap: false,
      maxConcurrent: template.maxConcurrent,
      bufferTime: template.bufferTime,
      createdAt: new Date(),
      updatedAt: new Date(),
      tenantId: "",
    };
  }

  // --------------------------------------------------------------------------
  // Capacity Planning & Analysis
  // --------------------------------------------------------------------------

  calculateCapacity(
    schedule: Schedule,
    appointments: Appointment[],
    startDate: Date,
    endDate: Date,
  ): CapacityAnalysis {
    const days = eachDayOfInterval({ start: startDate, end: endDate });
    let totalSlots = 0;
    let bookedSlots = 0;
    const breakdown: CapacityAnalysis["breakdown"] = {};

    // Calculate total available slots
    for (const day of days) {
      const dayOfWeek = day.getDay() as DayOfWeek;
      const daySlots = schedule.timeSlots.filter(
        (slot) => slot.dayOfWeek === dayOfWeek && slot.isAvailable,
      );

      for (const slot of daySlots) {
        const slotDuration = this.calculateSlotDuration(
          slot.startTime,
          slot.endTime,
        );
        const slotsInPeriod = Math.floor(slotDuration / slot.duration);
        totalSlots += slotsInPeriod;

        // Initialize breakdown
        for (const apptType of slot.appointmentTypes) {
          if (!breakdown[apptType]) {
            breakdown[apptType] = { total: 0, booked: 0, available: 0 };
          }
          breakdown[apptType].total += slotsInPeriod;
        }
      }
    }

    // Count booked appointments
    const periodAppointments = appointments.filter((appt) => {
      const apptDate = new Date(appt.startTime);
      return isWithinInterval(apptDate, { start: startDate, end: endDate });
    });

    bookedSlots = periodAppointments.filter(
      (appt) =>
        appt.status !== "CANCELLED" && appt.status !== "NO_SHOW",
    ).length;

    const cancelledSlots = periodAppointments.filter(
      (appt) => appt.status === "CANCELLED",
    ).length;

    const noShowSlots = periodAppointments.filter(
      (appt) => appt.status === "NO_SHOW",
    ).length;

    // Update breakdown with booked appointments
    for (const appt of periodAppointments) {
      if (breakdown[appt.appointmentType]) {
        breakdown[appt.appointmentType].booked++;
      }
    }

    // Calculate available slots
    for (const type in breakdown) {
      breakdown[type].available =
        breakdown[type].total - breakdown[type].booked;
    }

    return {
      providerId: schedule.providerId,
      providerName: "Provider", // Would come from lookup
      period: { start: startDate, end: endDate },
      totalSlots,
      bookedSlots,
      availableSlots: totalSlots - bookedSlots,
      utilizationRate: totalSlots > 0 ? (bookedSlots / totalSlots) * 100 : 0,
      overbookedSlots: Math.max(0, bookedSlots - totalSlots),
      cancelledSlots,
      noShowSlots,
      breakdown,
    };
  }

  getProviderAvailability(
    schedule: Schedule,
    appointments: Appointment[],
    date: Date,
  ): ProviderAvailability {
    const dayOfWeek = date.getDay() as DayOfWeek;

    // Check for exceptions
    const exceptions = schedule.exceptions.filter(
      (exc) => format(new Date(exc.date), "yyyy-MM-dd") === format(date, "yyyy-MM-dd"),
    );

    // If full day exception, return no availability
    if (exceptions.some((exc) => !exc.startTime && !exc.endTime)) {
      return {
        providerId: schedule.providerId,
        date,
        dayOfWeek,
        slots: [],
        totalMinutes: 0,
        bookedMinutes: 0,
        availableMinutes: 0,
        exceptions,
      };
    }

    // Get time slots for the day
    const daySlots = schedule.timeSlots.filter(
      (slot) => slot.dayOfWeek === dayOfWeek && slot.isAvailable,
    );

    const availabilitySlots: AvailabilitySlot[] = [];
    let totalMinutes = 0;
    let bookedMinutes = 0;

    for (const slot of daySlots) {
      const [startHour, startMin] = slot.startTime.split(":").map(Number);
      const [endHour, endMin] = slot.endTime.split(":").map(Number);

      const slotStart = setMinutes(setHours(date, startHour), startMin);
      const slotEnd = setMinutes(setHours(date, endHour), endMin);
      const slotDuration = differenceInMinutes(slotEnd, slotStart);

      totalMinutes += slotDuration;

      // Generate individual appointment slots
      let currentTime = slotStart;
      while (isBefore(currentTime, slotEnd)) {
        const slotEndTime = new Date(
          Math.min(
            currentTime.getTime() + slot.duration * 60000,
            slotEnd.getTime(),
          ),
        );

        // Check if slot is booked
        const isBooked = appointments.some((appt) => {
          if (
            appt.status === "CANCELLED" ||
            appt.status === "NO_SHOW"
          )
            return false;

          const apptStart = new Date(appt.startTime);
          const apptEnd = new Date(appt.endTime);

          return (
            (currentTime >= apptStart && currentTime < apptEnd) ||
            (slotEndTime > apptStart && slotEndTime <= apptEnd) ||
            (currentTime <= apptStart && slotEndTime >= apptEnd)
          );
        });

        if (isBooked) {
          bookedMinutes += differenceInMinutes(slotEndTime, currentTime);
        }

        availabilitySlots.push({
          startTime: currentTime,
          endTime: slotEndTime,
          duration: differenceInMinutes(slotEndTime, currentTime),
          available: !isBooked,
          appointmentTypes: slot.appointmentTypes,
        });

        currentTime = slotEndTime;
      }
    }

    return {
      providerId: schedule.providerId,
      date,
      dayOfWeek,
      slots: availabilitySlots,
      totalMinutes,
      bookedMinutes,
      availableMinutes: totalMinutes - bookedMinutes,
      exceptions,
    };
  }

  // --------------------------------------------------------------------------
  // Resource Pooling
  // --------------------------------------------------------------------------

  createResourcePool(params: {
    name: string;
    type: ResourcePoolType;
    resourceIds: string[];
    facilityId: string;
    priority?: number;
    autoAssign?: boolean;
    loadBalancing?: LoadBalancingStrategy;
  }): ResourcePool {
    const pool: ResourcePool = {
      id: `pool_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      name: params.name,
      type: params.type,
      resourceIds: params.resourceIds,
      facilityId: params.facilityId,
      priority: params.priority || 0,
      autoAssign: params.autoAssign ?? true,
      loadBalancing: params.loadBalancing || LoadBalancingStrategy.ROUND_ROBIN,
    };

    this.resourcePools.set(pool.id, pool);
    return pool;
  }

  assignResourceFromPool(
    poolId: string,
    appointmentType: AppointmentType,
    startTime: Date,
    duration: number,
    existingAllocations: ResourceAllocation[],
  ): string | null {
    const pool = this.resourcePools.get(poolId);
    if (!pool) return null;

    switch (pool.loadBalancing) {
      case LoadBalancingStrategy.ROUND_ROBIN:
        return this.roundRobinAssignment(
          pool.resourceIds,
          existingAllocations,
        );

      case LoadBalancingStrategy.LEAST_LOADED:
        return this.leastLoadedAssignment(
          pool.resourceIds,
          startTime,
          duration,
          existingAllocations,
        );

      default:
        return pool.resourceIds[0] || null;
    }
  }

  private roundRobinAssignment(
    resourceIds: string[],
    allocations: ResourceAllocation[],
  ): string | null {
    if (resourceIds.length === 0) return null;

    // Count allocations per resource
    const counts = new Map<string, number>();
    resourceIds.forEach((id) => counts.set(id, 0));

    allocations.forEach((alloc) => {
      if (resourceIds.includes(alloc.providerId)) {
        counts.set(alloc.providerId, (counts.get(alloc.providerId) || 0) + 1);
      }
    });

    // Find resource with least allocations
    let minCount = Infinity;
    let selectedResource: string | null = null;

    resourceIds.forEach((id) => {
      const count = counts.get(id) || 0;
      if (count < minCount) {
        minCount = count;
        selectedResource = id;
      }
    });

    return selectedResource;
  }

  private leastLoadedAssignment(
    resourceIds: string[],
    startTime: Date,
    duration: number,
    allocations: ResourceAllocation[],
  ): string | null {
    if (resourceIds.length === 0) return null;

    const endTime = new Date(startTime.getTime() + duration * 60000);

    // Count overlapping allocations for each resource
    const loads = new Map<string, number>();
    resourceIds.forEach((id) => loads.set(id, 0));

    allocations.forEach((alloc) => {
      if (
        resourceIds.includes(alloc.providerId) &&
        alloc.status !== AllocationStatus.CANCELLED
      ) {
        const allocStart = new Date(alloc.allocationTime);
        const allocEnd = new Date(alloc.releaseTime);

        // Check for overlap
        if (
          (startTime >= allocStart && startTime < allocEnd) ||
          (endTime > allocStart && endTime <= allocEnd) ||
          (startTime <= allocStart && endTime >= allocEnd)
        ) {
          loads.set(
            alloc.providerId,
            (loads.get(alloc.providerId) || 0) + 1,
          );
        }
      }
    });

    // Find resource with lowest load
    let minLoad = Infinity;
    let selectedResource: string | null = null;

    resourceIds.forEach((id) => {
      const load = loads.get(id) || 0;
      if (load < minLoad) {
        minLoad = load;
        selectedResource = id;
      }
    });

    return selectedResource;
  }

  // --------------------------------------------------------------------------
  // Room & Equipment Allocation
  // --------------------------------------------------------------------------

  allocateRoom(
    rooms: Room[],
    appointmentType: AppointmentType,
    startTime: Date,
    duration: number,
    existingAppointments: Appointment[],
  ): Room | null {
    const endTime = new Date(startTime.getTime() + duration * 60000);

    // Filter available rooms
    const availableRooms = rooms.filter((room) => {
      if (room.status !== "AVAILABLE") return false;

      // Check for conflicts
      const hasConflict = existingAppointments.some((appt) => {
        if (appt.roomId !== room.id) return false;
        if (
          appt.status === "CANCELLED" ||
          appt.status === "NO_SHOW"
        )
          return false;

        const apptStart = new Date(appt.startTime);
        const apptEnd = new Date(appt.endTime);

        return (
          (startTime >= apptStart && startTime < apptEnd) ||
          (endTime > apptStart && endTime <= apptEnd) ||
          (startTime <= apptStart && endTime >= apptEnd)
        );
      });

      return !hasConflict;
    });

    // Return first available room (could be enhanced with room preferences)
    return availableRooms[0] || null;
  }

  allocateEquipment(
    equipment: Equipment[],
    required: string[],
    startTime: Date,
    duration: number,
    existingAllocations: ResourceAllocation[],
  ): Equipment[] {
    const endTime = new Date(startTime.getTime() + duration * 60000);
    const allocated: Equipment[] = [];

    for (const reqType of required) {
      const available = equipment.find((equip) => {
        if (equip.type !== reqType) return false;
        if (equip.status !== "AVAILABLE") return false;

        // Check for allocation conflicts
        const hasConflict = existingAllocations.some((alloc) => {
          if (!alloc.equipmentIds.includes(equip.id)) return false;
          if (alloc.status === AllocationStatus.CANCELLED) return false;

          const allocStart = new Date(alloc.allocationTime);
          const allocEnd = new Date(alloc.releaseTime);

          return (
            (startTime >= allocStart && startTime < allocEnd) ||
            (endTime > allocStart && endTime <= allocEnd) ||
            (startTime <= allocStart && endTime >= allocEnd)
          );
        });

        return !hasConflict;
      });

      if (available) {
        allocated.push(available);
      }
    }

    return allocated;
  }

  // --------------------------------------------------------------------------
  // Helper Functions
  // --------------------------------------------------------------------------

  private calculateSlotDuration(startTime: string, endTime: string): number {
    const [startHour, startMin] = startTime.split(":").map(Number);
    const [endHour, endMin] = endTime.split(":").map(Number);

    const start = startHour * 60 + startMin;
    const end = endHour * 60 + endMin;

    return end - start;
  }

  generateRecurringSchedule(
    baseSchedule: Schedule,
    recurrenceRule: RecurrenceRule,
  ): Schedule[] {
    const schedules: Schedule[] = [];
    let currentDate = new Date(baseSchedule.effectiveDate);
    const endDate = recurrenceRule.until || addMonths(currentDate, 12);
    let count = 0;

    while (
      isBefore(currentDate, endDate) &&
      (!recurrenceRule.count || count < recurrenceRule.count)
    ) {
      const newSchedule: Schedule = {
        ...baseSchedule,
        id: `schedule_${Date.now()}_${count}_${Math.random().toString(36).substr(2, 9)}`,
        effectiveDate: new Date(currentDate),
        expirationDate: this.calculateExpirationDate(
          currentDate,
          recurrenceRule.frequency,
        ),
      };

      schedules.push(newSchedule);

      // Advance to next occurrence
      switch (recurrenceRule.frequency) {
        case RecurrenceFrequency.DAILY:
          currentDate = addDays(currentDate, recurrenceRule.interval);
          break;
        case RecurrenceFrequency.WEEKLY:
          currentDate = addWeeks(currentDate, recurrenceRule.interval);
          break;
        case RecurrenceFrequency.MONTHLY:
          currentDate = addMonths(currentDate, recurrenceRule.interval);
          break;
      }

      count++;
    }

    return schedules;
  }

  private calculateExpirationDate(
    effectiveDate: Date,
    frequency: RecurrenceFrequency,
  ): Date {
    switch (frequency) {
      case RecurrenceFrequency.DAILY:
        return addDays(effectiveDate, 1);
      case RecurrenceFrequency.WEEKLY:
        return addWeeks(effectiveDate, 1);
      case RecurrenceFrequency.MONTHLY:
        return addMonths(effectiveDate, 1);
      default:
        return addMonths(effectiveDate, 1);
    }
  }
}

// ============================================================================
// Singleton Instance
// ============================================================================

let resourceManagerInstance: ResourceManager | null = null;

export function getResourceManager(): ResourceManager {
  if (!resourceManagerInstance) {
    resourceManagerInstance = new ResourceManager();
  }
  return resourceManagerInstance;
}

// ============================================================================
// Utility Functions
// ============================================================================

export function calculateUtilization(
  bookedMinutes: number,
  totalMinutes: number,
): number {
  if (totalMinutes === 0) return 0;
  return (bookedMinutes / totalMinutes) * 100;
}

export function findAvailableSlots(
  availability: ProviderAvailability,
  duration: number,
): AvailabilitySlot[] {
  return availability.slots.filter(
    (slot) => slot.available && slot.duration >= duration,
  );
}

export function optimizeRoomUtilization(
  rooms: Room[],
  appointments: Appointment[],
  date: Date,
): {
  roomId: string;
  utilizationRate: number;
  appointmentCount: number;
}[] {
  const utilization = rooms.map((room) => {
    const roomAppointments = appointments.filter(
      (appt) =>
        appt.roomId === room.id &&
        format(new Date(appt.startTime), "yyyy-MM-dd") ===
          format(date, "yyyy-MM-dd") &&
        appt.status !== "CANCELLED" &&
        appt.status !== "NO_SHOW",
    );

    const totalMinutes = roomAppointments.reduce((sum, appt) => {
      return sum + differenceInMinutes(new Date(appt.endTime), new Date(appt.startTime));
    }, 0);

    // Assume 10-hour workday
    const availableMinutes = 10 * 60;

    return {
      roomId: room.id,
      utilizationRate: (totalMinutes / availableMinutes) * 100,
      appointmentCount: roomAppointments.length,
    };
  });

  return utilization.sort((a, b) => b.utilizationRate - a.utilizationRate);
}
