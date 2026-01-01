/**
 * OR Equipment Tracker
 * Tracks surgical equipment, maintenance schedules, and availability
 */

import {
  addDays,
  addMonths,
  differenceInDays,
  isBefore,
  isAfter,
  format,
  startOfDay,
  endOfDay,
} from "date-fns";
import type {
  SurgicalCase,
  EquipmentRequest,
} from "@/types/or-management";

// ============================================================================
// Types
// ============================================================================

export interface SurgicalEquipment {
  id: string;
  name: string;
  type: EquipmentType;
  category: EquipmentCategory;
  manufacturer: string;
  model: string;
  serialNumber: string;
  purchaseDate: Date;
  warrantyExpiry: Date | null;
  status: EquipmentStatus;
  location: string;
  assignedRoom: string | null;
  isPortable: boolean;
  requiresCertification: boolean;
  certifications: EquipmentCertification[];
  maintenanceSchedule: MaintenanceRecord[];
  usageLog: UsageRecord[];
  specifications: Record<string, any>;
  notes: string | null;
}

export enum EquipmentType {
  SURGICAL_INSTRUMENT = "SURGICAL_INSTRUMENT",
  IMAGING_DEVICE = "IMAGING_DEVICE",
  ANESTHESIA_MACHINE = "ANESTHESIA_MACHINE",
  ELECTROSURGICAL_UNIT = "ELECTROSURGICAL_UNIT",
  LASER = "LASER",
  ENDOSCOPE = "ENDOSCOPE",
  ROBOT = "ROBOT",
  MONITOR = "MONITOR",
  PUMP = "PUMP",
  VENTILATOR = "VENTILATOR",
  DEFIBRILLATOR = "DEFIBRILLATOR",
  MICROSCOPE = "MICROSCOPE",
  TABLE = "TABLE",
  LIGHT = "LIGHT",
  OTHER = "OTHER",
}

export enum EquipmentCategory {
  CAPITAL_EQUIPMENT = "CAPITAL_EQUIPMENT",
  CONSUMABLE = "CONSUMABLE",
  REUSABLE_INSTRUMENT = "REUSABLE_INSTRUMENT",
  SINGLE_USE = "SINGLE_USE",
  IMPLANT = "IMPLANT",
}

export enum EquipmentStatus {
  AVAILABLE = "AVAILABLE",
  IN_USE = "IN_USE",
  MAINTENANCE = "MAINTENANCE",
  REPAIR = "REPAIR",
  CLEANING = "CLEANING",
  STERILIZATION = "STERILIZATION",
  OUT_OF_SERVICE = "OUT_OF_SERVICE",
  RETIRED = "RETIRED",
}

export interface EquipmentCertification {
  name: string;
  issuer: string;
  issuedDate: Date;
  expiryDate: Date;
  certificateNumber: string;
  isActive: boolean;
}

export interface MaintenanceRecord {
  id: string;
  scheduledDate: Date;
  completedDate: Date | null;
  type: MaintenanceType;
  performedBy: string | null;
  cost: number | null;
  findings: string | null;
  nextServiceDate: Date | null;
  status: MaintenanceStatus;
}

export enum MaintenanceType {
  PREVENTIVE = "PREVENTIVE",
  CORRECTIVE = "CORRECTIVE",
  CALIBRATION = "CALIBRATION",
  INSPECTION = "INSPECTION",
  UPGRADE = "UPGRADE",
}

export enum MaintenanceStatus {
  SCHEDULED = "SCHEDULED",
  IN_PROGRESS = "IN_PROGRESS",
  COMPLETED = "COMPLETED",
  CANCELLED = "CANCELLED",
  OVERDUE = "OVERDUE",
}

export interface UsageRecord {
  id: string;
  caseId: string;
  startTime: Date;
  endTime: Date | null;
  duration: number | null;
  usedBy: string;
  condition: EquipmentCondition;
  issues: string | null;
}

export enum EquipmentCondition {
  EXCELLENT = "EXCELLENT",
  GOOD = "GOOD",
  FAIR = "FAIR",
  POOR = "POOR",
  NEEDS_REPAIR = "NEEDS_REPAIR",
}

