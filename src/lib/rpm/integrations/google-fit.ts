/**
 * Google Fit Integration
 * Handles data synchronization with Google Fit API
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

interface GoogleFitDataPoint {
  dataTypeName: string;
  startTimeNanos: string;
  endTimeNanos: string;
  value: Array<{ fpVal?: number; intVal?: number }>;
  originDataSourceId?: string;
}

export class GoogleFitIntegration {
  private readonly platform = WearablePlatform.GOOGLE_FIT;
  private readonly baseUrl = "https://www.googleapis.com/fitness/v1/users/me";

  /**
   * Initialize Google Fit integration
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
      platformUserId: authData.userId,
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

    return integration;
  }

  /**
   * Sync data from Google Fit
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

      // Fetch data for each data type
      for (const dataType of this.getSupportedDataTypes()) {
        try {
          const dataPoints = await this.fetchDataPoints(accessToken, dataType, start, end);

          for (const point of dataPoints) {
            try {
              await this.importDataPoint(integration.patientId, point, integration.organizationId);
              sync.recordsImported++;
            } catch (error) {
              sync.recordsSkipped++;
              sync.errors.push({
                timestamp: new Date(),
                dataType,
                error: error instanceof Error ? error.message : "Unknown error",
                rawData: point,
              });
            }
            sync.recordsProcessed++;
          }
        } catch (error) {
          sync.errors.push({
            timestamp: new Date(),
            dataType,
            error: error instanceof Error ? error.message : "Unknown error",
            rawData: {},
          });
        }
      }

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
    userId: string;
  }> {
    // Implement OAuth 2.0 flow with Google
    // This is a placeholder

    return {
      access_token: `google_fit_token_${Date.now()}`,
      refresh_token: `google_fit_refresh_${Date.now()}`,
      expires_in: 3600,
      scope: "https://www.googleapis.com/auth/fitness.activity.read https://www.googleapis.com/auth/fitness.blood_glucose.read https://www.googleapis.com/auth/fitness.blood_pressure.read https://www.googleapis.com/auth/fitness.body.read https://www.googleapis.com/auth/fitness.heart_rate.read https://www.googleapis.com/auth/fitness.oxygen_saturation.read",
      userId: `google_user_${Date.now()}`,
    };
  }

  private async fetchDataPoints(
    accessToken: string,
    dataType: string,
    startDate: Date,
    endDate: Date
  ): Promise<GoogleFitDataPoint[]> {
    // Implement Google Fit API call
    // This is a placeholder

    console.log(`Fetching Google Fit data for ${dataType} from ${startDate} to ${endDate}`);

    return [];
  }

  private async importDataPoint(
    patientId: string,
    dataPoint: GoogleFitDataPoint,
    organizationId: string
  ): Promise<void> {
    const readingType = this.mapGoogleFitType(dataPoint.dataTypeName);
    if (!readingType) {
      throw new Error(`Unsupported data type: ${dataPoint.dataTypeName}`);
    }

    const value = dataPoint.value[0]?.fpVal ?? dataPoint.value[0]?.intVal ?? 0;
    const timestamp = new Date(parseInt(dataPoint.startTimeNanos) / 1000000);

    const reading: CreateReadingDto = {
      patientId,
      readingType,
      value,
      unit: this.getUnitForDataType(dataPoint.dataTypeName),
      timestamp,
      source: ReadingSource.GOOGLE_FIT,
      metadata: {
        rawData: dataPoint,
        originDataSource: dataPoint.originDataSourceId,
      },
    };

    await vitalSignsCollector.collectReading(reading, "system", organizationId);
  }

  private mapGoogleFitType(googleType: string): ReadingType | null {
    const mapping: Record<string, ReadingType> = {
      "com.google.heart_rate.bpm": ReadingType.HEART_RATE,
      "com.google.blood_pressure": ReadingType.SYSTOLIC_BP,
      "com.google.oxygen_saturation": ReadingType.OXYGEN_SATURATION,
      "com.google.blood_glucose": ReadingType.BLOOD_GLUCOSE,
      "com.google.weight": ReadingType.WEIGHT,
      "com.google.body.temperature": ReadingType.TEMPERATURE,
      "com.google.step_count.delta": ReadingType.STEPS,
      "com.google.calories.expended": ReadingType.CALORIES,
      "com.google.sleep.segment": ReadingType.SLEEP_HOURS,
      "com.google.active_minutes": ReadingType.ACTIVITY_MINUTES,
    };

    return mapping[googleType] || null;
  }

  private getUnitForDataType(dataType: string): string {
    const units: Record<string, string> = {
      "com.google.heart_rate.bpm": "bpm",
      "com.google.blood_pressure": "mmHg",
      "com.google.oxygen_saturation": "%",
      "com.google.blood_glucose": "mg/dL",
      "com.google.weight": "kg",
      "com.google.body.temperature": "C",
      "com.google.step_count.delta": "count",
      "com.google.calories.expended": "kcal",
      "com.google.sleep.segment": "hr",
      "com.google.active_minutes": "min",
    };

    return units[dataType] || "unknown";
  }

  private getSupportedDataTypes(): string[] {
    return [
      "com.google.heart_rate.bpm",
      "com.google.blood_pressure",
      "com.google.oxygen_saturation",
      "com.google.blood_glucose",
      "com.google.weight",
      "com.google.body.temperature",
      "com.google.step_count.delta",
      "com.google.calories.expended",
      "com.google.sleep.segment",
      "com.google.active_minutes",
    ];
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
        tokenExpiresAt: new Date(Date.now() + newAuth.expires_in * 1000),
      },
    });
  }

  private async refreshAccessToken(refreshToken: string): Promise<{
    access_token: string;
    expires_in: number;
  }> {
    // Implement token refresh
    return {
      access_token: `google_fit_token_${Date.now()}`,
      expires_in: 3600,
    };
  }

  private async revokeToken(accessToken: string): Promise<void> {
    console.log(`Revoking Google Fit token`);
  }
}

export const googleFitIntegration = new GoogleFitIntegration();
