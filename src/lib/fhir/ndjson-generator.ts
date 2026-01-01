/**
 * NDJSON Generator for Bulk FHIR Export
 * Streaming support for large datasets with progress tracking
 */

import { createWriteStream, createReadStream } from "fs";
import { pipeline } from "stream/promises";
import { Transform } from "stream";
import { z } from "zod";

/**
 * NDJSON Export Options
 */
export interface NDJSONExportOptions {
  outputPath: string;
  resourceType: string;
  compress?: boolean;
  batchSize?: number;
  includeDeleted?: boolean;
  since?: Date;
  type?: string[]; // Resource types to export
  typeFilter?: string; // FHIR search parameters
}

/**
 * Export Progress
 */
export interface ExportProgress {
  resourceType: string;
  processedCount: number;
  totalCount: number;
  bytesWritten: number;
  startTime: Date;
  currentTime: Date;
  estimatedTimeRemaining?: number;
  errors: Array<{
    resourceId: string;
    error: string;
  }>;
}

/**
 * Export Job Status
 */
export enum ExportJobStatus {
  PENDING = "pending",
  IN_PROGRESS = "in-progress",
  COMPLETED = "completed",
  FAILED = "failed",
  CANCELLED = "cancelled",
}

/**
 * Export Job
 */
export interface ExportJob {
  id: string;
  requestUrl: string;
  status: ExportJobStatus;
  transactionTime: Date;
  request: string;
  requiresAccessToken: boolean;
  output?: Array<{
    type: string;
    url: string;
    count?: number;
  }>;
  error?: Array<{
    type: string;
    url: string;
  }>;
  deleted?: Array<{
    type: string;
    url: string;
    count?: number;
  }>;
  extension?: Record<string, unknown>;
  createdAt: Date;
  completedAt?: Date;
  expiresAt?: Date;
}

/**
 * NDJSON Writer Transform Stream
 */
class NDJSONWriterTransform extends Transform {
  private processedCount = 0;
  private bytesWritten = 0;
  private errors: Array<{ resourceId: string; error: string }> = [];

  constructor(private onProgress?: (progress: ExportProgress) => void) {
    super({ objectMode: true });
  }

  _transform(
    resource: unknown,
    encoding: string,
    callback: (error?: Error | null) => void
  ): void {
    try {
      // Validate resource has required fields
      const resourceObj = resource as { id?: string; resourceType?: string };
      if (!resourceObj.id || !resourceObj.resourceType) {
        this.errors.push({
          resourceId: resourceObj.id || "unknown",
          error: "Resource missing id or resourceType",
        });
        callback();
        return;
      }

      // Convert to NDJSON (one JSON object per line)
      const jsonLine = JSON.stringify(resource) + "\n";
      this.bytesWritten += Buffer.byteLength(jsonLine, "utf8");
      this.processedCount++;

      // Report progress
      if (this.onProgress && this.processedCount % 100 === 0) {
        this.onProgress({
          resourceType: resourceObj.resourceType,
          processedCount: this.processedCount,
          totalCount: 0, // Will be updated by caller
          bytesWritten: this.bytesWritten,
          startTime: new Date(), // Will be updated by caller
          currentTime: new Date(),
          errors: this.errors,
        });
      }

      this.push(jsonLine);
      callback();
    } catch (error) {
      const resourceObj = resource as { id?: string };
      this.errors.push({
        resourceId: resourceObj.id || "unknown",
        error: error instanceof Error ? error.message : String(error),
      });
      callback();
    }
  }

  getStats(): { processedCount: number; bytesWritten: number; errors: Array<{ resourceId: string; error: string }> } {
    return {
      processedCount: this.processedCount,
      bytesWritten: this.bytesWritten,
      errors: this.errors,
    };
  }
}

/**
 * Generate NDJSON file from resources
 */
export async function generateNDJSONFile(
  resources: unknown[],
  options: NDJSONExportOptions,
  onProgress?: (progress: ExportProgress) => void
): Promise<{
  processedCount: number;
  bytesWritten: number;
  errors: Array<{ resourceId: string; error: string }>;
}> {
  const startTime = new Date();
  const writerTransform = new NDJSONWriterTransform((progress) => {
    if (onProgress) {
      onProgress({
        ...progress,
        totalCount: resources.length,
        startTime,
      });
    }
  });

  const writeStream = createWriteStream(options.outputPath, { encoding: "utf8" });

  // Create readable stream from resources array
  const { Readable } = await import("stream");
  const readableStream = Readable.from(resources);

  // Pipeline: resources -> transform -> file
  await pipeline(readableStream, writerTransform, writeStream);

  return writerTransform.getStats();
}

/**
 * Generate NDJSON file from async iterator (for streaming large datasets)
 */
