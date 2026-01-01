/**
 * FHIR R4 API Endpoint
 * Comprehensive FHIR REST API with full CRUD operations, search, and bulk export
 */

import { NextRequest, NextResponse } from "next/server";
import { fhirServer } from "@/lib/fhir/server";
import {
  bulkExportManager,
  validateBulkExportRequest,
  createBulkExportHeaders,
  createBulkExportResponse,
} from "@/lib/fhir/bulk-export";
import { patientToFHIR, patientFromFHIR } from "@/lib/fhir/resources/patient";
import {
  encounterToFHIR,
  encounterFromFHIR,
} from "@/lib/fhir/resources/encounter";
import {
  observationToFHIR,
  observationFromFHIR,
} from "@/lib/fhir/resources/observation";
import {
  medicationRequestToFHIR,
  medicationRequestFromFHIR,
} from "@/lib/fhir/resources/medication";
import {
  conditionToFHIR,
  conditionFromFHIR,
} from "@/lib/fhir/resources/condition";
import {
  procedureToFHIR,
  procedureFromFHIR,
} from "@/lib/fhir/resources/procedure";
import {
  createSearchBundle,
  createTransactionBundle,
} from "@/lib/fhir/resources";
import prisma from "@/lib/db";

/**
 * Authentication middleware
 */
async function authenticateRequest(
  request: NextRequest,
): Promise<{ userId: string } | null> {
  const authHeader = request.headers.get("authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return null;
  }

  // TODO: Implement JWT validation with your auth system
  // For now, return a mock user
  return { userId: "system" };
}

