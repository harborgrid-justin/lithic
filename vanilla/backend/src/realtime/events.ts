/**
 * WebSocket Events
 *
 * Event definitions and emitters for real-time updates
 */

import { SocketManager, SocketMessage } from './socket';
import { logger } from '../utils/logger';

// Event Types
export enum EventType {
  // Patient events
  PATIENT_CREATED = 'patient:created',
  PATIENT_UPDATED = 'patient:updated',
  PATIENT_DELETED = 'patient:deleted',

  // Appointment events
  APPOINTMENT_CREATED = 'appointment:created',
  APPOINTMENT_UPDATED = 'appointment:updated',
  APPOINTMENT_CANCELLED = 'appointment:cancelled',
  APPOINTMENT_REMINDER = 'appointment:reminder',

  // Order events
  ORDER_CREATED = 'order:created',
  ORDER_UPDATED = 'order:updated',
  ORDER_COMPLETED = 'order:completed',

  // Result events
  RESULT_AVAILABLE = 'result:available',
  RESULT_CRITICAL = 'result:critical',

  // Prescription events
  PRESCRIPTION_CREATED = 'prescription:created',
  PRESCRIPTION_UPDATED = 'prescription:updated',
  PRESCRIPTION_FILLED = 'prescription:filled',

  // Encounter events
  ENCOUNTER_STARTED = 'encounter:started',
  ENCOUNTER_UPDATED = 'encounter:updated',
  ENCOUNTER_COMPLETED = 'encounter:completed',

  // Messaging events
  MESSAGE_RECEIVED = 'message:received',
  MESSAGE_READ = 'message:read',

  // Notification events
  NOTIFICATION = 'notification',
  ALERT = 'alert',

  // System events
  SYSTEM_UPDATE = 'system:update',
  SYSTEM_MAINTENANCE = 'system:maintenance',
}

// Event Payload
export interface EventPayload {
  eventType: EventType;
  data: any;
  metadata?: {
    userId?: string;
    patientId?: string;
    providerId?: string;
    timestamp?: string;
    priority?: 'low' | 'normal' | 'high' | 'critical';
  };
}

/**
 * Event Emitter
 */
export class EventEmitter {
  constructor(private socketManager: SocketManager) {}

  /**
   * Emit event to specific user
   */
  emitToUser(userId: string, payload: EventPayload): void {
    const message: SocketMessage = {
      type: 'event',
      payload,
      timestamp: new Date().toISOString(),
      id: crypto.randomUUID(),
    };

    const sent = this.socketManager.sendToUser(userId, message);

    logger.debug('Event emitted to user', {
      userId,
      eventType: payload.eventType,
      sent,
    });
  }

  /**
   * Emit event to multiple users
   */
  emitToUsers(userIds: string[], payload: EventPayload): void {
    for (const userId of userIds) {
      this.emitToUser(userId, payload);
    }
  }

  /**
   * Emit event to channel
   */
  emitToChannel(channel: string, payload: EventPayload): void {
    const message: SocketMessage = {
      type: 'event',
      payload,
      timestamp: new Date().toISOString(),
      id: crypto.randomUUID(),
    };

    const sent = this.socketManager.broadcastToChannel(channel, message);

    logger.debug('Event emitted to channel', {
      channel,
      eventType: payload.eventType,
      sent,
    });
  }

  /**
   * Broadcast event to all authenticated users
   */
  broadcast(payload: EventPayload): void {
    const message: SocketMessage = {
      type: 'event',
      payload,
      timestamp: new Date().toISOString(),
      id: crypto.randomUUID(),
    };

    const sent = this.socketManager.broadcast(message, (client) => client.authenticated);

    logger.debug('Event broadcasted', {
      eventType: payload.eventType,
      sent,
    });
  }

  /**
   * Emit patient event
   */
  emitPatientEvent(
    eventType: EventType.PATIENT_CREATED | EventType.PATIENT_UPDATED | EventType.PATIENT_DELETED,
    patientData: any,
    options?: {
      notifyUsers?: string[];
      notifyProviders?: string[];
    }
  ): void {
    const payload: EventPayload = {
      eventType,
      data: patientData,
      metadata: {
        patientId: patientData.id,
        timestamp: new Date().toISOString(),
        priority: 'normal',
      },
    };

    // Notify specific users
    if (options?.notifyUsers) {
      this.emitToUsers(options.notifyUsers, payload);
    }

    // Notify to patient channel
    this.emitToChannel(`patient:${patientData.id}`, payload);
  }