export interface EquipmentAvailability {
  equipmentId: string;
  equipmentName: string;
  date: Date;
  timeSlots: AvailabilitySlot[];
  reservations: EquipmentReservation[];
  maintenanceWindows: MaintenanceWindow[];
  isAvailable: boolean;
}

export interface AvailabilitySlot {
  startTime: Date;
  endTime: Date;
  isAvailable: boolean;
  reservedBy: string | null;
}

export interface EquipmentReservation {
  id: string;
  equipmentId: string;
  caseId: string;
  startTime: Date;
  endTime: Date;
  reservedBy: string;
  status: ReservationStatus;
}

export enum ReservationStatus {
  CONFIRMED = "CONFIRMED",
  PENDING = "PENDING",
  CANCELLED = "CANCELLED",
  COMPLETED = "COMPLETED",
}

export interface MaintenanceWindow {
  startTime: Date;
  endTime: Date;
  type: MaintenanceType;
  description: string;
}

// ============================================================================
// Equipment Tracker Class
// ============================================================================

export class EquipmentTracker {
  private readonly MAINTENANCE_WARNING_DAYS = 30;
  private readonly WARRANTY_WARNING_DAYS = 90;

  // --------------------------------------------------------------------------
  // Availability Management
  // --------------------------------------------------------------------------

  checkAvailability(
    equipmentId: string,
    startTime: Date,
    endTime: Date,
    equipment: SurgicalEquipment,
    reservations: EquipmentReservation[],
    maintenanceSchedule: MaintenanceRecord[]
  ): {
    available: boolean;
    conflicts: string[];
    alternatives?: string[];
  } {
    const conflicts: string[] = [];

    // Check equipment status
    if (equipment.status !== EquipmentStatus.AVAILABLE) {
      conflicts.push(
        `Equipment is ${equipment.status.toLowerCase().replace("_", " ")}`
      );
    }

    // Check for conflicting reservations
    const conflictingReservations = reservations.filter((res) => {
      if (res.status === ReservationStatus.CANCELLED) return false;
      if (res.status === ReservationStatus.COMPLETED) return false;

      const resStart = new Date(res.startTime);
      const resEnd = new Date(res.endTime);

      return (
        (startTime >= resStart && startTime < resEnd) ||
        (endTime > resStart && endTime <= resEnd) ||
        (startTime <= resStart && endTime >= resEnd)
      );
    });

    if (conflictingReservations.length > 0) {
      conflicts.push(
        `${conflictingReservations.length} conflicting reservation(s)`
      );
    }

    // Check for maintenance windows
    const maintenanceConflicts = maintenanceSchedule.filter((maint) => {
      if (maint.status === MaintenanceStatus.COMPLETED) return false;
      if (maint.status === MaintenanceStatus.CANCELLED) return false;

      const maintDate = new Date(maint.scheduledDate);
      const maintEnd = maint.completedDate
        ? new Date(maint.completedDate)
        : addDays(maintDate, 1);

      return (
        (startTime >= maintDate && startTime < maintEnd) ||
        (endTime > maintDate && endTime <= maintEnd) ||
        (startTime <= maintDate && endTime >= maintEnd)
      );
    });

    if (maintenanceConflicts.length > 0) {
      conflicts.push(`Scheduled for maintenance during requested time`);
    }

    return {
      available: conflicts.length === 0,
      conflicts,
      alternatives: conflicts.length > 0 ? this.findAlternatives(equipment) : undefined,
    };
  }

  private findAlternatives(equipment: SurgicalEquipment): string[] {
    // In a real implementation, this would query for similar equipment
    return [`Similar ${equipment.type} equipment may be available`];
  }

