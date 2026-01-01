/**
 * Campaign Analytics - Performance tracking and insights
 * Campaign performance metrics, engagement tracking, conversion tracking
 */

import { db } from '@/lib/db';
import { CampaignType, CampaignChannel } from './campaign-engine';

export interface CampaignAnalytics {
  campaignId: string;
  campaignName: string;
  type: CampaignType;
  status: string;

  // Overall metrics
  sent: number;
  delivered: number;
  opened: number;
  clicked: number;
  converted: number;
  bounced: number;
  failed: number;

  // Rates
  deliveryRate: number;
  openRate: number;
  clickRate: number;
  conversionRate: number;
  bounceRate: number;

  // Channel breakdown
  channelMetrics: ChannelMetrics[];

  // Time-based metrics
  hourlyMetrics?: HourlyMetrics[];
  dailyMetrics?: DailyMetrics[];

  // A/B test results
  abTestResults?: ABTestResults;

  // Revenue/ROI (if applicable)
  revenue?: number;
  roi?: number;
}

export interface ChannelMetrics {
  channel: CampaignChannel;
  sent: number;
  delivered: number;
  opened: number;
  clicked: number;
  converted: number;
  deliveryRate: number;
  openRate: number;
  clickRate: number;
  conversionRate: number;
}

export interface HourlyMetrics {
  hour: number;
  sent: number;
  opened: number;
  clicked: number;
}

export interface DailyMetrics {
  date: Date;
  sent: number;
  delivered: number;
  opened: number;
  clicked: number;
  converted: number;
}

export interface ABTestResults {
  testId: string;
  winner?: string;
  confidence: number;
  variants: VariantMetrics[];
}

export interface VariantMetrics {
  variantId: string;
  variantName: string;
  sent: number;
  opened: number;
  clicked: number;
  converted: number;
  openRate: number;
  clickRate: number;
  conversionRate: number;
  isWinner: boolean;
}

export interface CampaignComparisonMetrics {
  campaigns: Array<{
    id: string;
    name: string;
    type: CampaignType;
    openRate: number;
    clickRate: number;
    conversionRate: number;
    sent: number;
  }>;
  averages: {
    openRate: number;
    clickRate: number;
    conversionRate: number;
  };
}

export interface EngagementTrends {
  period: 'daily' | 'weekly' | 'monthly';
  data: Array<{
    date: Date;
    totalSent: number;
    totalOpened: number;
    totalClicked: number;
    totalConverted: number;
    openRate: number;
    clickRate: number;
    conversionRate: number;
  }>;
}

export class CampaignAnalytics {
  /**
   * Get comprehensive analytics for a campaign
   */
  static async getCampaignAnalytics(
    campaignId: string
  ): Promise<CampaignAnalytics> {
    const campaign = await db.campaign.findUnique({
      where: { id: campaignId },
      include: {
        recipients: true,
      },
    });

    if (!campaign) throw new Error('Campaign not found');

    const recipients = campaign.recipients || [];

    // Calculate overall metrics
    const sent = recipients.length;
    const delivered = recipients.filter((r: any) => r.status === 'delivered' || r.deliveredAt).length;
    const opened = recipients.filter((r: any) => r.openedAt).length;
    const clicked = recipients.filter((r: any) => r.clickedAt).length;
    const converted = recipients.filter((r: any) => r.convertedAt).length;
    const bounced = recipients.filter((r: any) => r.status === 'bounced').length;
    const failed = recipients.filter((r: any) => r.status === 'failed').length;

    const deliveryRate = sent > 0 ? (delivered / sent) * 100 : 0;
    const openRate = delivered > 0 ? (opened / delivered) * 100 : 0;
    const clickRate = opened > 0 ? (clicked / opened) * 100 : 0;
    const conversionRate = clicked > 0 ? (converted / clicked) * 100 : 0;
    const bounceRate = sent > 0 ? (bounced / sent) * 100 : 0;

    // Calculate channel metrics
    const channelMetrics = await this.getChannelMetrics(campaignId);

    // Calculate daily metrics
    const dailyMetrics = await this.getDailyMetrics(campaignId);

    // Get A/B test results if applicable
    let abTestResults: ABTestResults | undefined;
    if (campaign.abTest && (campaign.abTest as any).enabled) {
      abTestResults = await this.getABTestResults(campaignId);
    }

    return {
      campaignId,
      campaignName: campaign.name,
      type: campaign.type as CampaignType,
      status: campaign.status,
      sent,
      delivered,
      opened,
      clicked,
      converted,
      bounced,
      failed,
      deliveryRate,
      openRate,
      clickRate,
      conversionRate,
      bounceRate,
      channelMetrics,
      dailyMetrics,
      abTestResults,
    };
  }

