/**
 * Bulk FHIR Export API Endpoint
 * Implements $export operation for system, patient, and group level exports
 */

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import {
  createExportJob,
  updateExportJobStatus,
  ExportJobStatus,
  generateNDJSONFile,
  type ExportJob,
} from "@/lib/fhir/ndjson-generator";

/**
 * Export request parameters schema
 */
const ExportRequestSchema = z.object({
  _outputFormat: z.string().optional().default("application/fhir+ndjson"),
  _since: z.string().datetime().optional(),
  _type: z.string().optional(), // Comma-separated resource types
  _typeFilter: z.string().optional(), // FHIR search parameters
  _elements: z.string().optional(), // Comma-separated elements
  patient: z.string().optional(), // For patient-level export
  group: z.string().optional(), // For group-level export
});

/**
 * In-memory job storage (replace with database in production)
 */
const exportJobs = new Map<string, ExportJob>();

/**
 * POST /$export - Initiate system-level export
 * POST /Patient/$export - Initiate patient-level export
 * POST /Group/:id/$export - Initiate group-level export
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    // Parse request parameters
    const url = new URL(request.url);
    const params = Object.fromEntries(url.searchParams);
    const validatedParams = ExportRequestSchema.parse(params);

    // Validate output format
    if (
      validatedParams._outputFormat !== "application/fhir+ndjson" &&
      validatedParams._outputFormat !== "application/ndjson"
    ) {
      return NextResponse.json(
        {
          resourceType: "OperationOutcome",
          issue: [
            {
              severity: "error",
              code: "not-supported",
              diagnostics: "Only application/fhir+ndjson output format is supported",
            },
          ],
        },
        { status: 400 }
      );
    }

    // Create export job
    const job = createExportJob(
      request.url,
      JSON.stringify(validatedParams),
      new Date()
    );

    // Store job
    exportJobs.set(job.id, job);

    // Start async export (in production, use a queue system)
    processExportJob(job.id, validatedParams).catch((error) => {
      console.error("Export job failed:", error);
      const failedJob = exportJobs.get(job.id);
      if (failedJob) {
        exportJobs.set(
          job.id,
          updateExportJobStatus(failedJob, ExportJobStatus.FAILED, undefined, [
            {
              type: "OperationOutcome",
              url: `/api/fhir/bulk/export/${job.id}/error`,
            },
          ])
        );
      }
    });

    // Return 202 Accepted with Content-Location header
    const statusUrl = `${url.origin}/api/fhir/bulk/export/${job.id}/status`;
    return new NextResponse(null, {
      status: 202,
      headers: {
        "Content-Location": statusUrl,
      },
    });
  } catch (error) {
    console.error("Export request error:", error);
    return NextResponse.json(
      {
        resourceType: "OperationOutcome",
        issue: [
          {
            severity: "error",
            code: "processing",
            diagnostics:
              error instanceof Error ? error.message : "Unknown error",
          },
        ],
      },
      { status: 400 }
    );
  }
}

/**
 * GET /api/fhir/bulk/export/:jobId/status - Check export status
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const url = new URL(request.url);
    const pathParts = url.pathname.split("/");
    const jobId = pathParts[pathParts.length - 2]; // Get jobId from path

    const job = exportJobs.get(jobId);
    if (!job) {
      return NextResponse.json(
        {
          resourceType: "OperationOutcome",
          issue: [
            {
              severity: "error",
              code: "not-found",
              diagnostics: "Export job not found",
            },
          ],
        },
        { status: 404 }
      );
    }

    // Check if job expired
    if (job.expiresAt && job.expiresAt < new Date()) {
      return NextResponse.json(
        {
          resourceType: "OperationOutcome",
          issue: [
            {
              severity: "error",
              code: "expired",
              diagnostics: "Export job has expired",
            },
          ],
        },
        { status: 410 }
      );
    }

    // If still in progress, return 202
    if (job.status === ExportJobStatus.IN_PROGRESS || job.status === ExportJobStatus.PENDING) {
      const retryAfter = 10; // seconds
      return new NextResponse(null, {
        status: 202,
        headers: {
          "X-Progress": "Processing",
          "Retry-After": retryAfter.toString(),
        },
      });
    }

    // If failed, return error
    if (job.status === ExportJobStatus.FAILED) {
      return NextResponse.json(
        {
          resourceType: "OperationOutcome",
          issue: [
            {
              severity: "error",
              code: "processing",
              diagnostics: "Export job failed",
            },
          ],
        },
        { status: 500 }
      );
    }

    // If completed, return export manifest
    if (job.status === ExportJobStatus.COMPLETED) {
      return NextResponse.json(
        {
          transactionTime: job.transactionTime.toISOString(),
          request: job.request,
          requiresAccessToken: job.requiresAccessToken,
          output: job.output || [],
          error: job.error || [],
          deleted: job.deleted || [],
        },
        {
          status: 200,
          headers: {
            "Content-Type": "application/json",
            Expires: job.expiresAt?.toUTCString() || "",
          },
        }
      );
    }

    return NextResponse.json(
      {
        resourceType: "OperationOutcome",
        issue: [
          {
            severity: "error",
            code: "processing",
            diagnostics: "Unknown job status",
          },
        ],
      },
      { status: 500 }
    );
  } catch (error) {
    console.error("Status check error:", error);
    return NextResponse.json(
      {
        resourceType: "OperationOutcome",
        issue: [
          {
            severity: "error",
            code: "processing",
            diagnostics:
              error instanceof Error ? error.message : "Unknown error",
          },
        ],
      },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/fhir/bulk/export/:jobId/status - Cancel export job
 */