  getAvailabilitySchedule(
    equipment: SurgicalEquipment,
    date: Date,
    reservations: EquipmentReservation[],
    maintenanceSchedule: MaintenanceRecord[]
  ): EquipmentAvailability {
    const dayStart = startOfDay(date);
    const dayEnd = endOfDay(date);

    // Filter reservations for this date
    const dayReservations = reservations.filter((res) => {
      const resDate = new Date(res.startTime);
      return (
        format(resDate, "yyyy-MM-dd") === format(date, "yyyy-MM-dd") &&
        res.status !== ReservationStatus.CANCELLED &&
        res.status !== ReservationStatus.COMPLETED
      );
    });

    // Filter maintenance for this date
    const dayMaintenance = maintenanceSchedule
      .filter((maint) => {
        const maintDate = new Date(maint.scheduledDate);
        return (
          format(maintDate, "yyyy-MM-dd") === format(date, "yyyy-MM-dd") &&
          maint.status !== MaintenanceStatus.COMPLETED &&
          maint.status !== MaintenanceStatus.CANCELLED
        );
      })
      .map((maint) => ({
        startTime: new Date(maint.scheduledDate),
        endTime: maint.completedDate
          ? new Date(maint.completedDate)
          : addDays(new Date(maint.scheduledDate), 1),
        type: maint.type,
        description: `${maint.type} maintenance`,
      }));

    // Generate time slots (30-minute intervals)
    const timeSlots: AvailabilitySlot[] = [];
    let currentTime = dayStart;

    while (isBefore(currentTime, dayEnd)) {
      const slotEnd = addDays(currentTime, 0);
      slotEnd.setMinutes(currentTime.getMinutes() + 30);

      const isReserved = dayReservations.some((res) => {
        const resStart = new Date(res.startTime);
        const resEnd = new Date(res.endTime);
        return currentTime >= resStart && currentTime < resEnd;
      });

      const inMaintenance = dayMaintenance.some((maint) => {
        return currentTime >= maint.startTime && currentTime < maint.endTime;
      });

      timeSlots.push({
        startTime: new Date(currentTime),
        endTime: new Date(slotEnd),
        isAvailable: !isReserved && !inMaintenance && equipment.status === EquipmentStatus.AVAILABLE,
        reservedBy: isReserved
          ? dayReservations.find((res) => {
              const resStart = new Date(res.startTime);
              const resEnd = new Date(res.endTime);
              return currentTime >= resStart && currentTime < resEnd;
            })?.reservedBy || null
          : null,
      });

      currentTime = slotEnd;
    }

    const isAvailable =
      equipment.status === EquipmentStatus.AVAILABLE &&
      dayReservations.length === 0 &&
      dayMaintenance.length === 0;

    return {
      equipmentId: equipment.id,
      equipmentName: equipment.name,
      date,
      timeSlots,
      reservations: dayReservations,
      maintenanceWindows: dayMaintenance,
      isAvailable,
    };
  }

  // --------------------------------------------------------------------------
  // Maintenance Tracking
  // --------------------------------------------------------------------------

  schedulePreventiveMaintenance(
    equipment: SurgicalEquipment,
    interval: number, // days
    startDate: Date,
    endDate: Date
  ): MaintenanceRecord[] {
    const schedule: MaintenanceRecord[] = [];
    let currentDate = new Date(startDate);

    while (isBefore(currentDate, endDate)) {
      schedule.push({
        id: `maint_${equipment.id}_${currentDate.getTime()}`,
        scheduledDate: new Date(currentDate),
        completedDate: null,
        type: MaintenanceType.PREVENTIVE,
        performedBy: null,
        cost: null,
        findings: null,
        nextServiceDate: addDays(currentDate, interval),
        status: MaintenanceStatus.SCHEDULED,
      });

      currentDate = addDays(currentDate, interval);
    }

    return schedule;
  }

  getUpcomingMaintenance(
    equipment: SurgicalEquipment[],
    days: number = 30
  ): Array<{
    equipment: SurgicalEquipment;
    maintenance: MaintenanceRecord;
    daysUntil: number;
    isOverdue: boolean;
  }> {
    const upcoming: Array<{
      equipment: SurgicalEquipment;
      maintenance: MaintenanceRecord;
      daysUntil: number;
      isOverdue: boolean;
    }> = [];

    const today = new Date();
    const futureDate = addDays(today, days);

    for (const item of equipment) {
      const pendingMaintenance = item.maintenanceSchedule.filter(
        (m) =>
          m.status === MaintenanceStatus.SCHEDULED ||
          m.status === MaintenanceStatus.OVERDUE
      );

      for (const maint of pendingMaintenance) {
        const maintDate = new Date(maint.scheduledDate);
        const daysUntil = differenceInDays(maintDate, today);

        if (maintDate <= futureDate) {
          upcoming.push({
            equipment: item,
            maintenance: maint,
            daysUntil,
            isOverdue: isBefore(maintDate, today),
          });
        }
      }
    }

    return upcoming.sort((a, b) => a.daysUntil - b.daysUntil);
  }

