/**
 * Queue Processor
 * Background job processing with Bull/BullMQ and Redis
 */

import { z } from "zod";
import Redis from "ioredis";

const QueueConfigSchema = z.object({
  redis: z.object({
    host: z.string().default("localhost"),
    port: z.number().default(6379),
    password: z.string().optional(),
    db: z.number().default(0),
  }),
  defaultJobOptions: z
    .object({
      attempts: z.number().default(3),
      backoff: z.object({
        type: z.enum(["fixed", "exponential"]).default("exponential"),
        delay: z.number().default(1000),
      }),
      removeOnComplete: z.boolean().default(true),
      removeOnFail: z.boolean().default(false),
    })
    .optional(),
});

type QueueConfig = z.infer<typeof QueueConfigSchema>;

export interface Job<T = any> {
  id: string;
  name: string;
  data: T;
  opts: JobOptions;
  timestamp: number;
  processedOn?: number;
  finishedOn?: number;
  failedReason?: string;
  stacktrace?: string[];
  returnvalue?: any;
  attemptsMade: number;
}

export interface JobOptions {
  priority?: number;
  delay?: number;
  attempts?: number;
  backoff?: {
    type: "fixed" | "exponential";
    delay: number;
  };
  timeout?: number;
  removeOnComplete?: boolean;
  removeOnFail?: boolean;
}

export type JobProcessor<T = any> = (job: Job<T>) => Promise<any>;

export class QueueProcessor {
  private redis: Redis;
  private config: QueueConfig;
  private processors: Map<string, JobProcessor> = new Map();
  private queues: Map<string, Job[]> = new Map();
  private processing: Map<string, boolean> = new Map();
  private intervals: Map<string, NodeJS.Timeout> = new Map();

  constructor(config: Partial<QueueConfig> = {}) {
    this.config = QueueConfigSchema.parse({
      redis: {
        host: process.env.REDIS_HOST || "localhost",
        port: parseInt(process.env.REDIS_PORT || "6379"),
        password: process.env.REDIS_PASSWORD,
        db: parseInt(process.env.REDIS_DB || "0"),
      },
      ...config,
    });

    this.redis = new Redis({
      host: this.config.redis.host,
      port: this.config.redis.port,
      password: this.config.redis.password,
      db: this.config.redis.db,
      maxRetriesPerRequest: null,
      enableReadyCheck: false,
    });
  }

  /**
   * Register a job processor
   */
  registerProcessor<T = any>(
    jobName: string,
    processor: JobProcessor<T>,
  ): void {
    this.processors.set(jobName, processor);
    this.queues.set(jobName, []);
    this.processing.set(jobName, false);

    // Start processing queue
    this.startProcessing(jobName);
  }

  /**
   * Add job to queue
   */
  async addJob<T = any>(
    jobName: string,
    data: T,
    options: JobOptions = {},
  ): Promise<Job<T>> {
    const job: Job<T> = {
      id: `${jobName}:${Date.now()}:${Math.random().toString(36).substring(7)}`,
      name: jobName,
      data,
      opts: {
        ...this.config.defaultJobOptions,
        ...options,
      },
      timestamp: Date.now(),
      attemptsMade: 0,
    };

    // Store in Redis
    await this.redis.rpush(`queue:${jobName}`, JSON.stringify(job));

    // Publish event
    await this.redis.publish(
      "job:added",
      JSON.stringify({ jobName, jobId: job.id }),
    );

    return job;
  }

  /**
   * Start processing jobs from queue
   */
  private startProcessing(jobName: string): void {
    const interval = setInterval(() => {
      this.processNextJob(jobName);
    }, 100);

    this.intervals.set(jobName, interval);
  }