  /**
   * Get metrics broken down by channel
   */
  private static async getChannelMetrics(
    campaignId: string
  ): Promise<ChannelMetrics[]> {
    const recipients = await db.campaignRecipient.findMany({
      where: { campaignId },
    });

    const channels = new Set(recipients.map((r) => r.channel));
    const channelMetrics: ChannelMetrics[] = [];

    channels.forEach((channel) => {
      const channelRecipients = recipients.filter((r) => r.channel === channel);
      const sent = channelRecipients.length;
      const delivered = channelRecipients.filter(
        (r) => r.deliveredAt
      ).length;
      const opened = channelRecipients.filter((r) => r.openedAt).length;
      const clicked = channelRecipients.filter((r) => r.clickedAt).length;
      const converted = channelRecipients.filter((r) => r.convertedAt).length;

      channelMetrics.push({
        channel: channel as CampaignChannel,
        sent,
        delivered,
        opened,
        clicked,
        converted,
        deliveryRate: sent > 0 ? (delivered / sent) * 100 : 0,
        openRate: delivered > 0 ? (opened / delivered) * 100 : 0,
        clickRate: opened > 0 ? (clicked / opened) * 100 : 0,
        conversionRate: clicked > 0 ? (converted / clicked) * 100 : 0,
      });
    });

    return channelMetrics;
  }

  /**
   * Get daily metrics for a campaign
   */
  private static async getDailyMetrics(
    campaignId: string
  ): Promise<DailyMetrics[]> {
    const recipients = await db.campaignRecipient.findMany({
      where: { campaignId },
      orderBy: { sentAt: 'asc' },
    });

    const dailyMap = new Map<string, DailyMetrics>();

    recipients.forEach((recipient) => {
      if (!recipient.sentAt) return;

      const dateKey = recipient.sentAt.toISOString().split('T')[0];
      const existing = dailyMap.get(dateKey) || {
        date: new Date(dateKey),
        sent: 0,
        delivered: 0,
        opened: 0,
        clicked: 0,
        converted: 0,
      };

      existing.sent++;
      if (recipient.deliveredAt) existing.delivered++;
      if (recipient.openedAt) existing.opened++;
      if (recipient.clickedAt) existing.clicked++;
      if (recipient.convertedAt) existing.converted++;

      dailyMap.set(dateKey, existing);
    });

    return Array.from(dailyMap.values()).sort(
      (a, b) => a.date.getTime() - b.date.getTime()
    );
  }

  /**
   * Get A/B test results
   */
  private static async getABTestResults(
    campaignId: string
  ): Promise<ABTestResults> {
    const campaign = await db.campaign.findUnique({
      where: { id: campaignId },
    });

    if (!campaign || !campaign.abTest) {
      throw new Error('No A/B test found');
    }

    const abTest = campaign.abTest as any;
    const variants: VariantMetrics[] = [];

    for (const variant of abTest.variants) {
      const recipients = await db.campaignRecipient.findMany({
        where: {
          campaignId,
          variantId: variant.id,
        },
      });

      const sent = recipients.length;
      const opened = recipients.filter((r) => r.openedAt).length;
      const clicked = recipients.filter((r) => r.clickedAt).length;
      const converted = recipients.filter((r) => r.convertedAt).length;

      variants.push({
        variantId: variant.id,
        variantName: variant.name,
        sent,
        opened,
        clicked,
        converted,
        openRate: sent > 0 ? (opened / sent) * 100 : 0,
        clickRate: opened > 0 ? (clicked / opened) * 100 : 0,
        conversionRate: clicked > 0 ? (converted / clicked) * 100 : 0,
        isWinner: false,
      });
    }

    // Determine winner based on criteria
    const winningCriteria = abTest.winningCriteria || 'open_rate';
    let winner: string | undefined;
    let highestValue = 0;

    variants.forEach((variant) => {
      let value = 0;
      if (winningCriteria === 'open_rate') value = variant.openRate;
      else if (winningCriteria === 'click_rate') value = variant.clickRate;
      else if (winningCriteria === 'conversion_rate')
        value = variant.conversionRate;

      if (value > highestValue) {
        highestValue = value;
        winner = variant.variantId;
      }
    });

    // Mark winner
    if (winner) {
      const winnerVariant = variants.find((v) => v.variantId === winner);
      if (winnerVariant) winnerVariant.isWinner = true;
    }

    // Calculate confidence (simplified - would use statistical significance testing)
    const confidence = variants.length > 1 ? 85 : 0;

    return {
      testId: campaignId,
      winner,
      confidence,
      variants,
    };
  }

  /**
   * Compare multiple campaigns
   */
  static async compareCampaigns(
    campaignIds: string[]
  ): Promise<CampaignComparisonMetrics> {
    const campaigns = await db.campaign.findMany({
      where: {
        id: { in: campaignIds },
      },
    });

    const comparisonData = campaigns.map((campaign) => ({
      id: campaign.id,
      name: campaign.name,
      type: campaign.type as CampaignType,
      openRate:
        campaign.delivered && campaign.delivered > 0
          ? ((campaign.opened || 0) / campaign.delivered) * 100
          : 0,
      clickRate:
        campaign.opened && campaign.opened > 0
          ? ((campaign.clicked || 0) / campaign.opened) * 100
          : 0,
      conversionRate:
        campaign.clicked && campaign.clicked > 0
          ? ((campaign.converted || 0) / campaign.clicked) * 100
          : 0,
      sent: campaign.sent || 0,
    }));

    const averages = {
      openRate:
        comparisonData.reduce((sum, c) => sum + c.openRate, 0) /
        comparisonData.length,
      clickRate:
        comparisonData.reduce((sum, c) => sum + c.clickRate, 0) /
        comparisonData.length,
      conversionRate:
        comparisonData.reduce((sum, c) => sum + c.conversionRate, 0) /
        comparisonData.length,
    };

    return {
      campaigns: comparisonData,
      averages,
    };
  }

