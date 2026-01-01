/**
 * Queue Processor
 *
 * Job queue processing system with retry logic, priorities, and monitoring
 */

import { EventEmitter } from "events";
import { logger } from "../utils/logger";

// Job Status
export type JobStatus =
  | "pending"
  | "processing"
  | "completed"
  | "failed"
  | "retry";

// Job Priority
export type JobPriority = "low" | "normal" | "high" | "critical";

// Job Definition
export interface Job<T = any> {
  id: string;
  type: string;
  data: T;
  priority: JobPriority;
  status: JobStatus;
  attempts: number;
  maxAttempts: number;
  createdAt: Date;
  updatedAt: Date;
  startedAt?: Date;
  completedAt?: Date;
  failedAt?: Date;
  error?: string;
  result?: any;
  metadata?: Record<string, any>;
}

// Job Handler
export type JobHandler<T = any> = (job: Job<T>) => Promise<any>;

// Queue Options
export interface QueueOptions {
  concurrency?: number;
  maxRetries?: number;
  retryDelay?: number;
  pollInterval?: number;
}

/**
 * Queue Processor
 */
export class QueueProcessor extends EventEmitter {
  private jobs: Map<string, Job> = new Map();
  private handlers: Map<string, JobHandler> = new Map();
  private processing: Set<string> = new Set();
  private concurrency: number;
  private maxRetries: number;
  private retryDelay: number;
  private pollInterval: number;
  private pollTimer?: NodeJS.Timeout;
  private running: boolean = false;

  constructor(options: QueueOptions = {}) {
    super();
    this.concurrency = options.concurrency || 5;
    this.maxRetries = options.maxRetries || 3;
    this.retryDelay = options.retryDelay || 1000;
    this.pollInterval = options.pollInterval || 100;
  }

  /**
   * Register a job handler
   */
  registerHandler<T = any>(jobType: string, handler: JobHandler<T>): void {
    this.handlers.set(jobType, handler);
    logger.info("Job handler registered", { jobType });
  }

  /**
   * Add a job to the queue
   */
  async addJob<T = any>(
    type: string,
    data: T,
    options: {
      priority?: JobPriority;
      maxAttempts?: number;
      metadata?: Record<string, any>;
    } = {},
  ): Promise<Job<T>> {
    const job: Job<T> = {
      id: crypto.randomUUID(),
      type,
      data,
      priority: options.priority || "normal",
      status: "pending",
      attempts: 0,
      maxAttempts: options.maxAttempts || this.maxRetries,
      createdAt: new Date(),
      updatedAt: new Date(),
      metadata: options.metadata,
    };

    this.jobs.set(job.id, job);
    this.emit("job:added", job);

    logger.info("Job added to queue", {
      jobId: job.id,
      type: job.type,
      priority: job.priority,
    });

    return job;
  }

  /**
   * Start processing jobs
   */
  start(): void {
    if (this.running) {
      logger.warn("Queue processor already running");
      return;
    }

    this.running = true;
    this.pollTimer = setInterval(() => {
      this.processNextJobs();
    }, this.pollInterval);

    logger.info("Queue processor started", {
      concurrency: this.concurrency,
      pollInterval: this.pollInterval,
    });

    this.emit("started");
  }

  /**
   * Stop processing jobs
   */
  async stop(): Promise<void> {
    if (!this.running) {
      return;
    }

    this.running = false;

    if (this.pollTimer) {
      clearInterval(this.pollTimer);
      this.pollTimer = undefined;
    }

    // Wait for current jobs to complete
    while (this.processing.size > 0) {
      await this.sleep(100);
    }

    logger.info("Queue processor stopped");
    this.emit("stopped");
  }

  /**
   * Process next available jobs
   */
  private async processNextJobs(): Promise<void> {
    if (!this.running) {
      return;
    }

    // Check if we can process more jobs
    const availableSlots = this.concurrency - this.processing.size;
    if (availableSlots <= 0) {
      return;
    }

    // Get pending jobs sorted by priority and created date
    const pendingJobs = Array.from(this.jobs.values())
      .filter((job) => job.status === "pending" && !this.processing.has(job.id))
      .sort((a, b) => {
        // Sort by priority first
        const priorityOrder = { critical: 0, high: 1, normal: 2, low: 3 };
        const priorityDiff =
          priorityOrder[a.priority] - priorityOrder[b.priority];
        if (priorityDiff !== 0) return priorityDiff;

        // Then by created date
        return a.createdAt.getTime() - b.createdAt.getTime();
      })
      .slice(0, availableSlots);

    // Process jobs
    for (const job of pendingJobs) {
      this.processJob(job).catch((error) => {
        logger.error("Unexpected error processing job", {
          jobId: job.id,
          error: error.message,
        });
      });
    }
  }

