/**
 * Campaign Engine - Care Campaigns System
 * Campaign management, targeting rules, and A/B testing support
 */

import { db } from '@/lib/db';
import { logAudit } from '@/lib/audit';

export enum CampaignType {
  EDUCATIONAL = 'educational',
  PREVENTIVE_CARE = 'preventive_care',
  MEDICATION_ADHERENCE = 'medication_adherence',
  APPOINTMENT_REMINDER = 'appointment_reminder',
  WELLNESS_CHECK = 'wellness_check',
  GOAL_ENCOURAGEMENT = 'goal_encouragement',
  CHALLENGE_INVITATION = 'challenge_invitation',
  SEASONAL = 'seasonal',
  EMERGENCY_ALERT = 'emergency_alert',
}

export enum CampaignStatus {
  DRAFT = 'draft',
  SCHEDULED = 'scheduled',
  ACTIVE = 'active',
  PAUSED = 'paused',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
}

export enum CampaignChannel {
  EMAIL = 'email',
  SMS = 'sms',
  PUSH_NOTIFICATION = 'push',
  IN_APP = 'in_app',
  PATIENT_PORTAL = 'portal',
}

export enum CampaignPriority {
  LOW = 'low',
  NORMAL = 'normal',
  HIGH = 'high',
  URGENT = 'urgent',
}

export interface Campaign {
  id: string;
  name: string;
  description: string;
  type: CampaignType;
  status: CampaignStatus;
  priority: CampaignPriority;
  channels: CampaignChannel[];

  // Targeting
  targetingRules: TargetingRule[];
  estimatedAudience: number;

  // Scheduling
  startDate: Date;
  endDate?: Date;
  schedule?: CampaignSchedule;

  // Content
  messageTemplateId: string;
  subject?: string;
  previewText?: string;

  // A/B Testing
  abTest?: ABTest;

  // Tracking
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;

  // Analytics
  sent: number;
  delivered: number;
  opened: number;
  clicked: number;
  converted: number;
}

export interface TargetingRule {
  type: 'demographic' | 'behavior' | 'health' | 'engagement' | 'custom';
  field: string;
  operator: 'equals' | 'not_equals' | 'contains' | 'greater_than' | 'less_than' | 'in' | 'not_in';
  value: any;
  logic?: 'AND' | 'OR';
}

export interface CampaignSchedule {
  type: 'immediate' | 'scheduled' | 'recurring' | 'triggered';
  timezone?: string;
  sendTime?: string; // HH:MM format
  recurrence?: {
    frequency: 'daily' | 'weekly' | 'monthly';
    interval: number;
    daysOfWeek?: number[]; // 0-6
    dayOfMonth?: number; // 1-31
  };
  trigger?: {
    event: string;
    delay?: number; // minutes
    conditions?: TargetingRule[];
  };
}

export interface ABTest {
  enabled: boolean;
  variants: ABTestVariant[];
  winningCriteria: 'open_rate' | 'click_rate' | 'conversion_rate';
  testDuration: number; // hours
  trafficSplit: number[]; // percentages for each variant
}

export interface ABTestVariant {
  id: string;
  name: string;
  subject?: string;
  messageTemplateId: string;
  sent: number;
  opened: number;
  clicked: number;
  converted: number;
}

export interface CampaignRecipient {
  id: string;
  campaignId: string;
  userId: string;
  variantId?: string;
  channel: CampaignChannel;
  status: 'pending' | 'sent' | 'delivered' | 'failed' | 'bounced' | 'opened' | 'clicked' | 'converted';
  sentAt?: Date;
  deliveredAt?: Date;
  openedAt?: Date;
  clickedAt?: Date;
  convertedAt?: Date;
  failureReason?: string;
  metadata?: Record<string, any>;
}

