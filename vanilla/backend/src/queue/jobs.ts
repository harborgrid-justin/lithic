/**
 * Job Definitions
 *
 * Predefined job types for common healthcare operations
 */

import { queueProcessor, JobPriority } from './processor';
import { logger } from '../utils/logger';
import { triggerWebhook } from '../integrations/webhooks/manager';

/**
 * Job Types
 */
export enum JobType {
  // Patient operations
  PATIENT_SYNC = 'patient:sync',
  PATIENT_EXPORT = 'patient:export',
  PATIENT_MERGE = 'patient:merge',

  // Clinical operations
  RESULT_NOTIFICATION = 'result:notification',
  LAB_ORDER_SUBMIT = 'lab:order:submit',
  IMAGING_ORDER_SUBMIT = 'imaging:order:submit',

  // Billing operations
  CLAIM_SUBMIT = 'claim:submit',
  CLAIM_STATUS_CHECK = 'claim:status:check',
  ELIGIBILITY_CHECK = 'eligibility:check',
  ERA_PROCESS = 'era:process',

  // Prescription operations
  PRESCRIPTION_SEND = 'prescription:send',
  PRESCRIPTION_STATUS = 'prescription:status',

  // Integration operations
  FHIR_SYNC = 'fhir:sync',
  HL7_SEND = 'hl7:send',
  WEBHOOK_DELIVERY = 'webhook:delivery',

  // Analytics operations
  REPORT_GENERATE = 'report:generate',
  DATA_EXPORT = 'data:export',
  ANALYTICS_UPDATE = 'analytics:update',

  // Maintenance operations
  AUDIT_LOG_ARCHIVE = 'audit:archive',
  DATA_CLEANUP = 'data:cleanup',
  BACKUP = 'backup',
}

/**
 * Job Factory
 */
export class JobFactory {
  /**
   * Create patient sync job
   */
  static async createPatientSyncJob(data: {
    patientId: string;
    source: 'fhir' | 'hl7' | 'api';
    destination: string;
  }): Promise<string> {
    const job = await queueProcessor.addJob(JobType.PATIENT_SYNC, data, {
      priority: 'normal',
      maxAttempts: 3,
      metadata: {
        category: 'patient',
      },
    });

    return job.id;
  }

  /**
   * Create lab order submission job
   */
  static async createLabOrderJob(data: {
    orderId: string;
    patientId: string;
    tests: string[];
    priority: 'routine' | 'urgent' | 'stat';
  }): Promise<string> {
    const job = await queueProcessor.addJob(JobType.LAB_ORDER_SUBMIT, data, {
      priority: data.priority === 'stat' ? 'critical' : data.priority === 'urgent' ? 'high' : 'normal',
      maxAttempts: 3,
      metadata: {
        category: 'clinical',
      },
    });

    return job.id;
  }

  /**
   * Create result notification job
   */
  static async createResultNotificationJob(data: {
    resultId: string;
    patientId: string;
    providerId: string;
    resultType: 'lab' | 'imaging' | 'pathology';
    critical: boolean;
  }): Promise<string> {
    const job = await queueProcessor.addJob(JobType.RESULT_NOTIFICATION, data, {
      priority: data.critical ? 'critical' : 'high',
      maxAttempts: 5,
      metadata: {
        category: 'clinical',
      },
    });

    return job.id;
  }

  /**
   * Create claim submission job
   */
  static async createClaimSubmissionJob(data: {
    claimId: string;
    patientId: string;
    providerId: string;
    payerId: string;
    totalCharges: number;
  }): Promise<string> {
    const job = await queueProcessor.addJob(JobType.CLAIM_SUBMIT, data, {
      priority: 'normal',
      maxAttempts: 3,
      metadata: {
        category: 'billing',
      },
    });

    return job.id;
  }