export async function generateNDJSONFileFromIterator(
  resourceIterator: AsyncIterableIterator<unknown>,
  options: NDJSONExportOptions,
  totalCount: number,
  onProgress?: (progress: ExportProgress) => void
): Promise<{
  processedCount: number;
  bytesWritten: number;
  errors: Array<{ resourceId: string; error: string }>;
}> {
  const startTime = new Date();
  const writerTransform = new NDJSONWriterTransform((progress) => {
    if (onProgress) {
      const elapsed = new Date().getTime() - startTime.getTime();
      const rate = progress.processedCount / (elapsed / 1000); // resources per second
      const remaining = totalCount - progress.processedCount;
      const estimatedTimeRemaining = remaining / rate;

      onProgress({
        ...progress,
        totalCount,
        startTime,
        estimatedTimeRemaining,
      });
    }
  });

  const writeStream = createWriteStream(options.outputPath, { encoding: "utf8" });

  // Create readable stream from async iterator
  const { Readable } = await import("stream");
  const readableStream = Readable.from(resourceIterator);

  // Pipeline: iterator -> transform -> file
  await pipeline(readableStream, writerTransform, writeStream);

  return writerTransform.getStats();
}

/**
 * Read NDJSON file and parse resources
 */
export async function* readNDJSONFile(filePath: string): AsyncIterableIterator<unknown> {
  const readStream = createReadStream(filePath, { encoding: "utf8" });
  const { createInterface } = await import("readline");
  const rl = createInterface({
    input: readStream,
    crlfDelay: Infinity,
  });

  for await (const line of rl) {
    if (line.trim().length > 0) {
      try {
        yield JSON.parse(line);
      } catch (error) {
        console.error("Error parsing NDJSON line:", error);
      }
    }
  }
}

/**
 * Validate NDJSON file
 */
