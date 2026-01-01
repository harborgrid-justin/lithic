/**
 * Clinical Collaboration Module for Lithic Enterprise Healthcare Platform
 * Care team coordination, handoff communication, and urgent alerts
 */

import { getRealtimeEngine } from './engine';
import { getSecureMessaging } from './messaging';
import {
  CareTeamMessage,
  CareTeamAcknowledgment,
  HandoffCommunication,
  HandoffActionItem,
  NotificationPriority,
  MessageType,
  ClinicalContext,
} from '@/types/communication';

export class ClinicalCollaboration {
  private engine = getRealtimeEngine();
  private messaging = getSecureMessaging();
  private careTeamMessages = new Map<string, CareTeamMessage>();
  private handoffs = new Map<string, HandoffCommunication>();
  private urgentAlerts = new Map<string, CareTeamMessage>();

  constructor() {
    this.setupClinicalListeners();
  }

  /**
   * Send care team update
   */
  public async sendCareTeamUpdate(params: {
    careTeamId: string;
    patientId: string;
    patientName: string;
    type: 'update' | 'handoff' | 'alert' | 'consult';
    priority: NotificationPriority;
    subject: string;
    content: string;
    attachments?: any[];
    requiresAcknowledgment?: boolean;
    expiresAt?: Date;
  }): Promise<CareTeamMessage> {
    const {
      careTeamId,
      patientId,
      patientName,
      type,
      priority,
      subject,
      content,
      attachments,
      requiresAcknowledgment = false,
      expiresAt,
    } = params;

    const message: Partial<CareTeamMessage> = {
      id: this.generateMessageId(),
      careTeamId,
      patientId,
      patientName,
      type,
      priority,
      subject,
      content,
      attachments,
      acknowledgments: [],
      createdAt: new Date(),
      expiresAt,
    };

    this.engine.send('send_care_team_message', {
      message,
      requiresAcknowledgment,
    });

    // Store locally
    this.careTeamMessages.set(message.id!, message as CareTeamMessage);

    return message as CareTeamMessage;
  }

  /**
   * Send urgent clinical alert
   */
  public async sendUrgentAlert(params: {
    careTeamId: string;
    patientId: string;
    patientName: string;
    subject: string;
    content: string;
    priority?: 'URGENT' | 'CRITICAL';
  }): Promise<CareTeamMessage> {
    const { careTeamId, patientId, patientName, subject, content, priority = 'URGENT' } = params;

    const alert: Partial<CareTeamMessage> = {
      id: this.generateMessageId(),
      careTeamId,
      patientId,
      patientName,
      type: 'alert',
      priority: priority === 'CRITICAL' ? NotificationPriority.CRITICAL : NotificationPriority.URGENT,
      subject,
      content,
      acknowledgments: [],
      createdAt: new Date(),
    };

    // Send via multiple channels for critical alerts
    this.engine.send('send_urgent_alert', {
      alert,
      channels: ['websocket', 'push', 'sms'], // Multi-channel delivery
    });

    // Also send as regular message with high priority
    await this.messaging.sendMessage({
      conversationId: careTeamId,
      content: `URGENT: ${subject}\n\n${content}`,
      type: MessageType.URGENT,
      metadata: {
        clinicalContext: {
          patientId,
          patientName,
          urgency: priority === 'CRITICAL' ? NotificationPriority.CRITICAL : NotificationPriority.URGENT,
        },
      },
    });

    // Store locally
    this.urgentAlerts.set(alert.id!, alert as CareTeamMessage);

    return alert as CareTeamMessage;
  }

  /**
   * Acknowledge care team message
   */
  public async acknowledgeMessage(
    messageId: string,
    note?: string
  ): Promise<void> {
    const acknowledgment: Partial<CareTeamAcknowledgment> = {
      acknowledgedAt: new Date(),
      note,
    };

    this.engine.send('acknowledge_message', {
      messageId,
      acknowledgment,
    });

    // Update local message
    const message = this.careTeamMessages.get(messageId);
    if (message) {
      message.acknowledgments.push(acknowledgment as CareTeamAcknowledgment);
      this.careTeamMessages.set(messageId, message);
    }
  }

