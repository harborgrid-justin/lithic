/**
 * Real-time Event Definitions
 * Typed event payloads for Socket.IO
 */

import {
  emitToUser,
  emitToRoom,
  emitToOrganization,
  broadcast,
} from "./socket";

/**
 * Event types
 */
export const RealtimeEvents = {
  // Patient events
  PATIENT_CREATED: "patient:created",
  PATIENT_UPDATED: "patient:updated",
  PATIENT_CHECKED_IN: "patient:checked_in",

  // Appointment events
  APPOINTMENT_CREATED: "appointment:created",
  APPOINTMENT_UPDATED: "appointment:updated",
  APPOINTMENT_CANCELLED: "appointment:cancelled",
  APPOINTMENT_CONFIRMED: "appointment:confirmed",
  APPOINTMENT_REMINDER: "appointment:reminder",

  // Clinical events
  VITALS_RECORDED: "vitals:recorded",
  LAB_RESULT_AVAILABLE: "lab:result_available",
  IMAGING_RESULT_AVAILABLE: "imaging:result_available",
  PRESCRIPTION_CREATED: "prescription:created",
  PRESCRIPTION_FILLED: "prescription:filled",

  // Messaging events
  MESSAGE_RECEIVED: "message:received",
  MESSAGE_READ: "message:read",
  TYPING_START: "typing:start",
  TYPING_STOP: "typing:stop",

  // Notification events
  NOTIFICATION_NEW: "notification:new",
  NOTIFICATION_READ: "notification:read",
  ALERT_CRITICAL: "alert:critical",

  // System events
  SYSTEM_MAINTENANCE: "system:maintenance",
  SYSTEM_UPDATE: "system:update",

  // Presence events
  USER_ONLINE: "user:online",
  USER_OFFLINE: "user:offline",
  USER_AWAY: "user:away",

  // Queue events
  QUEUE_UPDATED: "queue:updated",
  PATIENT_CALLED: "patient:called",
} as const;

/**
 * Patient events
 */
export function notifyPatientCreated(params: {
  patientId: string;
  patientName: string;
  organizationId: string;
  createdBy: string;
}): void {
  emitToOrganization(params.organizationId, RealtimeEvents.PATIENT_CREATED, {
    patientId: params.patientId,
    patientName: params.patientName,
    createdBy: params.createdBy,
    timestamp: new Date().toISOString(),
  });
}

export function notifyPatientUpdated(params: {
  patientId: string;
  patientName: string;
  organizationId: string;
  updatedBy: string;
  changes: string[];
}): void {
  emitToOrganization(params.organizationId, RealtimeEvents.PATIENT_UPDATED, {
    patientId: params.patientId,
    patientName: params.patientName,
    updatedBy: params.updatedBy,
    changes: params.changes,
    timestamp: new Date().toISOString(),
  });
}

export function notifyPatientCheckedIn(params: {
  patientId: string;
  patientName: string;
  appointmentId: string;
  providerId: string;
  checkInTime: Date;
}): void {
  // Notify provider
  emitToUser(params.providerId, RealtimeEvents.PATIENT_CHECKED_IN, {
    patientId: params.patientId,
    patientName: params.patientName,
    appointmentId: params.appointmentId,
    checkInTime: params.checkInTime.toISOString(),
  });

  // Update waiting room queue
  emitToRoom("waiting-room", RealtimeEvents.QUEUE_UPDATED, {
    action: "patient_checked_in",
    patientId: params.patientId,
    timestamp: new Date().toISOString(),
  });
}

/**
 * Appointment events
 */
export function notifyAppointmentCreated(params: {
  appointmentId: string;
  patientId: string;
  providerId: string;
  startTime: Date;
  endTime: Date;
  type: string;
}): void {
  // Notify patient
  emitToUser(params.patientId, RealtimeEvents.APPOINTMENT_CREATED, {
    appointmentId: params.appointmentId,
    providerId: params.providerId,
    startTime: params.startTime.toISOString(),
    endTime: params.endTime.toISOString(),
    type: params.type,
  });

  // Notify provider
  emitToUser(params.providerId, RealtimeEvents.APPOINTMENT_CREATED, {
    appointmentId: params.appointmentId,
    patientId: params.patientId,
    startTime: params.startTime.toISOString(),
    endTime: params.endTime.toISOString(),
    type: params.type,
  });
}

export function notifyAppointmentCancelled(params: {
  appointmentId: string;
  patientId: string;
  providerId: string;
  reason?: string;
}): void {
  emitToUser(params.patientId, RealtimeEvents.APPOINTMENT_CANCELLED, {
    appointmentId: params.appointmentId,
    reason: params.reason,
    timestamp: new Date().toISOString(),
  });

  emitToUser(params.providerId, RealtimeEvents.APPOINTMENT_CANCELLED, {
    appointmentId: params.appointmentId,
    patientId: params.patientId,
    reason: params.reason,
    timestamp: new Date().toISOString(),
  });
}

/**
 * Clinical events
 */