  /**
   * Emit appointment event
   */
  emitAppointmentEvent(
    eventType: EventType.APPOINTMENT_CREATED | EventType.APPOINTMENT_UPDATED | EventType.APPOINTMENT_CANCELLED,
    appointmentData: any
  ): void {
    const payload: EventPayload = {
      eventType,
      data: appointmentData,
      metadata: {
        patientId: appointmentData.patientId,
        providerId: appointmentData.providerId,
        timestamp: new Date().toISOString(),
        priority: 'normal',
      },
    };

    // Notify patient
    if (appointmentData.patientId) {
      this.emitToChannel(`user:${appointmentData.patientId}`, payload);
    }

    // Notify provider
    if (appointmentData.providerId) {
      this.emitToChannel(`provider:${appointmentData.providerId}`, payload);
    }

    // Notify appointment channel
    this.emitToChannel(`appointment:${appointmentData.id}`, payload);
  }

  /**
   * Emit result notification
   */
  emitResultAvailable(resultData: any, critical: boolean = false): void {
    const eventType = critical ? EventType.RESULT_CRITICAL : EventType.RESULT_AVAILABLE;

    const payload: EventPayload = {
      eventType,
      data: resultData,
      metadata: {
        patientId: resultData.patientId,
        providerId: resultData.providerId,
        timestamp: new Date().toISOString(),
        priority: critical ? 'critical' : 'high',
      },
    };

    // Notify patient
    if (resultData.patientId) {
      this.emitToChannel(`user:${resultData.patientId}`, payload);
    }

    // Notify ordering provider
    if (resultData.providerId) {
      this.emitToChannel(`provider:${resultData.providerId}`, payload);
    }

    logger.info('Result notification emitted', {
      resultId: resultData.id,
      critical,
    });
  }

  /**
   * Emit prescription event
   */
  emitPrescriptionEvent(
    eventType: EventType.PRESCRIPTION_CREATED | EventType.PRESCRIPTION_UPDATED | EventType.PRESCRIPTION_FILLED,
    prescriptionData: any
  ): void {
    const payload: EventPayload = {
      eventType,
      data: prescriptionData,
      metadata: {
        patientId: prescriptionData.patientId,
        providerId: prescriptionData.providerId,
        timestamp: new Date().toISOString(),
        priority: 'normal',
      },
    };

    // Notify patient
    if (prescriptionData.patientId) {
      this.emitToChannel(`user:${prescriptionData.patientId}`, payload);
    }

    // Notify prescriber
    if (prescriptionData.providerId) {
      this.emitToChannel(`provider:${prescriptionData.providerId}`, payload);
    }
  }

  /**
   * Emit notification
   */
  emitNotification(
    userId: string,
    notification: {
      title: string;
      message: string;
      type: 'info' | 'success' | 'warning' | 'error';
      action?: {
        label: string;
        url: string;
      };
    }
  ): void {
    const payload: EventPayload = {
      eventType: EventType.NOTIFICATION,
      data: notification,
      metadata: {
        userId,
        timestamp: new Date().toISOString(),
        priority: notification.type === 'error' ? 'high' : 'normal',
      },
    };

    this.emitToUser(userId, payload);
  }

  /**
   * Emit alert
   */
  emitAlert(
    alert: {
      title: string;
      message: string;
      severity: 'low' | 'medium' | 'high' | 'critical';
      category: string;
      affectedUsers?: string[];
    }
  ): void {
    const payload: EventPayload = {
      eventType: EventType.ALERT,
      data: alert,
      metadata: {
        timestamp: new Date().toISOString(),
        priority: alert.severity === 'critical' || alert.severity === 'high' ? 'critical' : 'high',
      },
    };

    if (alert.affectedUsers && alert.affectedUsers.length > 0) {
      this.emitToUsers(alert.affectedUsers, payload);
    } else {
      this.broadcast(payload);
    }

    logger.warn('Alert emitted', {
      severity: alert.severity,
      category: alert.category,
    });
  }

  /**
   * Emit system update
   */
  emitSystemUpdate(update: {
    version: string;
    message: string;
    features?: string[];
    maintenanceWindow?: {
      start: string;
      end: string;
    };
  }): void {
    const payload: EventPayload = {
      eventType: EventType.SYSTEM_UPDATE,
      data: update,
      metadata: {
        timestamp: new Date().toISOString(),
        priority: 'normal',
      },
    };

    this.broadcast(payload);

    logger.info('System update broadcasted', {
      version: update.version,
    });
  }

  /**
   * Emit message received event
   */
  emitMessageReceived(
    userId: string,
    message: {
      id: string;
      from: string;
      subject: string;
      preview: string;
    }
  ): void {
    const payload: EventPayload = {
      eventType: EventType.MESSAGE_RECEIVED,
      data: message,
      metadata: {
        userId,
        timestamp: new Date().toISOString(),
        priority: 'normal',
      },
    };

    this.emitToUser(userId, payload);
  }
}

/**
 * Create event emitter
 */
export function createEventEmitter(socketManager: SocketManager): EventEmitter {
  return new EventEmitter(socketManager);
}