  /**
   * Create handoff communication
   */
  public async createHandoff(params: {
    patientId: string;
    patientName: string;
    toProviderId: string;
    toProviderName: string;
    type: 'shift' | 'transfer' | 'consult';
    summary: string;
    clinicalContext: string;
    actionItems: Omit<HandoffActionItem, 'id' | 'completed'>[];
  }): Promise<HandoffCommunication> {
    const {
      patientId,
      patientName,
      toProviderId,
      toProviderName,
      type,
      summary,
      clinicalContext,
      actionItems,
    } = params;

    const handoff: Partial<HandoffCommunication> = {
      id: this.generateHandoffId(),
      patientId,
      patientName,
      toProviderId,
      toProviderName,
      type,
      status: 'pending',
      summary,
      clinicalContext,
      actionItems: actionItems.map((item, index) => ({
        id: `action_${index}`,
        ...item,
        completed: false,
      })),
      createdAt: new Date(),
    };

    this.engine.send('create_handoff', { handoff });

    // Send notification to receiving provider
    await this.messaging.sendMessage({
      conversationId: toProviderId,
      content: `New handoff for patient ${patientName}:\n\n${summary}`,
      type: MessageType.CLINICAL,
      metadata: {
        clinicalContext: {
          patientId,
          patientName,
          urgency: NotificationPriority.HIGH,
        },
      },
    });

    // Store locally
    this.handoffs.set(handoff.id!, handoff as HandoffCommunication);

    return handoff as HandoffCommunication;
  }

  /**
   * Accept handoff
   */
  public async acceptHandoff(handoffId: string): Promise<void> {
    this.engine.send('accept_handoff', {
      handoffId,
      acceptedAt: new Date(),
    });

    // Update local handoff
    const handoff = this.handoffs.get(handoffId);
    if (handoff) {
      handoff.status = 'accepted';
      handoff.acceptedAt = new Date();
      this.handoffs.set(handoffId, handoff);
    }
  }

  /**
   * Decline handoff
   */
  public async declineHandoff(handoffId: string, reason: string): Promise<void> {
    this.engine.send('decline_handoff', {
      handoffId,
      reason,
    });

    // Update local handoff
    const handoff = this.handoffs.get(handoffId);
    if (handoff) {
      handoff.status = 'declined';
      this.handoffs.set(handoffId, handoff);
    }
  }

  /**
   * Complete handoff
   */
  public async completeHandoff(handoffId: string): Promise<void> {
    this.engine.send('complete_handoff', {
      handoffId,
      completedAt: new Date(),
    });

    // Update local handoff
    const handoff = this.handoffs.get(handoffId);
    if (handoff) {
      handoff.status = 'completed';
      handoff.completedAt = new Date();
      this.handoffs.set(handoffId, handoff);
    }
  }

  /**
   * Complete action item
   */
  public async completeActionItem(
    handoffId: string,
    actionItemId: string
  ): Promise<void> {
    this.engine.send('complete_action_item', {
      handoffId,
      actionItemId,
      completedAt: new Date(),
    });

    // Update local handoff
    const handoff = this.handoffs.get(handoffId);
    if (handoff) {
      const actionItem = handoff.actionItems.find((item) => item.id === actionItemId);
      if (actionItem) {
        actionItem.completed = true;
        actionItem.completedAt = new Date();
        this.handoffs.set(handoffId, handoff);
      }
    }
  }

  /**
   * Request consultation
   */
  public async requestConsultation(params: {
    patientId: string;
    patientName: string;
    specialty: string;
    consultantId?: string;
    reason: string;
    urgency: NotificationPriority;
    clinicalSummary: string;
  }): Promise<CareTeamMessage> {
    const {
      patientId,
      patientName,
      specialty,
      consultantId,
      reason,
      urgency,
      clinicalSummary,
    } = params;

    return this.sendCareTeamUpdate({
      careTeamId: consultantId || specialty,
      patientId,
      patientName,
      type: 'consult',
      priority: urgency,
      subject: `Consultation Request - ${specialty}`,
      content: `Reason: ${reason}\n\nClinical Summary:\n${clinicalSummary}`,
    });
  }

  /**
   * Send STAT order notification
   */
  public async sendStatOrder(params: {
    careTeamId: string;
    patientId: string;
    patientName: string;
    orderType: string;
    orderDetails: string;
  }): Promise<CareTeamMessage> {
    const { careTeamId, patientId, patientName, orderType, orderDetails } = params;

    return this.sendUrgentAlert({
      careTeamId,
      patientId,
      patientName,
      subject: `STAT ${orderType}`,
      content: orderDetails,
      priority: 'URGENT',
    });
  }

  /**
   * Send code alert
   */
  public async sendCodeAlert(params: {
    codeType: string;
    location: string;
    patientId?: string;
    patientName?: string;
    additionalInfo?: string;
  }): Promise<void> {
    const { codeType, location, patientId, patientName, additionalInfo } = params;

    const alert = {
      codeType,
      location,
      patientId,
      patientName,
      additionalInfo,
      timestamp: new Date(),
    };

    // Broadcast to all emergency responders
    this.engine.send('send_code_alert', {
      alert,
      broadcast: true,
    });

    // Send to emergency response channel
    await this.messaging.sendMessage({
      conversationId: 'emergency_response',
      content: `${codeType} - ${location}${patientName ? `\nPatient: ${patientName}` : ''}${additionalInfo ? `\n${additionalInfo}` : ''}`,
      type: MessageType.URGENT,
      metadata: {
        urgency: NotificationPriority.CRITICAL,
      },
    });
  }