export function notifyLabResultAvailable(params: {
  resultId: string;
  patientId: string;
  providerId: string;
  testName: string;
  status: string;
  critical?: boolean;
}): void {
  // Notify patient
  emitToUser(params.patientId, RealtimeEvents.LAB_RESULT_AVAILABLE, {
    resultId: params.resultId,
    testName: params.testName,
    status: params.status,
    timestamp: new Date().toISOString(),
  });

  // Notify provider
  emitToUser(params.providerId, RealtimeEvents.LAB_RESULT_AVAILABLE, {
    resultId: params.resultId,
    patientId: params.patientId,
    testName: params.testName,
    status: params.status,
    critical: params.critical,
    timestamp: new Date().toISOString(),
  });

  // If critical, send alert
  if (params.critical) {
    emitToUser(params.providerId, RealtimeEvents.ALERT_CRITICAL, {
      type: "lab_result",
      resultId: params.resultId,
      patientId: params.patientId,
      testName: params.testName,
      message: `Critical lab result for ${params.testName}`,
      timestamp: new Date().toISOString(),
    });
  }
}

export function notifyVitalsRecorded(params: {
  patientId: string;
  providerId: string;
  vitals: Record<string, any>;
  abnormal?: boolean;
}): void {
  emitToUser(params.providerId, RealtimeEvents.VITALS_RECORDED, {
    patientId: params.patientId,
    vitals: params.vitals,
    abnormal: params.abnormal,
    timestamp: new Date().toISOString(),
  });
}

/**
 * Messaging events
 */
export function notifyMessageReceived(params: {
  messageId: string;
  conversationId: string;
  fromUserId: string;
  toUserId: string;
  message: string;
  timestamp: Date;
}): void {
  emitToUser(params.toUserId, RealtimeEvents.MESSAGE_RECEIVED, {
    messageId: params.messageId,
    conversationId: params.conversationId,
    fromUserId: params.fromUserId,
    message: params.message,
    timestamp: params.timestamp.toISOString(),
  });

  // Update conversation room
  emitToRoom(
    `conversation:${params.conversationId}`,
    RealtimeEvents.MESSAGE_RECEIVED,
    {
      messageId: params.messageId,
      fromUserId: params.fromUserId,
      message: params.message,
      timestamp: params.timestamp.toISOString(),
    },
  );
}

/**
 * Notification events
 */
export function notifyUser(params: {
  userId: string;
  title: string;
  message: string;
  type: "info" | "success" | "warning" | "error";
  actionUrl?: string;
}): void {
  emitToUser(params.userId, RealtimeEvents.NOTIFICATION_NEW, {
    title: params.title,
    message: params.message,
    type: params.type,
    actionUrl: params.actionUrl,
    timestamp: new Date().toISOString(),
  });
}

export function sendCriticalAlert(params: {
  userId: string;
  title: string;
  message: string;
  severity: "high" | "critical";
  requiresAcknowledgment?: boolean;
}): void {
  emitToUser(params.userId, RealtimeEvents.ALERT_CRITICAL, {
    title: params.title,
    message: params.message,
    severity: params.severity,
    requiresAcknowledgment: params.requiresAcknowledgment,
    timestamp: new Date().toISOString(),
  });
}

/**
 * Queue management events
 */
export function updateWaitingRoomQueue(params: {
  action: "add" | "remove" | "update" | "call";
  patientId: string;
  patientName?: string;
  position?: number;
  estimatedWaitTime?: number;
}): void {
  emitToRoom("waiting-room", RealtimeEvents.QUEUE_UPDATED, {
    action: params.action,
    patientId: params.patientId,
    patientName: params.patientName,
    position: params.position,
    estimatedWaitTime: params.estimatedWaitTime,
    timestamp: new Date().toISOString(),
  });
}

export function callPatient(params: {
  patientId: string;
  patientName: string;
  roomNumber: string;
  providerId: string;
}): void {
  // Notify patient
  emitToUser(params.patientId, RealtimeEvents.PATIENT_CALLED, {
    roomNumber: params.roomNumber,
    providerId: params.providerId,
    timestamp: new Date().toISOString(),
  });

  // Update waiting room display
  emitToRoom("waiting-room", RealtimeEvents.PATIENT_CALLED, {
    patientName: params.patientName,
    roomNumber: params.roomNumber,
    timestamp: new Date().toISOString(),
  });
}

/**
 * System events
 */
export function notifySystemMaintenance(params: {
  startTime: Date;
  endTime: Date;
  message: string;
}): void {
  broadcast(RealtimeEvents.SYSTEM_MAINTENANCE, {
    startTime: params.startTime.toISOString(),
    endTime: params.endTime.toISOString(),
    message: params.message,
    timestamp: new Date().toISOString(),
  });
}

export function notifySystemUpdate(params: {
  version: string;
  features: string[];
  releaseNotes?: string;
}): void {
  broadcast(RealtimeEvents.SYSTEM_UPDATE, {
    version: params.version,
    features: params.features,
    releaseNotes: params.releaseNotes,
    timestamp: new Date().toISOString(),
  });
}

/**
 * Helper to emit custom event
 */
export function emitCustomEvent(params: {
  target: "user" | "room" | "organization" | "broadcast";
  targetId?: string;
  event: string;
  data: any;
}): void {
  switch (params.target) {
    case "user":
      if (params.targetId) {
        emitToUser(params.targetId, params.event, params.data);
      }
      break;
    case "room":
      if (params.targetId) {
        emitToRoom(params.targetId, params.event, params.data);
      }
      break;
    case "organization":
      if (params.targetId) {
        emitToOrganization(params.targetId, params.event, params.data);
      }
      break;
    case "broadcast":
      broadcast(params.event, params.data);
      break;
  }
}
