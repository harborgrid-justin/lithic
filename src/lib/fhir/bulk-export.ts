/**
 * FHIR Bulk Data Export Implementation
 * Implements the FHIR Bulk Data Access IG ($export operation)
 * Based on: https://hl7.org/fhir/uv/bulkdata/
 */

import { z } from "zod";
import { createWriteStream, promises as fs } from "fs";
import { join } from "path";
import { Readable } from "stream";

export interface BulkExportRequest {
  resourceTypes?: string[];
  since?: Date;
  outputFormat?: "application/fhir+ndjson" | "application/ndjson";
  includeAssociatedData?: (
    | "LatestProvenanceResources"
    | "RelevantProvenanceResources"
  )[];
  patient?: string[];
  group?: string;
  typeFilter?: string[];
}

export interface BulkExportJob {
  id: string;
  status: "active" | "completed" | "failed" | "cancelled";
  request: BulkExportRequest;
  transactionTime: Date;
  output?: BulkExportOutput[];
  error?: BulkExportError[];
  requiresAccessToken?: boolean;
  outputUrl?: string;
  deleteUrl?: string;
  progress?: number;
  createdAt: Date;
  completedAt?: Date;
}

export interface BulkExportOutput {
  type: string;
  url: string;
  count?: number;
}

export interface BulkExportError {
  type: string;
  url: string;
}

/**
 * Bulk Export Manager
 */
export class BulkExportManager {
  private jobs: Map<string, BulkExportJob> = new Map();
  private exportDir: string;

  constructor(exportDir: string = "/tmp/fhir-exports") {
    this.exportDir = exportDir;
  }

  /**
   * Initiate a bulk export operation
   */
  async initiateExport(
    request: BulkExportRequest,
  ): Promise<{ jobId: string; statusUrl: string }> {
    const jobId = this.generateJobId();
    const job: BulkExportJob = {
      id: jobId,
      status: "active",
      request,
      transactionTime: new Date(),
      progress: 0,
      createdAt: new Date(),
      outputUrl: `/api/fhir/$export-poll/${jobId}`,
      deleteUrl: `/api/fhir/$export-poll/${jobId}`,
    };

    this.jobs.set(jobId, job);

    // Start export in background
    this.processExport(jobId).catch((error) => {
      const job = this.jobs.get(jobId);
      if (job) {
        job.status = "failed";
        job.error = [
          {
            type: "OperationOutcome",
            url: `/api/fhir/$export-poll/${jobId}/error.ndjson`,
          },
        ];
      }
    });

    return {
      jobId,
      statusUrl: `/api/fhir/$export-poll/${jobId}`,
    };
  }

  /**
   * Get export job status
   */
  async getJobStatus(jobId: string): Promise<BulkExportJob | null> {
    return this.jobs.get(jobId) || null;
  }

  /**
   * Cancel an export job
   */
  async cancelJob(jobId: string): Promise<boolean> {
    const job = this.jobs.get(jobId);
    if (!job) return false;

    if (job.status === "active") {
      job.status = "cancelled";
      return true;
    }

    return false;
  }

  /**
   * Delete an export job and its output files
   */
  async deleteJob(jobId: string): Promise<boolean> {
    const job = this.jobs.get(jobId);
    if (!job) return false;

    // Delete output files
    if (job.output) {
      for (const output of job.output) {
        const filePath = this.getFilePathFromUrl(output.url);
        try {
          await fs.unlink(filePath);
        } catch (error) {
          // Ignore errors if file doesn't exist
        }
      }
    }

    // Delete error files
    if (job.error) {
      for (const error of job.error) {
        const filePath = this.getFilePathFromUrl(error.url);
        try {
          await fs.unlink(filePath);
        } catch (err) {
          // Ignore errors if file doesn't exist
        }
      }
    }

    this.jobs.delete(jobId);
    return true;
  }

  /**
   * Process bulk export (this would be called in the background)
   */
  private async processExport(jobId: string): Promise<void> {
    const job = this.jobs.get(jobId);
    if (!job) return;

    try {
      // Ensure export directory exists
      await fs.mkdir(join(this.exportDir, jobId), { recursive: true });

      const resourceTypes = job.request.resourceTypes || [
        "Patient",
        "Observation",
        "Condition",
        "MedicationRequest",
        "Encounter",
        "Procedure",
      ];

      const outputs: BulkExportOutput[] = [];
      let totalProgress = 0;

      for (const resourceType of resourceTypes) {
        const fileName = `${resourceType}.ndjson`;
        const filePath = join(this.exportDir, jobId, fileName);
        const count = await this.exportResourceType(
          resourceType,
          filePath,
          job.request,
        );

        if (count > 0) {
          outputs.push({
            type: resourceType,
            url: `/api/fhir/$export-poll/${jobId}/${fileName}`,
            count,
          });
        }

        totalProgress += 1 / resourceTypes.length;
        job.progress = Math.round(totalProgress * 100);
      }

      job.output = outputs;
      job.status = "completed";
      job.completedAt = new Date();
      job.progress = 100;
    } catch (error) {
      job.status = "failed";
      throw error;
    }
  }

