/**
 * Fitbit Integration
 * Handles data synchronization with Fitbit Web API
 */

import type {
  WearableIntegration,
  WearableDataSync,
  WearablePlatform,
  SyncStatus,
  CreateReadingDto,
  ReadingType,
  ReadingSource,
} from "@/types/rpm";
import { db } from "@/lib/db";
import { vitalSignsCollector } from "../vital-signs-collector";
import { encrypt, decrypt } from "@/lib/encryption";

export class FitbitIntegration {
  private readonly platform = WearablePlatform.FITBIT;
  private readonly baseUrl = "https://api.fitbit.com/1/user/-";

  /**
   * Initialize Fitbit integration
   */
  async initializeIntegration(
    patientId: string,
    authCode: string,
    organizationId: string
  ): Promise<WearableIntegration> {
    const authData = await this.exchangeAuthCode(authCode);

    const integration: WearableIntegration = {
      id: crypto.randomUUID(),
      patientId,
      platform: this.platform,
      platformUserId: authData.user_id,
      accessToken: await encrypt(authData.access_token),
      refreshToken: authData.refresh_token ? await encrypt(authData.refresh_token) : null,
      tokenExpiresAt: new Date(Date.now() + authData.expires_in * 1000),
      scope: authData.scope.split(" "),
      isActive: true,
      lastSync: null,
      syncFrequency: 3600,
      dataTypes: this.getSupportedDataTypes(),
      metadata: {},
      organizationId,
      createdAt: new Date(),
      updatedAt: new Date(),
      deletedAt: null,
      createdBy: patientId,
      updatedBy: patientId,
    };

    await db.wearableIntegration.create({ data: integration });

    // Set up webhook subscription for real-time updates
    await this.setupWebhookSubscription(integration);

    return integration;
  }

  /**
   * Sync data from Fitbit
   */
  async syncData(integrationId: string, startDate?: Date, endDate?: Date): Promise<WearableDataSync> {
    const integration = await db.wearableIntegration.findUnique({
      where: { id: integrationId },
    });

    if (!integration) {
      throw new Error("Integration not found");
    }

    const sync: WearableDataSync = {
      id: crypto.randomUUID(),
      integrationId,
      patientId: integration.patientId,
      syncStartTime: new Date(),
      syncEndTime: null,
      status: SyncStatus.IN_PROGRESS,
      recordsProcessed: 0,
      recordsImported: 0,
      recordsSkipped: 0,
      errors: [],
    };

    await db.wearableDataSync.create({ data: sync });

    try {
      await this.refreshTokenIfNeeded(integration as WearableIntegration);

      const accessToken = await decrypt(integration.accessToken);
      const start = startDate || integration.lastSync || new Date(Date.now() - 24 * 60 * 60 * 1000);
      const end = endDate || new Date();

      // Sync heart rate
      await this.syncHeartRate(integration.patientId, accessToken, start, end, sync, integration.organizationId);

      // Sync activity data
      await this.syncActivityData(integration.patientId, accessToken, start, end, sync, integration.organizationId);

      // Sync sleep data
      await this.syncSleepData(integration.patientId, accessToken, start, end, sync, integration.organizationId);

      // Sync weight
      await this.syncWeight(integration.patientId, accessToken, start, end, sync, integration.organizationId);

      // Sync SpO2
      await this.syncSpO2(integration.patientId, accessToken, start, end, sync, integration.organizationId);

      sync.status = SyncStatus.COMPLETED;
      sync.syncEndTime = new Date();

      await db.wearableIntegration.update({
        where: { id: integrationId },
        data: { lastSync: new Date() },
      });
    } catch (error) {
      sync.status = SyncStatus.FAILED;
      sync.syncEndTime = new Date();
      sync.errors.push({
        timestamp: new Date(),
        dataType: "general",
        error: error instanceof Error ? error.message : "Unknown error",
        rawData: {},
      });
    }

    await db.wearableDataSync.update({
      where: { id: sync.id },
      data: sync,
    });

    return sync;
  }

  /**
   * Handle webhook notification from Fitbit
   */
  async handleWebhook(payload: any): Promise<void> {
    // Process webhook notification for real-time updates
    console.log("Processing Fitbit webhook:", payload);

    // Trigger sync for affected users
    if (payload.ownerId) {
      const integration = await db.wearableIntegration.findFirst({
        where: {
          platformUserId: payload.ownerId,
          platform: this.platform,
          isActive: true,
        },
      });

      if (integration) {
        await this.syncData(integration.id);
      }
    }
  }