  /**
   * Create eligibility check job
   */
  static async createEligibilityCheckJob(data: {
    patientId: string;
    payerId: string;
    memberId: string;
    serviceDate?: string;
  }): Promise<string> {
    const job = await queueProcessor.addJob(JobType.ELIGIBILITY_CHECK, data, {
      priority: 'high',
      maxAttempts: 2,
      metadata: {
        category: 'billing',
      },
    });

    return job.id;
  }

  /**
   * Create prescription send job
   */
  static async createPrescriptionSendJob(data: {
    prescriptionId: string;
    patientId: string;
    pharmacyNCPDP: string;
    medicationCode: string;
    urgent: boolean;
  }): Promise<string> {
    const job = await queueProcessor.addJob(JobType.PRESCRIPTION_SEND, data, {
      priority: data.urgent ? 'high' : 'normal',
      maxAttempts: 3,
      metadata: {
        category: 'pharmacy',
      },
    });

    return job.id;
  }

  /**
   * Create FHIR sync job
   */
  static async createFHIRSyncJob(data: {
    resourceType: string;
    resourceId: string;
    operation: 'create' | 'update' | 'delete';
    destination: string;
  }): Promise<string> {
    const job = await queueProcessor.addJob(JobType.FHIR_SYNC, data, {
      priority: 'normal',
      maxAttempts: 3,
      metadata: {
        category: 'integration',
      },
    });

    return job.id;
  }

  /**
   * Create HL7 send job
   */
  static async createHL7SendJob(data: {
    messageType: string;
    message: string;
    destination: string;
  }): Promise<string> {
    const job = await queueProcessor.addJob(JobType.HL7_SEND, data, {
      priority: 'normal',
      maxAttempts: 3,
      metadata: {
        category: 'integration',
      },
    });

    return job.id;
  }

  /**
   * Create webhook delivery job
   */
  static async createWebhookDeliveryJob(data: {
    event: string;
    payload: any;
    url: string;
  }): Promise<string> {
    const job = await queueProcessor.addJob(JobType.WEBHOOK_DELIVERY, data, {
      priority: 'normal',
      maxAttempts: 3,
      metadata: {
        category: 'integration',
      },
    });

    return job.id;
  }

  /**
   * Create report generation job
   */
  static async createReportGenerationJob(data: {
    reportType: string;
    parameters: Record<string, any>;
    format: 'pdf' | 'excel' | 'csv';
    requestedBy: string;
  }): Promise<string> {
    const job = await queueProcessor.addJob(JobType.REPORT_GENERATE, data, {
      priority: 'low',
      maxAttempts: 2,
      metadata: {
        category: 'analytics',
      },
    });

    return job.id;
  }

  /**
   * Create data export job
   */
  static async createDataExportJob(data: {
    dataType: string;
    filters: Record<string, any>;
    format: 'csv' | 'json' | 'xml';
    destination: string;
  }): Promise<string> {
    const job = await queueProcessor.addJob(JobType.DATA_EXPORT, data, {
      priority: 'low',
      maxAttempts: 2,
      metadata: {
        category: 'analytics',
      },
    });

    return job.id;
  }

  /**
   * Create audit log archive job
   */
  static async createAuditArchiveJob(data: {
    startDate: string;
    endDate: string;
    destination: string;
  }): Promise<string> {
    const job = await queueProcessor.addJob(JobType.AUDIT_LOG_ARCHIVE, data, {
      priority: 'low',
      maxAttempts: 2,
      metadata: {
        category: 'maintenance',
      },
    });

    return job.id;
  }

  /**
   * Create data cleanup job
   */
  static async createDataCleanupJob(data: {
    dataType: string;
    olderThan: string;
    dryRun: boolean;
  }): Promise<string> {
    const job = await queueProcessor.addJob(JobType.DATA_CLEANUP, data, {
      priority: 'low',
      maxAttempts: 1,
      metadata: {
        category: 'maintenance',
      },
    });

    return job.id;
  }

