/**
 * Batch Processor
 * Lithic Healthcare Platform v0.5
 *
 * Handles batch notification processing for sending notifications
 * to multiple recipients efficiently with rate limiting and queuing.
 */

import {
  NotificationBatch,
  NotificationRecipient,
  CreateNotificationRequest,
  NotificationPriority,
} from '@/types/notifications';
import Redis from 'ioredis';

export class BatchProcessor {
  private notificationHub: any; // Reference to NotificationHub
  private redis: Redis;
  private processingBatches: Map<string, NotificationBatch> = new Map();

  // Rate limiting configuration
  private readonly MAX_CONCURRENT_SENDS = 10;
  private readonly BATCH_SIZE = 100;
  private readonly RATE_LIMIT_PER_SECOND = 50;

  constructor(notificationHub: any, redis?: Redis) {
    this.notificationHub = notificationHub;
    this.redis = redis || new Redis(process.env.REDIS_URL || 'redis://localhost:6379');
  }

  /**
   * Process a batch of notifications
   */
  async processBatch(
    recipients: NotificationRecipient[],
    notification: Omit<CreateNotificationRequest, 'recipients'>
  ): Promise<string> {
    // Create batch record
    const batch = this.createBatch(recipients, notification);

    // Store batch
    await this.storeBatch(batch);

    // Process asynchronously
    this.processBatchAsync(batch, notification).catch((error) => {
      console.error('Batch processing error:', error);
      this.updateBatchStatus(batch.id, 'failed');
    });

    return batch.id;
  }

  /**
   * Process batch asynchronously
   */
  private async processBatchAsync(
    batch: NotificationBatch,
    notification: Omit<CreateNotificationRequest, 'recipients'>
  ): Promise<void> {
    // Update status to processing
    batch.status = 'processing';
    batch.startedAt = new Date();
    await this.updateBatch(batch);

    // Split recipients into chunks
    const chunks = this.chunkArray(batch.recipientIds, this.BATCH_SIZE);

    let successful = 0;
    let failed = 0;
    const errors: Array<{
      recipientId: string;
      notificationId: string;
      error: string;
    }> = [];

    // Process each chunk
    for (let i = 0; i < chunks.length; i++) {
      const chunk = chunks[i];

      // Rate limiting - wait between chunks
      if (i > 0) {
        await this.sleep(1000 / (this.RATE_LIMIT_PER_SECOND / this.BATCH_SIZE));
      }

      // Process chunk with concurrency control
      const chunkResults = await this.processChunk(chunk, notification);

      successful += chunkResults.successful;
      failed += chunkResults.failed;
      errors.push(...chunkResults.errors);

      // Update progress
      batch.progress = Math.round(((i + 1) / chunks.length) * 100);
      batch.successful = successful;
      batch.failed = failed;
      await this.updateBatch(batch);
    }

    // Complete batch
    batch.status = 'completed';
    batch.completedAt = new Date();
    batch.successful = successful;
    batch.failed = failed;
    batch.errors = errors;
    batch.progress = 100;

    await this.updateBatch(batch);

    // Emit completion event
    this.notificationHub.emit('batch:completed', batch);
  }

  /**
   * Process a chunk of recipients
   */
  private async processChunk(
    recipientIds: string[],
    notification: Omit<CreateNotificationRequest, 'recipients'>
  ): Promise<{
    successful: number;
    failed: number;
    errors: Array<{
      recipientId: string;
      notificationId: string;
      error: string;
    }>;
  }> {
    const promises = recipientIds.map(async (recipientId) => {
      try {
        const request: CreateNotificationRequest = {
          ...notification,
          recipients: [{ userId: recipientId }],
        };

        const result = await this.notificationHub.send(request);

        return {
          success: result.success,
          recipientId,
          notificationId: result.notificationIds[0],
          error: result.errors?.[0]?.error,
        };
      } catch (error) {
        return {
          success: false,
          recipientId,
          notificationId: '',
          error: error instanceof Error ? error.message : 'Unknown error',
        };
      }
    });

    // Process with concurrency control
    const results = await this.processWithConcurrency(
      promises,
      this.MAX_CONCURRENT_SENDS
    );

    let successful = 0;
    let failed = 0;
    const errors: Array<{
      recipientId: string;
      notificationId: string;
      error: string;
    }> = [];

    results.forEach((result) => {
      if (result.success) {
        successful++;
      } else {
        failed++;
        if (result.error) {
          errors.push({
            recipientId: result.recipientId,
            notificationId: result.notificationId,
            error: result.error,
          });
        }
      }
    });

    return { successful, failed, errors };
  }