  /**
   * Revoke integration
   */
  async revokeIntegration(integrationId: string): Promise<void> {
    const integration = await db.wearableIntegration.findUnique({
      where: { id: integrationId },
    });

    if (!integration) {
      throw new Error("Integration not found");
    }

    const accessToken = await decrypt(integration.accessToken);
    await this.revokeToken(accessToken);
    await this.removeWebhookSubscription(integration as WearableIntegration);

    await db.wearableIntegration.update({
      where: { id: integrationId },
      data: {
        isActive: false,
        deletedAt: new Date(),
      },
    });
  }

  // ============================================================================
  // Private Helper Methods
  // ============================================================================

  private async exchangeAuthCode(authCode: string): Promise<{
    access_token: string;
    refresh_token: string;
    expires_in: number;
    scope: string;
    user_id: string;
  }> {
    // Implement OAuth 2.0 flow with Fitbit
    return {
      access_token: `fitbit_token_${Date.now()}`,
      refresh_token: `fitbit_refresh_${Date.now()}`,
      expires_in: 3600,
      scope: "activity heartrate nutrition profile settings sleep social weight",
      user_id: `fitbit_user_${Date.now()}`,
    };
  }

  private async syncHeartRate(
    patientId: string,
    accessToken: string,
    startDate: Date,
    endDate: Date,
    sync: WearableDataSync,
    organizationId: string
  ): Promise<void> {
    // Fetch heart rate data from Fitbit API
    const dateStr = this.formatDate(startDate);
    const heartRateData = await this.fetchFitbitData(accessToken, `activities/heart/date/${dateStr}/1d.json`);

    // Process and import heart rate data
    if (heartRateData?.["activities-heart"]?.[0]?.value?.restingHeartRate) {
      const reading: CreateReadingDto = {
        patientId,
        readingType: ReadingType.HEART_RATE,
        value: heartRateData["activities-heart"][0].value.restingHeartRate,
        unit: "bpm",
        timestamp: new Date(heartRateData["activities-heart"][0].dateTime),
        source: ReadingSource.FITBIT,
        metadata: { rawData: heartRateData },
      };

      try {
        await vitalSignsCollector.collectReading(reading, "system", organizationId);
        sync.recordsImported++;
      } catch (error) {
        sync.recordsSkipped++;
        sync.errors.push({
          timestamp: new Date(),
          dataType: "heart_rate",
          error: error instanceof Error ? error.message : "Unknown error",
          rawData: heartRateData,
        });
      }
      sync.recordsProcessed++;
    }
  }

  private async syncActivityData(
    patientId: string,
    accessToken: string,
    startDate: Date,
    endDate: Date,
    sync: WearableDataSync,
    organizationId: string
  ): Promise<void> {
    const dateStr = this.formatDate(startDate);
    const activityData = await this.fetchFitbitData(accessToken, `activities/date/${dateStr}.json`);

    if (activityData?.summary) {
      // Steps
      if (activityData.summary.steps) {
        try {
          await vitalSignsCollector.collectReading(
            {
              patientId,
              readingType: ReadingType.STEPS,
              value: activityData.summary.steps,
              unit: "count",
              timestamp: new Date(dateStr),
              source: ReadingSource.FITBIT,
              metadata: { rawData: activityData },
            },
            "system",
            organizationId
          );
          sync.recordsImported++;
        } catch (error) {
          sync.recordsSkipped++;
        }
        sync.recordsProcessed++;
      }

      // Calories
      if (activityData.summary.caloriesOut) {
        try {
          await vitalSignsCollector.collectReading(
            {
              patientId,
              readingType: ReadingType.CALORIES,
              value: activityData.summary.caloriesOut,
              unit: "kcal",
              timestamp: new Date(dateStr),
              source: ReadingSource.FITBIT,
              metadata: { rawData: activityData },
            },
            "system",
            organizationId
          );
          sync.recordsImported++;
        } catch (error) {
          sync.recordsSkipped++;
        }
        sync.recordsProcessed++;
      }

      // Active minutes
      if (activityData.summary.fairlyActiveMinutes || activityData.summary.veryActiveMinutes) {
        const activeMinutes =
          (activityData.summary.fairlyActiveMinutes || 0) + (activityData.summary.veryActiveMinutes || 0);
        try {
          await vitalSignsCollector.collectReading(
            {
              patientId,
              readingType: ReadingType.ACTIVITY_MINUTES,
              value: activeMinutes,
              unit: "min",
              timestamp: new Date(dateStr),
              source: ReadingSource.FITBIT,
              metadata: { rawData: activityData },
            },
            "system",
            organizationId
          );
          sync.recordsImported++;
        } catch (error) {
          sync.recordsSkipped++;
        }
        sync.recordsProcessed++;
      }
    }
  }