  /**
   * Export a specific resource type to NDJSON
   */
  private async exportResourceType(
    resourceType: string,
    filePath: string,
    request: BulkExportRequest,
  ): Promise<number> {
    // This is a simplified implementation
    // In a real system, this would query the database and stream resources

    const writeStream = createWriteStream(filePath, { encoding: "utf-8" });
    let count = 0;

    try {
      // Simulate exporting resources (replace with actual database queries)
      const resources = await this.fetchResources(resourceType, request);

      for (const resource of resources) {
        writeStream.write(JSON.stringify(resource) + "\n");
        count++;
      }

      writeStream.end();

      return new Promise((resolve, reject) => {
        writeStream.on("finish", () => resolve(count));
        writeStream.on("error", reject);
      });
    } catch (error) {
      writeStream.destroy();
      throw error;
    }
  }

  /**
   * Fetch resources from database (placeholder - implement with actual database queries)
   */
  private async fetchResources(
    resourceType: string,
    request: BulkExportRequest,
  ): Promise<any[]> {
    // This is a placeholder - replace with actual database queries
    // using Prisma or your database client

    // Example implementation would be:
    // - Query database for resources of the specified type
    // - Filter by patient IDs if provided
    // - Filter by date if 'since' is provided
    // - Transform to FHIR format
    // - Return as array

    return [];
  }

  /**
   * Generate unique job ID
   */
  private generateJobId(): string {
    const timestamp = Date.now();
    const random = Math.floor(Math.random() * 100000);
    return `export-${timestamp}-${random}`;
  }

  /**
   * Get file path from URL
   */
  private getFilePathFromUrl(url: string): string {
    // Extract file path from URL
    // Example: /api/fhir/$export-poll/export-123/Patient.ndjson
    const parts = url.split("/");
    const jobId = parts[parts.length - 2];
    const fileName = parts[parts.length - 1];
    return join(this.exportDir, jobId, fileName);
  }

  /**
   * Read exported file as stream
   */
  async readExportFile(
    jobId: string,
    fileName: string,
  ): Promise<Readable | null> {
    const job = this.jobs.get(jobId);
    if (!job || job.status !== "completed") return null;

    const filePath = join(this.exportDir, jobId, fileName);

    try {
      const stream = Readable.from(await fs.readFile(filePath, "utf-8"));
      return stream;
    } catch (error) {
      return null;
    }
  }
}

/**
 * Create a default bulk export manager
 */
export const bulkExportManager = new BulkExportManager(
  process.env.BULK_EXPORT_DIR || "/tmp/fhir-exports",
);

/**
 * Validate bulk export request
 */
export function validateBulkExportRequest(request: BulkExportRequest): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  // Validate output format
  if (
    request.outputFormat &&
    request.outputFormat !== "application/fhir+ndjson" &&
    request.outputFormat !== "application/ndjson"
  ) {
    errors.push(
      "Invalid output format. Must be application/fhir+ndjson or application/ndjson",
    );
  }

  // Validate resource types
  const validResourceTypes = [
    "Patient",
    "Practitioner",
    "Organization",
    "Location",
    "Encounter",
    "Observation",
    "Condition",
    "Procedure",
    "MedicationRequest",
    "MedicationAdministration",
    "AllergyIntolerance",
    "DiagnosticReport",
    "DocumentReference",
    "Immunization",
  ];

  if (request.resourceTypes) {
    const invalidTypes = request.resourceTypes.filter(
      (type) => !validResourceTypes.includes(type),
    );
    if (invalidTypes.length > 0) {
      errors.push(`Invalid resource types: ${invalidTypes.join(", ")}`);
    }
  }

  // Validate date
  if (request.since && request.since > new Date()) {
    errors.push("Since date cannot be in the future");
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Create bulk export response headers
 */
export function createBulkExportHeaders(
  job: BulkExportJob,
): Record<string, string> {
  if (job.status === "active") {
    return {
      "X-Progress": `${job.progress || 0}% complete`,
      "Retry-After": "120", // Ask client to retry in 120 seconds
    };
  }

  if (job.status === "completed") {
    return {
      "Content-Type": "application/json",
      Expires: new Date(Date.now() + 24 * 60 * 60 * 1000).toUTCString(), // 24 hours
    };
  }

  return {};
}

/**
 * Create bulk export status response
 */
export function createBulkExportResponse(job: BulkExportJob): any {
  if (job.status !== "completed") {
    return null;
  }

  return {
    transactionTime: job.transactionTime.toISOString(),
    request: job.outputUrl,
    requiresAccessToken: job.requiresAccessToken || false,
    output: job.output || [],
    error: job.error || [],
    extension: {
      "http://hl7.org/fhir/uv/bulkdata/StructureDefinition/export-delete-url":
        job.deleteUrl,
    },
  };
}