  /**
   * Share patient context with care team
   */
  public async sharePatientContext(params: {
    careTeamId: string;
    patientId: string;
    patientName: string;
    context: {
      vitals?: any;
      labs?: any;
      medications?: any;
      allergies?: any;
      diagnoses?: any;
      notes?: string;
    };
  }): Promise<void> {
    const { careTeamId, patientId, patientName, context } = params;

    const clinicalContext: ClinicalContext = {
      patientId,
      patientName,
    };

    await this.messaging.sendMessage({
      conversationId: careTeamId,
      content: `Patient context for ${patientName}:\n${JSON.stringify(context, null, 2)}`,
      type: MessageType.CLINICAL,
      metadata: {
        clinicalContext,
        ...context,
      },
    });
  }

  /**
   * Create clinical note annotation
   */
  public async annotateNote(params: {
    noteId: string;
    patientId: string;
    annotation: string;
    mentionProviders?: string[];
  }): Promise<void> {
    const { noteId, patientId, annotation, mentionProviders = [] } = params;

    this.engine.send('annotate_note', {
      noteId,
      patientId,
      annotation,
      mentions: mentionProviders,
      timestamp: new Date(),
    });
  }

  /**
   * Get pending acknowledgments
   */
  public getPendingAcknowledgments(): CareTeamMessage[] {
    return Array.from(this.careTeamMessages.values()).filter(
      (message) => message.acknowledgments.length === 0
    );
  }

  /**
   * Get pending handoffs
   */
  public getPendingHandoffs(): HandoffCommunication[] {
    return Array.from(this.handoffs.values()).filter(
      (handoff) => handoff.status === 'pending'
    );
  }

  /**
   * Get active urgent alerts
   */
  public getUrgentAlerts(): CareTeamMessage[] {
    return Array.from(this.urgentAlerts.values()).filter(
      (alert) => !alert.expiresAt || alert.expiresAt > new Date()
    );
  }

  /**
   * Setup clinical event listeners
   */
  private setupClinicalListeners(): void {
    this.engine.on('care_team_message_received' as any, (data: { message: CareTeamMessage }) => {
      this.careTeamMessages.set(data.message.id, data.message);

      // Show notification for urgent messages
      if (
        data.message.priority === NotificationPriority.URGENT ||
        data.message.priority === NotificationPriority.CRITICAL
      ) {
        this.showUrgentNotification(data.message);
      }
    });

    this.engine.on('handoff_received' as any, (data: { handoff: HandoffCommunication }) => {
      this.handoffs.set(data.handoff.id, data.handoff);
      this.showHandoffNotification(data.handoff);
    });

    this.engine.on('urgent_alert_received' as any, (data: { alert: CareTeamMessage }) => {
      this.urgentAlerts.set(data.alert.id, data.alert);
      this.showUrgentNotification(data.alert);
    });

    this.engine.on('code_alert_received' as any, (data: any) => {
      this.showCodeAlertNotification(data.alert);
    });
  }

  /**
   * Show urgent notification
   */
  private showUrgentNotification(message: CareTeamMessage): void {
    // This would integrate with the notification center
    console.log('URGENT:', message.subject);

    // In production, this would:
    // 1. Show browser notification
    // 2. Play alert sound
    // 3. Show in-app notification
    // 4. Send push notification if available
  }

  /**
   * Show handoff notification
   */
  private showHandoffNotification(handoff: HandoffCommunication): void {
    console.log('New handoff:', handoff.summary);

    // In production, this would show appropriate notification
  }

  /**
   * Show code alert notification
   */
  private showCodeAlertNotification(alert: any): void {
    console.log('CODE ALERT:', alert.codeType, alert.location);

    // In production, this would:
    // 1. Show full-screen alert
    // 2. Play loud alert sound
    // 3. Send push notification
    // 4. Potentially activate pager/SMS
  }

  /**
   * Generate unique message ID
   */
  private generateMessageId(): string {
    return `ctm_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Generate unique handoff ID
   */
  private generateHandoffId(): string {
    return `handoff_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Cleanup
   */
  public destroy(): void {
    this.careTeamMessages.clear();
    this.handoffs.clear();
    this.urgentAlerts.clear();
  }
}

// Singleton instance
let clinicalCollabInstance: ClinicalCollaboration | null = null;

/**
 * Get clinical collaboration instance
 */
export function getClinicalCollaboration(): ClinicalCollaboration {
  if (!clinicalCollabInstance) {
    clinicalCollabInstance = new ClinicalCollaboration();
  }
  return clinicalCollabInstance;
}

/**
 * Destroy clinical collaboration instance
 */
export function destroyClinicalCollaboration(): void {
  if (clinicalCollabInstance) {
    clinicalCollabInstance.destroy();
    clinicalCollabInstance = null;
  }
}