  updateMaintenanceStatus(
    maintenanceId: string,
    status: MaintenanceStatus,
    completedDate?: Date,
    findings?: string,
    cost?: number
  ): MaintenanceRecord {
    // In a real implementation, this would update the database
    return {
      id: maintenanceId,
      scheduledDate: new Date(),
      completedDate: completedDate || null,
      type: MaintenanceType.PREVENTIVE,
      performedBy: "Technician",
      cost: cost || null,
      findings: findings || null,
      nextServiceDate: completedDate ? addMonths(completedDate, 6) : null,
      status,
    };
  }

  // --------------------------------------------------------------------------
  // Equipment Matching
  // --------------------------------------------------------------------------

  matchEquipmentToCase(
    caseRequirements: EquipmentRequest[],
    availableEquipment: SurgicalEquipment[],
    caseStartTime: Date,
    caseEndTime: Date
  ): {
    matched: Map<string, SurgicalEquipment>;
    missing: EquipmentRequest[];
    warnings: string[];
  } {
    const matched = new Map<string, SurgicalEquipment>();
    const missing: EquipmentRequest[] = [];
    const warnings: string[] = [];

    for (const requirement of caseRequirements) {
      // Find matching equipment
      const candidates = availableEquipment.filter((eq) =>
        eq.name.toLowerCase().includes(requirement.equipmentName.toLowerCase())
      );

      if (candidates.length === 0) {
        if (requirement.required) {
          missing.push(requirement);
        } else {
          warnings.push(`Optional equipment '${requirement.equipmentName}' not available`);
        }
        continue;
      }

      // Find the best available candidate
      let bestCandidate: SurgicalEquipment | null = null;

      for (const candidate of candidates) {
        const availability = this.checkAvailability(
          candidate.id,
          caseStartTime,
          caseEndTime,
          candidate,
          [], // Would pass actual reservations
          candidate.maintenanceSchedule
        );

        if (availability.available) {
          bestCandidate = candidate;
          break;
        }
      }

      if (bestCandidate) {
        matched.set(requirement.id, bestCandidate);
      } else if (requirement.required) {
        missing.push(requirement);
        warnings.push(
          `Required equipment '${requirement.equipmentName}' not available during requested time`
        );
      }
    }

    return { matched, missing, warnings };
  }

  // --------------------------------------------------------------------------
  // Usage Tracking
  // --------------------------------------------------------------------------

  recordUsage(
    equipmentId: string,
    caseId: string,
    startTime: Date,
    endTime: Date,
    usedBy: string,
    condition: EquipmentCondition,
    issues?: string
  ): UsageRecord {
    const duration = differenceInDays(endTime, startTime);

    return {
      id: `usage_${equipmentId}_${Date.now()}`,
      caseId,
      startTime,
      endTime,
      duration,
      usedBy,
      condition,
      issues: issues || null,
    };
  }

  getUsageStatistics(
    equipment: SurgicalEquipment,
    startDate: Date,
    endDate: Date
  ): {
    totalUsages: number;
    totalHours: number;
    averageUsagePerDay: number;
    conditionTrend: Record<EquipmentCondition, number>;
    issuesReported: number;
  } {
    const relevantUsage = equipment.usageLog.filter((usage) => {
      const usageDate = new Date(usage.startTime);
      return usageDate >= startDate && usageDate <= endDate;
    });

    const totalUsages = relevantUsage.length;
    const totalMinutes = relevantUsage.reduce(
      (sum, usage) => sum + (usage.duration || 0),
      0
    );
    const totalHours = totalMinutes / 60;

    const days = differenceInDays(endDate, startDate) || 1;
    const averageUsagePerDay = totalUsages / days;

    const conditionTrend: Record<EquipmentCondition, number> = {
      [EquipmentCondition.EXCELLENT]: 0,
      [EquipmentCondition.GOOD]: 0,
      [EquipmentCondition.FAIR]: 0,
      [EquipmentCondition.POOR]: 0,
      [EquipmentCondition.NEEDS_REPAIR]: 0,
    };

    for (const usage of relevantUsage) {
      conditionTrend[usage.condition]++;
    }

    const issuesReported = relevantUsage.filter(
      (usage) => usage.issues !== null
    ).length;

    return {
      totalUsages,
      totalHours,
      averageUsagePerDay,
      conditionTrend,
      issuesReported,
    };
  }