  /**
   * Process a single job
   */
  private async processJob(job: Job): Promise<void> {
    this.processing.add(job.id);

    job.status = "processing";
    job.attempts++;
    job.startedAt = new Date();
    job.updatedAt = new Date();
    this.jobs.set(job.id, job);

    logger.info("Processing job", {
      jobId: job.id,
      type: job.type,
      attempt: job.attempts,
    });

    this.emit("job:started", job);

    try {
      // Get handler
      const handler = this.handlers.get(job.type);
      if (!handler) {
        throw new Error(`No handler registered for job type: ${job.type}`);
      }

      // Execute handler
      const result = await handler(job);

      // Job completed successfully
      job.status = "completed";
      job.result = result;
      job.completedAt = new Date();
      job.updatedAt = new Date();
      this.jobs.set(job.id, job);

      logger.info("Job completed", {
        jobId: job.id,
        type: job.type,
        duration: job.completedAt.getTime() - job.startedAt!.getTime(),
      });

      this.emit("job:completed", job);
    } catch (error: any) {
      // Job failed
      job.error = error.message;
      job.failedAt = new Date();
      job.updatedAt = new Date();

      logger.error("Job failed", {
        jobId: job.id,
        type: job.type,
        attempt: job.attempts,
        error: error.message,
      });

      this.emit("job:failed", job, error);

      // Retry if attempts remaining
      if (job.attempts < job.maxAttempts) {
        job.status = "retry";
        this.jobs.set(job.id, job);

        logger.info("Scheduling job retry", {
          jobId: job.id,
          attempt: job.attempts + 1,
          maxAttempts: job.maxAttempts,
        });

        this.emit("job:retry", job);

        // Schedule retry
        setTimeout(
          () => {
            job.status = "pending";
            job.updatedAt = new Date();
            this.jobs.set(job.id, job);
          },
          this.retryDelay * Math.pow(2, job.attempts - 1),
        );
      } else {
        job.status = "failed";
        this.jobs.set(job.id, job);
      }
    } finally {
      this.processing.delete(job.id);
    }
  }

  /**
   * Get job by ID
   */
  getJob(jobId: string): Job | undefined {
    return this.jobs.get(jobId);
  }

  /**
   * Get all jobs
   */
  getAllJobs(): Job[] {
    return Array.from(this.jobs.values());
  }

  /**
   * Get jobs by status
   */
  getJobsByStatus(status: JobStatus): Job[] {
    return Array.from(this.jobs.values()).filter(
      (job) => job.status === status,
    );
  }

  /**
   * Get jobs by type
   */
  getJobsByType(type: string): Job[] {
    return Array.from(this.jobs.values()).filter((job) => job.type === type);
  }

  /**
   * Cancel a job
   */
  cancelJob(jobId: string): boolean {
    const job = this.jobs.get(jobId);
    if (!job || job.status !== "pending") {
      return false;
    }

    job.status = "failed";
    job.error = "Job cancelled";
    job.failedAt = new Date();
    job.updatedAt = new Date();
    this.jobs.set(jobId, job);

    logger.info("Job cancelled", { jobId });
    this.emit("job:cancelled", job);

    return true;
  }

  /**
   * Remove a job
   */
  removeJob(jobId: string): boolean {
    const job = this.jobs.get(jobId);
    if (!job) {
      return false;
    }

    // Don't remove processing jobs
    if (job.status === "processing") {
      return false;
    }

    this.jobs.delete(jobId);
    this.emit("job:removed", job);

    return true;
  }

  /**
   * Clear completed jobs
   */
  clearCompleted(): number {
    let cleared = 0;

    for (const [id, job] of this.jobs.entries()) {
      if (job.status === "completed") {
        this.jobs.delete(id);
        cleared++;
      }
    }

    logger.info("Cleared completed jobs", { count: cleared });
    return cleared;
  }

  /**
   * Clear old jobs
   */
  clearOld(olderThan: Date): number {
    let cleared = 0;

    for (const [id, job] of this.jobs.entries()) {
      if (job.status !== "processing" && job.updatedAt < olderThan) {
        this.jobs.delete(id);
        cleared++;
      }
    }

    logger.info("Cleared old jobs", { count: cleared });
    return cleared;
  }

  /**
   * Get queue statistics
   */
  getStats(): {
    total: number;
    pending: number;
    processing: number;
    completed: number;
    failed: number;
    retry: number;
  } {
    const jobs = Array.from(this.jobs.values());

    return {
      total: jobs.length,
      pending: jobs.filter((j) => j.status === "pending").length,
      processing: jobs.filter((j) => j.status === "processing").length,
      completed: jobs.filter((j) => j.status === "completed").length,
      failed: jobs.filter((j) => j.status === "failed").length,
      retry: jobs.filter((j) => j.status === "retry").length,
    };
  }

  /**
   * Check if queue is running
   */
  isRunning(): boolean {
    return this.running;
  }

  /**
   * Sleep utility
   */
  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}

/**
 * Default queue processor instance
 */
export const queueProcessor = new QueueProcessor({
  concurrency: parseInt(process.env.QUEUE_CONCURRENCY || "5", 10),
  maxRetries: parseInt(process.env.QUEUE_MAX_RETRIES || "3", 10),
  retryDelay: parseInt(process.env.QUEUE_RETRY_DELAY || "1000", 10),
  pollInterval: parseInt(process.env.QUEUE_POLL_INTERVAL || "100", 10),
});

// Auto-start in production
if (process.env.NODE_ENV === "production") {
  queueProcessor.start();
}