export async function DELETE(request: NextRequest): Promise<NextResponse> {
  try {
    const url = new URL(request.url);
    const pathParts = url.pathname.split("/");
    const jobId = pathParts[pathParts.length - 2];

    const job = exportJobs.get(jobId);
    if (!job) {
      return NextResponse.json(
        {
          resourceType: "OperationOutcome",
          issue: [
            {
              severity: "error",
              code: "not-found",
              diagnostics: "Export job not found",
            },
          ],
        },
        { status: 404 }
      );
    }

    // Cancel the job
    exportJobs.set(
      jobId,
      updateExportJobStatus(job, ExportJobStatus.CANCELLED)
    );

    return new NextResponse(null, { status: 202 });
  } catch (error) {
    console.error("Job cancellation error:", error);
    return NextResponse.json(
      {
        resourceType: "OperationOutcome",
        issue: [
          {
            severity: "error",
            code: "processing",
            diagnostics:
              error instanceof Error ? error.message : "Unknown error",
          },
        ],
      },
      { status: 500 }
    );
  }
}

/**
 * Process export job asynchronously
 */
async function processExportJob(
  jobId: string,
  params: z.infer<typeof ExportRequestSchema>
): Promise<void> {
  const job = exportJobs.get(jobId);
  if (!job) {
    throw new Error("Job not found");
  }

  // Update status to in-progress
  exportJobs.set(jobId, updateExportJobStatus(job, ExportJobStatus.IN_PROGRESS));

  try {
    // Parse resource types
    const resourceTypes = params._type?.split(",").map((t) => t.trim()) || [
      "Patient",
      "Observation",
      "Condition",
      "MedicationRequest",
      "AllergyIntolerance",
      "Immunization",
      "Procedure",
      "Encounter",
      "DiagnosticReport",
    ];

    const output: ExportJob["output"] = [];

    // Export each resource type
    for (const resourceType of resourceTypes) {
      // In production, fetch resources from database
      const resources = await fetchResourcesForExport(
        resourceType,
        params._since ? new Date(params._since) : undefined,
        params._typeFilter
      );

      if (resources.length === 0) continue;

      // Generate NDJSON file
      const outputPath = `/tmp/export_${jobId}_${resourceType}.ndjson`;
      const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";
      const downloadUrl = `${baseUrl}/api/fhir/bulk/export/${jobId}/download/${resourceType}.ndjson`;

      await generateNDJSONFile(resources, {
        outputPath,
        resourceType,
      });

      output.push({
        type: resourceType,
        url: downloadUrl,
        count: resources.length,
      });
    }

    // Update job with results
    const updatedJob = exportJobs.get(jobId);
    if (updatedJob) {
      exportJobs.set(
        jobId,
        updateExportJobStatus(updatedJob, ExportJobStatus.COMPLETED, output)
      );
    }
  } catch (error) {
    console.error("Export processing error:", error);
    const failedJob = exportJobs.get(jobId);
    if (failedJob) {
      exportJobs.set(
        jobId,
        updateExportJobStatus(failedJob, ExportJobStatus.FAILED, undefined, [
          {
            type: "OperationOutcome",
            url: `/api/fhir/bulk/export/${jobId}/error`,
          },
        ])
      );
    }
  }
}

/**
 * Fetch resources for export (mock implementation)
 * In production, this would query the database
 */
async function fetchResourcesForExport(
  resourceType: string,
  since?: Date,
  typeFilter?: string
): Promise<unknown[]> {
  // Mock implementation - replace with actual database query
  console.log(`Fetching ${resourceType} resources for export`, { since, typeFilter });

  // Return empty array for now - in production, query database
  return [];
}