  // --------------------------------------------------------------------------
  // Alerts & Warnings
  // --------------------------------------------------------------------------

  getEquipmentAlerts(equipment: SurgicalEquipment[]): Array<{
    equipmentId: string;
    equipmentName: string;
    alertType: AlertType;
    severity: AlertSeverity;
    message: string;
    dueDate?: Date;
  }> {
    const alerts: Array<{
      equipmentId: string;
      equipmentName: string;
      alertType: AlertType;
      severity: AlertSeverity;
      message: string;
      dueDate?: Date;
    }> = [];

    const today = new Date();

    for (const item of equipment) {
      // Warranty expiry
      if (item.warrantyExpiry) {
        const daysUntilExpiry = differenceInDays(item.warrantyExpiry, today);
        if (daysUntilExpiry <= this.WARRANTY_WARNING_DAYS && daysUntilExpiry > 0) {
          alerts.push({
            equipmentId: item.id,
            equipmentName: item.name,
            alertType: AlertType.WARRANTY_EXPIRING,
            severity: daysUntilExpiry <= 30 ? AlertSeverity.HIGH : AlertSeverity.MEDIUM,
            message: `Warranty expires in ${daysUntilExpiry} days`,
            dueDate: item.warrantyExpiry,
          });
        }
      }

      // Overdue maintenance
      const overdueMaintenance = item.maintenanceSchedule.filter((m) => {
        const maintDate = new Date(m.scheduledDate);
        return (
          isBefore(maintDate, today) &&
          m.status === MaintenanceStatus.SCHEDULED
        );
      });

      if (overdueMaintenance.length > 0) {
        alerts.push({
          equipmentId: item.id,
          equipmentName: item.name,
          alertType: AlertType.MAINTENANCE_OVERDUE,
          severity: AlertSeverity.HIGH,
          message: `${overdueMaintenance.length} overdue maintenance task(s)`,
        });
      }

      // Expired certifications
      const expiredCerts = item.certifications.filter((cert) =>
        isBefore(new Date(cert.expiryDate), today)
      );

      if (expiredCerts.length > 0) {
        alerts.push({
          equipmentId: item.id,
          equipmentName: item.name,
          alertType: AlertType.CERTIFICATION_EXPIRED,
          severity: AlertSeverity.CRITICAL,
          message: `${expiredCerts.length} certification(s) expired`,
        });
      }
    }

    return alerts.sort((a, b) => {
      const severityOrder = {
        [AlertSeverity.CRITICAL]: 0,
        [AlertSeverity.HIGH]: 1,
        [AlertSeverity.MEDIUM]: 2,
        [AlertSeverity.LOW]: 3,
      };
      return severityOrder[a.severity] - severityOrder[b.severity];
    });
  }
}

export enum AlertType {
  WARRANTY_EXPIRING = "WARRANTY_EXPIRING",
  MAINTENANCE_OVERDUE = "MAINTENANCE_OVERDUE",
  CERTIFICATION_EXPIRED = "CERTIFICATION_EXPIRED",
  EQUIPMENT_UNAVAILABLE = "EQUIPMENT_UNAVAILABLE",
}

export enum AlertSeverity {
  CRITICAL = "CRITICAL",
  HIGH = "HIGH",
  MEDIUM = "MEDIUM",
  LOW = "LOW",
}

// ============================================================================
// Singleton Instance
// ============================================================================

let trackerInstance: EquipmentTracker | null = null;

export function getEquipmentTracker(): EquipmentTracker {
  if (!trackerInstance) {
    trackerInstance = new EquipmentTracker();
  }
  return trackerInstance;
}