export class CampaignEngine {
  /**
   * Create a new campaign
   */
  static async createCampaign(
    createdBy: string,
    campaignData: Partial<Campaign>
  ): Promise<Campaign> {
    // Estimate audience size based on targeting rules
    const estimatedAudience = await this.estimateAudience(
      campaignData.targetingRules || []
    );

    const campaign = await db.campaign.create({
      data: {
        name: campaignData.name || 'Untitled Campaign',
        description: campaignData.description || '',
        type: campaignData.type || CampaignType.EDUCATIONAL,
        status: CampaignStatus.DRAFT,
        priority: campaignData.priority || CampaignPriority.NORMAL,
        channels: campaignData.channels || [CampaignChannel.EMAIL],
        targetingRules: campaignData.targetingRules || [],
        estimatedAudience,
        startDate: campaignData.startDate || new Date(),
        endDate: campaignData.endDate,
        schedule: campaignData.schedule || { type: 'immediate' },
        messageTemplateId: campaignData.messageTemplateId || '',
        subject: campaignData.subject,
        previewText: campaignData.previewText,
        abTest: campaignData.abTest,
        createdBy,
        sent: 0,
        delivered: 0,
        opened: 0,
        clicked: 0,
        converted: 0,
      },
    });

    await logAudit({
      action: 'CAMPAIGN_CREATED',
      userId: createdBy,
      resource: 'campaign',
      resourceId: campaign.id,
      description: `Campaign created: ${campaign.name}`,
      metadata: {
        name: campaign.name,
        type: campaign.type,
      },
    });

    return campaign as Campaign;
  }

  /**
   * Update campaign
   */
  static async updateCampaign(
    campaignId: string,
    updates: Partial<Campaign>
  ): Promise<Campaign> {
    const campaign = await db.campaign.findUnique({
      where: { id: campaignId },
    });

    if (!campaign) throw new Error('Campaign not found');

    // Don't allow editing active campaigns
    if (campaign.status === CampaignStatus.ACTIVE) {
      throw new Error('Cannot edit active campaign');
    }

    // Re-estimate audience if targeting changed
    let estimatedAudience = campaign.estimatedAudience;
    if (updates.targetingRules) {
      estimatedAudience = await this.estimateAudience(updates.targetingRules);
    }

    const updated = await db.campaign.update({
      where: { id: campaignId },
      data: {
        ...updates,
        estimatedAudience,
        updatedAt: new Date(),
      },
    });

    return updated as Campaign;
  }

  /**
   * Launch campaign
   */
  static async launchCampaign(campaignId: string): Promise<void> {
    const campaign = await db.campaign.findUnique({
      where: { id: campaignId },
    });

    if (!campaign) throw new Error('Campaign not found');
    if (campaign.status !== CampaignStatus.DRAFT && campaign.status !== CampaignStatus.SCHEDULED) {
      throw new Error('Campaign must be in draft or scheduled status');
    }

    // Get target audience
    const recipients = await this.getTargetAudience(
      campaign.targetingRules as TargetingRule[]
    );

    if (recipients.length === 0) {
      throw new Error('No recipients match targeting criteria');
    }

    // Handle A/B testing
    if (campaign.abTest?.enabled) {
      await this.createABTestRecipients(campaign, recipients);
    } else {
      await this.createRecipients(campaign, recipients);
    }

    // Update campaign status
    await db.campaign.update({
      where: { id: campaignId },
      data: {
        status: CampaignStatus.ACTIVE,
        updatedAt: new Date(),
      },
    });

    // If immediate send, process now
    if ((campaign.schedule as CampaignSchedule)?.type === 'immediate') {
      await this.processCampaign(campaignId);
    }

    await logAudit({
      action: 'CAMPAIGN_LAUNCHED',
      userId: campaign.createdBy,
      resource: 'campaign',
      resourceId: campaignId,
      description: `Campaign launched: ${campaign.name}`,
      metadata: {
        name: campaign.name,
        recipients: recipients.length,
      },
    });
  }