/**
 * GET /api/fhir/metadata - Capability Statement
 * GET /api/fhir/[resourceType]/[id] - Read resource
 * GET /api/fhir/[resourceType] - Search resources
 * GET /api/fhir/$export-poll/[jobId] - Poll bulk export status
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { resource: string[] } },
) {
  try {
    const [first, second, third] = params.resource;

    // Handle metadata/capability statement
    if (first === "metadata") {
      const capabilities = fhirServer.getCapabilityStatement();
      return NextResponse.json(capabilities);
    }

    // Handle SMART-on-FHIR configuration
    if (first === ".well-known" && second === "smart-configuration") {
      const smartConfig = fhirServer.getSmartConfiguration();
      if (!smartConfig) {
        return NextResponse.json(
          { error: "SMART-on-FHIR not enabled" },
          { status: 404 },
        );
      }
      return NextResponse.json(smartConfig);
    }

    // Handle bulk export status polling
    if (first === "$export-poll" && second) {
      const jobId = second;
      const job = await bulkExportManager.getJobStatus(jobId);

      if (!job) {
        return NextResponse.json(
          { error: "Export job not found" },
          { status: 404 },
        );
      }

      const headers = createBulkExportHeaders(job);

      if (job.status === "active") {
        return new NextResponse(null, {
          status: 202,
          headers,
        });
      }

      if (job.status === "completed") {
        const response = createBulkExportResponse(job);
        return NextResponse.json(response, { headers });
      }

      if (job.status === "failed") {
        return NextResponse.json(
          { error: "Export job failed" },
          { status: 500 },
        );
      }

      return NextResponse.json(
        { error: "Export job cancelled" },
        { status: 410 },
      );
    }

    // Require authentication for resource access
    const auth = await authenticateRequest(request);
    if (!auth) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const resourceType = first;
    const id = second;

    // Handle read by ID
    if (id && !id.startsWith("$")) {
      const resource = await readResource(resourceType, id);
      if (!resource) {
        return NextResponse.json(
          {
            resourceType: "OperationOutcome",
            issue: [
              {
                severity: "error",
                code: "not-found",
                diagnostics: `${resourceType}/${id} not found`,
              },
            ],
          },
          { status: 404 },
        );
      }
      return NextResponse.json(resource);
    }

    // Handle search
    const searchParams: Record<string, string> = {};
    request.nextUrl.searchParams.forEach((value, key) => {
      searchParams[key] = value;
    });

    const results = await searchResources(resourceType, searchParams);
    return NextResponse.json(results);
  } catch (error) {
    console.error("FHIR GET error:", error);
    return NextResponse.json(
      {
        resourceType: "OperationOutcome",
        issue: [
          {
            severity: "error",
            code: "exception",
            diagnostics:
              error instanceof Error ? error.message : "Unknown error",
          },
        ],
      },
      { status: 500 },
    );
  }
}

/**
 * POST /api/fhir/[resourceType] - Create resource
 * POST /api/fhir/ - Process bundle
 * POST /api/fhir/[resourceType]/$validate - Validate resource
 * POST /api/fhir/$export - Initiate bulk export
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { resource: string[] } },
) {
  try {
    const auth = await authenticateRequest(request);
    if (!auth) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const [first, second] = params.resource;
    const body = await request.json();

    // Handle system-level bulk export
    if (first === "$export" || (first && first.includes("$export"))) {
      const exportRequest = {
        resourceTypes: body._type?.split(","),
        since: body._since ? new Date(body._since) : undefined,
        outputFormat: body._outputFormat || "application/fhir+ndjson",
        patient: body.patient,
      };

      const validation = validateBulkExportRequest(exportRequest);
      if (!validation.valid) {
        return NextResponse.json(
          {
            resourceType: "OperationOutcome",
            issue: validation.errors.map((e) => ({
              severity: "error",
              code: "invalid",
              diagnostics: e,
            })),
          },
          { status: 400 },
        );
      }

      const { jobId, statusUrl } =
        await bulkExportManager.initiateExport(exportRequest);

      return new NextResponse(null, {
        status: 202,
        headers: {
          "Content-Location": statusUrl,
        },
      });
    }

    // Handle resource-level operations
    if (second === "$validate") {
      const validation = fhirServer.validateResource(body);
      return NextResponse.json({
        resourceType: "OperationOutcome",
        issue: validation.issues,
      });
    }

    // Handle bundle/transaction
    if (!first || body.resourceType === "Bundle") {
      const result = await processBundle(body);
      return NextResponse.json(result);
    }

    const resourceType = first;

    // Validate resource type matches
    if (body.resourceType !== resourceType) {
      return NextResponse.json(
        {
          resourceType: "OperationOutcome",
          issue: [
            {
              severity: "error",
              code: "invalid",
              diagnostics: "Resource type mismatch",
            },
          ],
        },
        { status: 400 },
      );
    }

    // Create resource
    const created = await createResource(resourceType, body);
    return NextResponse.json(created, {
      status: 201,
      headers: {
        Location: `${request.nextUrl.origin}/api/fhir/${resourceType}/${created.id}`,
      },
    });
  } catch (error) {
    console.error("FHIR POST error:", error);
    return NextResponse.json(
      {
        resourceType: "OperationOutcome",
        issue: [
          {
            severity: "error",
            code: "exception",
            diagnostics:
              error instanceof Error ? error.message : "Unknown error",
          },
        ],
      },
      { status: 500 },
    );
  }
}

/**
 * PUT /api/fhir/[resourceType]/[id] - Update resource
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: { resource: string[] } },
) {
  try {
    const auth = await authenticateRequest(request);
    if (!auth) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const [resourceType, id] = params.resource;

    if (!id) {
      return NextResponse.json(
        {
          resourceType: "OperationOutcome",
          issue: [
            {
              severity: "error",
              code: "invalid",
              diagnostics: "Resource ID required for update",
            },
          ],
        },
        { status: 400 },
      );
    }

    // Validate resource type and ID match
    if (body.resourceType !== resourceType || (body.id && body.id !== id)) {
      return NextResponse.json(
        {
          resourceType: "OperationOutcome",
          issue: [
            {
              severity: "error",
              code: "invalid",
              diagnostics: "Resource type or ID mismatch",
            },
          ],
        },
        { status: 400 },
      );
    }

    // Update resource
    const updated = await updateResource(resourceType, id, body);
    return NextResponse.json(updated);
  } catch (error) {
    console.error("FHIR PUT error:", error);
    return NextResponse.json(
      {
        resourceType: "OperationOutcome",
        issue: [
          {
            severity: "error",
            code: "exception",
            diagnostics:
              error instanceof Error ? error.message : "Unknown error",
          },
        ],
      },
      { status: 500 },
    );
  }
}

/**
 * DELETE /api/fhir/[resourceType]/[id] - Delete resource
 * DELETE /api/fhir/$export-poll/[jobId] - Delete export job
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { resource: string[] } },
) {
  try {
    const auth = await authenticateRequest(request);
    if (!auth) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const [first, second] = params.resource;

    // Handle export job deletion
    if (first === "$export-poll" && second) {
      const deleted = await bulkExportManager.deleteJob(second);
      if (!deleted) {
        return NextResponse.json(
          { error: "Export job not found" },
          { status: 404 },
        );
      }
      return new NextResponse(null, { status: 204 });
    }

    const resourceType = first;
    const id = second;

    if (!id) {
      return NextResponse.json(
        {
          resourceType: "OperationOutcome",
          issue: [
            {
              severity: "error",
              code: "invalid",
              diagnostics: "Resource ID required for delete",
            },
          ],
        },
        { status: 400 },
      );
    }

    await deleteResource(resourceType, id);
    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error("FHIR DELETE error:", error);
    return NextResponse.json(
      {
        resourceType: "OperationOutcome",
        issue: [
          {
            severity: "error",
            code: "exception",
            diagnostics:
              error instanceof Error ? error.message : "Unknown error",
          },
        ],
      },
      { status: 500 },
    );
  }
}

/**
 * Read a resource by type and ID
 */