  private async syncSleepData(
    patientId: string,
    accessToken: string,
    startDate: Date,
    endDate: Date,
    sync: WearableDataSync,
    organizationId: string
  ): Promise<void> {
    const dateStr = this.formatDate(startDate);
    const sleepData = await this.fetchFitbitData(accessToken, `sleep/date/${dateStr}.json`);

    if (sleepData?.summary?.totalMinutesAsleep) {
      try {
        await vitalSignsCollector.collectReading(
          {
            patientId,
            readingType: ReadingType.SLEEP_HOURS,
            value: sleepData.summary.totalMinutesAsleep / 60,
            unit: "hr",
            timestamp: new Date(dateStr),
            source: ReadingSource.FITBIT,
            metadata: { rawData: sleepData },
          },
          "system",
          organizationId
        );
        sync.recordsImported++;
      } catch (error) {
        sync.recordsSkipped++;
      }
      sync.recordsProcessed++;
    }
  }

  private async syncWeight(
    patientId: string,
    accessToken: string,
    startDate: Date,
    endDate: Date,
    sync: WearableDataSync,
    organizationId: string
  ): Promise<void> {
    const dateStr = this.formatDate(startDate);
    const weightData = await this.fetchFitbitData(accessToken, `body/log/weight/date/${dateStr}.json`);

    if (weightData?.weight?.[0]) {
      try {
        await vitalSignsCollector.collectReading(
          {
            patientId,
            readingType: ReadingType.WEIGHT,
            value: weightData.weight[0].weight,
            unit: "kg",
            timestamp: new Date(weightData.weight[0].date),
            source: ReadingSource.FITBIT,
            metadata: { rawData: weightData },
          },
          "system",
          organizationId
        );
        sync.recordsImported++;
      } catch (error) {
        sync.recordsSkipped++;
      }
      sync.recordsProcessed++;
    }
  }

  private async syncSpO2(
    patientId: string,
    accessToken: string,
    startDate: Date,
    endDate: Date,
    sync: WearableDataSync,
    organizationId: string
  ): Promise<void> {
    const dateStr = this.formatDate(startDate);
    const spo2Data = await this.fetchFitbitData(accessToken, `spo2/date/${dateStr}.json`);

    if (spo2Data?.value) {
      try {
        await vitalSignsCollector.collectReading(
          {
            patientId,
            readingType: ReadingType.OXYGEN_SATURATION,
            value: spo2Data.value.avg,
            unit: "%",
            timestamp: new Date(dateStr),
            source: ReadingSource.FITBIT,
            metadata: { rawData: spo2Data },
          },
          "system",
          organizationId
        );
        sync.recordsImported++;
      } catch (error) {
        sync.recordsSkipped++;
      }
      sync.recordsProcessed++;
    }
  }

  private async fetchFitbitData(accessToken: string, endpoint: string): Promise<any> {
    // Implement Fitbit API call
    console.log(`Fetching from Fitbit: ${endpoint}`);
    return {};
  }

  private formatDate(date: Date): string {
    return date.toISOString().split("T")[0] || "";
  }

  private getSupportedDataTypes(): string[] {
    return ["heart_rate", "steps", "calories", "sleep", "weight", "spo2", "activity"];
  }

  private async setupWebhookSubscription(integration: WearableIntegration): Promise<void> {
    // Set up Fitbit webhook subscription
    console.log(`Setting up Fitbit webhook for user ${integration.platformUserId}`);
  }

  private async removeWebhookSubscription(integration: WearableIntegration): Promise<void> {
    // Remove Fitbit webhook subscription
    console.log(`Removing Fitbit webhook for user ${integration.platformUserId}`);
  }

  private async refreshTokenIfNeeded(integration: WearableIntegration): Promise<void> {
    if (!integration.tokenExpiresAt || integration.tokenExpiresAt > new Date()) {
      return;
    }

    if (!integration.refreshToken) {
      throw new Error("No refresh token available");
    }

    const refreshToken = await decrypt(integration.refreshToken);
    const newAuth = await this.refreshAccessToken(refreshToken);

    await db.wearableIntegration.update({
      where: { id: integration.id },
      data: {
        accessToken: await encrypt(newAuth.access_token),
        refreshToken: await encrypt(newAuth.refresh_token),
        tokenExpiresAt: new Date(Date.now() + newAuth.expires_in * 1000),
      },
    });
  }

  private async refreshAccessToken(refreshToken: string): Promise<{
    access_token: string;
    refresh_token: string;
    expires_in: number;
  }> {
    // Implement token refresh
    return {
      access_token: `fitbit_token_${Date.now()}`,
      refresh_token: `fitbit_refresh_${Date.now()}`,
      expires_in: 3600,
    };
  }

  private async revokeToken(accessToken: string): Promise<void> {
    console.log(`Revoking Fitbit token`);
  }
}

export const fitbitIntegration = new FitbitIntegration();