  /**
   * Get engagement trends over time
   */
  static async getEngagementTrends(
    startDate: Date,
    endDate: Date,
    period: 'daily' | 'weekly' | 'monthly' = 'daily'
  ): Promise<EngagementTrends> {
    const campaigns = await db.campaign.findMany({
      where: {
        createdAt: {
          gte: startDate,
          lte: endDate,
        },
        status: { in: ['ACTIVE', 'COMPLETED'] },
      },
      include: {
        recipients: true,
      },
    });

    const trendMap = new Map<
      string,
      {
        date: Date;
        totalSent: number;
        totalOpened: number;
        totalClicked: number;
        totalConverted: number;
      }
    >();

    campaigns.forEach((campaign) => {
      (campaign.recipients || []).forEach((recipient: any) => {
        if (!recipient.sentAt) return;

        let dateKey: string;
        const sentDate = new Date(recipient.sentAt);

        if (period === 'daily') {
          dateKey = sentDate.toISOString().split('T')[0];
        } else if (period === 'weekly') {
          const weekStart = new Date(sentDate);
          weekStart.setDate(sentDate.getDate() - sentDate.getDay());
          dateKey = weekStart.toISOString().split('T')[0];
        } else {
          dateKey = `${sentDate.getFullYear()}-${String(sentDate.getMonth() + 1).padStart(2, '0')}-01`;
        }

        const existing = trendMap.get(dateKey) || {
          date: new Date(dateKey),
          totalSent: 0,
          totalOpened: 0,
          totalClicked: 0,
          totalConverted: 0,
        };

        existing.totalSent++;
        if (recipient.openedAt) existing.totalOpened++;
        if (recipient.clickedAt) existing.totalClicked++;
        if (recipient.convertedAt) existing.totalConverted++;

        trendMap.set(dateKey, existing);
      });
    });

    const data = Array.from(trendMap.values())
      .map((item) => ({
        ...item,
        openRate:
          item.totalSent > 0 ? (item.totalOpened / item.totalSent) * 100 : 0,
        clickRate:
          item.totalOpened > 0
            ? (item.totalClicked / item.totalOpened) * 100
            : 0,
        conversionRate:
          item.totalClicked > 0
            ? (item.totalConverted / item.totalClicked) * 100
            : 0,
      }))
      .sort((a, b) => a.date.getTime() - b.date.getTime());

    return {
      period,
      data,
    };
  }

  /**
   * Get top performing campaigns
   */
  static async getTopPerformingCampaigns(
    limit = 10,
    metric: 'open_rate' | 'click_rate' | 'conversion_rate' = 'conversion_rate'
  ): Promise<
    Array<{
      id: string;
      name: string;
      type: CampaignType;
      metricValue: number;
      sent: number;
      converted: number;
    }>
  > {
    const campaigns = await db.campaign.findMany({
      where: {
        status: { in: ['ACTIVE', 'COMPLETED'] },
        sent: { gt: 0 },
      },
    });

    const ranked = campaigns
      .map((campaign) => {
        let metricValue = 0;

        if (metric === 'open_rate' && campaign.delivered && campaign.delivered > 0) {
          metricValue = ((campaign.opened || 0) / campaign.delivered) * 100;
        } else if (metric === 'click_rate' && campaign.opened && campaign.opened > 0) {
          metricValue = ((campaign.clicked || 0) / campaign.opened) * 100;
        } else if (metric === 'conversion_rate' && campaign.clicked && campaign.clicked > 0) {
          metricValue = ((campaign.converted || 0) / campaign.clicked) * 100;
        }

        return {
          id: campaign.id,
          name: campaign.name,
          type: campaign.type as CampaignType,
          metricValue,
          sent: campaign.sent || 0,
          converted: campaign.converted || 0,
        };
      })
      .sort((a, b) => b.metricValue - a.metricValue)
      .slice(0, limit);

    return ranked;
  }

  /**
   * Export campaign data for reporting
   */
  static async exportCampaignData(
    campaignId: string
  ): Promise<{
    campaign: any;
    recipients: any[];
    summary: any;
  }> {
    const analytics = await this.getCampaignAnalytics(campaignId);

    const campaign = await db.campaign.findUnique({
      where: { id: campaignId },
    });

    const recipients = await db.campaignRecipient.findMany({
      where: { campaignId },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true,
          },
        },
      },
    });

    return {
      campaign,
      recipients,
      summary: analytics,
    };
  }
}