async function readResource(resourceType: string, id: string): Promise<any> {
  switch (resourceType) {
    case "Patient": {
      const patient = await prisma.patient.findUnique({ where: { id } });
      return patient ? patientToFHIR(patient as any) : null;
    }
    case "Encounter": {
      const encounter = await prisma.encounter.findUnique({ where: { id } });
      return encounter ? encounterToFHIR(encounter as any) : null;
    }
    case "Observation": {
      const observation = await prisma.observation.findUnique({
        where: { id },
      });
      return observation ? observationToFHIR(observation as any) : null;
    }
    case "MedicationRequest": {
      const medication = await prisma.prescription.findUnique({
        where: { id },
      });
      return medication ? medicationRequestToFHIR(medication as any) : null;
    }
    case "Condition": {
      const condition = await prisma.problem.findUnique({ where: { id } });
      return condition ? conditionToFHIR(condition as any) : null;
    }
    case "Procedure": {
      const procedure = await prisma.procedure.findUnique({ where: { id } });
      return procedure ? procedureToFHIR(procedure as any) : null;
    }
    default:
      throw new Error(`Resource type ${resourceType} not supported`);
  }
}

/**
 * Search resources with parameters
 */
async function searchResources(
  resourceType: string,
  params: Record<string, string>,
): Promise<any> {
  const { _count = "50", _offset = "0", ...searchParams } = params;
  const limit = parseInt(_count);
  const offset = parseInt(_offset);

  switch (resourceType) {
    case "Patient": {
      const where: any = {};

      if (searchParams.identifier) where.mrn = searchParams.identifier;
      if (searchParams.family)
        where.lastName = { contains: searchParams.family, mode: "insensitive" };
      if (searchParams.given)
        where.firstName = { contains: searchParams.given, mode: "insensitive" };
      if (searchParams.birthdate)
        where.dateOfBirth = new Date(searchParams.birthdate);
      if (searchParams.gender) where.gender = searchParams.gender.toUpperCase();

      const [patients, total] = await Promise.all([
        prisma.patient.findMany({ where, take: limit, skip: offset }),
        prisma.patient.count({ where }),
      ]);

      const resources = patients.map((p) => patientToFHIR(p as any));
      return createSearchBundle(resources, total);
    }

    case "Encounter": {
      const where: any = {};

      if (searchParams.patient)
        where.patientId = searchParams.patient.replace("Patient/", "");
      if (searchParams.date) where.startDate = new Date(searchParams.date);
      if (searchParams.status) where.status = searchParams.status.toUpperCase();

      const [encounters, total] = await Promise.all([
        prisma.encounter.findMany({
          where,
          take: limit,
          skip: offset,
          orderBy: { startDate: "desc" },
        }),
        prisma.encounter.count({ where }),
      ]);

      const resources = encounters.map((e) => encounterToFHIR(e as any));
      return createSearchBundle(resources, total);
    }

    case "Observation": {
      const where: any = {};

      if (searchParams.patient)
        where.patientId = searchParams.patient.replace("Patient/", "");
      if (searchParams.code) where.code = searchParams.code;
      if (searchParams.category) where.category = searchParams.category;
      if (searchParams.date) where.effectiveDate = new Date(searchParams.date);

      const [observations, total] = await Promise.all([
        prisma.observation.findMany({
          where,
          take: limit,
          skip: offset,
          orderBy: { effectiveDate: "desc" },
        }),
        prisma.observation.count({ where }),
      ]);

      const resources = observations.map((o) => observationToFHIR(o as any));
      return createSearchBundle(resources, total);
    }

    default:
      return createSearchBundle([], 0);
  }
}