  /**
   * Process and send campaign messages
   */
  static async processCampaign(campaignId: string): Promise<void> {
    const campaign = await db.campaign.findUnique({
      where: { id: campaignId },
    });

    if (!campaign) throw new Error('Campaign not found');

    // Get pending recipients
    const pendingRecipients = await db.campaignRecipient.findMany({
      where: {
        campaignId,
        status: 'pending',
      },
      take: 100, // Process in batches
    });

    for (const recipient of pendingRecipients) {
      try {
        await this.sendMessage(campaign, recipient);

        await db.campaignRecipient.update({
          where: { id: recipient.id },
          data: {
            status: 'sent',
            sentAt: new Date(),
          },
        });

        // Update campaign stats
        await db.campaign.update({
          where: { id: campaignId },
          data: {
            sent: { increment: 1 },
          },
        });
      } catch (error) {
        await db.campaignRecipient.update({
          where: { id: recipient.id },
          data: {
            status: 'failed',
            failureReason: (error as Error).message,
          },
        });
      }
    }

    // Check if campaign is complete
    const remainingPending = await db.campaignRecipient.count({
      where: {
        campaignId,
        status: 'pending',
      },
    });

    if (remainingPending === 0) {
      await db.campaign.update({
        where: { id: campaignId },
        data: {
          status: CampaignStatus.COMPLETED,
          updatedAt: new Date(),
        },
      });
    }
  }

  /**
   * Send individual message
   */
  private static async sendMessage(
    campaign: any,
    recipient: any
  ): Promise<void> {
    const user = await db.user.findUnique({
      where: { id: recipient.userId },
    });

    if (!user) throw new Error('User not found');

    // Get message template and personalize
    // This would integrate with actual messaging services (SendGrid, Twilio, etc.)

    // For now, create notification record
    await db.notification.create({
      data: {
        userId: recipient.userId,
        type: 'campaign',
        title: campaign.subject || campaign.name,
        message: `Campaign: ${campaign.name}`,
        channel: recipient.channel,
        metadata: {
          campaignId: campaign.id,
          recipientId: recipient.id,
        },
      },
    });
  }

  /**
   * Estimate audience size based on targeting rules
   */
  private static async estimateAudience(
    rules: TargetingRule[]
  ): Promise<number> {
    if (rules.length === 0) {
      return await db.user.count({
        where: { role: 'patient' },
      });
    }

    const where = this.buildWhereClause(rules);
    return await db.user.count({ where });
  }

  /**
   * Get target audience based on targeting rules
   */
  private static async getTargetAudience(
    rules: TargetingRule[]
  ): Promise<string[]> {
    const where = this.buildWhereClause(rules);

    const users = await db.user.findMany({
      where,
      select: { id: true },
    });

    return users.map((u) => u.id);
  }

  /**
   * Build Prisma where clause from targeting rules
   */
  private static buildWhereClause(rules: TargetingRule[]): any {
    if (rules.length === 0) {
      return { role: 'patient' };
    }

    const conditions = rules.map((rule) => {
      const condition: any = {};

      switch (rule.operator) {
        case 'equals':
          condition[rule.field] = rule.value;
          break;
        case 'not_equals':
          condition[rule.field] = { not: rule.value };
          break;
        case 'contains':
          condition[rule.field] = { contains: rule.value };
          break;
        case 'greater_than':
          condition[rule.field] = { gt: rule.value };
          break;
        case 'less_than':
          condition[rule.field] = { lt: rule.value };
          break;
        case 'in':
          condition[rule.field] = { in: rule.value };
          break;
        case 'not_in':
          condition[rule.field] = { notIn: rule.value };
          break;
      }

      return condition;
    });

    // Combine with AND logic by default (can be enhanced for OR)
    return {
      AND: [{ role: 'patient' }, ...conditions],
    };
  }

  /**
   * Create recipients for campaign
   */
  private static async createRecipients(
    campaign: any,
    userIds: string[]
  ): Promise<void> {
    const channels = campaign.channels as CampaignChannel[];

    const recipients = userIds.flatMap((userId) =>
      channels.map((channel) => ({
        campaignId: campaign.id,
        userId,
        channel,
        status: 'pending',
      }))
    );

    await db.campaignRecipient.createMany({
      data: recipients as any,
    });
  }