  /**
   * Process promises with concurrency limit
   */
  private async processWithConcurrency<T>(
    promises: Promise<T>[],
    concurrency: number
  ): Promise<T[]> {
    const results: T[] = [];
    const executing: Promise<void>[] = [];

    for (const promise of promises) {
      const p = promise.then((result) => {
        results.push(result);
      });

      executing.push(p);

      if (executing.length >= concurrency) {
        await Promise.race(executing);
        executing.splice(
          executing.findIndex((p) => p === p),
          1
        );
      }
    }

    await Promise.all(executing);
    return results;
  }

  /**
   * Create batch record
   */
  private createBatch(
    recipients: NotificationRecipient[],
    notification: Omit<CreateNotificationRequest, 'recipients'>
  ): NotificationBatch {
    const batchId = this.generateBatchId();

    return {
      id: batchId,
      tenantId: 'default', // Would come from context
      recipientIds: recipients.map((r) => r.userId),
      notificationIds: [],
      status: 'pending',
      progress: 0,
      successful: 0,
      failed: 0,
      scheduledFor: notification.scheduledFor,
      createdAt: new Date(),
    };
  }

  /**
   * Schedule batch for later processing
   */
  async scheduleBatch(
    recipients: NotificationRecipient[],
    notification: Omit<CreateNotificationRequest, 'recipients'>,
    scheduledFor: Date
  ): Promise<string> {
    const batch = this.createBatch(recipients, notification);
    batch.scheduledFor = scheduledFor;

    await this.storeBatch(batch);

    // Schedule processing
    const delay = scheduledFor.getTime() - Date.now();
    if (delay > 0) {
      setTimeout(() => {
        this.processBatchAsync(batch, notification);
      }, delay);
    }

    return batch.id;
  }

  /**
   * Get batch status
   */
  async getBatchStatus(batchId: string): Promise<NotificationBatch | null> {
    const batch = this.processingBatches.get(batchId);
    if (batch) {
      return batch;
    }

    // Try to load from Redis
    const data = await this.redis.get(`batch:${batchId}`);
    if (data) {
      return JSON.parse(data);
    }

    return null;
  }

  /**
   * Cancel batch processing
   */
  async cancelBatch(batchId: string): Promise<boolean> {
    const batch = await this.getBatchStatus(batchId);

    if (!batch) {
      return false;
    }

    if (batch.status === 'completed' || batch.status === 'failed') {
      return false; // Cannot cancel completed batches
    }

    batch.status = 'failed';
    batch.completedAt = new Date();

    await this.updateBatch(batch);
    this.processingBatches.delete(batchId);

    return true;
  }

  /**
   * Retry failed batch notifications
   */
  async retryFailed(batchId: string): Promise<string> {
    const batch = await this.getBatchStatus(batchId);

    if (!batch || !batch.errors || batch.errors.length === 0) {
      throw new Error('No failed notifications to retry');
    }

    // Create new batch with failed recipients
    const failedRecipients = batch.errors.map((e) => ({ userId: e.recipientId }));

    // Would need to reconstruct notification from stored data
    // For now, throw error as we need notification details
    throw new Error('Retry not fully implemented - need notification details');
  }

  /**
   * Get batch statistics
   */
  async getBatchStats(tenantId: string): Promise<{
    total: number;
    pending: number;
    processing: number;
    completed: number;
    failed: number;
  }> {
    // In production, query from database
    return {
      total: 0,
      pending: 0,
      processing: 0,
      completed: 0,
      failed: 0,
    };
  }

  /**
   * Helper methods
   */

  private generateBatchId(): string {
    return `batch_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private async storeBatch(batch: NotificationBatch): Promise<void> {
    await this.redis.set(
      `batch:${batch.id}`,
      JSON.stringify(batch),
      'EX',
      7 * 24 * 60 * 60 // 7 days
    );

    this.processingBatches.set(batch.id, batch);
  }

  private async updateBatch(batch: NotificationBatch): Promise<void> {
    await this.redis.set(
      `batch:${batch.id}`,
      JSON.stringify(batch),
      'KEEPTTL'
    );

    this.processingBatches.set(batch.id, batch);
  }

  private async updateBatchStatus(
    batchId: string,
    status: NotificationBatch['status']
  ): Promise<void> {
    const batch = await this.getBatchStatus(batchId);
    if (batch) {
      batch.status = status;
      if (status === 'completed' || status === 'failed') {
        batch.completedAt = new Date();
      }
      await this.updateBatch(batch);
    }
  }

  private chunkArray<T>(array: T[], size: number): T[][] {
    const chunks: T[][] = [];
    for (let i = 0; i < array.length; i += size) {
      chunks.push(array.slice(i, i + size));
    }
    return chunks;
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * Cleanup
   */
  async cleanup(): Promise<void> {
    this.processingBatches.clear();
  }
}
