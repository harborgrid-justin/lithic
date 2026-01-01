/**
 * Queue Jobs
 * Pre-defined job types and processors for common tasks
 */

import { createQueue } from './processor';
import { db } from '@/lib/db';
import { fhirClient } from '@/lib/fhir/client';
import { clearinghouseClient } from '@/lib/integrations/clearinghouse';
import { eligibilityClient } from '@/lib/integrations/eligibility';
import { webhookManager } from '@/lib/webhooks/manager';

/**
 * Email notification job
 */
interface EmailJob {
  to: string;
  subject: string;
  body: string;
  template?: string;
  data?: Record<string, any>;
}

export const emailQueue = createQueue<EmailJob>('email', async (job) => {
  console.log(`Sending email to ${job.data.to}: ${job.data.subject}`);

  // Implement email sending (e.g., using nodemailer, SendGrid, etc.)
  // const result = await emailService.send(job.data);

  return { sent: true, messageId: `msg_${Date.now()}` };
});

/**
 * SMS notification job
 */
interface SMSJob {
  to: string;
  message: string;
  priority?: 'high' | 'normal' | 'low';
}

export const smsQueue = createQueue<SMSJob>('sms', async (job) => {
  console.log(`Sending SMS to ${job.data.to}`);

  // Implement SMS sending (e.g., using Twilio)
  // const result = await twilioClient.messages.create({
  //   to: job.data.to,
  //   body: job.data.message,
  //   from: process.env.TWILIO_PHONE_NUMBER,
  // });

  return { sent: true, messageId: `sms_${Date.now()}` };
});

/**
 * FHIR sync job
 */
interface FHIRSyncJob {
  resourceType: string;
  resourceId: string;
  action: 'create' | 'update' | 'delete';
  data?: any;
}

export const fhirSyncQueue = createQueue<FHIRSyncJob>('fhir-sync', async (job) => {
  const { resourceType, resourceId, action, data } = job.data;

  switch (action) {
    case 'create':
      return await fhirClient.create(resourceType, data);

    case 'update':
      return await fhirClient.update(resourceType, resourceId, data);

    case 'delete':
      await fhirClient.delete(resourceType, resourceId);
      return { deleted: true };

    default:
      throw new Error(`Unknown action: ${action}`);
  }
});

/**
 * Claims submission job
 */
interface ClaimSubmissionJob {
  claimId: string;
}

export const claimSubmissionQueue = createQueue<ClaimSubmissionJob>(
  'claim-submission',
  async (job) => {
    const claim = await db.claim.findUnique({
      where: { id: job.data.claimId },
      include: {
        patient: true,
        provider: true,
        serviceLines: true,
      },
    });

    if (!claim) {
      throw new Error(`Claim ${job.data.claimId} not found`);
    }

    // Submit to clearinghouse
    const result = await clearinghouseClient.submitClaim({
      claimId: claim.id,
      patientInfo: {
        memberId: claim.patient.insuranceMemberId || '',
        firstName: claim.patient.firstName,
        lastName: claim.patient.lastName,
        dateOfBirth: claim.patient.dateOfBirth,
        gender: claim.patient.gender as 'M' | 'F',
      },
      providerInfo: {
        npi: claim.provider.npi || '',
        taxId: claim.provider.taxId || '',
        name: claim.provider.name || '',
        address: claim.provider.address || '',
        city: claim.provider.city || '',
        state: claim.provider.state || '',
        zipCode: claim.provider.zipCode || '',
      },
      payerInfo: {
        payerId: claim.payerId || '',
        name: claim.payerName || '',
      },
      claimInfo: {
        claimType: 'Professional',
        serviceDate: claim.serviceDate,
        diagnosisCodes: claim.diagnosisCodes || [],
        serviceLin: claim.serviceLines.map((line: any) => ({
          procedureCode: line.procedureCode,
          modifier: line.modifiers,
          units: line.units,
          chargeAmount: line.chargeAmount,
          placeOfService: line.placeOfService,
        })),
        totalCharges: claim.totalCharges,
      },
    } as any);

    // Update claim status
    await db.claim.update({
      where: { id: claim.id },
      data: {
        status: 'SUBMITTED',
        submittedAt: new Date(),
        submissionId: result.submissionId,
      },
    });

    return result;
  }
);

/**
 * Eligibility check job
 */
interface EligibilityCheckJob {
  patientId: string;
  payerId: string;
  serviceDate?: Date;
}

export const eligibilityCheckQueue = createQueue<EligibilityCheckJob>(
  'eligibility-check',
  async (job) => {
    const patient = await db.patient.findUnique({
      where: { id: job.data.patientId },
    });

    if (!patient) {
      throw new Error(`Patient ${job.data.patientId} not found`);
    }

    const result = await eligibilityClient.checkEligibility({
      patient: {
        memberId: patient.insuranceMemberId || '',
        firstName: patient.firstName,
        lastName: patient.lastName,
        dateOfBirth: patient.dateOfBirth,
        gender: patient.gender as 'M' | 'F',
      },
      provider: {
        npi: process.env.PROVIDER_NPI || '',
      },
      payer: {
        payerId: job.data.payerId,
      },
      serviceDate: job.data.serviceDate,
    });

    // Store eligibility result
    await db.eligibilityCheck.create({
      data: {
        patientId: patient.id,
        payerId: job.data.payerId,
        checkDate: new Date(),
        eligible: result.eligible,
        status: result.status,
        response: result as any,
      } as any,
    });

    return result;
  }
);

/**
 * Report generation job
 */
interface ReportGenerationJob {
  reportType: string;
  parameters: Record<string, any>;
  userId: string;
}