export async function validateNDJSONFile(filePath: string): Promise<{
  valid: boolean;
  lineCount: number;
  errors: Array<{ line: number; error: string }>;
}> {
  const errors: Array<{ line: number; error: string }> = [];
  let lineCount = 0;

  const readStream = createReadStream(filePath, { encoding: "utf8" });
  const { createInterface } = await import("readline");
  const rl = createInterface({
    input: readStream,
    crlfDelay: Infinity,
  });

  for await (const line of rl) {
    lineCount++;
    if (line.trim().length === 0) continue;

    try {
      const resource = JSON.parse(line);
      if (!resource.resourceType || !resource.id) {
        errors.push({
          line: lineCount,
          error: "Resource missing resourceType or id",
        });
      }
    } catch (error) {
      errors.push({
        line: lineCount,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  return {
    valid: errors.length === 0,
    lineCount,
    errors,
  };
}

/**
 * Compress NDJSON file to gzip
 */
export async function compressNDJSONFile(
  inputPath: string,
  outputPath: string
): Promise<void> {
  const { createGzip } = await import("zlib");
  const gzip = createGzip();
  const source = createReadStream(inputPath);
  const destination = createWriteStream(outputPath);

  await pipeline(source, gzip, destination);
}

/**
 * Decompress gzipped NDJSON file
 */
export async function decompressNDJSONFile(
  inputPath: string,
  outputPath: string
): Promise<void> {
  const { createGunzip } = await import("zlib");
  const gunzip = createGunzip();
  const source = createReadStream(inputPath);
  const destination = createWriteStream(outputPath);

  await pipeline(source, gunzip, destination);
}

/**
 * Split NDJSON file by resource type
 */
export async function splitNDJSONByResourceType(
  inputPath: string,
  outputDir: string
): Promise<Map<string, string>> {
  const fileMap = new Map<string, string>();
  const writers = new Map<string, ReturnType<typeof createWriteStream>>();

  try {
    const readStream = createReadStream(inputPath, { encoding: "utf8" });
    const { createInterface } = await import("readline");
    const rl = createInterface({
      input: readStream,
      crlfDelay: Infinity,
    });

    for await (const line of rl) {
      if (line.trim().length === 0) continue;

      try {
        const resource = JSON.parse(line) as { resourceType: string };
        const resourceType = resource.resourceType;

        if (!resourceType) continue;

        // Get or create writer for this resource type
        let writer = writers.get(resourceType);
        if (!writer) {
          const outputPath = `${outputDir}/${resourceType}.ndjson`;
          writer = createWriteStream(outputPath, { encoding: "utf8" });
          writers.set(resourceType, writer);
          fileMap.set(resourceType, outputPath);
        }

        writer.write(line + "\n");
      } catch (error) {
        console.error("Error processing line:", error);
      }
    }

    // Close all writers
    for (const writer of writers.values()) {
      writer.end();
    }

    return fileMap;
  } finally {
    // Ensure all streams are closed
    for (const writer of writers.values()) {
      if (!writer.closed) {
        writer.end();
      }
    }
  }
}

/**
 * Merge multiple NDJSON files
 */
export async function mergeNDJSONFiles(
  inputPaths: string[],
  outputPath: string
): Promise<number> {
  let totalLines = 0;
  const outputStream = createWriteStream(outputPath, { encoding: "utf8" });

  try {
    for (const inputPath of inputPaths) {
      const readStream = createReadStream(inputPath, { encoding: "utf8" });
      const { createInterface } = await import("readline");
      const rl = createInterface({
        input: readStream,
        crlfDelay: Infinity,
      });

      for await (const line of rl) {
        if (line.trim().length > 0) {
          outputStream.write(line + "\n");
          totalLines++;
        }
      }
    }

    return totalLines;
  } finally {
    outputStream.end();
  }
}

/**
 * Filter NDJSON file by predicate
 */
export async function filterNDJSONFile(
  inputPath: string,
  outputPath: string,
  predicate: (resource: unknown) => boolean
): Promise<number> {
  let filteredCount = 0;
  const outputStream = createWriteStream(outputPath, { encoding: "utf8" });

  try {
    const readStream = createReadStream(inputPath, { encoding: "utf8" });
    const { createInterface } = await import("readline");
    const rl = createInterface({
      input: readStream,
      crlfDelay: Infinity,
    });

    for await (const line of rl) {
      if (line.trim().length === 0) continue;

      try {
        const resource = JSON.parse(line);
        if (predicate(resource)) {
          outputStream.write(line + "\n");
          filteredCount++;
        }
      } catch (error) {
        console.error("Error filtering resource:", error);
      }
    }

    return filteredCount;
  } finally {
    outputStream.end();
  }
}

/**
 * Get NDJSON file statistics
 */
export async function getNDJSONFileStats(filePath: string): Promise<{
  totalLines: number;
  resourceTypes: Map<string, number>;
  fileSize: number;
  estimatedResourceCount: number;
}> {
  const { stat } = await import("fs/promises");
  const stats = await stat(filePath);
  const resourceTypes = new Map<string, number>();
  let totalLines = 0;

  const readStream = createReadStream(filePath, { encoding: "utf8" });
  const { createInterface } = await import("readline");
  const rl = createInterface({
    input: readStream,
    crlfDelay: Infinity,
  });

  for await (const line of rl) {
    if (line.trim().length === 0) continue;
    totalLines++;

    try {
      const resource = JSON.parse(line) as { resourceType: string };
      const resourceType = resource.resourceType || "unknown";
      resourceTypes.set(resourceType, (resourceTypes.get(resourceType) || 0) + 1);
    } catch (error) {
      // Skip invalid lines
    }
  }

  return {
    totalLines,
    resourceTypes,
    fileSize: stats.size,
    estimatedResourceCount: totalLines,
  };
}

/**
 * Generate export job ID
 */
export function generateExportJobId(): string {
  const crypto = require("crypto");
  return `export_${crypto.randomBytes(16).toString("hex")}`;
}

/**
 * Create export job
 */
export function createExportJob(
  requestUrl: string,
  request: string,
  transactionTime: Date = new Date(),
  expiresIn: number = 86400 // 24 hours default
): ExportJob {
  const now = new Date();
  const expiresAt = new Date(now.getTime() + expiresIn * 1000);

  return {
    id: generateExportJobId(),
    requestUrl,
    status: ExportJobStatus.PENDING,
    transactionTime,
    request,
    requiresAccessToken: true,
    createdAt: now,
    expiresAt,
  };
}

/**
 * Update export job status
 */
export function updateExportJobStatus(
  job: ExportJob,
  status: ExportJobStatus,
  output?: ExportJob["output"],
  error?: ExportJob["error"]
): ExportJob {
  return {
    ...job,
    status,
    output,
    error,
    completedAt: status === ExportJobStatus.COMPLETED ? new Date() : job.completedAt,
  };
}

/**
 * Validation schemas
 */
export const ExportJobSchema = z.object({
  id: z.string(),
  requestUrl: z.string(),
  status: z.nativeEnum(ExportJobStatus),
  transactionTime: z.date(),
  request: z.string(),
  requiresAccessToken: z.boolean(),
  output: z
    .array(
      z.object({
        type: z.string(),
        url: z.string(),
        count: z.number().optional(),
      })
    )
    .optional(),
  error: z
    .array(
      z.object({
        type: z.string(),
        url: z.string(),
      })
    )
    .optional(),
  createdAt: z.date(),
  completedAt: z.date().optional(),
  expiresAt: z.date().optional(),
});