  /**
   * Create backup job
   */
  static async createBackupJob(data: {
    backupType: 'full' | 'incremental';
    destination: string;
    encrypt: boolean;
  }): Promise<string> {
    const job = await queueProcessor.addJob(JobType.BACKUP, data, {
      priority: 'low',
      maxAttempts: 1,
      metadata: {
        category: 'maintenance',
      },
    });

    return job.id;
  }
}

/**
 * Batch Job Creator
 */
export class BatchJobCreator {
  /**
   * Create multiple eligibility check jobs
   */
  static async createBatchEligibilityChecks(
    patients: Array<{
      patientId: string;
      payerId: string;
      memberId: string;
    }>
  ): Promise<string[]> {
    const jobIds: string[] = [];

    for (const patient of patients) {
      const jobId = await JobFactory.createEligibilityCheckJob(patient);
      jobIds.push(jobId);
    }

    logger.info('Batch eligibility checks created', {
      count: jobIds.length,
    });

    return jobIds;
  }

  /**
   * Create multiple claim submission jobs
   */
  static async createBatchClaimSubmissions(
    claims: Array<{
      claimId: string;
      patientId: string;
      providerId: string;
      payerId: string;
      totalCharges: number;
    }>
  ): Promise<string[]> {
    const jobIds: string[] = [];

    for (const claim of claims) {
      const jobId = await JobFactory.createClaimSubmissionJob(claim);
      jobIds.push(jobId);
    }

    logger.info('Batch claim submissions created', {
      count: jobIds.length,
    });

    return jobIds;
  }

  /**
   * Create multiple FHIR sync jobs
   */
  static async createBatchFHIRSync(
    resources: Array<{
      resourceType: string;
      resourceId: string;
      operation: 'create' | 'update' | 'delete';
      destination: string;
    }>
  ): Promise<string[]> {
    const jobIds: string[] = [];

    for (const resource of resources) {
      const jobId = await JobFactory.createFHIRSyncJob(resource);
      jobIds.push(jobId);
    }

    logger.info('Batch FHIR sync jobs created', {
      count: jobIds.length,
    });

    return jobIds;
  }
}

/**
 * Scheduled Job Creator
 */
export class ScheduledJobCreator {
  /**
   * Schedule daily cleanup job
   */
  static scheduleDailyCleanup(): void {
    // Clean up old completed jobs daily at 2 AM
    const schedule = () => {
      const now = new Date();
      const next = new Date();
      next.setHours(2, 0, 0, 0);

      if (next <= now) {
        next.setDate(next.getDate() + 1);
      }

      const timeout = next.getTime() - now.getTime();

      setTimeout(async () => {
        await JobFactory.createDataCleanupJob({
          dataType: 'completed_jobs',
          olderThan: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
          dryRun: false,
        });

        schedule(); // Schedule next cleanup
      }, timeout);
    };

    schedule();
    logger.info('Scheduled daily cleanup job');
  }

  /**
   * Schedule weekly backup job
   */
  static scheduleWeeklyBackup(): void {
    // Run backup every Sunday at 1 AM
    const schedule = () => {
      const now = new Date();
      const next = new Date();
      next.setHours(1, 0, 0, 0);

      const daysUntilSunday = (7 - now.getDay()) % 7;
      next.setDate(next.getDate() + daysUntilSunday);

      if (next <= now) {
        next.setDate(next.getDate() + 7);
      }

      const timeout = next.getTime() - now.getTime();

      setTimeout(async () => {
        await JobFactory.createBackupJob({
          backupType: 'full',
          destination: process.env.BACKUP_DESTINATION || '/backups',
          encrypt: true,
        });

        schedule(); // Schedule next backup
      }, timeout);
    };

    schedule();
    logger.info('Scheduled weekly backup job');
  }
}

// Auto-schedule maintenance jobs
if (process.env.NODE_ENV === 'production') {
  ScheduledJobCreator.scheduleDailyCleanup();
  ScheduledJobCreator.scheduleWeeklyBackup();
}