/**
 * Create a new resource
 */
async function createResource(
  resourceType: string,
  resource: any,
): Promise<any> {
  switch (resourceType) {
    case "Patient": {
      const patientData = patientFromFHIR(resource);
      const created = await prisma.patient.create({ data: patientData as any });
      return patientToFHIR(created as any);
    }
    default:
      throw new Error(`Resource type ${resourceType} not supported for create`);
  }
}

/**
 * Update a resource
 */
async function updateResource(
  resourceType: string,
  id: string,
  resource: any,
): Promise<any> {
  switch (resourceType) {
    case "Patient": {
      const patientData = patientFromFHIR(resource);
      const updated = await prisma.patient.update({
        where: { id },
        data: patientData as any,
      });
      return patientToFHIR(updated as any);
    }
    default:
      throw new Error(`Resource type ${resourceType} not supported for update`);
  }
}

/**
 * Delete a resource
 */
async function deleteResource(resourceType: string, id: string): Promise<void> {
  switch (resourceType) {
    case "Patient":
      await prisma.patient.delete({ where: { id } });
      break;
    default:
      throw new Error(`Resource type ${resourceType} not supported for delete`);
  }
}

/**
 * Process a FHIR bundle (batch/transaction)
 */
async function processBundle(bundle: any): Promise<any> {
  if (bundle.type !== "transaction" && bundle.type !== "batch") {
    throw new Error("Only transaction and batch bundles are supported");
  }

  const responseEntries = await Promise.all(
    bundle.entry?.map(async (entry: any) => {
      try {
        const { method, url } = entry.request;
        const resource = entry.resource;

        let response: any = { status: "200 OK" };

        if (method === "POST") {
          const resourceType = url;
          const created = await createResource(resourceType, resource);
          response = {
            status: "201 Created",
            location: `${resourceType}/${created.id}`,
          };
        } else if (method === "PUT") {
          const [resourceType, id] = url.split("/");
          await updateResource(resourceType, id, resource);
          response = { status: "200 OK" };
        } else if (method === "DELETE") {
          const [resourceType, id] = url.split("/");
          await deleteResource(resourceType, id);
          response = { status: "204 No Content" };
        } else if (method === "GET") {
          const [resourceType, id] = url.split("/");
          const result = id
            ? await readResource(resourceType, id)
            : await searchResources(resourceType, {});
          response = {
            status: "200 OK",
            resource: result,
          };
        }

        return { response };
      } catch (error) {
        return {
          response: {
            status: "500 Internal Server Error",
            outcome: {
              resourceType: "OperationOutcome",
              issue: [
                {
                  severity: "error",
                  code: "exception",
                  diagnostics:
                    error instanceof Error ? error.message : "Unknown error",
                },
              ],
            },
          },
        };
      }
    }) || [],
  );

  return {
    resourceType: "Bundle",
    type: `${bundle.type}-response`,
    entry: responseEntries,
  };
}