  /**
   * Create recipients with A/B test variants
   */
  private static async createABTestRecipients(
    campaign: any,
    userIds: string[]
  ): Promise<void> {
    const abTest = campaign.abTest as ABTest;
    const channels = campaign.channels as CampaignChannel[];
    const recipients: any[] = [];

    let currentIndex = 0;
    userIds.forEach((userId) => {
      channels.forEach((channel) => {
        // Assign variant based on traffic split
        const variantIndex = this.getVariantForUser(
          currentIndex,
          abTest.trafficSplit
        );
        const variant = abTest.variants[variantIndex];

        recipients.push({
          campaignId: campaign.id,
          userId,
          channel,
          variantId: variant.id,
          status: 'pending',
        });

        currentIndex++;
      });
    });

    await db.campaignRecipient.createMany({
      data: recipients,
    });
  }

  /**
   * Determine variant for user based on traffic split
   */
  private static getVariantForUser(
    index: number,
    trafficSplit: number[]
  ): number {
    const total = trafficSplit.reduce((sum, split) => sum + split, 0);
    const position = (index % total);

    let cumulative = 0;
    for (let i = 0; i < trafficSplit.length; i++) {
      cumulative += trafficSplit[i];
      if (position < cumulative) {
        return i;
      }
    }

    return 0;
  }

  /**
   * Track campaign interaction (open, click, conversion)
   */
  static async trackInteraction(
    recipientId: string,
    interactionType: 'delivered' | 'opened' | 'clicked' | 'converted'
  ): Promise<void> {
    const recipient = await db.campaignRecipient.findUnique({
      where: { id: recipientId },
    });

    if (!recipient) return;

    const updateData: any = {
      status: interactionType,
    };

    switch (interactionType) {
      case 'delivered':
        updateData.deliveredAt = new Date();
        break;
      case 'opened':
        updateData.openedAt = new Date();
        break;
      case 'clicked':
        updateData.clickedAt = new Date();
        break;
      case 'converted':
        updateData.convertedAt = new Date();
        break;
    }

    await db.campaignRecipient.update({
      where: { id: recipientId },
      data: updateData,
    });

    // Update campaign stats
    const fieldMap = {
      delivered: 'delivered',
      opened: 'opened',
      clicked: 'clicked',
      converted: 'converted',
    };

    await db.campaign.update({
      where: { id: recipient.campaignId },
      data: {
        [fieldMap[interactionType]]: { increment: 1 },
      },
    });

    // Update A/B test variant stats if applicable
    if (recipient.variantId) {
      // Would update variant-specific stats
    }
  }

  /**
   * Pause campaign
   */
  static async pauseCampaign(campaignId: string): Promise<void> {
    await db.campaign.update({
      where: { id: campaignId },
      data: {
        status: CampaignStatus.PAUSED,
        updatedAt: new Date(),
      },
    });
  }

  /**
   * Resume paused campaign
   */
  static async resumeCampaign(campaignId: string): Promise<void> {
    await db.campaign.update({
      where: { id: campaignId },
      data: {
        status: CampaignStatus.ACTIVE,
        updatedAt: new Date(),
      },
    });
  }

  /**
   * Get campaign performance metrics
   */
  static async getCampaignMetrics(campaignId: string): Promise<{
    sent: number;
    delivered: number;
    opened: number;
    clicked: number;
    converted: number;
    deliveryRate: number;
    openRate: number;
    clickRate: number;
    conversionRate: number;
  }> {
    const campaign = await db.campaign.findUnique({
      where: { id: campaignId },
    });

    if (!campaign) throw new Error('Campaign not found');

    const sent = campaign.sent || 0;
    const delivered = campaign.delivered || 0;
    const opened = campaign.opened || 0;
    const clicked = campaign.clicked || 0;
    const converted = campaign.converted || 0;

    return {
      sent,
      delivered,
      opened,
      clicked,
      converted,
      deliveryRate: sent > 0 ? (delivered / sent) * 100 : 0,
      openRate: delivered > 0 ? (opened / delivered) * 100 : 0,
      clickRate: opened > 0 ? (clicked / opened) * 100 : 0,
      conversionRate: clicked > 0 ? (converted / clicked) * 100 : 0,
    };
  }
}