  /**
   * Process next job in queue
   */
  private async processNextJob(jobName: string): Promise<void> {
    if (this.processing.get(jobName)) {
      return; // Already processing
    }

    const processor = this.processors.get(jobName);
    if (!processor) {
      return;
    }

    // Get next job from Redis
    const jobData = await this.redis.lpop(`queue:${jobName}`);
    if (!jobData) {
      return; // Queue is empty
    }

    const job: Job = JSON.parse(jobData);

    // Check if delayed
    if (job.opts.delay && Date.now() - job.timestamp < job.opts.delay) {
      // Re-queue the job
      await this.redis.rpush(`queue:${jobName}`, JSON.stringify(job));
      return;
    }

    this.processing.set(jobName, true);

    try {
      job.processedOn = Date.now();

      // Set timeout if specified
      let timeoutId: NodeJS.Timeout | undefined;
      const timeoutPromise = new Promise((_, reject) => {
        if (job.opts.timeout) {
          timeoutId = setTimeout(() => {
            reject(new Error(`Job timeout after ${job.opts.timeout}ms`));
          }, job.opts.timeout);
        }
      });

      // Process job with timeout
      const resultPromise = processor(job);
      const result = await Promise.race([resultPromise, timeoutPromise]);

      if (timeoutId) {
        clearTimeout(timeoutId);
      }

      job.finishedOn = Date.now();
      job.returnvalue = result;

      // Store completed job
      if (job.opts.removeOnComplete) {
        await this.redis.del(`job:${job.id}`);
      } else {
        await this.redis.set(
          `job:${job.id}`,
          JSON.stringify(job),
          "EX",
          86400, // 24 hours
        );
      }

      // Publish completion event
      await this.redis.publish(
        "job:completed",
        JSON.stringify({
          jobName: job.name,
          jobId: job.id,
          result,
        }),
      );
    } catch (error) {
      job.attemptsMade++;
      job.failedReason =
        error instanceof Error ? error.message : "Unknown error";
      job.stacktrace = error instanceof Error ? error.stack?.split("\n") : [];

      const maxAttempts = job.opts.attempts || 1;

      if (job.attemptsMade < maxAttempts) {
        // Retry with backoff
        const backoffDelay = this.calculateBackoff(job);
        job.opts.delay = backoffDelay;

        // Re-queue
        await this.redis.rpush(`queue:${jobName}`, JSON.stringify(job));

        // Publish retry event
        await this.redis.publish(
          "job:retry",
          JSON.stringify({
            jobName: job.name,
            jobId: job.id,
            attempt: job.attemptsMade,
            nextRetry: backoffDelay,
          }),
        );
      } else {
        // Job failed permanently
        job.finishedOn = Date.now();

        if (!job.opts.removeOnFail) {
          await this.redis.set(
            `job:failed:${job.id}`,
            JSON.stringify(job),
            "EX",
            604800, // 7 days
          );
        }

        // Publish failure event
        await this.redis.publish(
          "job:failed",
          JSON.stringify({
            jobName: job.name,
            jobId: job.id,
            error: job.failedReason,
          }),
        );
      }
    } finally {
      this.processing.set(jobName, false);
    }
  }

  /**
   * Calculate backoff delay
   */
  private calculateBackoff(job: Job): number {
    if (!job.opts.backoff) {
      return 1000;
    }

    const { type, delay } = job.opts.backoff;

    if (type === "exponential") {
      return delay * Math.pow(2, job.attemptsMade - 1);
    }

    return delay;
  }

  /**
   * Get job status
   */
  async getJob(jobId: string): Promise<Job | null> {
    const jobData = await this.redis.get(`job:${jobId}`);
    if (!jobData) {
      // Check failed jobs
      const failedData = await this.redis.get(`job:failed:${jobId}`);
      return failedData ? JSON.parse(failedData) : null;
    }

    return JSON.parse(jobData);
  }

  /**
   * Get queue stats
   */
  async getQueueStats(jobName: string): Promise<{
    waiting: number;
    active: boolean;
    completed: number;
    failed: number;
  }> {
    const waiting = await this.redis.llen(`queue:${jobName}`);
    const active = this.processing.get(jobName) || false;

    return {
      waiting,
      active,
      completed: 0, // Would need to track this separately
      failed: 0, // Would need to track this separately
    };
  }

  /**
   * Clear queue
   */
  async clearQueue(jobName: string): Promise<void> {
    await this.redis.del(`queue:${jobName}`);
  }

  /**
   * Pause queue
   */
  pauseQueue(jobName: string): void {
    const interval = this.intervals.get(jobName);
    if (interval) {
      clearInterval(interval);
      this.intervals.delete(jobName);
    }
  }

  /**
   * Resume queue
   */
  resumeQueue(jobName: string): void {
    if (!this.intervals.has(jobName)) {
      this.startProcessing(jobName);
    }
  }

  /**
   * Close connections
   */
  async close(): Promise<void> {
    // Clear all intervals
    for (const interval of this.intervals.values()) {
      clearInterval(interval);
    }
    this.intervals.clear();

    // Close Redis connection
    await this.redis.quit();
  }

  /**
   * Subscribe to job events
   */
  on(
    event: "completed" | "failed" | "retry" | "added",
    callback: (data: any) => void,
  ): void {
    const subscriber = new Redis({
      host: this.config.redis.host,
      port: this.config.redis.port,
      password: this.config.redis.password,
      db: this.config.redis.db,
    });

    subscriber.subscribe(`job:${event}`);
    subscriber.on("message", (channel, message) => {
      if (channel === `job:${event}`) {
        callback(JSON.parse(message));
      }
    });
  }
}

/**
 * Default queue processor instance
 */
export const queueProcessor = new QueueProcessor();

/**
 * Helper to create a queue
 */
export function createQueue<T = any>(
  name: string,
  processor: JobProcessor<T>,
): {
  add: (data: T, options?: JobOptions) => Promise<Job<T>>;
  getStats: () => Promise<any>;
  pause: () => void;
  resume: () => void;
  clear: () => Promise<void>;
} {
  queueProcessor.registerProcessor(name, processor);

  return {
    add: (data: T, options?: JobOptions) =>
      queueProcessor.addJob(name, data, options),
    getStats: () => queueProcessor.getQueueStats(name),
    pause: () => queueProcessor.pauseQueue(name),
    resume: () => queueProcessor.resumeQueue(name),
    clear: () => queueProcessor.clearQueue(name),
  };
}