export const reportGenerationQueue = createQueue<ReportGenerationJob>(
  'report-generation',
  async (job) => {
    console.log(`Generating report: ${job.data.reportType}`);

    // Implement report generation logic
    // This is a placeholder - actual implementation would generate PDFs, Excel, etc.

    const reportData = {
      type: job.data.reportType,
      generatedAt: new Date(),
      parameters: job.data.parameters,
      data: [], // Report data
    };

    // Store report
    const report = await db.report.create({
      data: {
        type: job.data.reportType,
        userId: job.data.userId,
        parameters: job.data.parameters,
        status: 'COMPLETED',
        generatedAt: new Date(),
        data: reportData as any,
      } as any,
    });

    // Send notification
    await emailQueue.add({
      to: job.data.parameters.email || '',
      subject: `Your ${job.data.reportType} report is ready`,
      body: `Your report has been generated and is ready for download.`,
    });

    return { reportId: report.id };
  }
);

/**
 * Data export job
 */
interface DataExportJob {
  resourceType: string;
  filters: Record<string, any>;
  format: 'json' | 'csv' | 'excel';
  userId: string;
}

export const dataExportQueue = createQueue<DataExportJob>(
  'data-export',
  async (job) => {
    console.log(`Exporting ${job.data.resourceType} data`);

    // Implement data export logic
    // This would fetch data based on resourceType and filters,
    // then convert to requested format

    return {
      exportId: `export_${Date.now()}`,
      downloadUrl: `/api/exports/download/${Date.now()}`,
    };
  }
);

/**
 * Appointment reminder job
 */
interface AppointmentReminderJob {
  appointmentId: string;
  reminderType: 'email' | 'sms' | 'both';
  hoursBefore: number;
}

export const appointmentReminderQueue = createQueue<AppointmentReminderJob>(
  'appointment-reminder',
  async (job) => {
    const appointment = await db.appointment.findUnique({
      where: { id: job.data.appointmentId },
      include: {
        patient: true,
        provider: true,
      },
    });

    if (!appointment) {
      throw new Error(`Appointment ${job.data.appointmentId} not found`);
    }

    const message = `Reminder: You have an appointment with ${appointment.provider.name} on ${appointment.startTime.toLocaleDateString()} at ${appointment.startTime.toLocaleTimeString()}.`;

    if (job.data.reminderType === 'email' || job.data.reminderType === 'both') {
      await emailQueue.add({
        to: appointment.patient.email || '',
        subject: 'Appointment Reminder',
        body: message,
      });
    }

    if (job.data.reminderType === 'sms' || job.data.reminderType === 'both') {
      await smsQueue.add({
        to: appointment.patient.phone || '',
        message,
      });
    }

    // Mark reminder sent
    await db.appointmentReminder.create({
      data: {
        appointmentId: appointment.id,
        sentAt: new Date(),
        type: job.data.reminderType,
        hoursBefore: job.data.hoursBefore,
      } as any,
    });

    return { sent: true };
  }
);

/**
 * Webhook delivery job
 */
interface WebhookDeliveryJob {
  eventType: string;
  eventData: any;
}

export const webhookDeliveryQueue = createQueue<WebhookDeliveryJob>(
  'webhook-delivery',
  async (job) => {
    const eventId = await webhookManager.emit({
      type: job.data.eventType,
      data: job.data.eventData,
    });

    return { eventId };
  }
);

/**
 * Batch processing job
 */
interface BatchProcessingJob {
  batchType: string;
  items: any[];
  processor: string;
}

export const batchProcessingQueue = createQueue<BatchProcessingJob>(
  'batch-processing',
  async (job) => {
    const results = [];
    const errors = [];

    for (const item of job.data.items) {
      try {
        // Process item based on processor type
        let result;
        switch (job.data.processor) {
          case 'eligibility':
            // Process eligibility checks
            break;
          case 'claims':
            // Process claims
            break;
          default:
            throw new Error(`Unknown processor: ${job.data.processor}`);
        }
        results.push({ item, result, success: true });
      } catch (error) {
        errors.push({
          item,
          error: error instanceof Error ? error.message : 'Unknown error',
          success: false,
        });
      }
    }

    return {
      totalItems: job.data.items.length,
      successful: results.length,
      failed: errors.length,
      results,
      errors,
    };
  }
);

/**
 * Schedule appointment reminder
 */
export async function scheduleAppointmentReminder(
  appointmentId: string,
  appointmentTime: Date,
  hoursBefore: number = 24
): Promise<void> {
  const reminderTime = new Date(appointmentTime.getTime() - hoursBefore * 60 * 60 * 1000);
  const delay = reminderTime.getTime() - Date.now();

  if (delay > 0) {
    await appointmentReminderQueue.add(
      {
        appointmentId,
        reminderType: 'both',
        hoursBefore,
      },
      { delay }
    );
  }
}

/**
 * Queue stats
 */
export async function getQueueStats() {
  return {
    email: await emailQueue.getStats(),
    sms: await smsQueue.getStats(),
    fhirSync: await fhirSyncQueue.getStats(),
    claimSubmission: await claimSubmissionQueue.getStats(),
    eligibilityCheck: await eligibilityCheckQueue.getStats(),
    reportGeneration: await reportGenerationQueue.getStats(),
    dataExport: await dataExportQueue.getStats(),
    appointmentReminder: await appointmentReminderQueue.getStats(),
    webhookDelivery: await webhookDeliveryQueue.getStats(),
    batchProcessing: await batchProcessingQueue.getStats(),
  };
}
